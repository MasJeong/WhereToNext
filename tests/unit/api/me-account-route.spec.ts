import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSessionOrNull = vi.fn();
const mockDeleteUserAccount = vi.fn();
const mockUpdateUserDisplayName = vi.fn();

vi.mock("@/lib/auth-session", () => ({
  getSessionOrNull: () => mockGetSessionOrNull(),
}));

vi.mock("@/lib/account/service", () => ({
  deleteUserAccount: (...args: unknown[]) => mockDeleteUserAccount(...args),
  updateUserDisplayName: (...args: unknown[]) => mockUpdateUserDisplayName(...args),
}));

import {
  DELETE as deleteAccountRoute,
  PATCH as patchAccountRoute,
} from "@/app/api/me/account/route";

describe("me account route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires auth before deleting the account", async () => {
    mockGetSessionOrNull.mockResolvedValue(null);

    const response = await deleteAccountRoute(
      new Request("http://localhost:4010/api/me/account", { method: "DELETE" }),
    );

    expect(response.status).toBe(401);
    expect(mockDeleteUserAccount).not.toHaveBeenCalled();
  });

  it("updates the signed-in user's nickname", async () => {
    mockGetSessionOrNull.mockResolvedValue({
      user: { id: "user-1", name: "Delete User", email: "delete@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });
    mockUpdateUserDisplayName.mockResolvedValue({
      id: "user-1",
      name: "바꾼 닉네임",
      email: "delete@example.com",
    });

    const response = await patchAccountRoute(
      new Request("http://localhost:4010/api/me/account", {
        method: "PATCH",
        body: JSON.stringify({ name: "바꾼 닉네임" }),
        headers: { "content-type": "application/json" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateUserDisplayName).toHaveBeenCalledWith("user-1", "바꾼 닉네임");
    expect(payload.data.user.name).toBe("바꾼 닉네임");
  });

  it("clears the session cookie after deleting the signed-in user", async () => {
    mockGetSessionOrNull.mockResolvedValue({
      user: { id: "user-1", name: "Delete User", email: "delete@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });
    mockDeleteUserAccount.mockResolvedValue(true);

    const response = await deleteAccountRoute(
      new Request("http://localhost:4010/api/me/account", {
        method: "DELETE",
        headers: { cookie: "trip_compass_session=test-token" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mockDeleteUserAccount).toHaveBeenCalledWith("user-1");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
