import { afterEach, describe, expect, it, vi } from "vitest";

const TEST_BASE_URL = "http://localhost:4010";

vi.mock("@/lib/oauth-provider-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/oauth-provider-service")>(
    "@/lib/oauth-provider-service",
  );

  return {
    ...actual,
    exchangeOAuthCallback: vi.fn(async () => ({
      providerId: "kakao",
      accountId: "42",
      email: null,
      emailVerified: false,
      name: "카카오 사용자",
      image: null,
    })),
  };
});

import { GET as callbackGet } from "@/app/api/auth/oauth/[provider]/callback/route";
import { createOAuthTransaction } from "@/lib/oauth-transaction";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("kakao oauth callback", () => {
  afterEach(() => {
    vi.clearAllMocks();
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();
    memoryStore.oauthTransactions.clear();
  });

  it("creates session even when kakao email is unavailable", async () => {
    const transaction = await createOAuthTransaction({
      provider: "kakao",
      next: "/account",
      intent: "login",
    });

    const response = await callbackGet(
      new Request(`${TEST_BASE_URL}/api/auth/oauth/kakao/callback?code=code-123&state=${transaction.state}`),
      { params: Promise.resolve({ provider: "kakao" }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${TEST_BASE_URL}/account`);
    expect(response.cookies.get("trip_compass_session")?.value).toBeTruthy();
    expect(memoryStore.users.size).toBe(1);
  });
});
