import { createHash, randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LOCAL_STORE_FILE = resolve(process.cwd(), ".data", "trip-compass-local-store.json");

describe("local-store session fallback", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();
    await rm(LOCAL_STORE_FILE, { force: true });
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.resetModules();
    await rm(LOCAL_STORE_FILE, { force: true });
  });

  it("enforces absolute expiry in local-store fallback mode", async () => {
    const auth = await import("@/lib/auth");
    const { readLocalStore, writeLocalStore } = await import("@/lib/persistence/local-store");
    const store = await readLocalStore();
    const userId = randomUUID();
    const sessionId = randomUUID();

    store.users[userId] = {
      id: userId,
      name: "Local Fallback User",
      email: "local-fallback@example.com",
      emailVerified: false,
      image: null,
    };
    store.sessions[sessionId] = {
      id: sessionId,
      userId,
      token: createHash("sha256").update("local-absolute-token").digest("hex"),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      clientType: "web",
      lastSeenAt: new Date(Date.now() - 60_000).toISOString(),
      absoluteExpiresAt: new Date(Date.now() - 1_000).toISOString(),
      ipAddress: null,
      userAgent: null,
    };
    await writeLocalStore(store);

    const session = await auth.getSessionFromHeaders(
      new Headers({ cookie: "trip_compass_session=local-absolute-token" }),
    );

    expect(session).toBeNull();
  });

  it("keeps legacy local-store sessions readable until their original expiresAt", async () => {
    const auth = await import("@/lib/auth");
    const { readLocalStore, writeLocalStore } = await import("@/lib/persistence/local-store");
    const store = await readLocalStore();
    const userId = randomUUID();
    const sessionId = randomUUID();

    store.users[userId] = {
      id: userId,
      name: "Legacy Local User",
      email: "legacy-local@example.com",
      emailVerified: false,
      image: null,
    };
    store.sessions[sessionId] = {
      id: sessionId,
      userId,
      token: createHash("sha256").update("legacy-local-token").digest("hex"),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      ipAddress: null,
      userAgent: null,
    };
    await writeLocalStore(store);

    const session = await auth.getSessionFromHeaders(
      new Headers({ cookie: "trip_compass_session=legacy-local-token" }),
    );

    expect(session?.session.id).toBe(sessionId);
  });
});
