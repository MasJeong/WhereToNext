function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/u, "");
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function resolvePublicOrigin(): string {
  const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (appOrigin) {
    return trimTrailingSlash(appOrigin);
  }

  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    return window.location.origin;
  }

  throw new Error("NEXT_PUBLIC_APP_ORIGIN is required outside local dev/test browser runtime.");
}

function resolveApiBaseUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (apiBaseUrl) {
    return trimTrailingSlash(apiBaseUrl);
  }

  return "";
}

/**
 * Builds an absolute URL for app page links.
 * @param path Relative application path
 * @returns Canonical public URL
 */
export function buildPublicUrl(path: string): string {
  const normalizedPath = ensureLeadingSlash(path);
  const origin = resolvePublicOrigin();

  return `${origin}${normalizedPath}`;
}

/**
 * Builds an API URL that stays relative on normal web and becomes absolute only when configured.
 * @param path Relative API path
 * @returns Relative or absolute API URL depending on environment
 */
export function buildApiUrl(path: string): string {
  const normalizedPath = ensureLeadingSlash(path);
  const baseUrl = resolveApiBaseUrl();

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}
