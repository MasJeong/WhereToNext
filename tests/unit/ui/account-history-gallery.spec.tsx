import { fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { AccountExperience } from "@/components/trip-compass/account-experience";
import type { UserDestinationHistory, UserPreferenceProfile } from "@/lib/domain/contracts";
import {
  getAccountHistoryEntryTestId,
  getAccountHistoryGalleryImageTestId,
  getAccountHistoryGalleryToggleTestId,
} from "@/lib/test-ids";

const { mockPush, mockRefresh, mockSignOut } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: mockSignOut,
    useSession: () => ({
      data: {
        user: {
          id: "user-1",
          name: "테스트 사용자",
        },
      },
    }),
  },
}));

const profile: UserPreferenceProfile = {
  userId: "user-1",
  explorationPreference: "balanced",
};

const historyEntry: UserDestinationHistory = {
  id: "history-1",
  userId: "user-1",
  destinationId: "tokyo",
  rating: 5,
  tags: ["city", "food"],
  wouldRevisit: true,
  visitedAt: "2026-02-01T00:00:00.000Z",
  memo: "사진 여러 장으로 다시 보기 쉽게 남겨 뒀어요.",
  images: [
    { name: "one.jpg", contentType: "image/jpeg", dataUrl: "data:image/jpeg;base64,ONE" },
    { name: "two.jpg", contentType: "image/jpeg", dataUrl: "data:image/jpeg;base64,TWO" },
    { name: "three.jpg", contentType: "image/jpeg", dataUrl: "data:image/jpeg;base64,THREE" },
  ],
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

describe("AccountExperience history gallery", () => {
  it("shows a cover count badge and opens the inline gallery", () => {
    render(
      <AccountExperience
        userName="테스트 사용자"
        initialTab="history"
        initialProfile={profile}
        initialHistory={[historyEntry]}
        initialSavedSnapshots={[]}
      />,
    );

    expect(screen.getByTestId(getAccountHistoryEntryTestId(0))).toHaveTextContent("+2");

    fireEvent.click(screen.getByTestId(getAccountHistoryGalleryToggleTestId(0)));

    expect(screen.getByTestId(getAccountHistoryGalleryImageTestId(0))).toBeInTheDocument();
    expect(screen.getByTestId(getAccountHistoryGalleryImageTestId(1))).toBeInTheDocument();
    expect(screen.getByTestId(getAccountHistoryGalleryImageTestId(2))).toBeInTheDocument();
  });
});
