import { NextResponse } from "next/server";

import { exchangeOAuthCallback } from "@/lib/oauth-provider-service";
import { setSessionCookie } from "@/lib/auth";
import { consumeOAuthTransaction, type OAuthProviderId } from "@/lib/oauth-transaction";
import { signInWithProviderIdentity } from "@/lib/provider-auth";

function parseProvider(provider: string): OAuthProviderId | null {
  return provider === "google" || provider === "kakao" || provider === "apple" ? provider : null;
}

function buildAuthRedirect(request: Request, next: string, error?: string) {
  const url = new URL("/auth", request.url);
  url.searchParams.set("next", next);
  if (error) {
    url.searchParams.set("error", error);
  }
  return NextResponse.redirect(url);
}

async function extractCallbackParams(request: Request) {
  if (request.method === "POST") {
    const formData = await request.formData();
    return {
      code: formData.get("code")?.toString() ?? null,
      state: formData.get("state")?.toString() ?? null,
      error: formData.get("error")?.toString() ?? null,
    };
  }

  const url = new URL(request.url);
  return {
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    error: url.searchParams.get("error"),
  };
}

async function handleCallback(request: Request, provider: OAuthProviderId) {
  const callback = await extractCallbackParams(request);

  if (!callback.state) {
    return buildAuthRedirect(request, "/account", "OAUTH_STATE_INVALID");
  }

  let transaction;
  try {
    transaction = await consumeOAuthTransaction({ state: callback.state, provider });
  } catch (error) {
    return buildAuthRedirect(
      request,
      "/account",
      error instanceof Error ? error.message : "OAUTH_STATE_INVALID",
    );
  }

  if (callback.error) {
    return buildAuthRedirect(request, transaction.next, "OAUTH_PROVIDER_DENIED");
  }

  if (!callback.code) {
    return buildAuthRedirect(request, transaction.next, "OAUTH_CODE_MISSING");
  }

  const identity = await exchangeOAuthCallback({
    provider,
    code: callback.code,
    codeVerifier: transaction.codeVerifier,
    nonce: transaction.nonce,
    redirectUri: `${new URL(request.url).origin}/api/auth/oauth/${provider}/callback`,
  });

  const result = await signInWithProviderIdentity({
    identity,
    requestHeaders: request.headers,
    ipAddress: request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  });

  if (result.error || !result.data || !result.data.token) {
    return buildAuthRedirect(request, transaction.next, result.error?.code ?? "OAUTH_CALLBACK_FAILED");
  }

  const response = NextResponse.redirect(new URL(transaction.next, request.url));
  setSessionCookie(response, result.data.token, request);
  return response;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await context.params;
  const provider = parseProvider(rawProvider);

  if (!provider) {
    return NextResponse.json({ code: "OAUTH_PROVIDER_UNSUPPORTED" }, { status: 404 });
  }

  return handleCallback(request, provider);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await context.params;
  const provider = parseProvider(rawProvider);

  if (!provider) {
    return NextResponse.json({ code: "OAUTH_PROVIDER_UNSUPPORTED" }, { status: 404 });
  }

  return handleCallback(request, provider);
}
