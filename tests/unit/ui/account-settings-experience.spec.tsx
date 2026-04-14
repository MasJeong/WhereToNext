import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountSettingsExperience } from "@/components/trip-compass/account-settings-experience";
import { testIds } from "@/lib/test-ids";

const { mockPush, mockRefresh, mockDeleteAccount, mockUpdateDisplayName } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockDeleteAccount: vi.fn(),
  mockUpdateDisplayName: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/account/settings",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    deleteAccount: mockDeleteAccount,
    updateDisplayName: mockUpdateDisplayName,
    useSession: () => ({
      data: {
        user: {
          id: "user-1",
          name: "테스트 사용자",
        },
      },
      isPending: false,
    }),
  },
}));

describe("AccountSettingsExperience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets the user update their nickname", async () => {
    mockUpdateDisplayName.mockResolvedValue({
      ok: true,
      status: 200,
      payload: {
        data: {
          user: {
            id: "user-1",
            name: "바꾼 닉네임",
            email: "user@example.com",
          },
        },
      },
    });

    render(<AccountSettingsExperience userName="테스트 사용자" />);

    fireEvent.change(screen.getByTestId(testIds.account.settingsNameInput), {
      target: { value: "바꾼 닉네임" },
    });
    fireEvent.click(screen.getByTestId(testIds.account.settingsNameSave));

    await waitFor(() => {
      expect(mockUpdateDisplayName).toHaveBeenCalledWith("바꾼 닉네임");
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("contains the privacy link and account deletion flow", async () => {
    mockDeleteAccount.mockResolvedValue({
      ok: true,
      status: 200,
      payload: { ok: true },
    });

    render(<AccountSettingsExperience userName="테스트 사용자" />);

    expect(screen.getByTestId(testIds.account.settingsRoot)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.account.privacyLink)).toHaveAttribute("href", "/privacy");

    fireEvent.click(screen.getByTestId(testIds.account.deleteAccountOpen));
    expect(screen.getByTestId(testIds.account.deleteAccountDialog)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(testIds.account.deleteAccountConfirm));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/?accountDeleted=1");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
