import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommunityExperience } from "@/components/trip-compass/community-experience";

const longMemo =
  "우에노에 숙소 잡아두고 긴자, 오모테산도, 시부야를 하루씩 나눠 돌았는데 생각보다 체력 소모가 덜했어요. 평일 저녁 7시 전에는 인기 식당도 혼자 들어가기 괜찮았고, 편의점이랑 카페를 섞어 쓰니 예산도 크게 안 무너졌습니다. 쇼핑 동선이 길어 보여도 지하철 환승이 익숙해지면 금방 리듬이 잡혀서, 도쿄 처음 가는 분한테도 꽤 무난한 코스였어요.";

const feed = {
  items: [
    {
      historyId: "history-photo-comments",
      authorName: "김민서",
      authorImage: null,
      destinationName: "도쿄",
      rating: 5,
      tags: ["혼자 일정 짜기 편함"],
      memo: longMemo,
      imageUrl: "data:image/jpeg;base64,AAA",
      commentCount: 3,
      createdAt: "2026-04-14T12:00:00.000Z",
    },
    {
      historyId: "history-photo-latest",
      authorName: "박혜진",
      authorImage: null,
      destinationName: "타이베이",
      rating: 4,
      tags: ["닝샤 야시장 추천"],
      memo: "첫날은 닝샤 야시장부터 가는 편이 훨씬 좋았어요.",
      imageUrl: "data:image/jpeg;base64,BBB",
      commentCount: 1,
      createdAt: "2026-04-14T13:00:00.000Z",
    },
    {
      historyId: "history-no-photo",
      authorName: "이도현",
      authorImage: null,
      destinationName: "발리",
      rating: 5,
      tags: ["풀빌라 미리 예약"],
      memo: "우붓은 숙소에서 쉬는 시간이 더 오래 기억났어요.",
      imageUrl: null,
      commentCount: 7,
      createdAt: "2026-04-14T11:00:00.000Z",
    },
  ],
  nextCursor: null,
};

const fetchMock = vi.fn();

function buildFeedResponse(input: string) {
  const url = new URL(input, "http://localhost:4010");
  const sort = url.searchParams.get("sort") ?? "recommended";
  const search = (url.searchParams.get("search") ?? "").trim();
  const photosOnly = url.searchParams.get("photosOnly") === "true";

  const loweredSearch = search.toLowerCase();
  const items = feed.items
    .filter((item) => (photosOnly ? item.imageUrl : true))
    .filter((item) => {
      if (!loweredSearch) {
        return true;
      }

      return [
        item.destinationName,
        item.memo,
        item.authorName,
        ...item.tags,
      ].some((value) => value.toLowerCase().includes(loweredSearch));
    })
    .sort((left, right) => {
      if (sort === "latest") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      if (sort === "ratingHigh") {
        return right.rating - left.rating;
      }

      if (sort === "ratingLow") {
        return left.rating - right.rating;
      }

      return right.commentCount - left.commentCount;
    });

  return {
    items,
    nextCursor: null,
    totalCount: items.length,
    photoCount: items.filter((item) => Boolean(item.imageUrl)).length,
  };
}

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <span aria-label={alt ?? ""} />,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: null,
      isPending: false,
    }),
  },
}));

vi.mock("@/lib/runtime/url", () => ({
  buildApiUrl: (path: string) => path,
}));

class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
}

describe("CommunityExperience", () => {
  beforeEach(() => {
    fetchMock.mockImplementation(async (input: string) => {
      if (input.startsWith("/api/community")) {
        return {
          ok: true,
          json: async () => buildFeedResponse(input),
        };
      }

      return {
        ok: true,
        json: async () => ({ comments: [] }),
      };
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal(
      "IntersectionObserver",
      MockIntersectionObserver as unknown as typeof IntersectionObserver,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("defaults to photo reviews and recommended ordering", async () => {
    render(<CommunityExperience />);

    await screen.findByText("도쿄");

    expect(screen.getByRole("searchbox", { name: "여행지 검색" })).toBeInTheDocument();
    expect(screen.queryByText("발리")).not.toBeInTheDocument();

    const headings = screen.getAllByRole("heading");
    expect(headings.some((heading) => heading.textContent?.includes("도쿄"))).toBe(true);
    expect(headings.some((heading) => heading.textContent?.includes("타이베이"))).toBe(true);
    expect(
      screen.getByText((_, element) => element?.textContent === "2개의 후기"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("현장 사진 있음").length).toBeGreaterThan(0);
  });

  it("supports latest sorting and showing posts without photos", async () => {
    render(<CommunityExperience />);

    await screen.findByText("도쿄");

    fireEvent.click(screen.getByRole("button", { name: "최신" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "타이베이" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "사진만" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "발리" })).toBeInTheDocument();
    });
  });

  it("supports rating sorting and keyword search across destination, memo, and tags", async () => {
    render(<CommunityExperience />);

    await screen.findByText("도쿄");

    fireEvent.click(screen.getByRole("button", { name: "사진만" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "발리" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "별점 낮은순" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "타이베이" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("여행지, 태그로 검색"), {
      target: { value: "야시장" },
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "타이베이" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "도쿄" })).not.toBeInTheDocument();
      expect(
        screen.getByText((_, element) => element?.textContent === "1개의 후기"),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("여행지, 태그로 검색"), {
      target: { value: "발리" },
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "발리" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "도쿄" })).not.toBeInTheDocument();
      expect(
        screen.getByText((_, element) => element?.textContent === "1개의 후기"),
      ).toBeInTheDocument();
    });
  });

  it("expands long review copy on demand", async () => {
    render(<CommunityExperience />);

    await screen.findByText("도쿄");

    expect(screen.getByRole("button", { name: "더 보기" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "더 보기" }));

    expect(screen.getByText(longMemo)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "접기" })).toBeInTheDocument();
  });

  it("keeps the search controls visible when no results match the search", async () => {
    render(<CommunityExperience />);

    await screen.findByText("도쿄");

    fireEvent.change(screen.getByPlaceholderText("여행지, 태그로 검색"), {
      target: { value: "없는검색어" },
    });

    await waitFor(() => {
      expect(screen.getByText("조건에 맞는 후기가 아직 없어요")).toBeInTheDocument();
    });

    expect(screen.getByRole("searchbox", { name: "여행지 검색" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "사진만" })).toBeInTheDocument();
  });
});
