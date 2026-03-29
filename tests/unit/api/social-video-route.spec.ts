import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_BASE_URL = "http://localhost:4010";

const getLeadSocialVideosMock = vi.fn();

vi.mock("@/lib/social-video/service", () => ({
  getLeadSocialVideos: getLeadSocialVideosMock,
}));

describe("GET /api/social-video", () => {
  beforeEach(() => {
    getLeadSocialVideosMock.mockReset();
  });

  it("returns a selected social video when a valid candidate exists", async () => {
    const { GET } = await import("@/app/api/social-video/route");
    getLeadSocialVideosMock.mockResolvedValue([
      {
        provider: "youtube",
        videoId: "tokyo-video",
        title: "도쿄 골목과 야경을 빠르게 보는 여행 브이로그",
        channelTitle: "서울 여행자",
        channelUrl: "https://www.youtube.com/channel/channel-1",
        videoUrl: "https://www.youtube.com/watch?v=tokyo-video",
        thumbnailUrl: "https://img.youtube.com/vi/tokyo-video/hqdefault.jpg",
        publishedAt: "2026-03-28T00:00:00.000Z",
        durationSeconds: 54,
      },
      {
        provider: "youtube",
        videoId: "tokyo-video-2",
        title: "도쿄 쇼핑 스폿 요약",
        channelTitle: "서울 여행자",
        channelUrl: "https://www.youtube.com/channel/channel-1",
        videoUrl: "https://www.youtube.com/watch?v=tokyo-video-2",
        thumbnailUrl: "https://img.youtube.com/vi/tokyo-video-2/hqdefault.jpg",
        publishedAt: "2026-03-27T00:00:00.000Z",
        durationSeconds: 71,
      },
    ]);

    const request = new Request(
      `${TEST_BASE_URL}/api/social-video?destinationId=tokyo&partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance,food`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.item.videoId).toBe("tokyo-video");
    expect(data.items).toHaveLength(2);
  });

  it("returns empty when the service finds no candidate", async () => {
    const { GET } = await import("@/app/api/social-video/route");
    getLeadSocialVideosMock.mockResolvedValue([]);

    const request = new Request(
      `${TEST_BASE_URL}/api/social-video?destinationId=tokyo&partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "empty",
      item: null,
      items: [],
    });
  });

  it("returns empty when the service throws", async () => {
    const { GET } = await import("@/app/api/social-video/route");
    getLeadSocialVideosMock.mockRejectedValue(new Error("quota exceeded"));

    const request = new Request(
      `${TEST_BASE_URL}/api/social-video?destinationId=tokyo&partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: "empty",
      item: null,
      items: [],
    });
  });

  it("rejects invalid queries with a stable code", async () => {
    const { GET } = await import("@/app/api/social-video/route");

    const request = new Request(`${TEST_BASE_URL}/api/social-video?destinationId=unknown&travelMonth=13`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_QUERY");
  });
});
