import { createHash, randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { getSessionFromHeaders } from "@/lib/auth";
import { session } from "@/lib/db/schema";
import {
  isLegacyLocalSessionRecord,
  type LocalSessionRecord,
} from "@/lib/persistence/local-store";
import {
  isLegacyMemorySessionRecord,
  memoryStore,
  type MemorySessionRecord,
} from "@/lib/persistence/memory-store";

describe("session storage model", () => {
  it("reads new-format memory session records that include idle+absolute lifetime fields", async () => {
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();

    const userId = randomUUID();
    const sessionId = randomUUID();
    const rawToken = "new-shape-token";
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const now = Date.now();
    const idleExpiresAt = new Date(now + 60_000).toISOString();
    const absoluteExpiresAt = new Date(now + 120_000).toISOString();

    memoryStore.users.set(userId, {
      id: userId,
      name: "Storage Shape User",
      email: "session-storage-model@example.com",
      emailVerified: false,
      image: null,
    });
    memoryStore.sessions.set(sessionId, {
      id: sessionId,
      userId,
      token: hashedToken,
      expiresAt: idleExpiresAt,
      clientType: "ios-shell",
      lastSeenAt: new Date(now).toISOString(),
      absoluteExpiresAt,
      ipAddress: null,
      userAgent: null,
    });

    const resolved = await getSessionFromHeaders(
      new Headers({ cookie: `trip_compass_session=${rawToken}` }),
    );

    expect(resolved?.session.id).toBe(sessionId);
    const createdSession = memoryStore.sessions.get(sessionId);
    expect(createdSession).toBeDefined();
    expect(createdSession?.clientType).toBe("ios-shell");
    expect(createdSession?.lastSeenAt).toBeTypeOf("string");
    expect(createdSession?.absoluteExpiresAt).toBeTypeOf("string");
    expect(createdSession?.expiresAt).toBeTypeOf("string");
    expect(isLegacyMemorySessionRecord(createdSession!)).toBe(false);
    expect(new Date(createdSession!.absoluteExpiresAt ?? 0).getTime()).toBeGreaterThan(
      new Date(createdSession!.expiresAt).getTime(),
    );
  });

  it("keeps local/memory/db session shapes aligned with the new fields", () => {
    const nowIso = new Date().toISOString();
    const localRecord: LocalSessionRecord = {
      id: randomUUID(),
      userId: randomUUID(),
      token: "token-hash",
      expiresAt: nowIso,
      clientType: "web",
      lastSeenAt: nowIso,
      absoluteExpiresAt: nowIso,
      ipAddress: null,
      userAgent: null,
    };
    const memoryRecord: MemorySessionRecord = {
      id: randomUUID(),
      userId: randomUUID(),
      token: "token-hash",
      expiresAt: nowIso,
      clientType: "web",
      lastSeenAt: nowIso,
      absoluteExpiresAt: nowIso,
      ipAddress: null,
      userAgent: null,
    };

    expect(localRecord.clientType).toBe("web");
    expect(memoryRecord.clientType).toBe("web");
    expect(isLegacyLocalSessionRecord(localRecord)).toBe(false);
    expect(isLegacyMemorySessionRecord(memoryRecord)).toBe(false);
    expect("clientType" in session).toBe(true);
    expect("lastSeenAt" in session).toBe(true);
    expect("absoluteExpiresAt" in session).toBe(true);
    expect("expiresAt" in session).toBe(true);
  });

  it("reads legacy records missing new fields and marks them as legacy", async () => {
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();

    const legacyUserId = randomUUID();
    const legacySessionId = randomUUID();
    const legacyToken = "legacy-token";
    const legacyTokenHash = createHash("sha256").update(legacyToken).digest("hex");
    const legacyExpiresAt = new Date(Date.now() + 60_000).toISOString();

    memoryStore.users.set(legacyUserId, {
      id: legacyUserId,
      name: "Legacy User",
      email: "legacy-user@example.com",
      emailVerified: false,
      image: null,
    });
    memoryStore.sessions.set(legacySessionId, {
      id: legacySessionId,
      userId: legacyUserId,
      token: legacyTokenHash,
      expiresAt: legacyExpiresAt,
      ipAddress: null,
      userAgent: null,
    });

    const sessionFromLegacy = await getSessionFromHeaders(
      new Headers({ cookie: `trip_compass_session=${legacyToken}` }),
    );

    expect(sessionFromLegacy?.session.id).toBe(legacySessionId);
    const storedLegacy = memoryStore.sessions.get(legacySessionId);
    expect(storedLegacy).toBeDefined();
    expect(isLegacyMemorySessionRecord(storedLegacy!)).toBe(true);
    expect(storedLegacy?.expiresAt).toBe(legacyExpiresAt);
    expect(storedLegacy?.lastSeenAt).toBeUndefined();
    expect(storedLegacy?.absoluteExpiresAt).toBeUndefined();
  });
});
