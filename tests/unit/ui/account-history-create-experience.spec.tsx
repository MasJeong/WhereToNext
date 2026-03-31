import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountHistoryCreateExperience } from "@/components/trip-compass/account-history-create-experience";
import type { UserDestinationHistory } from "@/lib/domain/contracts";
import {
  getAccountHistoryDestinationResultTestId,
  getAccountHistoryImageRemoveTestId,
  getAccountHistoryImageThumbTestId,
  testIds,
} from "@/lib/test-ids";

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
  images: [],
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

class MockFileReader {
  static counter = 0;

  result: string | ArrayBuffer | null = null;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;

  readAsDataURL(file: File) {
    MockFileReader.counter += 1;
    this.result = `data:${file.type};base64,MOCK_${MockFileReader.counter}`;
    this.onload?.();
  }
}

describe("AccountHistoryCreateExperience destination autocomplete", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPush.mockReset();
    mockRefresh.mockReset();
    MockFileReader.counter = 0;
    vi.stubGlobal("FileReader", MockFileReader as unknown as typeof FileReader);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("filters destinations by Korean, English, and country code input", () => {
    render(<AccountHistoryCreateExperience />);

    const searchInput = screen.getByTestId(testIds.account.newHistoryDestinationSearch);

    fireEvent.change(searchInput, { target: { value: "오사" } });
    expect(screen.getByTestId(getAccountHistoryDestinationResultTestId(0))).toHaveTextContent("오사카");

    fireEvent.change(searchInput, { target: { value: "pari" } });
    expect(screen.getByTestId(getAccountHistoryDestinationResultTestId(0))).toHaveTextContent("파리");

    fireEvent.change(searchInput, { target: { value: "us" } });
    expect(screen.getByTestId(getAccountHistoryDestinationResultTestId(0))).toHaveTextContent("US");
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

  it("shows multiple thumbnails and removes one image at a time", async () => {
    render(<AccountHistoryCreateExperience mode="edit" initialEntry={initialEntry} />);

    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(screen.getByTestId(testIds.account.newHistoryNext));
    }

    const input = screen.getByTestId(testIds.account.newHistoryImageInput);

    await act(async () => {
      fireEvent.change(input, {
        target: {
          files: [
            new File(["a"], "one.jpg", { type: "image/jpeg" }),
            new File(["b"], "two.jpg", { type: "image/jpeg" }),
          ],
        },
      });
    });

    expect(screen.getByTestId(getAccountHistoryImageThumbTestId(0))).toBeInTheDocument();
    expect(screen.getByTestId(getAccountHistoryImageThumbTestId(1))).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId(getAccountHistoryImageRemoveTestId(0)));
    });

    expect(screen.getByTestId(getAccountHistoryImageThumbTestId(0))).toBeInTheDocument();
    expect(screen.queryByTestId(getAccountHistoryImageThumbTestId(1))).not.toBeInTheDocument();
  });
});
