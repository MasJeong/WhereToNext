import type { OAuthProviderId } from "@/lib/oauth-transaction";

export type NormalizedProviderIdentity = {
  providerId: OAuthProviderId;
  accountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
};

type GoogleIdentityInput = {
  sub: string;
  email?: string | null;
  email_verified?: boolean | null;
  name?: string | null;
  picture?: string | null;
};

type KakaoIdentityInput = {
  id: string | number;
  properties?: {
    nickname?: string | null;
    profile_image?: string | null;
  } | null;
  kakao_account?: {
    email?: string | null;
    is_email_valid?: boolean | null;
    is_email_verified?: boolean | null;
    profile?: {
      nickname?: string | null;
      profile_image_url?: string | null;
    } | null;
  } | null;
};

type AppleIdentityInput = {
  sub: string;
  email?: string | null;
  email_verified?: boolean | "true" | "false" | null;
  name?: string | null;
  picture?: string | null;
};

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeOptionalEmail(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.toLowerCase() : null;
}

function normalizeBoolean(value: boolean | "true" | "false" | null | undefined): boolean {
  return value === true || value === "true";
}

export function normalizeGoogleIdentity(input: GoogleIdentityInput): NormalizedProviderIdentity {
  return {
    providerId: "google",
    accountId: input.sub,
    email: normalizeOptionalEmail(input.email),
    emailVerified: input.email_verified === true,
    name: normalizeOptionalString(input.name),
    image: normalizeOptionalString(input.picture),
  };
}

export function normalizeKakaoIdentity(input: KakaoIdentityInput): NormalizedProviderIdentity {
  const account = input.kakao_account ?? null;
  const profile = account?.profile ?? input.properties ?? null;
  const email = normalizeOptionalEmail(account?.email);
  const emailVerified = account?.is_email_valid === true && account?.is_email_verified === true;
  const image = account?.profile?.profile_image_url ?? input.properties?.profile_image ?? null;

  return {
    providerId: "kakao",
    accountId: String(input.id),
    email,
    emailVerified,
    name: normalizeOptionalString(profile?.nickname),
    image: normalizeOptionalString(image),
  };
}

export function normalizeAppleIdentity(input: AppleIdentityInput): NormalizedProviderIdentity {
  return {
    providerId: "apple",
    accountId: input.sub,
    email: normalizeOptionalEmail(input.email),
    emailVerified: normalizeBoolean(input.email_verified),
    name: normalizeOptionalString(input.name),
    image: normalizeOptionalString(input.picture),
  };
}
