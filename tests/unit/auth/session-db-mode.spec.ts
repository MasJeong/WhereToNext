import { createHash, randomUUID } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

type MockSessionRow = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  clientType: "web" | "ios-shell" | null;
  lastSeenAt: Date | null;
  absoluteExpiresAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  updatedAt: Date;
};

function buildMockDb(sessionRow: MockSessionRow | null) {
  return {
    query: {
      session: {
        findFirst: vi.fn(async () => sessionRow),
      },
      user: {
        findFirst: vi.fn(async () =>
          sessionRow
            ? {
                id: sessionRow.userId,
                name: "DB User",
                email: "db-user@example.com",
              }
            : null,
        ),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => []),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => undefined),
    })),
    insert: vi.fn(),
  };
}

async function importAuthWithMockedDb(sessionRow: MockSessionRow | null) {
  vi.resetModules();
  vi.stubEnv("DATABASE_URL", "postgres://unit-test");
  vi.doMock("@/lib/db/runtime", () => ({
    getRuntimeDatabase: async () => ({
      db: buildMockDb(sessionRow),
      mode: "postgres",
      close: async () => undefined,
    }),
  }));

  return import("@/lib/auth");
}

describe("session db mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects absolute-expired database sessions", async () => {
    const rawToken = "db-absolute-token";
    const auth = await importAuthWithMockedDb({
      id: randomUUID(),
      userId: randomUUID(),
      token: createHash("sha256").update(rawToken).digest("hex"),
      expiresAt: new Date(Date.now() + 60_000),
      clientType: "web",
      lastSeenAt: new Date(Date.now() - 10_000),
      absoluteExpiresAt: new Date(Date.now() - 1_000),
      ipAddress: null,
      userAgent: null,
      updatedAt: new Date(),
    });

    const session = await auth.getSessionFromHeaders(
      new Headers({ cookie: `trip_compass_session=${rawToken}` }),
    );

    expect(session).toBeNull();
  });

  it("keeps legacy database sessions readable until their original expiresAt", async () => {
    const rawToken = "db-legacy-token";
    const sessionId = randomUUID();
    const auth = await importAuthWithMockedDb({
      id: sessionId,
      userId: randomUUID(),
      token: createHash("sha256").update(rawToken).digest("hex"),
      expiresAt: new Date(Date.now() + 60_000),
      clientType: null,
      lastSeenAt: null,
      absoluteExpiresAt: null,
      ipAddress: null,
      userAgent: null,
      updatedAt: new Date(),
    });

    const session = await auth.getSessionFromHeaders(
      new Headers({ cookie: `trip_compass_session=${rawToken}` }),
    );

    expect(session?.session.id).toBe(sessionId);
    expect(session?.user.email).toBe("db-user@example.com");
  });
});
