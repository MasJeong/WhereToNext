import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let currentToken: string | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name !== "trip_compass_session" || !currentToken) {
        return undefined;
      }

      return { value: currentToken };
    },
  }),
}));

import { POST as signOutRoute } from "@/app/api/auth/sign-out/route";
import { getSessionFromHeaders, signUpWithEmailPassword } from "@/lib/auth";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("sign-out route", () => {
  beforeEach(() => {
    currentToken = null;
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();
  });

  afterEach(() => {
    currentToken = null;
  });

  it("removes the server-side session and clears the cookie", async () => {
    const signUpResult = await signUpWithEmailPassword({
      name: "Logout User",
      email: "logout-user@example.com",
      password: "password-1234",
    });

    if (!signUpResult.token) {
      throw new Error("TEST_SIGN_UP_FAILED");
    }

    currentToken = signUpResult.token;

    const response = await signOutRoute(
      new Request("http://localhost:4010/api/auth/sign-out", {
        method: "POST",
        headers: { cookie: `trip_compass_session=${signUpResult.token}` },
      }),
    );
    const payload = await response.json();
    const sessionAfterLogout = await getSessionFromHeaders(
      new Headers({ cookie: `trip_compass_session=${signUpResult.token}` }),
    );

    expect(response.status).toBe(200);
    expect(payload.data?.ok).toBe(true);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(memoryStore.sessions.size).toBe(0);
    expect(sessionAfterLogout).toBeNull();
  });
});
