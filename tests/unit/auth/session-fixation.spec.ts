import { describe, expect, it } from "vitest";

import { getSessionFromHeaders, rotateSessionForUser, signUpWithEmailPassword } from "@/lib/auth";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("session fixation", () => {
  it("rotates the app session after authentication and invalidates the previous cookie", async () => {
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();

    const signedUp = await signUpWithEmailPassword({
      name: "Session User",
      email: "session-user@example.com",
      password: "password-1234",
    });

    if (!signedUp.data || !signedUp.token) {
      throw new Error("TEST_SIGN_UP_FAILED");
    }

    const rotated = await rotateSessionForUser({
      user: signedUp.data.user,
      requestHeaders: new Headers({ cookie: `trip_compass_session=${signedUp.token}` }),
    });

    const previousSession = await getSessionFromHeaders(
      new Headers({ cookie: `trip_compass_session=${signedUp.token}` }),
    );
    const currentSession = await getSessionFromHeaders(
      new Headers({ cookie: `trip_compass_session=${rotated.token}` }),
    );

    expect(rotated.token).not.toBe(signedUp.token);
    expect(rotated.session.id).not.toBe(signedUp.data.session.id);
    expect(previousSession).toBeNull();
    expect(currentSession?.user.id).toBe(signedUp.data.user.id);
  });
});
