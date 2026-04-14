import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/community/route";

const TEST_BASE_URL = "http://localhost:4010";

const { listPublicPostsMock } = vi.hoisted(() => ({
  listPublicPostsMock: vi.fn(),
}));

vi.mock("@/lib/community/service", () => ({
  listPublicPosts: listPublicPostsMock,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    remaining: 59,
    resetAt: 1_234_567,
  })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

describe("GET /api/community", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the public feed page with rate-limit headers", async () => {
    listPublicPostsMock.mockResolvedValue({
      items: [
        {
          historyId: "history-1",
          authorName: "여행자",
          authorImage: null,
          destinationName: "도쿄",
          rating: 5,
          tags: ["야시장"],
          memo: "좋았어요",
          imageUrl: null,
          commentCount: 2,
          createdAt: "2026-04-14T10:00:00.000Z",
        },
      ],
      nextCursor: null,
      totalCount: 37,
      photoCount: 31,
    });

    const response = await GET(new Request(`${TEST_BASE_URL}/api/community?cursor=2026-04-13T00:00:00.000Z`));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(listPublicPostsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: "2026-04-13T00:00:00.000Z",
      }),
    );
    expect(data.items).toHaveLength(1);
    expect(data.totalCount).toBe(37);
    expect(data.photoCount).toBe(31);
    expect(response.headers.get("x-ratelimit-limit")).toBe("60");
  });
});
