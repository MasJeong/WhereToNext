import { afterEach, describe, expect, it, vi } from "vitest";

import { buildOAuthAuthorizationUrl, exchangeOAuthCallback } from "@/lib/oauth-provider-service";

function createIdToken(claims: Record<string, unknown>) {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "none", typ: "JWT" })}.${encode(claims)}.signature`;
}

describe("google provider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  it("builds google authorization url with state nonce and pkce", async () => {
    process.env.GOOGLE_CLIENT_ID = "google-client-id";

    const url = await buildOAuthAuthorizationUrl({
      provider: "google",
      state: "state-123",
      codeChallenge: "challenge-123",
      nonce: "nonce-123",
      redirectUri: "http://localhost:4010/api/auth/oauth/google/callback",
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(parsed.searchParams.get("client_id")).toBe("google-client-id");
    expect(parsed.searchParams.get("state")).toBe("state-123");
    expect(parsed.searchParams.get("nonce")).toBe("nonce-123");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("exchanges callback and normalizes google identity from id token", async () => {
    process.env.GOOGLE_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id_token: createIdToken({
              sub: "google-sub-123",
              email: "User@Example.com",
              email_verified: true,
              name: "Google User",
              picture: "https://example.com/google.png",
              nonce: "nonce-123",
            }),
          }),
          { status: 200 },
        ),
      ),
    );

    const identity = await exchangeOAuthCallback({
      provider: "google",
      code: "code-123",
      codeVerifier: "verifier-123",
      nonce: "nonce-123",
      redirectUri: "http://localhost:4010/api/auth/oauth/google/callback",
    });

    expect(identity).toEqual({
      providerId: "google",
      accountId: "google-sub-123",
      email: "user@example.com",
      emailVerified: true,
      name: "Google User",
      image: "https://example.com/google.png",
    });
  });
});
