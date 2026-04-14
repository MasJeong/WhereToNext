import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommunityDetailExperience } from "@/components/trip-compass/community-detail-experience";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <span aria-label={alt ?? ""} />,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: {
          id: "user-1",
          name: "Traveler",
          email: "traveler@example.com",
        },
      },
      isPending: false,
    }),
  },
}));

vi.mock("@/components/trip-compass/community-experience", async () => {
  const actual = await vi.importActual<typeof import("@/components/trip-compass/community-experience")>(
    "@/components/trip-compass/community-experience",
  );

  return {
    ...actual,
    CommentSection: () => <div>댓글 영역</div>,
  };
});

const post = {
  historyId: "history-1",
  authorName: "김민서",
  authorImage: null,
  destinationName: "도쿄",
  rating: 5,
  tags: ["혼자 일정 짜기 편함"],
  memo: "우에노 쪽에 숙소를 잡아두니 동선이 꽤 편했어요.",
  imageUrl: "data:image/jpeg;base64,AAA",
  commentCount: 3,
  createdAt: "2026-04-14T12:00:00.000Z",
};

const storage = (() => {
  let values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    clear: () => {
      values = new Map<string, string>();
    },
  };
})();

describe("CommunityDetailExperience", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storage);
    storage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens the image modal and shows the photo guidance copy", () => {
    render(<CommunityDetailExperience post={post} />);

    expect(
      screen.getByText("현장 사진으로 먼저 분위기를 확인하고, 아래 후기에서 동선과 팁을 이어서 읽어보세요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /크게 보기/i }));

    expect(screen.getByRole("dialog", { name: "여행 사진 크게 보기" })).toBeInTheDocument();
  });

  it("stores the helpful reaction in localStorage", () => {
    render(<CommunityDetailExperience post={post} />);

    fireEvent.click(screen.getByRole("button", { name: "이 후기가 도움됐어요" }));

    expect(screen.getByRole("button", { name: "도움이 됐어요" })).toBeInTheDocument();
    expect(window.localStorage.getItem("community-helpful:history-1")).toBe("true");
    expect(screen.getByText("이 브라우저에 유용한 후기로 저장했어요.")).toBeInTheDocument();
  });
});
