import { describe, expect, it } from "vitest";

import {
  consumeOAuthTransaction,
  createOAuthTransaction,
  createPkceCodeChallenge,
} from "@/lib/oauth-transaction";

describe("oauth transaction", () => {
  it("creates one-time state and pkce values that consume successfully once", async () => {
    const created = await createOAuthTransaction({
      provider: "google",
      next: "/auth?intent=save",
      intent: "save",
    });

    expect(created.codeChallenge).toBe(createPkceCodeChallenge(created.codeVerifier));

    const consumed = await consumeOAuthTransaction({
      state: created.state,
      provider: "google",
    });

    expect(consumed.state).toBe(created.state);
    expect(consumed.next).toBe("/auth?intent=save");

    await expect(
      consumeOAuthTransaction({
        state: created.state,
        provider: "google",
      }),
    ).rejects.toThrow("OAUTH_TRANSACTION_NOT_FOUND");
  });

  it("fails closed for provider mismatch and non-relative next values", async () => {
    await expect(
      createOAuthTransaction({
        provider: "kakao",
        next: "https://evil.example",
        intent: "share",
      }),
    ).rejects.toThrow("OAUTH_NEXT_INVALID");

    const created = await createOAuthTransaction({
      provider: "apple",
      next: "/compare/next",
      intent: "login",
    });

    await expect(
      consumeOAuthTransaction({
        state: created.state,
        provider: "google",
      }),
    ).rejects.toThrow("OAUTH_PROVIDER_MISMATCH");
  });
});
