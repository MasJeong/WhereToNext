import { createHash, randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getAuthSession } from "@/app/api/auth/session/route";
import { POST as signUpRoute } from "@/app/api/auth/sign-up/route";
import { getSessionFromHeaders, WEB_IDLE_TTL_SECONDS } from "@/lib/auth";
import { memoryStore } from "@/lib/persistence/memory-store";

function seedMemoryUser(userId: string, email: string) {
  memoryStore.users.set(userId, {
    id: userId,
    name: "Session Test User",
    email,
    emailVerified: false,
    image: null,
  });
}

function seedMemorySession(input: {
  userId: string;
  rawToken: string;
  expiresAt: string;
  clientType?: "web" | "ios-shell";
  lastSeenAt?: string;
  absoluteExpiresAt?: string;
}) {
  const sessionId = randomUUID();

  memoryStore.sessions.set(sessionId, {
    id: sessionId,
    userId: input.userId,
    token: createHash("sha256").update(input.rawToken).digest("hex"),
    expiresAt: input.expiresAt,
    clientType: input.clientType,
    lastSeenAt: input.lastSeenAt,
    absoluteExpiresAt: input.absoluteExpiresAt,
    ipAddress: null,
    userAgent: null,
  });

  return sessionId;
}

function readIssuedCookie(response: Response): string {
  const cookieHeader = response.headers.get("set-cookie");
  if (!cookieHeader) {
    throw new Error("TEST_COOKIE_MISSING");
  }

  return cookieHeader;
}

describe("session read refresh and auth routes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects idle-expired sessions on authenticated reads", async () => {
    const userId = randomUUID();
    seedMemoryUser(userId, "idle-expired@example.com");
    seedMemorySession({
      userId,
      rawToken: "idle-expired-token",
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      clientType: "web",
      lastSeenAt: new Date(Date.now() - 10_000).toISOString(),
      absoluteExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const session = await getSessionFromHeaders(
      new Headers({ cookie: "trip_compass_session=idle-expired-token" }),
    );

    expect(session).toBeNull();
  });

  it("rejects absolute-expired sessions even when idle expiry is still in the future", async () => {
    const userId = randomUUID();
    seedMemoryUser(userId, "absolute-expired@example.com");
    seedMemorySession({
      userId,
      rawToken: "absolute-expired-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      clientType: "web",
      lastSeenAt: new Date(Date.now() - 10_000).toISOString(),
      absoluteExpiresAt: new Date(Date.now() - 1_000).toISOString(),
    });

    const session = await getSessionFromHeaders(
      new Headers({ cookie: "trip_compass_session=absolute-expired-token" }),
    );

    expect(session).toBeNull();
  });

  it("treats corrupted expiry timestamps as expired instead of failing open", async () => {
    const userId = randomUUID();
    seedMemoryUser(userId, "invalid-date@example.com");
    seedMemorySession({
      userId,
      rawToken: "invalid-date-token",
      expiresAt: "not-a-date",
      clientType: "web",
      lastSeenAt: new Date(Date.now() - 10_000).toISOString(),
      absoluteExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const session = await getSessionFromHeaders(
      new Headers({ cookie: "trip_compass_session=invalid-date-token" }),
    );

    expect(session).toBeNull();
  });

  it("keeps legacy sessions readable without sliding refresh", async () => {
    const userId = randomUUID();
    seedMemoryUser(userId, "legacy@example.com");
    const sessionId = seedMemorySession({
      userId,
      rawToken: "legacy-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const response = await getAuthSession(
      new Request("http://localhost:4010/api/auth/session", {
        headers: { cookie: "trip_compass_session=legacy-token" },
      }),
    );
    const payload = await response.json();
    const storedSession = memoryStore.sessions.get(sessionId);

    expect(response.status).toBe(200);
    expect(payload.data?.session.id).toBe(sessionId);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(storedSession?.lastSeenAt).toBeUndefined();
    expect(storedSession?.absoluteExpiresAt).toBeUndefined();
  });

  it("refreshes eligible sessions through the auth session route and syncs cookie maxAge", async () => {
    const userId = randomUUID();
    const now = Date.now();
    seedMemoryUser(userId, "refresh@example.com");
    const sessionId = seedMemorySession({
      userId,
      rawToken: "refresh-token",
      expiresAt: new Date(now + 60_000).toISOString(),
      clientType: "web",
      lastSeenAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
      absoluteExpiresAt: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const response = await getAuthSession(
      new Request("http://localhost:4010/api/auth/session", {
        headers: { cookie: "trip_compass_session=refresh-token" },
      }),
    );
    const payload = await response.json();
    const storedSession = memoryStore.sessions.get(sessionId);
    const setCookie = readIssuedCookie(response);

    expect(response.status).toBe(200);
    expect(payload.data?.session.id).toBe(sessionId);
    expect(storedSession?.lastSeenAt).toBe(new Date(now).toISOString());
    expect(storedSession?.expiresAt).toBe(
      new Date(now + WEB_IDLE_TTL_SECONDS * 1000).toISOString(),
    );
    expect(setCookie).toContain("trip_compass_session=refresh-token");
    expect(setCookie).toContain(`Max-Age=${WEB_IDLE_TTL_SECONDS}`);
  });

  it("skips repeated refresh writes inside the throttle window", async () => {
    const userId = randomUUID();
    const now = Date.now();
    seedMemoryUser(userId, "throttle@example.com");
    const sessionId = seedMemorySession({
      userId,
      rawToken: "throttle-token",
      expiresAt: new Date(now + 60_000).toISOString(),
      clientType: "web",
      lastSeenAt: new Date(now - 60 * 60 * 1000).toISOString(),
      absoluteExpiresAt: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const response = await getAuthSession(
      new Request("http://localhost:4010/api/auth/session", {
        headers: { cookie: "trip_compass_session=throttle-token" },
      }),
    );
    const storedSession = memoryStore.sessions.get(sessionId);

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(storedSession?.lastSeenAt).toBe(new Date(now - 60 * 60 * 1000).toISOString());
    expect(storedSession?.expiresAt).toBe(new Date(now + 60_000).toISOString());
  });

  it("issues ios-shell policy only for trusted shell auth-route requests", async () => {
    const response = await signUpRoute(
      new Request("http://localhost:4010/api/auth/sign-up", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "capacitor://localhost",
        },
        body: JSON.stringify({
          name: "Shell User",
          email: "shell-user@example.com",
          password: "password-1234",
        }),
      }),
    );
    const payload = await response.json();
    const sessionRecord = [...memoryStore.sessions.values()][0];
    const cookieHeader = readIssuedCookie(response);

    expect(response.status).toBe(201);
    expect(payload.data?.user.email).toBe("shell-user@example.com");
    expect(sessionRecord?.clientType).toBe("ios-shell");
    expect(cookieHeader).toContain("Max-Age=2592000");

    const sessionResponse = await getAuthSession(
      new Request("http://localhost:4010/api/auth/session", {
        headers: {
          cookie: cookieHeader.split(",")[0] ?? cookieHeader,
          origin: "capacitor://localhost",
        },
      }),
    );
    const sessionPayload = await sessionResponse.json();

    expect(sessionResponse.status).toBe(200);
    expect(sessionPayload.data?.user.email).toBe("shell-user@example.com");
    expect(memoryStore.sessions.get(sessionRecord!.id)?.clientType).toBe("ios-shell");
  });

});
