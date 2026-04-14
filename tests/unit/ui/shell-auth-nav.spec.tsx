import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ShellAuthNav } from "@/components/trip-compass/shell-auth-nav";
import { testIds } from "@/lib/test-ids";

const {
  mockPush,
  mockRefresh,
  mockUseSession,
  mockSignOut,
  mockUsePathname,
  mockSearchParamsToString,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockUseSession: vi.fn(),
  mockSignOut: vi.fn(),
  mockUsePathname: vi.fn(),
  mockSearchParamsToString: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => ({
    toString: mockSearchParamsToString,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => mockUseSession(),
    signOut: mockSignOut,
  },
}));

describe("ShellAuthNav", () => {
  it("preserves the current route when building the login link", () => {
    mockUsePathname.mockReturnValue("/results");
    mockSearchParamsToString.mockReturnValue("partyType=couple&budgetBand=mid");
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    render(<ShellAuthNav />);

    expect(screen.getByTestId(testIds.shell.authCta)).toHaveAttribute(
      "href",
      "/auth?next=%2Fresults%3FpartyType%3Dcouple%26budgetBand%3Dmid",
    );
  });

  it("refreshes the app after sign-out succeeds", async () => {
    mockUsePathname.mockReturnValue("/");
    mockSearchParamsToString.mockReturnValue("");
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "Tester",
          email: "tester@example.com",
        },
      },
      isPending: false,
    });
    mockSignOut.mockResolvedValue({
      ok: true,
      status: 200,
      payload: { data: { ok: true } },
    });

    render(<ShellAuthNav />);
    fireEvent.click(screen.getByTestId(testIds.shell.authCta));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows the logged-in user name in the header identity card", () => {
    mockUsePathname.mockReturnValue("/");
    mockSearchParamsToString.mockReturnValue("");
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "정지훈",
          email: "jihun@example.com",
        },
      },
      isPending: false,
    });

    render(<ShellAuthNav />);

    expect(screen.getByTestId(testIds.shell.identityCard)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.shell.identityName)).toHaveTextContent("정지훈");
  });
});
