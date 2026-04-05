export type PostAuthIntent =
  | {
      kind: "save-home-card";
      route: string;
      destinationId: string;
    }
  | {
      kind: "save-detail-card";
      route: string;
      destinationId: string;
    }
  | {
      kind: "create-compare";
      route: string;
    };

const POST_AUTH_INTENT_STORAGE_KEY = "trip-compass.post-auth-intent";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function buildCurrentRoute(pathname: string, searchParams?: URLSearchParams): string {
  const query = searchParams?.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function savePostAuthIntent(intent: PostAuthIntent): void {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(POST_AUTH_INTENT_STORAGE_KEY, JSON.stringify(intent));
}

export function readPostAuthIntent(): PostAuthIntent | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(POST_AUTH_INTENT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PostAuthIntent;
  } catch {
    clearPostAuthIntent();
    return null;
  }
}

export function clearPostAuthIntent(): void {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(POST_AUTH_INTENT_STORAGE_KEY);
}

export function consumeMatchingPostAuthIntent(currentRoute: string): PostAuthIntent | null {
  const intent = readPostAuthIntent();

  if (!intent || intent.route !== currentRoute) {
    return null;
  }

  clearPostAuthIntent();
  return intent;
}
