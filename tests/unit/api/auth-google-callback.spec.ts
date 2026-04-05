import { afterEach, describe, expect, it, vi } from "vitest";

const TEST_BASE_URL = "http://localhost:4010";

vi.mock("@/lib/oauth-provider-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/oauth-provider-service")>(
    "@/lib/oauth-provider-service",
  );

  return {
    ...actual,
    exchangeOAuthCallback: vi.fn(async () => ({
      providerId: "google",
      accountId: "google-sub-123",
      email: "user@example.com",
      emailVerified: true,
      name: "Google User",
      image: null,
    })),
  };
});

import { GET as callbackGet } from "@/app/api/auth/oauth/[provider]/callback/route";
import { createOAuthTransaction } from "@/lib/oauth-transaction";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("google oauth callback", () => {
  afterEach(() => {
    vi.clearAllMocks();
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();
    memoryStore.oauthTransactions.clear();
  });

  it("blocks email collision without merge", async () => {
    memoryStore.users.set("existing-user", {
      id: "existing-user",
      name: "Existing User",
      email: "user@example.com",
      emailVerified: true,
      image: null,
    });

    const transaction = await createOAuthTransaction({
      provider: "google",
      next: "/account",
      intent: "login",
    });

    const response = await callbackGet(
      new Request(`${TEST_BASE_URL}/api/auth/oauth/google/callback?code=code-123&state=${transaction.state}`),
      { params: Promise.resolve({ provider: "google" }) },
    );

    expect(response.headers.get("location")).toContain("error=ACCOUNT_PROVIDER_MISMATCH");
    expect(memoryStore.accounts.size).toBe(0);
  });
});
