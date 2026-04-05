import { NextResponse } from "next/server";

import type { OAuthProviderId } from "@/lib/oauth-transaction";

function parseProvider(provider: string): OAuthProviderId | null {
  return provider === "google" || provider === "kakao" || provider === "apple" ? provider : null;
}

function buildCode(provider: OAuthProviderId, mockCase: string | null): string {
  return `mock:${provider}:${mockCase ?? "success"}`;
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

  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const redirectUri = url.searchParams.get("redirect_uri");
  const mockCase = url.searchParams.get("mockCase");

  if (!state || !redirectUri) {
    return NextResponse.json({ code: "MOCK_OAUTH_INVALID" }, { status: 400 });
  }

  if (mockCase === "denied") {
    if (provider === "apple") {
      return new NextResponse(
        `<html><body><form id="mock-oauth-form" method="POST" action="${redirectUri}"><input type="hidden" name="state" value="${state}" /><input type="hidden" name="error" value="access_denied" /></form><script>document.getElementById('mock-oauth-form').submit();</script></body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }

    const deniedUrl = new URL(redirectUri);
    deniedUrl.searchParams.set("state", state);
    deniedUrl.searchParams.set("error", "access_denied");
    return NextResponse.redirect(deniedUrl);
  }

  const code = buildCode(provider, mockCase);

  if (provider === "apple") {
    return new NextResponse(
      `<html><body><form id="mock-oauth-form" method="POST" action="${redirectUri}"><input type="hidden" name="state" value="${state}" /><input type="hidden" name="code" value="${code}" /></form><script>document.getElementById('mock-oauth-form').submit();</script></body></html>`,
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("state", state);
  callbackUrl.searchParams.set("code", code);
  return NextResponse.redirect(callbackUrl);
}
