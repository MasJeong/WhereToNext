import type { OAuthProviderId } from "@/lib/oauth-transaction";
import {
  normalizeAppleIdentity,
  normalizeGoogleIdentity,
  normalizeKakaoIdentity,
  type NormalizedProviderIdentity,
} from "@/lib/provider-identity";

export type OAuthAuthorizationInput = {
  provider: OAuthProviderId;
  state: string;
  codeChallenge: string;
  nonce: string;
  redirectUri: string;
  mockCase?: string | null;
};

export type OAuthCallbackExchangeInput = {
  provider: OAuthProviderId;
  code: string;
  codeVerifier: string;
  nonce: string;
  redirectUri: string;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`OAUTH_ENV_MISSING:${name}`);
  }
  return value;
}

function isMockOAuthEnabled(): boolean {
  return process.env.MOCK_OAUTH_PROVIDER === "true";
}

function buildMockAuthorizationUrl(input: OAuthAuthorizationInput): string {
  const origin = new URL(input.redirectUri).origin;
  const url = new URL(`/api/auth/mock/${input.provider}/authorize`, origin);
  url.searchParams.set("state", input.state);
  url.searchParams.set("redirect_uri", input.redirectUri);
  if (input.mockCase) {
    url.searchParams.set("mockCase", input.mockCase);
  }
  return url.toString();
}

function readMockIdentity(input: OAuthCallbackExchangeInput): NormalizedProviderIdentity {
  const [, provider, mockCase = "success"] = input.code.split(":");

  if (provider !== input.provider) {
    throw new Error("OAUTH_PROVIDER_EXCHANGE_FAILED");
  }

  if (input.provider === "google") {
    return normalizeGoogleIdentity({
      sub: mockCase === "collision" ? "google-collision" : "google-success",
      email: mockCase === "collision" ? "user@example.com" : "google-user@example.com",
      email_verified: true,
      name: "Google User",
      picture: null,
    });
  }

  if (input.provider === "kakao") {
    return normalizeKakaoIdentity({
      id: mockCase === "no-email" ? 42 : 43,
      properties: {
        nickname: "카카오 사용자",
        profile_image: null,
      },
      kakao_account:
        mockCase === "no-email"
          ? {
              email: null,
              is_email_valid: false,
              is_email_verified: false,
            }
          : {
              email: "kakao-user@example.com",
              is_email_valid: true,
              is_email_verified: true,
            },
    });
  }

  return normalizeAppleIdentity({
    sub: "apple-success",
    email: mockCase === "relay" ? "relay@privaterelay.appleid.com" : "apple-user@example.com",
    email_verified: "true",
    name: "Apple User",
    picture: null,
  });
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split(".");
  if (!payload) {
    throw new Error("OAUTH_ID_TOKEN_INVALID");
  }

  const normalized = payload.replace(/-/gu, "+").replace(/_/gu, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<string, unknown>;
}

async function buildGoogleAuthorizationUrl(input: OAuthAuthorizationInput): Promise<string> {
  if (isMockOAuthEnabled()) {
    return buildMockAuthorizationUrl(input);
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", readRequiredEnv("GOOGLE_CLIENT_ID"));
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", input.state);
  url.searchParams.set("nonce", input.nonce);
  return url.toString();
}

async function exchangeGoogleCallback(
  input: OAuthCallbackExchangeInput,
): Promise<NormalizedProviderIdentity> {
  if (isMockOAuthEnabled()) {
    return readMockIdentity(input);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      client_id: readRequiredEnv("GOOGLE_CLIENT_ID"),
      client_secret: readRequiredEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: input.redirectUri,
      code_verifier: input.codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error("OAUTH_PROVIDER_EXCHANGE_FAILED");
  }

  const payload = (await response.json()) as { id_token?: string };
  if (!payload.id_token) {
    throw new Error("OAUTH_ID_TOKEN_MISSING");
  }

  const claims = decodeJwtPayload(payload.id_token);
  if (claims.nonce !== input.nonce) {
    throw new Error("OAUTH_NONCE_INVALID");
  }
  if (typeof claims.sub !== "string" || claims.sub.length === 0) {
    throw new Error("OAUTH_SUBJECT_MISSING");
  }

  return normalizeGoogleIdentity({
    sub: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    email_verified: claims.email_verified === true,
    name: typeof claims.name === "string" ? claims.name : null,
    picture: typeof claims.picture === "string" ? claims.picture : null,
  });
}

async function buildKakaoAuthorizationUrl(input: OAuthAuthorizationInput): Promise<string> {
  if (isMockOAuthEnabled()) {
    return buildMockAuthorizationUrl(input);
  }

  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", readRequiredEnv("KAKAO_CLIENT_ID"));
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", input.state);
  return url.toString();
}

async function exchangeKakaoCallback(
  input: OAuthCallbackExchangeInput,
): Promise<NormalizedProviderIdentity> {
  if (isMockOAuthEnabled()) {
    return readMockIdentity(input);
  }

  const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: readRequiredEnv("KAKAO_CLIENT_ID"),
      client_secret: readRequiredEnv("KAKAO_CLIENT_SECRET"),
      redirect_uri: input.redirectUri,
      code: input.code,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("OAUTH_PROVIDER_EXCHANGE_FAILED");
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenPayload.access_token) {
    throw new Error("OAUTH_ACCESS_TOKEN_MISSING");
  }

  const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
      "content-type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!userResponse.ok) {
    throw new Error("OAUTH_PROVIDER_PROFILE_FAILED");
  }

  const profilePayload = (await userResponse.json()) as {
    id: string | number;
    properties?: { nickname?: string | null; profile_image?: string | null } | null;
    kakao_account?: {
      email?: string | null;
      is_email_valid?: boolean | null;
      is_email_verified?: boolean | null;
      email_needs_agreement?: boolean | null;
      profile?: { nickname?: string | null; profile_image_url?: string | null } | null;
    } | null;
  };

  return normalizeKakaoIdentity(profilePayload);
}

async function buildAppleAuthorizationUrl(input: OAuthAuthorizationInput): Promise<string> {
  if (isMockOAuthEnabled()) {
    return buildMockAuthorizationUrl(input);
  }

  const url = new URL("https://appleid.apple.com/auth/authorize");
  url.searchParams.set("client_id", readRequiredEnv("APPLE_CLIENT_ID"));
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "form_post");
  url.searchParams.set("scope", "openid email name");
  url.searchParams.set("state", input.state);
  url.searchParams.set("nonce", input.nonce);
  return url.toString();
}

async function exchangeAppleCallback(
  input: OAuthCallbackExchangeInput,
): Promise<NormalizedProviderIdentity> {
  if (isMockOAuthEnabled()) {
    return readMockIdentity(input);
  }

  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      client_id: readRequiredEnv("APPLE_CLIENT_ID"),
      client_secret: readRequiredEnv("APPLE_CLIENT_SECRET"),
      redirect_uri: input.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("OAUTH_PROVIDER_EXCHANGE_FAILED");
  }

  const payload = (await response.json()) as { id_token?: string };
  if (!payload.id_token) {
    throw new Error("OAUTH_ID_TOKEN_MISSING");
  }

  const claims = decodeJwtPayload(payload.id_token);
  if (claims.nonce !== input.nonce) {
    throw new Error("OAUTH_NONCE_INVALID");
  }
  if (typeof claims.sub !== "string" || claims.sub.length === 0) {
    throw new Error("OAUTH_SUBJECT_MISSING");
  }

  return normalizeAppleIdentity({
    sub: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    email_verified:
      claims.email_verified === true || claims.email_verified === "true"
        ? "true"
        : claims.email_verified === false || claims.email_verified === "false"
          ? "false"
          : null,
    name: typeof claims.name === "string" ? claims.name : null,
    picture: typeof claims.picture === "string" ? claims.picture : null,
  });
}

export async function buildOAuthAuthorizationUrl(input: OAuthAuthorizationInput): Promise<string> {
  if (input.provider === "google") {
    return buildGoogleAuthorizationUrl(input);
  }

  if (input.provider === "kakao") {
    return buildKakaoAuthorizationUrl(input);
  }

  if (input.provider === "apple") {
    return buildAppleAuthorizationUrl(input);
  }

  throw new Error("OAUTH_PROVIDER_NOT_IMPLEMENTED");
}

export async function exchangeOAuthCallback(
  input: OAuthCallbackExchangeInput,
): Promise<NormalizedProviderIdentity> {
  if (input.provider === "google") {
    return exchangeGoogleCallback(input);
  }

  if (input.provider === "kakao") {
    return exchangeKakaoCallback(input);
  }

  if (input.provider === "apple") {
    return exchangeAppleCallback(input);
  }

  throw new Error("OAUTH_PROVIDER_NOT_IMPLEMENTED");
}
