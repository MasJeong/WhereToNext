import { afterEach, describe, expect, it, vi } from "vitest";

import { buildOAuthAuthorizationUrl, exchangeOAuthCallback } from "@/lib/oauth-provider-service";

function createIdToken(claims: Record<string, unknown>) {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "none", typ: "JWT" })}.${encode(claims)}.signature`;
}

describe("apple provider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.APPLE_CLIENT_ID;
    delete process.env.APPLE_CLIENT_SECRET;
  });

  it("builds apple authorization url with form_post and nonce", async () => {
    process.env.APPLE_CLIENT_ID = "apple-client-id";

    const url = await buildOAuthAuthorizationUrl({
      provider: "apple",
      state: "apple-state",
      codeChallenge: "unused",
      nonce: "apple-nonce",
      redirectUri: "http://localhost:4010/api/auth/oauth/apple/callback",
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://appleid.apple.com/auth/authorize");
    expect(parsed.searchParams.get("response_mode")).toBe("form_post");
    expect(parsed.searchParams.get("nonce")).toBe("apple-nonce");
  });

  it("normalizes apple relay email and validates nonce", async () => {
    process.env.APPLE_CLIENT_ID = "apple-client-id";
    process.env.APPLE_CLIENT_SECRET = "apple-client-secret";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id_token: createIdToken({
              sub: "apple-sub-123",
              email: "relay@privaterelay.appleid.com",
              email_verified: "true",
              nonce: "apple-nonce",
            }),
          }),
          { status: 200 },
        ),
      ),
    );

    const identity = await exchangeOAuthCallback({
      provider: "apple",
      code: "apple-code",
      codeVerifier: "unused",
      nonce: "apple-nonce",
      redirectUri: "http://localhost:4010/api/auth/oauth/apple/callback",
    });

    expect(identity).toEqual({
      providerId: "apple",
      accountId: "apple-sub-123",
      email: "relay@privaterelay.appleid.com",
      emailVerified: true,
      name: null,
      image: null,
    });
  });
});
