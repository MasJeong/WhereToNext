import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeOAuthTransaction: vi.fn(),
  exchangeOAuthCallback: vi.fn(),
  signInWithProviderIdentity: vi.fn(),
}));

vi.mock("@/lib/oauth-transaction", async () => {
  const actual = await vi.importActual<typeof import("@/lib/oauth-transaction")>("@/lib/oauth-transaction");
  return {
    ...actual,
    consumeOAuthTransaction: mocks.consumeOAuthTransaction,
  };
});

vi.mock("@/lib/oauth-provider-service", () => ({
  exchangeOAuthCallback: mocks.exchangeOAuthCallback,
}));

vi.mock("@/lib/provider-auth", () => ({
  signInWithProviderIdentity: mocks.signInWithProviderIdentity,
}));

import { GET as oauthGoogleCallback } from "@/app/api/auth/oauth/[provider]/callback/route";

describe("oauth callback shell session issuance", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps ios-shell issuance when the stored oauth transaction was created in shell mode", async () => {
    const sessionExpiresAt = "2026-04-30T13:30:45.867Z";
    mocks.consumeOAuthTransaction.mockResolvedValue({
      state: "state-123",
      codeVerifier: "verifier-123",
      nonce: "nonce-123",
      provider: "google",
      next: "/account",
      intent: "login",
      clientType: "ios-shell",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    mocks.exchangeOAuthCallback.mockResolvedValue({
      providerId: "google",
      accountId: "google-sub-123",
      email: "shell-oauth@example.com",
      emailVerified: true,
      name: "Shell OAuth",
      image: null,
    });
    mocks.signInWithProviderIdentity.mockResolvedValue({
      data: {
        token: "oauth-shell-token",
        user: {
          id: "user-1",
          name: "Shell OAuth",
          email: "shell-oauth@example.com",
        },
        session: {
          id: "session-1",
          expiresAt: sessionExpiresAt,
        },
      },
    });

    const response = await oauthGoogleCallback(
      new Request("http://localhost:4010/api/auth/oauth/google/callback?code=code-123&state=state-123"),
      { params: Promise.resolve({ provider: "google" }) },
    );
    const setCookie = response.headers.get("set-cookie") ?? "";
    const maxAgeMatch = setCookie.match(/Max-Age=(\d+)/);

    expect(mocks.signInWithProviderIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        clientType: "ios-shell",
        allowIosShell: true,
      }),
    );
    expect(setCookie).toContain("trip_compass_session=oauth-shell-token");
    expect(maxAgeMatch).not.toBeNull();
    const expectedMaxAge = Math.ceil((new Date(sessionExpiresAt).getTime() - Date.now()) / 1000);
    expect(Number(maxAgeMatch?.[1] ?? 0)).toBeGreaterThanOrEqual(expectedMaxAge - 1);
    expect(Number(maxAgeMatch?.[1] ?? 0)).toBeLessThanOrEqual(expectedMaxAge + 1);
  });

  it("redirects with the previous provider when the account was created with a different login method", async () => {
    mocks.consumeOAuthTransaction.mockResolvedValue({
      state: "state-456",
      codeVerifier: "verifier-456",
      nonce: "nonce-456",
      provider: "kakao",
      next: "/account",
      intent: "login",
      clientType: "web",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    mocks.exchangeOAuthCallback.mockResolvedValue({
      providerId: "kakao",
      accountId: "kakao-sub-123",
      email: "collision@example.com",
      emailVerified: true,
      name: "Collision User",
      image: null,
    });
    mocks.signInWithProviderIdentity.mockResolvedValue({
      error: {
        code: "ACCOUNT_PROVIDER_MISMATCH",
        message: "same email already exists",
        providerId: "google",
      },
    });

    const response = await oauthGoogleCallback(
      new Request("http://localhost:4010/api/auth/oauth/kakao/callback?code=code-456&state=state-456"),
      { params: Promise.resolve({ provider: "kakao" }) },
    );
    const redirectUrl = new URL(response.headers.get("location") ?? "", "http://localhost:4010");

    expect(redirectUrl.pathname).toBe("/auth");
    expect(redirectUrl.searchParams.get("error")).toBe("ACCOUNT_PROVIDER_MISMATCH");
    expect(redirectUrl.searchParams.get("existingProvider")).toBe("google");
    expect(redirectUrl.searchParams.get("attemptedProvider")).toBe("kakao");
  });
});
