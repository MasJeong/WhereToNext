import { afterEach, describe, expect, it, vi } from "vitest";

const TEST_BASE_URL = "http://localhost:4010";

vi.mock("@/lib/oauth-provider-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/oauth-provider-service")>(
    "@/lib/oauth-provider-service",
  );

  return {
    ...actual,
    exchangeOAuthCallback: vi.fn(async () => ({
      providerId: "apple",
      accountId: "apple-sub-123",
      email: "relay@privaterelay.appleid.com",
      emailVerified: true,
      name: null,
      image: null,
    })),
  };
});

import { POST as callbackPost } from "@/app/api/auth/oauth/[provider]/callback/route";
import { createOAuthTransaction } from "@/lib/oauth-transaction";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("apple oauth callback", () => {
  afterEach(() => {
    vi.clearAllMocks();
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();
    memoryStore.oauthTransactions.clear();
  });

  it("accepts form_post callback and creates an app session", async () => {
    const transaction = await createOAuthTransaction({
      provider: "apple",
      next: "/account",
      intent: "login",
    });

    const formData = new FormData();
    formData.set("code", "apple-code");
    formData.set("state", transaction.state);

    const response = await callbackPost(
      new Request(`${TEST_BASE_URL}/api/auth/oauth/apple/callback`, {
        method: "POST",
        body: formData,
      }),
      { params: Promise.resolve({ provider: "apple" }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${TEST_BASE_URL}/account`);
    expect(response.cookies.get("trip_compass_session")?.value).toBeTruthy();
  });
});
