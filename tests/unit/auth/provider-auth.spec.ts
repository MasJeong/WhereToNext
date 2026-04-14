import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionFromHeaders: vi.fn(),
  rotateSessionForUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSessionFromHeaders: mocks.getSessionFromHeaders,
  rotateSessionForUser: mocks.rotateSessionForUser,
}));

import { signInWithProviderIdentity } from "@/lib/provider-auth";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("signInWithProviderIdentity", () => {
  beforeEach(() => {
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();
    mocks.getSessionFromHeaders.mockResolvedValue(null);
    mocks.rotateSessionForUser.mockImplementation(async ({ user }) => ({
      user,
      session: {
        id: "session-1",
        expiresAt: new Date().toISOString(),
      },
      token: "test-token",
    }));
  });

  it("assigns an app nickname instead of the provider nickname for first social sign-in", async () => {
    const result = await signInWithProviderIdentity({
      identity: {
        providerId: "kakao",
        accountId: "kakao-1",
        email: "kakao@example.com",
        emailVerified: true,
        name: "정지훈",
        image: null,
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.user.name).toMatch(/^[가-힣]+[가-힣]+[0-9]{3}$/);
    expect(result.data?.user.name).not.toBe("정지훈");
  });

  it("keeps the stored nickname when an existing social account signs in again", async () => {
    memoryStore.users.set("user-1", {
      id: "user-1",
      name: "다정한참새871",
      email: "kakao@example.com",
      emailVerified: true,
      image: null,
    });
    memoryStore.accounts.set("account-1", {
      id: "account-1",
      userId: "user-1",
      providerId: "kakao",
      accountId: "kakao-1",
      password: null,
      providerEmail: "kakao@example.com",
      providerEmailVerified: true,
      lastLoginAt: null,
    });

    const result = await signInWithProviderIdentity({
      identity: {
        providerId: "kakao",
        accountId: "kakao-1",
        email: "kakao@example.com",
        emailVerified: true,
        name: "정지훈",
        image: "https://example.com/kakao.png",
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.user.name).toBe("다정한참새871");
    expect(memoryStore.users.get("user-1")?.name).toBe("다정한참새871");
    expect(memoryStore.users.get("user-1")?.image).toBe("https://example.com/kakao.png");
  });
});
