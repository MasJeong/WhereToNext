import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteCurrentSession: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  deleteCurrentSession: mocks.deleteCurrentSession,
  clearSessionCookie: mocks.clearSessionCookie,
}));

import { POST as signOutRoute } from "@/app/api/auth/sign-out/route";

describe("sign-out route error handling", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("still clears the cookie when server-side session deletion fails", async () => {
    mocks.deleteCurrentSession.mockRejectedValue(new Error("DB_DOWN"));

    const response = await signOutRoute(
      new Request("http://localhost:4010/api/auth/sign-out", {
        method: "POST",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data?.ok).toBe(true);
    expect(payload.error?.message).toContain("로그아웃");
    expect(mocks.clearSessionCookie).toHaveBeenCalledTimes(1);
  });
});
