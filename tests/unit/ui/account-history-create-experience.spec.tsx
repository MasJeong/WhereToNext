import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountHistoryCreateExperience } from "@/components/trip-compass/account-history-create-experience";
import type { UserDestinationHistory } from "@/lib/domain/contracts";
import { getAccountHistoryDestinationResultTestId, testIds } from "@/lib/test-ids";

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
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

const initialEntry: UserDestinationHistory = {
  id: "history-1",
  userId: "user-1",
  destinationId: "tokyo",
  rating: 5,
  tags: ["city", "food"],
  wouldRevisit: true,
  visitedAt: "2026-02-01T00:00:00.000Z",
  memo: "골목 분위기가 좋았어요.",
  image: null,
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

describe("AccountHistoryCreateExperience destination autocomplete", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("filters destinations by Korean, English, and country code input", () => {
    render(<AccountHistoryCreateExperience />);

    const searchInput = screen.getByTestId(testIds.account.newHistoryDestinationSearch);

    fireEvent.change(searchInput, { target: { value: "오사" } });
    expect(screen.getByTestId(getAccountHistoryDestinationResultTestId(0))).toHaveTextContent("오사카");

    fireEvent.change(searchInput, { target: { value: "pari" } });
    expect(screen.getByTestId(getAccountHistoryDestinationResultTestId(0))).toHaveTextContent("파리");

    fireEvent.change(searchInput, { target: { value: "us" } });
    expect(screen.getByTestId(getAccountHistoryDestinationResultTestId(0))).toHaveTextContent("호놀룰루");
  });

  it("selects a searched destination and advances to the next step", () => {
    render(<AccountHistoryCreateExperience mode="edit" initialEntry={initialEntry} />);

    const searchInput = screen.getByTestId(testIds.account.newHistoryDestinationSearch);

    fireEvent.change(searchInput, { target: { value: "taipei" } });
    fireEvent.click(screen.getByTestId(getAccountHistoryDestinationResultTestId(0)));

    act(() => {
      vi.advanceTimersByTime(130);
    });

    expect(screen.getByTestId(testIds.account.newHistoryStep)).toHaveTextContent("언제 다녀왔나요?");
  });
});
