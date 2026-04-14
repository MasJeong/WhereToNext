import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockGetSessionOrNull, mockRedirectToAuth, mockReadPublicPost, mockNotFound } = vi.hoisted(() => ({
  mockGetSessionOrNull: vi.fn(),
  mockRedirectToAuth: vi.fn(),
  mockReadPublicPost: vi.fn(),
  mockNotFound: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  getSessionOrNull: mockGetSessionOrNull,
  redirectToAuth: mockRedirectToAuth,
}));

vi.mock("@/lib/community/service", () => ({
  readPublicPost: mockReadPublicPost,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

import CommunityDetailPage from "@/app/community/[historyId]/page";

describe("CommunityDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirectToAuth.mockImplementation(() => {
      throw new Error("REDIRECTED_TO_AUTH");
    });
    mockNotFound.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });
  });

  it("redirects guests to auth before showing a travel story detail", async () => {
    mockGetSessionOrNull.mockResolvedValue(null);

    await expect(
      CommunityDetailPage({
        params: Promise.resolve({ historyId: "history-1" }),
      }),
    ).rejects.toThrow("REDIRECTED_TO_AUTH");

    expect(mockRedirectToAuth).toHaveBeenCalledWith("/community/history-1", "link");
    expect(mockReadPublicPost).not.toHaveBeenCalled();
  });

  it("renders the detail page for a signed-in user", async () => {
    mockGetSessionOrNull.mockResolvedValue({
      user: { id: "user-1", name: "Traveler", email: "traveler@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });
    mockReadPublicPost.mockResolvedValue({
      historyId: "history-1",
      authorName: "Traveler",
      authorImage: null,
      destinationName: "도쿄",
      rating: 5,
      tags: ["야시장"],
      memo: "골목 산책이 좋았어요.",
      imageUrl: null,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    });

    const result = await CommunityDetailPage({
      params: Promise.resolve({ historyId: "history-1" }),
    });

    expect(mockReadPublicPost).toHaveBeenCalledWith("history-1");
    expect(result).toBeTruthy();
  });

  it("returns notFound for a missing public travel story", async () => {
    mockGetSessionOrNull.mockResolvedValue({
      user: { id: "user-1", name: "Traveler", email: "traveler@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });
    mockReadPublicPost.mockResolvedValue(null);

    await expect(
      CommunityDetailPage({
        params: Promise.resolve({ historyId: "missing-history" }),
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalled();
  });
});
