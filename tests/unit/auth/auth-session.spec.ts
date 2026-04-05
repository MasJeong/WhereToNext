import { describe, expect, it, vi } from "vitest";

const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

import { redirectToAuth } from "@/lib/auth-session";

describe("auth-session helpers", () => {
  it("preserves the requested route when redirecting to auth", () => {
    redirectToAuth("/account?tab=history", "account");

    expect(mockRedirect).toHaveBeenCalledWith("/auth?next=%2Faccount%3Ftab%3Dhistory&intent=account");
  });
});
