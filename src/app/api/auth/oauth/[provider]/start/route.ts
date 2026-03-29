import { NextResponse } from "next/server";

import { buildOAuthAuthorizationUrl } from "@/lib/oauth-provider-service";
import {
  type OAuthIntent,
  type OAuthProviderId,
  createOAuthTransaction,
} from "@/lib/oauth-transaction";

function parseProvider(provider: string): OAuthProviderId | null {
  return provider === "google" || provider === "kakao" || provider === "apple" ? provider : null;
}

function parseIntent(value: string | null): OAuthIntent {
  return value === "save" || value === "share" || value === "link" ? value : "login";
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
  const transaction = await createOAuthTransaction({
    provider,
    next: url.searchParams.get("next") ?? "/account",
    intent: parseIntent(url.searchParams.get("intent")),
  });

  const authorizationUrl = await buildOAuthAuthorizationUrl({
    provider,
    state: transaction.state,
    codeChallenge: transaction.codeChallenge,
    nonce: transaction.nonce,
    redirectUri: `${url.origin}/api/auth/oauth/${provider}/callback`,
    mockCase: url.searchParams.get("mockCase"),
  });

  return NextResponse.redirect(authorizationUrl);
}
