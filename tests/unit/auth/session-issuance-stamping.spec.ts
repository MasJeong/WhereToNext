import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SHELL_ABSOLUTE_TTL_SECONDS,
  SHELL_IDLE_TTL_SECONDS,
  WEB_ABSOLUTE_TTL_SECONDS,
  WEB_IDLE_TTL_SECONDS,
  rotateSessionForUser,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/lib/auth";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("session issuance stamping", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stamps web policy fields at sign-up issuance time", async () => {
    const now = new Date();
    const signedUp = await signUpWithEmailPassword({
      name: "Lifetime User",
      email: "lifetime-user@example.com",
      password: "password-1234",
      clientType: "ios-shell",
    });

    if (!signedUp.data) {
      throw new Error("TEST_SIGN_UP_FAILED");
    }

    const record = memoryStore.sessions.get(signedUp.data.session.id);
    expect(record).toBeTruthy();
    expect(record?.clientType).toBe("web");
    expect(record?.lastSeenAt).toBe(now.toISOString());
    expect(record?.expiresAt).toBe(new Date(now.getTime() + WEB_IDLE_TTL_SECONDS * 1000).toISOString());
    expect(record?.absoluteExpiresAt).toBe(
      new Date(now.getTime() + WEB_ABSOLUTE_TTL_SECONDS * 1000).toISOString(),
    );
  });

  it("stamps fields on sign-in issuance time", async () => {
    const signedUp = await signUpWithEmailPassword({
      name: "Lifetime User",
      email: "sign-in-user@example.com",
      password: "password-1234",
    });

    if (!signedUp.data) {
      throw new Error("TEST_SIGN_UP_FAILED");
    }

    const now = new Date();
    const signedIn = await signInWithEmailPassword({
      email: "sign-in-user@example.com",
      password: "password-1234",
      clientType: "ios-shell",
    });

    if (!signedIn.data) {
      throw new Error("TEST_SIGN_IN_FAILED");
    }

    const record = memoryStore.sessions.get(signedIn.data.session.id);
    expect(record).toBeTruthy();
    expect(record?.clientType).toBe("web");
    expect(record?.lastSeenAt).toBe(now.toISOString());
    expect(record?.expiresAt).toBe(new Date(now.getTime() + WEB_IDLE_TTL_SECONDS * 1000).toISOString());
    expect(record?.absoluteExpiresAt).toBe(
      new Date(now.getTime() + WEB_ABSOLUTE_TTL_SECONDS * 1000).toISOString(),
    );
  });

  it("issues ios-shell policy only when the caller explicitly allowlists it", async () => {
    const now = new Date();
    const signedUp = await signUpWithEmailPassword({
      name: "Lifetime User",
      email: "rotate-user@example.com",
      password: "password-1234",
    });

    if (!signedUp.data || !signedUp.token) {
      throw new Error("TEST_SIGN_UP_FAILED");
    }

    const rotatedShell = await rotateSessionForUser({
      user: signedUp.data.user,
      requestHeaders: new Headers({ cookie: `trip_compass_session=${signedUp.token}` }),
      clientType: "ios-shell",
      allowIosShell: true,
    });

    const record = memoryStore.sessions.get(rotatedShell.session.id);
    expect(record).toBeTruthy();
    expect(record?.clientType).toBe("ios-shell");
    expect(record?.lastSeenAt).toBe(now.toISOString());
    expect(record?.expiresAt).toBe(new Date(now.getTime() + SHELL_IDLE_TTL_SECONDS * 1000).toISOString());
    expect(record?.absoluteExpiresAt).toBe(
      new Date(now.getTime() + SHELL_ABSOLUTE_TTL_SECONDS * 1000).toISOString(),
    );
  });
});
