import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteCurrentSession } = vi.hoisted(() => ({
  deleteCurrentSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  clearSessionCookie: (response: Response & {
    cookies: { set: (cookie: { name: string; value: string; maxAge: number }) => void };
  }) => {
    response.cookies.set({
      name: "trip_compass_session",
      value: "",
      maxAge: 0,
    });
  },
  deleteCurrentSession,
}));

import { POST as signOutRoute } from "@/app/api/auth/sign-out/route";

describe("sign-out route failure handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("still clears the cookie when session deletion fails", async () => {
    deleteCurrentSession.mockRejectedValueOnce(new Error("DB_DOWN"));

    const response = await signOutRoute(
      new Request("http://localhost:4010/api/auth/sign-out", {
        method: "POST",
        headers: { cookie: "trip_compass_session=raw-token" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("trip_compass_session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(payload.data?.ok).toBe(true);
    expect(payload.error?.message).toContain("로그아웃");
  });
});
