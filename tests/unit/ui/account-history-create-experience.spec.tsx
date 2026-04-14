import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountHistoryCreateExperience } from "@/components/trip-compass/account-history-create-experience";
import type { DestinationProfile, UserDestinationHistory } from "@/lib/domain/contracts";
import {
  getAccountHistoryCustomTagRemoveTestId,
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
  usePathname: () => "/account/history/new",
  useSearchParams: () => new URLSearchParams(),
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
  customTags: [],
  wouldRevisit: true,
  visitedAt: "2026-02-01T00:00:00.000Z",
  memo: "골목 분위기가 좋았어요.",
  images: [],
  visibility: "private",
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

  it("filters destinations by Korean, English, country name, and country code input", () => {
    render(<AccountHistoryCreateExperience />);

    const searchInput = screen.getByTestId(testIds.account.newHistoryDestinationSearch);

    fireEvent.change(searchInput, { target: { value: "도" } });
    expect(screen.getByText("도쿄")).toBeInTheDocument();
    expect(screen.queryByText("발리")).not.toBeInTheDocument();
    expect(screen.queryByText("사이판")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "인" } });
    expect(screen.queryByText("발리")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "오사" } });
    expect(screen.getByTestId(getAccountHistoryDestinationResultTestId(0))).toHaveTextContent("오사카");

    fireEvent.change(searchInput, { target: { value: "pari" } });
    expect(screen.getByTestId(getAccountHistoryDestinationResultTestId(0))).toHaveTextContent("파리");

    fireEvent.change(searchInput, { target: { value: "일본" } });
    expect(screen.getByText("도쿄")).toBeInTheDocument();
    expect(screen.getByText("오사카")).toBeInTheDocument();
    expect(screen.getByText("교토")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "vietnam" } });
    expect(screen.getByText("나트랑")).toBeInTheDocument();
    expect(screen.getByText("다낭")).toBeInTheDocument();
    expect(screen.getByText("호이안")).toBeInTheDocument();

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

  it("uses the provided destination list and deduplicates duplicate city ids", () => {
    const providedDestinations: DestinationProfile[] = [
      {
        id: "vancouver",
        slug: "vancouver-canada",
        kind: "city",
        countryCode: "CA",
        nameKo: "밴쿠버",
        nameEn: "Vancouver",
        budgetBand: "premium",
        flightBand: "long",
        bestMonths: [5, 6, 7, 8, 9],
        paceTags: ["balanced"],
        vibeTags: ["city", "nature"],
        summary: "캐나다 서부 대표 도시입니다.",
        watchOuts: [],
        active: true,
      },
      {
        id: "vancouver",
        slug: "vancouver-canada",
        kind: "city",
        countryCode: "CA",
        nameKo: "밴쿠버",
        nameEn: "Vancouver",
        budgetBand: "premium",
        flightBand: "long",
        bestMonths: [5, 6, 7, 8, 9],
        paceTags: ["balanced"],
        vibeTags: ["city", "food"],
        summary: "중복 입력 테스트용입니다.",
        watchOuts: [],
        active: true,
      },
      {
        id: "lisbon",
        slug: "lisbon-portugal",
        kind: "city",
        countryCode: "PT",
        nameKo: "리스본",
        nameEn: "Lisbon",
        budgetBand: "mid",
        flightBand: "long",
        bestMonths: [4, 5, 6, 9, 10],
        paceTags: ["slow", "balanced"],
        vibeTags: ["culture", "food"],
        summary: "포르투갈 대표 도시입니다.",
        watchOuts: [],
        active: true,
      },
    ];

    render(<AccountHistoryCreateExperience destinations={providedDestinations} />);

    const searchInput = screen.getByTestId(testIds.account.newHistoryDestinationSearch);

    fireEvent.change(searchInput, { target: { value: "vanc" } });
    expect(screen.getAllByText("밴쿠버")).toHaveLength(1);

    fireEvent.change(searchInput, { target: { value: "lis" } });
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

  it("adds custom hashtags, blocks duplicates, and removes them in the tags step", () => {
    render(<AccountHistoryCreateExperience mode="edit" initialEntry={initialEntry} />);

    fireEvent.click(screen.getByTestId(testIds.account.newHistoryNext));
    fireEvent.click(screen.getByTestId(testIds.account.newHistoryNext));
    fireEvent.click(screen.getByTestId(testIds.account.newHistoryNext));

    const customTagInput = screen.getByTestId(testIds.account.newHistoryCustomTagInput);
    const addButton = screen.getByTestId(testIds.account.newHistoryCustomTagAdd);

    fireEvent.change(customTagInput, { target: { value: "#야경맛집" } });
    fireEvent.click(addButton);

    expect(screen.getByText("#야경맛집")).toBeInTheDocument();

    fireEvent.change(customTagInput, { target: { value: "야경맛집" } });
    fireEvent.click(addButton);

    expect(screen.getByText("이미 추가한 해시태그예요.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(getAccountHistoryCustomTagRemoveTestId(0)));

    expect(screen.queryByText("#야경맛집")).not.toBeInTheDocument();
  });

  it("waits for IME composition to finish before adding a custom hashtag", () => {
    render(<AccountHistoryCreateExperience mode="edit" initialEntry={initialEntry} />);

    fireEvent.click(screen.getByTestId(testIds.account.newHistoryNext));
    fireEvent.click(screen.getByTestId(testIds.account.newHistoryNext));
    fireEvent.click(screen.getByTestId(testIds.account.newHistoryNext));

    const customTagInput = screen.getByTestId(testIds.account.newHistoryCustomTagInput);
    const addButton = screen.getByTestId(testIds.account.newHistoryCustomTagAdd);

    fireEvent.compositionStart(customTagInput);
    fireEvent.change(customTagInput, { target: { value: "아아" } });
    fireEvent.click(addButton);

    expect(screen.queryByText("#아아")).not.toBeInTheDocument();

    fireEvent.compositionEnd(customTagInput, { currentTarget: { value: "아아이" }, target: { value: "아아이" } });

    expect(screen.getByText("#아아이")).toBeInTheDocument();
    expect(screen.queryByText("#아아")).not.toBeInTheDocument();
    expect(screen.queryByText("#이")).not.toBeInTheDocument();
  });

  it("blocks submit when the destination search text changed after selection", async () => {
    render(<AccountHistoryCreateExperience />);

    const searchInput = screen.getByTestId(testIds.account.newHistoryDestinationSearch);
    fireEvent.change(searchInput, { target: { value: "taipei" } });
    fireEvent.click(screen.getByTestId(getAccountHistoryDestinationResultTestId(0)));

    act(() => {
      vi.advanceTimersByTime(130);
    });

    fireEvent.click(screen.getByRole("button", { name: /여행지/ }));
    fireEvent.change(screen.getByTestId(testIds.account.newHistoryDestinationSearch), {
      target: { value: "taipe" },
    });

    fireEvent.click(screen.getByRole("button", { name: /메모/ }));
    fireEvent.click(screen.getByTestId(testIds.account.newHistorySubmit));

    expect(screen.getByText("목적지를 목록에서 선택해 주세요.")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("leaves immediately when cancel is pressed without any changes", () => {
    render(<AccountHistoryCreateExperience />);

    fireEvent.click(screen.getByTestId(testIds.account.newHistoryCancel));

    expect(mockPush).toHaveBeenCalledWith("/account?tab=history");
    expect(screen.queryByTestId(testIds.account.newHistoryCancelDialog)).not.toBeInTheDocument();
  });

  it("asks for confirmation before leaving when the draft changed", () => {
    render(<AccountHistoryCreateExperience />);

    fireEvent.change(screen.getByTestId(testIds.account.newHistoryDestinationSearch), {
      target: { value: "taipei" },
    });
    fireEvent.click(screen.getByTestId(testIds.account.newHistoryCancel));

    expect(screen.getByTestId(testIds.account.newHistoryCancelDialog)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId(testIds.account.newHistoryCancelStay));

    expect(screen.queryByTestId(testIds.account.newHistoryCancelDialog)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(testIds.account.newHistoryCancel));
    fireEvent.click(screen.getByTestId(testIds.account.newHistoryCancelLeave));

    expect(mockPush).toHaveBeenCalledWith("/account?tab=history");
  });
});
