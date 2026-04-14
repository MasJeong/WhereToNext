import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { getRuntimeDatabase } from "@/lib/db/runtime";
import { account, user } from "@/lib/db/schema";
import { getSessionFromHeaders, rotateSessionForUser } from "@/lib/auth";
import { readLocalStore, writeLocalStore } from "@/lib/persistence/local-store";
import { memoryStore } from "@/lib/persistence/memory-store";
import type { NormalizedProviderIdentity } from "@/lib/provider-identity";
import { buildRandomUserDisplayName, resolveUserDisplayName } from "@/lib/user-display-name";

const usePersistentDatabase = Boolean(process.env.DATABASE_URL);
const useLocalFileStore = !usePersistentDatabase && process.env.NODE_ENV !== "test";

type ProviderAuthErrorCode = "ACCOUNT_PROVIDER_MISMATCH" | "ALREADY_SIGNED_IN";

type ProviderAuthErrorProviderId = "google" | "kakao" | "apple" | "credentials";

type ProviderAuthResult = {
  data?: Awaited<ReturnType<typeof rotateSessionForUser>>;
  error?: {
    code: ProviderAuthErrorCode;
    message: string;
    providerId?: ProviderAuthErrorProviderId;
  };
};

function buildProviderAuthError(
  code: ProviderAuthErrorCode,
  providerId?: ProviderAuthErrorProviderId,
): ProviderAuthResult {
  if (code === "ALREADY_SIGNED_IN") {
    return {
      error: {
        code,
        message: "이미 로그인되어 있어요. 계정 화면에서 현재 상태를 확인해 주세요.",
      },
    };
  }

  return {
    error: {
      code,
      message: "같은 이메일의 다른 로그인 수단이 있어 자동으로 연결하지 않았어요. 계정을 확인해 주세요.",
      providerId,
    },
  };
}

function toProviderAuthErrorProviderId(
  providerId: string | null | undefined,
): ProviderAuthErrorProviderId | undefined {
  if (
    providerId === "google" ||
    providerId === "kakao" ||
    providerId === "apple" ||
    providerId === "credentials"
  ) {
    return providerId;
  }

  return undefined;
}

function buildInitialSocialDisplayName(): string {
  return buildRandomUserDisplayName();
}

function getStoredUserDisplayName(name: string | null | undefined): string {
  return resolveUserDisplayName(name);
}

export async function signInWithProviderIdentity(input: {
  identity: NormalizedProviderIdentity;
  requestHeaders?: Headers;
  ipAddress?: string | null;
  userAgent?: string | null;
  clientType?: "web" | "ios-shell";
  allowIosShell?: boolean;
}): Promise<ProviderAuthResult> {
  const currentSession = input.requestHeaders
    ? await getSessionFromHeaders(input.requestHeaders)
    : null;

  if (currentSession) {
    return buildProviderAuthError("ALREADY_SIGNED_IN");
  }

  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const matchedAccount = Object.values(store.accounts).find(
        (entry) =>
          entry.providerId === input.identity.providerId && entry.accountId === input.identity.accountId,
      );

      if (matchedAccount) {
        const matchedUser = store.users[matchedAccount.userId];

        if (!matchedUser) {
          throw new Error("OAUTH_USER_NOT_FOUND");
        }

        matchedAccount.providerEmail = input.identity.email;
        matchedAccount.providerEmailVerified = input.identity.emailVerified;
        matchedAccount.lastLoginAt = new Date().toISOString();
        matchedUser.image = input.identity.image;
        if (input.identity.email) {
          matchedUser.email = input.identity.email;
          matchedUser.emailVerified = input.identity.emailVerified;
        }
        await writeLocalStore(store);

        return {
          data: await rotateSessionForUser({
            user: {
              id: matchedUser.id,
              name: getStoredUserDisplayName(matchedUser.name),
              email: matchedUser.email,
            },
            requestHeaders: input.requestHeaders,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            clientType: input.clientType,
            allowIosShell: input.allowIosShell,
          }),
        };
      }

      const collidingUser = input.identity.email
        ? Object.values(store.users).find((entry) => entry.email === input.identity.email)
        : null;
      if (collidingUser) {
        const existingAccount = Object.values(store.accounts).find((entry) => entry.userId === collidingUser.id);
        return buildProviderAuthError(
          "ACCOUNT_PROVIDER_MISMATCH",
          toProviderAuthErrorProviderId(existingAccount?.providerId),
        );
      }

      const userId = randomUUID();
      const nextUser = {
        id: userId,
        name: buildInitialSocialDisplayName(),
        email: input.identity.email,
        emailVerified: input.identity.emailVerified,
        image: input.identity.image,
      };
      const nextAccountId = randomUUID();
      store.users[userId] = nextUser;
      store.accounts[nextAccountId] = {
        id: nextAccountId,
        userId,
        providerId: input.identity.providerId,
        accountId: input.identity.accountId,
        password: null,
        providerEmail: input.identity.email,
        providerEmailVerified: input.identity.emailVerified,
        lastLoginAt: new Date().toISOString(),
      };
      await writeLocalStore(store);

      return {
        data: await rotateSessionForUser({
          user: {
            id: nextUser.id,
            name: getStoredUserDisplayName(nextUser.name),
            email: nextUser.email,
          },
          requestHeaders: input.requestHeaders,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          clientType: input.clientType,
          allowIosShell: input.allowIosShell,
        }),
      };
    }

    const matchedAccount = [...memoryStore.accounts.values()].find(
      (entry) => entry.providerId === input.identity.providerId && entry.accountId === input.identity.accountId,
    );
    if (matchedAccount) {
      const matchedUser = memoryStore.users.get(matchedAccount.userId);

      if (!matchedUser) {
        throw new Error("OAUTH_USER_NOT_FOUND");
      }

      matchedAccount.providerEmail = input.identity.email;
      matchedAccount.providerEmailVerified = input.identity.emailVerified;
      matchedAccount.lastLoginAt = new Date().toISOString();
      matchedUser.image = input.identity.image;
      if (input.identity.email) {
        matchedUser.email = input.identity.email;
        matchedUser.emailVerified = input.identity.emailVerified;
      }

      return {
        data: await rotateSessionForUser({
          user: {
            id: matchedUser.id,
            name: getStoredUserDisplayName(matchedUser.name),
            email: matchedUser.email,
          },
          requestHeaders: input.requestHeaders,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          clientType: input.clientType,
          allowIosShell: input.allowIosShell,
        }),
      };
    }

    const collidingUser = input.identity.email
      ? [...memoryStore.users.values()].find((entry) => entry.email === input.identity.email)
      : null;
    if (collidingUser) {
      const existingAccount = [...memoryStore.accounts.values()].find((entry) => entry.userId === collidingUser.id);
      return buildProviderAuthError(
        "ACCOUNT_PROVIDER_MISMATCH",
        toProviderAuthErrorProviderId(existingAccount?.providerId),
      );
    }

    const userId = randomUUID();
    memoryStore.users.set(userId, {
      id: userId,
      name: buildInitialSocialDisplayName(),
      email: input.identity.email,
      emailVerified: input.identity.emailVerified,
      image: input.identity.image,
    });
    const nextAccountId = randomUUID();
    memoryStore.accounts.set(nextAccountId, {
      id: nextAccountId,
      userId,
      providerId: input.identity.providerId,
      accountId: input.identity.accountId,
      password: null,
      providerEmail: input.identity.email,
      providerEmailVerified: input.identity.emailVerified,
      lastLoginAt: new Date().toISOString(),
    });

    return {
      data: await rotateSessionForUser({
        user: {
          id: userId,
          name: getStoredUserDisplayName(memoryStore.users.get(userId)?.name),
          email: input.identity.email,
        },
        requestHeaders: input.requestHeaders,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        clientType: input.clientType,
        allowIosShell: input.allowIosShell,
      }),
    };
  }

  const { db } = await getRuntimeDatabase();
  const matchedAccount = await db.query.account.findFirst({
    where: and(
      eq(account.providerId, input.identity.providerId),
      eq(account.accountId, input.identity.accountId),
    ),
  });

  if (matchedAccount) {
    const matchedUser = await db.query.user.findFirst({ where: eq(user.id, matchedAccount.userId) });
    if (!matchedUser) {
      throw new Error("OAUTH_USER_NOT_FOUND");
    }

    await db
      .update(account)
      .set({
        providerEmail: input.identity.email,
        providerEmailVerified: input.identity.emailVerified,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(account.id, matchedAccount.id));

    await db
      .update(user)
      .set({
        image: input.identity.image,
        email: input.identity.email ?? matchedUser.email,
        emailVerified: input.identity.email ? input.identity.emailVerified : matchedUser.emailVerified,
        status: "active",
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, matchedUser.id));

    return {
      data: await rotateSessionForUser({
        user: {
          id: matchedUser.id,
          name: getStoredUserDisplayName(matchedUser.name),
          email: input.identity.email ?? matchedUser.email,
        },
        requestHeaders: input.requestHeaders,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        clientType: input.clientType,
        allowIosShell: input.allowIosShell,
      }),
    };
  }

  const collidingUser = input.identity.email
    ? await db.query.user.findFirst({ where: eq(user.email, input.identity.email) })
    : null;
  if (collidingUser) {
    const existingAccount = await db.query.account.findFirst({
      where: eq(account.userId, collidingUser.id),
    });
    return buildProviderAuthError(
      "ACCOUNT_PROVIDER_MISMATCH",
      toProviderAuthErrorProviderId(existingAccount?.providerId),
    );
  }

  const userId = randomUUID();
  const initialDisplayName = buildInitialSocialDisplayName();
  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id: userId,
      name: initialDisplayName,
      email: input.identity.email,
      emailVerified: input.identity.emailVerified,
      image: input.identity.image,
      status: "active",
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await tx.insert(account).values({
      id: randomUUID(),
      userId,
      providerId: input.identity.providerId,
      accountId: input.identity.accountId,
      password: null,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: null,
      providerEmail: input.identity.email,
      providerEmailVerified: input.identity.emailVerified,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  return {
    data: await rotateSessionForUser({
      user: {
        id: userId,
        name: initialDisplayName,
        email: input.identity.email,
      },
      requestHeaders: input.requestHeaders,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      clientType: input.clientType,
      allowIosShell: input.allowIosShell,
    }),
  };
}
