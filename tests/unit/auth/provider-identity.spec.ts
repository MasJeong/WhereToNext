import { describe, expect, it } from "vitest";

import {
  normalizeAppleIdentity,
  normalizeGoogleIdentity,
  normalizeKakaoIdentity,
} from "@/lib/provider-identity";

describe("provider identity", () => {
  it("normalizes google identity using sub instead of email", () => {
    const identity = normalizeGoogleIdentity({
      sub: "google-sub-123",
      email: "User@Example.com",
      email_verified: true,
      name: "Google User",
      picture: "https://example.com/google-user.png",
    });

    expect(identity).toEqual({
      providerId: "google",
      accountId: "google-sub-123",
      email: "user@example.com",
      emailVerified: true,
      name: "Google User",
      image: "https://example.com/google-user.png",
    });
  });

  it("keeps kakao login usable when email is missing or unverifiable", () => {
    const identity = normalizeKakaoIdentity({
      id: 42,
      properties: {
        nickname: "카카오 사용자",
        profile_image: "https://example.com/kakao-user.png",
      },
      kakao_account: {
        email: null,
        is_email_valid: false,
        is_email_verified: false,
      },
    });

    expect(identity).toEqual({
      providerId: "kakao",
      accountId: "42",
      email: null,
      emailVerified: false,
      name: "카카오 사용자",
      image: "https://example.com/kakao-user.png",
    });
  });

  it("normalizes apple relay email and string email_verified claims", () => {
    const identity = normalizeAppleIdentity({
      sub: "apple-sub-999",
      email: "relay@privaterelay.appleid.com",
      email_verified: "true",
      name: "Apple User",
    });

    expect(identity).toEqual({
      providerId: "apple",
      accountId: "apple-sub-999",
      email: "relay@privaterelay.appleid.com",
      emailVerified: true,
      name: "Apple User",
      image: null,
    });
  });
});
