import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/community/[historyId]/comments/route";

const TEST_BASE_URL = "http://localhost:4010";

const {
  getSessionOrNullMock,
  isPublicPostVisibleMock,
  listCommentsMock,
  createCommentMock,
} = vi.hoisted(() => ({
  getSessionOrNullMock: vi.fn(),
  isPublicPostVisibleMock: vi.fn(),
  listCommentsMock: vi.fn(),
  createCommentMock: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  getSessionOrNull: getSessionOrNullMock,
}));

vi.mock("@/lib/community/service", () => ({
  isPublicPostVisible: isPublicPostVisibleMock,
  listComments: listCommentsMock,
  createComment: createCommentMock,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    remaining: 29,
    resetAt: 1_234_567,
  })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

describe("community comment routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects guest comment reads", async () => {
    getSessionOrNullMock.mockResolvedValue(null);

    const response = await GET(new Request(`${TEST_BASE_URL}/api/community/history-1/comments`), {
      params: Promise.resolve({ historyId: "history-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
    expect(listCommentsMock).not.toHaveBeenCalled();
  });

  it("rejects reading comments for a non-public story", async () => {
    getSessionOrNullMock.mockResolvedValue({
      user: { id: "user-1", name: "Traveler", email: "traveler@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });
    isPublicPostVisibleMock.mockResolvedValue(false);

    const response = await GET(new Request(`${TEST_BASE_URL}/api/community/history-1/comments`), {
      params: Promise.resolve({ historyId: "history-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("HISTORY_NOT_FOUND");
    expect(listCommentsMock).not.toHaveBeenCalled();
  });

  it("returns comments for a signed-in user when the story is public", async () => {
    getSessionOrNullMock.mockResolvedValue({
      user: { id: "user-1", name: "Traveler", email: "traveler@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });
    isPublicPostVisibleMock.mockResolvedValue(true);
    listCommentsMock.mockResolvedValue([
      {
        id: "comment-1",
        authorName: "Traveler",
        authorImage: null,
        content: "좋은 정보 감사합니다.",
        createdAt: "2026-04-14T10:00:00.000Z",
      },
    ]);

    const response = await GET(new Request(`${TEST_BASE_URL}/api/community/history-1/comments`), {
      params: Promise.resolve({ historyId: "history-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.comments).toHaveLength(1);
    expect(response.headers.get("x-ratelimit-limit")).toBe("30");
  });

  it("creates a comment for a signed-in user on a public story", async () => {
    getSessionOrNullMock.mockResolvedValue({
      user: { id: "user-1", name: "Traveler", email: "traveler@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });
    createCommentMock.mockResolvedValue({
      id: "comment-1",
      authorName: "Traveler",
      authorImage: null,
      content: "다음에도 참고할게요.",
      createdAt: "2026-04-14T10:00:00.000Z",
    });

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/community/history-1/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "다음에도 참고할게요." }),
      }),
      {
        params: Promise.resolve({ historyId: "history-1" }),
      },
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(createCommentMock).toHaveBeenCalledWith("history-1", "user-1", "다음에도 참고할게요.");
    expect(data.comment.id).toBe("comment-1");
  });
});
