import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getRuntimeDatabase } from "@/lib/db/runtime";
import { account, session, user } from "@/lib/db/schema";
import { readLocalStore, writeLocalStore } from "@/lib/persistence/local-store";
import { memoryStore } from "@/lib/persistence/memory-store";
import { resolveUserDisplayName } from "@/lib/user-display-name";

const SESSION_COOKIE_NAME = "trip_compass_session";
const SESSION_REFRESH_THROTTLE_SECONDS = 60 * 60 * 6;

export const WEB_IDLE_TTL_SECONDS = 60 * 60 * 24 * 14;
export const WEB_ABSOLUTE_TTL_SECONDS = 60 * 60 * 24 * 90;
export const SHELL_IDLE_TTL_SECONDS = 60 * 60 * 24 * 30;
export const SHELL_ABSOLUTE_TTL_SECONDS = 60 * 60 * 24 * 180;

export const CLIENT_TYPES = ["web", "ios-shell"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

type SessionPolicy = Readonly<{
  idleTtlSeconds: number;
  absoluteTtlSeconds: number;
}>;

/** issuance-time client classification (defaults to "web" unless explicitly allowed). */
export function classifyClientTypeForSessionIssuance(input?: {
  clientType?: unknown;
  allowIosShell?: boolean;
}): ClientType {
  if (input?.allowIosShell && input.clientType === "ios-shell") {
    return "ios-shell";
  }

  return "web";
}

export function getSessionPolicyForClientType(clientType: ClientType): SessionPolicy {
  if (clientType === "ios-shell") {
    return {
      idleTtlSeconds: SHELL_IDLE_TTL_SECONDS,
      absoluteTtlSeconds: SHELL_ABSOLUTE_TTL_SECONDS,
    };
  }

  return {
    idleTtlSeconds: WEB_IDLE_TTL_SECONDS,
    absoluteTtlSeconds: WEB_ABSOLUTE_TTL_SECONDS,
  };
}

type IssuedSessionStamp = Readonly<{
  clientType: ClientType;
  lastSeenAt: Date;
  expiresAt: Date;
  absoluteExpiresAt: Date;
}>;

type StoredSessionRecord = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string | Date;
  clientType?: string | null;
  lastSeenAt?: string | Date | null;
  absoluteExpiresAt?: string | Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type StoredAuthSession = Readonly<{
  sessionRecord: StoredSessionRecord;
  user: AuthUser;
  storage: "local" | "memory" | "database";
}>;

type SessionReadOptions = {
  refresh?: {
    request: Request;
    response: import("next/server").NextResponse;
  };
};

function computeIssuedSessionStamp(input: {
  now: Date;
  clientType?: unknown;
  allowIosShell?: boolean;
}): IssuedSessionStamp {
  const issuedClientType = classifyClientTypeForSessionIssuance({
    clientType: input.clientType,
    allowIosShell: input.allowIosShell,
  });
  const policy = getSessionPolicyForClientType(issuedClientType);

  return {
    clientType: issuedClientType,
    lastSeenAt: input.now,
    expiresAt: new Date(input.now.getTime() + policy.idleTtlSeconds * 1000),
    absoluteExpiresAt: new Date(input.now.getTime() + policy.absoluteTtlSeconds * 1000),
  };
}

function parseClientType(value: unknown): ClientType | null {
  return value === "web" || value === "ios-shell" ? value : null;
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function isValidDate(value: Date): boolean {
  return Number.isFinite(value.getTime());
}

function isLegacySessionRecord(sessionRecord: StoredSessionRecord): boolean {
  return (
    !parseClientType(sessionRecord.clientType) ||
    !sessionRecord.lastSeenAt ||
    !sessionRecord.absoluteExpiresAt
  );
}

function isSessionExpired(sessionRecord: StoredSessionRecord, now: Date): boolean {
  const expiresAt = toDate(sessionRecord.expiresAt);
  if (!isValidDate(expiresAt) || expiresAt.getTime() <= now.getTime()) {
    return true;
  }

  if (isLegacySessionRecord(sessionRecord)) {
    return false;
  }

  const absoluteExpiresAt = toDate(sessionRecord.absoluteExpiresAt!);
  return !isValidDate(absoluteExpiresAt) || absoluteExpiresAt.getTime() <= now.getTime();
}

function shouldRefreshSession(sessionRecord: StoredSessionRecord, now: Date): boolean {
  const clientType = parseClientType(sessionRecord.clientType);
  if (!clientType || isLegacySessionRecord(sessionRecord)) {
    return false;
  }

  const lastSeenAt = toDate(sessionRecord.lastSeenAt!);
  const expiresAt = toDate(sessionRecord.expiresAt);
  const absoluteExpiresAt = toDate(sessionRecord.absoluteExpiresAt!);
  if (!isValidDate(lastSeenAt) || !isValidDate(expiresAt) || !isValidDate(absoluteExpiresAt)) {
    return false;
  }
  const policy = getSessionPolicyForClientType(clientType);
  const elapsedSinceLastSeenMs = now.getTime() - lastSeenAt.getTime();
  const remainingIdleMs = expiresAt.getTime() - now.getTime();

  return (
    elapsedSinceLastSeenMs >= SESSION_REFRESH_THROTTLE_SECONDS * 1000 &&
    remainingIdleMs <= (policy.idleTtlSeconds * 1000) / 2 &&
    absoluteExpiresAt.getTime() > now.getTime()
  );
}

function buildRefreshedSessionStamp(input: {
  now: Date;
  clientType: ClientType;
  absoluteExpiresAt: string | Date;
}): Pick<IssuedSessionStamp, "clientType" | "lastSeenAt" | "expiresAt" | "absoluteExpiresAt"> {
  const policy = getSessionPolicyForClientType(input.clientType);
  const absoluteExpiresAt = toDate(input.absoluteExpiresAt);
  if (!isValidDate(absoluteExpiresAt)) {
    return {
      clientType: input.clientType,
      lastSeenAt: input.now,
      expiresAt: input.now,
      absoluteExpiresAt: input.now,
    };
  }
  const nextIdleExpiryMs = input.now.getTime() + policy.idleTtlSeconds * 1000;

  return {
    clientType: input.clientType,
    lastSeenAt: input.now,
    expiresAt: new Date(Math.min(nextIdleExpiryMs, absoluteExpiresAt.getTime())),
    absoluteExpiresAt,
  };
}

function buildAuthSessionFromStored(sessionState: StoredAuthSession): AuthSession {
  return {
    user: sessionState.user,
    session: {
      id: sessionState.sessionRecord.id,
      expiresAt: toDate(sessionState.sessionRecord.expiresAt).toISOString(),
    },
  };
}

async function lookupStoredSessionByToken(token: string): Promise<StoredAuthSession | null> {
  const tokenHash = hashSessionToken(token);

  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const localSession = Object.values(store.sessions).find((entry) => entry.token === tokenHash);
      if (!localSession) {
        return null;
      }

      const localUser = store.users[localSession.userId];
      if (!localUser) {
        return null;
      }

      return {
        storage: "local",
        sessionRecord: localSession,
        user: {
          id: localUser.id,
          name: getDisplayName(localUser.name),
          email: localUser.email,
        },
      };
    }

    const memorySession = [...memoryStore.sessions.values()].find((entry) => entry.token === tokenHash);
    if (!memorySession) {
      return null;
    }

    const memoryUser = memoryStore.users.get(memorySession.userId);
    if (!memoryUser) {
      return null;
    }

    return {
      storage: "memory",
      sessionRecord: memorySession,
      user: {
        id: memoryUser.id,
        name: getDisplayName(memoryUser.name),
        email: memoryUser.email,
      },
    };
  }

  const { db } = await getRuntimeDatabase();
  const sessionRow = await db.query.session.findFirst({
    where: eq(session.token, tokenHash),
  });
  if (!sessionRow) {
    return null;
  }

  const userRow = await db.query.user.findFirst({
    where: eq(user.id, sessionRow.userId),
  });
  if (!userRow) {
    return null;
  }

    return {
      storage: "database",
      sessionRecord: sessionRow,
      user: {
        id: userRow.id,
        name: getDisplayName(userRow.name),
        email: userRow.email,
      },
    };
}

async function refreshStoredSession(sessionState: StoredAuthSession, now: Date): Promise<StoredAuthSession> {
  const clientType = parseClientType(sessionState.sessionRecord.clientType);
  if (!clientType || !sessionState.sessionRecord.absoluteExpiresAt) {
    return sessionState;
  }

  const refreshedStamp = buildRefreshedSessionStamp({
    now,
    clientType,
    absoluteExpiresAt: sessionState.sessionRecord.absoluteExpiresAt,
  });

  if (sessionState.storage === "local") {
    const store = await readLocalStore();
    const targetSession = store.sessions[sessionState.sessionRecord.id];
    if (!targetSession) {
      return sessionState;
    }

    targetSession.expiresAt = refreshedStamp.expiresAt.toISOString();
    targetSession.lastSeenAt = refreshedStamp.lastSeenAt.toISOString();
    targetSession.absoluteExpiresAt = refreshedStamp.absoluteExpiresAt.toISOString();
    await writeLocalStore(store);

    return {
      ...sessionState,
      sessionRecord: targetSession,
    };
  }

  if (sessionState.storage === "memory") {
    const targetSession = memoryStore.sessions.get(sessionState.sessionRecord.id);
    if (!targetSession) {
      return sessionState;
    }

    targetSession.expiresAt = refreshedStamp.expiresAt.toISOString();
    targetSession.lastSeenAt = refreshedStamp.lastSeenAt.toISOString();
    targetSession.absoluteExpiresAt = refreshedStamp.absoluteExpiresAt.toISOString();

    return {
      ...sessionState,
      sessionRecord: targetSession,
    };
  }

  const { db } = await getRuntimeDatabase();
  const [updatedSession] = await db
    .update(session)
    .set({
      expiresAt: refreshedStamp.expiresAt,
      lastSeenAt: refreshedStamp.lastSeenAt,
      absoluteExpiresAt: refreshedStamp.absoluteExpiresAt,
      updatedAt: now,
    })
    .where(eq(session.id, sessionState.sessionRecord.id))
    .returning();

  return updatedSession
    ? {
        ...sessionState,
        sessionRecord: updatedSession,
      }
    : sessionState;
}
const usePersistentDatabase = Boolean(process.env.DATABASE_URL);
const useLocalFileStore = !usePersistentDatabase && process.env.NODE_ENV !== "test";

type AuthUser = {
  id: string;
  name: string;
  email: string | null;
};

type AuthSession = {
  user: AuthUser;
  session: {
    id: string;
    expiresAt: string;
  };
};

function getDisplayName(name: string | null | undefined): string {
  return resolveUserDisplayName(name);
}

/**
 * cookie 헤더 문자열에서 현재 세션 토큰을 파싱한다.
 * @param cookieHeader 요청 cookie 헤더 값
 * @returns 세션 토큰 또는 null
 */
function getSessionTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookieValue = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));

  return cookieValue ? cookieValue.slice(`${SESSION_COOKIE_NAME}=`.length) : null;
}

/**
 * 원문 세션 토큰으로부터 인증 세션을 조회한다.
 * @param token 원문 세션 토큰
 * @returns 인증 세션 또는 null
 */
async function getSessionByToken(token: string | null): Promise<AuthSession | null> {
  if (!token) {
    return null;
  }

  const sessionState = await lookupStoredSessionByToken(token);
  if (!sessionState) {
    return null;
  }

  if (isSessionExpired(sessionState.sessionRecord, new Date())) {
    return null;
  }

  return buildAuthSessionFromStored(sessionState);
}

async function getSessionByTokenWithOptions(
  token: string | null,
  options?: SessionReadOptions,
): Promise<AuthSession | null> {
  if (!token) {
    return null;
  }

  const now = new Date();
  const sessionState = await lookupStoredSessionByToken(token);
  if (!sessionState) {
    return null;
  }

  if (isSessionExpired(sessionState.sessionRecord, now)) {
    return null;
  }

  let resolvedSessionState = sessionState;
  if (options?.refresh && shouldRefreshSession(sessionState.sessionRecord, now)) {
    resolvedSessionState = await refreshStoredSession(sessionState, now);

    const refreshedClientType = parseClientType(resolvedSessionState.sessionRecord.clientType);
    if (refreshedClientType) {
      setSessionCookie(options.refresh.response, token, options.refresh.request, {
        clientType: refreshedClientType,
        allowIosShell: refreshedClientType === "ios-shell",
        expiresAt: resolvedSessionState.sessionRecord.expiresAt,
      });
    }
  }

  return buildAuthSessionFromStored(resolvedSessionState);
}

async function deleteSessionByToken(token: string | null): Promise<void> {
  if (!token) {
    return;
  }

  const tokenHash = hashSessionToken(token);

  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();

      for (const [sessionId, localSession] of Object.entries(store.sessions)) {
        if (localSession.token === tokenHash) {
          delete store.sessions[sessionId];
        }
      }

      await writeLocalStore(store);
      return;
    }

    for (const [sessionId, memorySession] of memoryStore.sessions.entries()) {
      if (memorySession.token === tokenHash) {
        memoryStore.sessions.delete(sessionId);
      }
    }

    return;
  }

  const { db } = await getRuntimeDatabase();
  await db.delete(session).where(eq(session.token, tokenHash));
}

type AuthResult = {
  data?: AuthSession;
  error?: {
    message: string;
  };
};

/**
 * DB unique 제약 오류인지 판별한다.
 * @param error 예외 객체
 * @returns unique 충돌 여부
 */
function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("unique") || message.includes("duplicate") || message.includes("constraint");
}

/**
 * 비밀번호를 salt와 함께 scrypt로 해시한다.
 * @param password 원문 비밀번호
 * @returns 저장 가능한 해시 문자열
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${derivedKey}`;
}

/**
 * 저장된 비밀번호 해시와 입력값을 비교한다.
 * @param password 원문 비밀번호
 * @param storedHash 저장된 해시 문자열
 * @returns 비밀번호 일치 여부
 */
function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(hash, "hex");

  return derivedKey.length === storedBuffer.length && timingSafeEqual(derivedKey, storedBuffer);
}

/**
 * 세션 쿠키 원문 토큰을 서버 저장용 해시로 바꾼다.
 * @param token 세션 쿠키 원문 토큰
 * @returns SHA-256 해시 문자열
 */
function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * 사용자와 세션 정보를 응답용 구조로 변환한다.
 * @param userRow 사용자 행
 * @param sessionRow 세션 행
 * @returns 인증 응답용 세션 객체
 */
function buildAuthSession(
  userRow: typeof user.$inferSelect,
  sessionRow: typeof session.$inferSelect,
): AuthSession {
  return {
    user: {
      id: userRow.id,
      name: getDisplayName(userRow.name),
      email: userRow.email,
    },
    session: {
      id: sessionRow.id,
      expiresAt: sessionRow.expiresAt.toISOString(),
    },
  };
}

function shouldUseSecureCookie(request?: Request): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  if (!request) {
    return true;
  }

  const requestUrl = new URL(request.url);
  if (["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname)) {
    return false;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return requestUrl.protocol === "https:";
}

/**
 * 세션 쿠키를 응답에 설정한다.
 * @param response Next 응답 객체
 * @param token 원문 세션 토큰
 */
export function setSessionCookie(
  response: import("next/server").NextResponse,
  token: string,
  request?: Request,
  options?: {
    clientType?: ClientType;
    allowIosShell?: boolean;
    expiresAt?: string | Date;
  },
) {
  const issuedClientType = classifyClientTypeForSessionIssuance({
    clientType: options?.clientType,
    allowIosShell: options?.allowIosShell,
  });
  const fallbackPolicy = getSessionPolicyForClientType(issuedClientType);
  const expiresAt = options?.expiresAt ? toDate(options.expiresAt) : null;
  const maxAge = expiresAt && isValidDate(expiresAt)
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000))
    : fallbackPolicy.idleTtlSeconds;

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge,
  });
}

/**
 * 세션 쿠키를 응답에서 제거한다.
 * @param response Next 응답 객체
 */
export function clearSessionCookie(response: import("next/server").NextResponse, request?: Request) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge: 0,
  });
}

/**
 * 새 사용자 계정과 세션을 만든다.
 * @param input 이름/이메일/비밀번호 및 요청 메타데이터
 * @returns 생성된 세션 또는 에러
 */
export async function signUpWithEmailPassword(input: {
  name?: string | null;
  email: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  clientType?: ClientType;
  allowIosShell?: boolean;
}): Promise<AuthResult & { token?: string }> {
  const email = input.email.trim().toLowerCase();
  const displayName = resolveUserDisplayName(input.name);
  const userId = randomUUID();
  const now = new Date();
  const stamp = computeIssuedSessionStamp({
    now,
    clientType: input.clientType,
    allowIosShell: input.allowIosShell,
  });
  const sessionToken = randomBytes(32).toString("hex");
  const sessionTokenHash = hashSessionToken(sessionToken);
  const sessionId = randomUUID();

  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const existingLocalUser = Object.values(store.users).find((entry) => entry.email === email);

      if (existingLocalUser) {
        return {
          error: {
            message: "이미 가입된 이메일이에요. 로그인으로 이어서 사용해 주세요.",
          },
        };
      }

      const expiresAtIso = stamp.expiresAt.toISOString();
      store.users[userId] = {
        id: userId,
        name: displayName,
        email,
        emailVerified: false,
        image: null,
      };
      const nextAccountId = randomUUID();
      store.accounts[nextAccountId] = {
        id: nextAccountId,
        userId,
        providerId: "credentials",
        accountId: email,
        password: hashPassword(input.password),
        providerEmail: email,
        providerEmailVerified: false,
        lastLoginAt: now.toISOString(),
      };
      store.sessions[sessionId] = {
        id: sessionId,
        userId,
        token: sessionTokenHash,
        expiresAt: expiresAtIso,
        clientType: stamp.clientType,
        lastSeenAt: stamp.lastSeenAt.toISOString(),
        absoluteExpiresAt: stamp.absoluteExpiresAt.toISOString(),
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      };
      await writeLocalStore(store);

      return {
        data: {
          user: {
            id: userId,
            name: displayName,
            email,
          },
          session: {
            id: sessionId,
            expiresAt: expiresAtIso,
          },
        },
        token: sessionToken,
      };
    }

    const existingMemoryUser = [...memoryStore.users.values()].find((entry) => entry.email === email);

    if (existingMemoryUser) {
      return {
        error: {
          message: "이미 가입된 이메일이에요. 로그인으로 이어서 사용해 주세요.",
        },
      };
    }

    const expiresAtIso = stamp.expiresAt.toISOString();

    memoryStore.users.set(userId, {
      id: userId,
      name: displayName,
      email,
      emailVerified: false,
      image: null,
    });
    const nextAccountId = randomUUID();
    memoryStore.accounts.set(nextAccountId, {
      id: nextAccountId,
      userId,
      providerId: "credentials",
      accountId: email,
      password: hashPassword(input.password),
      providerEmail: email,
      providerEmailVerified: false,
      lastLoginAt: now.toISOString(),
    });
    memoryStore.sessions.set(sessionId, {
      id: sessionId,
      userId,
      token: sessionTokenHash,
      expiresAt: expiresAtIso,
      clientType: stamp.clientType,
      lastSeenAt: stamp.lastSeenAt.toISOString(),
      absoluteExpiresAt: stamp.absoluteExpiresAt.toISOString(),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    return {
      data: {
        user: {
          id: userId,
          name: displayName,
          email,
        },
        session: {
          id: sessionId,
          expiresAt: expiresAtIso,
        },
      },
      token: sessionToken,
    };
  }

  const { db } = await getRuntimeDatabase();

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existingUser) {
    return {
      error: {
        message: "이미 가입된 이메일이에요. 로그인으로 이어서 사용해 주세요.",
      },
    };
  }

  let createdUser: typeof user.$inferSelect;
  let createdSession: typeof session.$inferSelect;

  try {
    [createdUser, createdSession] = await db.transaction(async (tx) => {
      const [nextUser] = await tx
        .insert(user)
        .values({
          id: userId,
          name: displayName,
          email,
          emailVerified: false,
          image: null,
          status: "active",
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await tx.insert(account).values({
        id: randomUUID(),
        accountId: email,
        providerId: "credentials",
        userId,
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        password: hashPassword(input.password),
        providerEmail: email,
        providerEmailVerified: false,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      });

      const expiresAt = stamp.expiresAt;
      const [nextSession] = await tx
        .insert(session)
        .values({
          id: sessionId,
          expiresAt,
          clientType: stamp.clientType,
          lastSeenAt: stamp.lastSeenAt,
          absoluteExpiresAt: stamp.absoluteExpiresAt,
          token: sessionTokenHash,
          createdAt: now,
          updatedAt: now,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          userId,
        })
        .returning();

      return [nextUser, nextSession] as const;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: {
          message: "이미 가입된 이메일이에요. 로그인으로 이어서 사용해 주세요.",
        },
      };
    }

    throw error;
  }

  return {
    data: buildAuthSession(createdUser, createdSession),
    token: sessionToken,
  };
}

/**
 * 이메일/비밀번호로 로그인 세션을 만든다.
 * @param input 이메일/비밀번호 및 요청 메타데이터
 * @returns 생성된 세션 또는 에러
 */
export async function signInWithEmailPassword(input: {
  email: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  clientType?: ClientType;
  allowIosShell?: boolean;
}): Promise<AuthResult & { token?: string }> {
  const email = input.email.trim().toLowerCase();
  const now = new Date();
  const stamp = computeIssuedSessionStamp({
    now,
    clientType: input.clientType,
    allowIosShell: input.allowIosShell,
  });

  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const localUser = Object.values(store.users).find((entry) => entry.email === email);
      const localAccount = localUser
        ? Object.values(store.accounts).find(
            (entry) => entry.userId === localUser.id && entry.providerId === "credentials",
          )
        : null;

      if (!localUser || !localAccount?.password || !verifyPassword(input.password, localAccount.password)) {
        return {
          error: {
            message: "이메일 또는 비밀번호를 다시 확인해 주세요.",
          },
        };
      }

      const expiresAtIso = stamp.expiresAt.toISOString();
      const nextSessionId = randomUUID();
      const nextToken = randomBytes(32).toString("hex");
      store.sessions[nextSessionId] = {
        id: nextSessionId,
        userId: localUser.id,
        token: hashSessionToken(nextToken),
        expiresAt: expiresAtIso,
        clientType: stamp.clientType,
        lastSeenAt: stamp.lastSeenAt.toISOString(),
        absoluteExpiresAt: stamp.absoluteExpiresAt.toISOString(),
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      };
      await writeLocalStore(store);

      return {
        data: {
          user: {
            id: localUser.id,
            name: getDisplayName(localUser.name),
            email: localUser.email,
          },
          session: {
            id: nextSessionId,
            expiresAt: expiresAtIso,
          },
        },
        token: nextToken,
      };
    }

    const memoryUser = [...memoryStore.users.values()].find((entry) => entry.email === email);
    const memoryAccount = memoryUser
      ? [...memoryStore.accounts.values()].find(
          (entry) => entry.userId === memoryUser.id && entry.providerId === "credentials",
        )
      : null;

    if (!memoryUser || !memoryAccount?.password || !verifyPassword(input.password, memoryAccount.password)) {
      return {
        error: {
          message: "이메일 또는 비밀번호를 다시 확인해 주세요.",
        },
      };
    }

    const expiresAtIso = stamp.expiresAt.toISOString();
    const nextSessionId = randomUUID();
    const nextToken = randomBytes(32).toString("hex");

    memoryStore.sessions.set(nextSessionId, {
      id: nextSessionId,
      userId: memoryUser.id,
      token: hashSessionToken(nextToken),
      expiresAt: expiresAtIso,
      clientType: stamp.clientType,
      lastSeenAt: stamp.lastSeenAt.toISOString(),
      absoluteExpiresAt: stamp.absoluteExpiresAt.toISOString(),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    return {
      data: {
        user: {
          id: memoryUser.id,
          name: getDisplayName(memoryUser.name),
          email: memoryUser.email,
        },
        session: {
          id: nextSessionId,
          expiresAt: expiresAtIso,
        },
      },
      token: nextToken,
    };
  }

  const { db } = await getRuntimeDatabase();

  const userRow = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!userRow) {
    return {
      error: {
        message: "이메일 또는 비밀번호를 다시 확인해 주세요.",
      },
    };
  }

  const accountRow = await db.query.account.findFirst({
    where: and(eq(account.userId, userRow.id), eq(account.providerId, "credentials")),
  });

  if (!accountRow?.password || !verifyPassword(input.password, accountRow.password)) {
    return {
      error: {
        message: "이메일 또는 비밀번호를 다시 확인해 주세요.",
      },
    };
  }

  const sessionToken = randomBytes(32).toString("hex");
  const sessionTokenHash = hashSessionToken(sessionToken);
  const expiresAt = stamp.expiresAt;
  const [createdSession] = await db
    .insert(session)
    .values({
      id: randomUUID(),
      expiresAt,
      clientType: stamp.clientType,
      lastSeenAt: stamp.lastSeenAt,
      absoluteExpiresAt: stamp.absoluteExpiresAt,
      token: sessionTokenHash,
      createdAt: now,
      updatedAt: now,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      userId: userRow.id,
    })
    .returning();

  await db
    .update(user)
    .set({
      lastLoginAt: now,
      updatedAt: now,
    })
    .where(eq(user.id, userRow.id));

  return {
    data: buildAuthSession(
      {
        ...userRow,
        lastLoginAt: now,
        updatedAt: now,
      },
      createdSession,
    ),
    token: sessionToken,
  };
}

/**
 * 현재 요청의 인증 세션을 조회한다.
 * @returns 인증 세션 또는 null
 */
export async function getSessionOrNull(): Promise<AuthSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
  return getSessionByToken(token);
}

/**
 * 요청 헤더를 기반으로 인증 세션을 조회한다.
 * @param requestHeaders 현재 HTTP 요청 헤더
 * @returns 인증 세션 또는 null
 */
export async function getSessionFromHeaders(
  requestHeaders: Headers,
  options?: SessionReadOptions,
): Promise<AuthSession | null> {
  return getSessionByTokenWithOptions(
    getSessionTokenFromCookieHeader(requestHeaders.get("cookie")),
    options,
  );
}

/**
 * 로그인 세션을 강제하고 없으면 인증 화면으로 보낸다.
 * @returns 보장된 세션 객체
 */
export async function requireSession() {
  const session = await getSessionOrNull();

  if (!session) {
    redirect("/auth");
  }

  return session;
}

/**
 * 현재 세션 쿠키에 연결된 세션을 삭제한다.
 */
export async function deleteCurrentSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  await deleteSessionByToken(token ?? null);
}

export async function rotateSessionForUser(input: {
  user: AuthUser;
  requestHeaders?: Headers;
  ipAddress?: string | null;
  userAgent?: string | null;
  clientType?: ClientType;
  allowIosShell?: boolean;
}): Promise<AuthSession & { token: string }> {
  const currentToken = input.requestHeaders
    ? getSessionTokenFromCookieHeader(input.requestHeaders.get("cookie"))
    : null;

  await deleteSessionByToken(currentToken);

  const now = new Date();
  const stamp = computeIssuedSessionStamp({
    now,
    clientType: input.clientType,
    allowIosShell: input.allowIosShell,
  });
  const sessionId = randomUUID();
  const sessionToken = randomBytes(32).toString("hex");
  const sessionTokenHash = hashSessionToken(sessionToken);
  const expiresAt = stamp.expiresAt;

  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      store.sessions[sessionId] = {
        id: sessionId,
        userId: input.user.id,
        token: sessionTokenHash,
        expiresAt: expiresAt.toISOString(),
        clientType: stamp.clientType,
        lastSeenAt: stamp.lastSeenAt.toISOString(),
        absoluteExpiresAt: stamp.absoluteExpiresAt.toISOString(),
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      };
      await writeLocalStore(store);
    } else {
      memoryStore.sessions.set(sessionId, {
        id: sessionId,
        userId: input.user.id,
        token: sessionTokenHash,
        expiresAt: expiresAt.toISOString(),
        clientType: stamp.clientType,
        lastSeenAt: stamp.lastSeenAt.toISOString(),
        absoluteExpiresAt: stamp.absoluteExpiresAt.toISOString(),
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      });
    }
  } else {
    const { db } = await getRuntimeDatabase();
    await db.insert(session).values({
      id: sessionId,
      userId: input.user.id,
      token: sessionTokenHash,
      expiresAt,
      clientType: stamp.clientType,
      lastSeenAt: stamp.lastSeenAt,
      absoluteExpiresAt: stamp.absoluteExpiresAt,
      createdAt: now,
      updatedAt: now,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  }

  return {
    user: input.user,
    session: {
      id: sessionId,
      expiresAt: expiresAt.toISOString(),
    },
    token: sessionToken,
  };
}
