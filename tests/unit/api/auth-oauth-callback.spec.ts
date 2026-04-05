import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_BASE_URL = "http://localhost:4010";
const { exchangeOAuthCallback } = vi.hoisted(() => ({
  exchangeOAuthCallback: vi.fn(async () => ({
    providerId: "google",
    accountId: "google-sub-123",
    email: "user@example.com",
    emailVerified: true,
    name: "OAuth User",
    image: null,
  })),
}));

vi.mock("@/lib/oauth-provider-service", () => ({
  buildOAuthAuthorizationUrl: vi.fn(async ({ provider, state }: { provider: string; state: string }) => {
    return `${TEST_BASE_URL}/provider/${provider}?state=${state}`;
  }),
  exchangeOAuthCallback,
}));

import { GET as callbackGet } from "@/app/api/auth/oauth/[provider]/callback/route";
import { GET as startGet } from "@/app/api/auth/oauth/[provider]/start/route";
import { createOAuthTransaction } from "@/lib/oauth-transaction";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("auth oauth callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchangeOAuthCallback.mockResolvedValue({
      providerId: "google",
      accountId: "google-sub-123",
      email: "user@example.com",
      emailVerified: true,
      name: "OAuth User",
      image: null,
    });
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();
    memoryStore.oauthTransactions.clear();
  });

  it("creates app session from normalized identity", async () => {
    const transaction = await createOAuthTransaction({
      provider: "google",
      next: "/account",
      intent: "login",
    });

    const request = new Request(
      `${TEST_BASE_URL}/api/auth/oauth/google/callback?code=test-code&state=${transaction.state}`,
    );
    const response = await callbackGet(request, {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${TEST_BASE_URL}/account`);
    expect(response.cookies.get("trip_compass_session")?.value).toBeTruthy();
    expect(memoryStore.accounts.size).toBe(1);
  });

  it("rejects unlinked provider collision without silent merge", async () => {
    memoryStore.users.set("existing-user", {
      id: "existing-user",
      name: "Existing User",
      email: "user@example.com",
      emailVerified: true,
      image: null,
    });

    const transaction = await createOAuthTransaction({
      provider: "google",
      next: "/auth?intent=save",
      intent: "save",
    });

    const request = new Request(
      `${TEST_BASE_URL}/api/auth/oauth/google/callback?code=test-code&state=${transaction.state}`,
    );
    const response = await callbackGet(request, {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth");
    expect(response.headers.get("location")).toContain("error=ACCOUNT_PROVIDER_MISMATCH");
    expect(memoryStore.accounts.size).toBe(0);
  });

  it("redirects back to auth instead of throwing when provider exchange fails", async () => {
    exchangeOAuthCallback.mockRejectedValueOnce(new Error("PROVIDER_DOWN"));

    const transaction = await createOAuthTransaction({
      provider: "google",
      next: "/results?partyType=couple",
      intent: "login",
    });

    const request = new Request(
      `${TEST_BASE_URL}/api/auth/oauth/google/callback?code=test-code&state=${transaction.state}`,
    );
    const response = await callbackGet(request, {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth");
    expect(response.headers.get("location")).toContain("error=OAUTH_CALLBACK_FAILED");
  });

  it("starts oauth flow with redirect to provider authorization url", async () => {
    const request = new Request(
      `${TEST_BASE_URL}/api/auth/oauth/google/start?next=/account&intent=login`,
    );
    const response = await startGet(request, {
      params: Promise.resolve({ provider: "google" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(`${TEST_BASE_URL}/provider/google?state=`);
  });
});
