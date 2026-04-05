import { afterEach, describe, expect, it, vi } from "vitest";

import { buildOAuthAuthorizationUrl, exchangeOAuthCallback } from "@/lib/oauth-provider-service";

describe("kakao provider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.KAKAO_CLIENT_ID;
    delete process.env.KAKAO_CLIENT_SECRET;
  });

  it("builds kakao authorization url with state", async () => {
    process.env.KAKAO_CLIENT_ID = "kakao-client-id";

    const url = await buildOAuthAuthorizationUrl({
      provider: "kakao",
      state: "state-kakao",
      codeChallenge: "unused",
      nonce: "unused",
      redirectUri: "http://localhost:4010/api/auth/oauth/kakao/callback",
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://kauth.kakao.com/oauth/authorize");
    expect(parsed.searchParams.get("client_id")).toBe("kakao-client-id");
    expect(parsed.searchParams.get("state")).toBe("state-kakao");
  });

  it("allows login with null email", async () => {
    process.env.KAKAO_CLIENT_ID = "kakao-client-id";
    process.env.KAKAO_CLIENT_SECRET = "kakao-client-secret";

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: "kakao-access-token" }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              id: 42,
              properties: {
                nickname: "카카오 사용자",
                profile_image: "https://example.com/kakao.png",
              },
              kakao_account: {
                email: null,
                is_email_valid: false,
                is_email_verified: false,
                email_needs_agreement: true,
              },
            }),
            { status: 200 },
          ),
        ),
    );

    const identity = await exchangeOAuthCallback({
      provider: "kakao",
      code: "kakao-code",
      codeVerifier: "unused",
      nonce: "unused",
      redirectUri: "http://localhost:4010/api/auth/oauth/kakao/callback",
    });

    expect(identity).toEqual({
      providerId: "kakao",
      accountId: "42",
      email: null,
      emailVerified: false,
      name: "카카오 사용자",
      image: "https://example.com/kakao.png",
    });
  });
});
