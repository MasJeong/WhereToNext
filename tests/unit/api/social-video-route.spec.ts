import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_BASE_URL = "http://localhost:4010";

const getLeadSocialVideoResultMock = vi.fn();

vi.mock("@/lib/social-video/service", () => ({
  buildSocialVideoFallbackSearches: vi.fn(() => [
    {
      label: "도쿄 여행 브이로그",
      url: "https://www.youtube.com/results?search_query=%EB%8F%84%EC%BF%84+%EC%97%AC%ED%96%89+%EB%B8%8C%EC%9D%B4%EB%A1%9C%EA%B7%B8",
    },
  ]),
  getLeadSocialVideoResult: getLeadSocialVideoResultMock,
}));

describe("GET /api/social-video", () => {
  beforeEach(() => {
    vi.resetModules();
    getLeadSocialVideoResultMock.mockReset();
  });

  it("returns a selected social video when a valid candidate exists", async () => {
    const { GET } = await import("@/app/api/social-video/route");
    getLeadSocialVideoResultMock.mockResolvedValue({
      status: "ok",
      item: {
        provider: "youtube",
        videoId: "tokyo-video",
        title: "도쿄 골목과 야경을 빠르게 보는 여행 브이로그",
        channelTitle: "서울 여행자",
        channelUrl: "https://www.youtube.com/channel/channel-1",
        videoUrl: "https://www.youtube.com/watch?v=tokyo-video",
        thumbnailUrl: "https://img.youtube.com/vi/tokyo-video/hqdefault.jpg",
        publishedAt: "2026-03-28T00:00:00.000Z",
        durationSeconds: 54,
        viewCount: 182000,
      },
      items: [
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
          viewCount: 182000,
        },
      ],
    });

    const request = new Request(
      `${TEST_BASE_URL}/api/social-video?destinationId=tokyo&partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance,food`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.item.videoId).toBe("tokyo-video");
    expect(data.items).toHaveLength(1);
  });

  it("returns fallback when the service finds no confident candidate", async () => {
    const { GET } = await import("@/app/api/social-video/route");
    getLeadSocialVideoResultMock.mockResolvedValue({
      status: "fallback",
      item: null,
      items: [],
      fallback: {
        reason: "no-candidates",
        headline: "자동 추천 대신 바로 찾을 수 있는 링크를 준비했어요",
        description: "목적지 기준 YouTube 검색 링크를 대신 보여드려요.",
        searches: [
          {
            label: "도쿄 여행 브이로그",
            url: "https://www.youtube.com/results?search_query=%EB%8F%84%EC%BF%84+%EC%97%AC%ED%96%89+%EB%B8%8C%EC%9D%B4%EB%A1%9C%EA%B7%B8",
          },
        ],
      },
    });

    const request = new Request(
      `${TEST_BASE_URL}/api/social-video?destinationId=tokyo&partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=11&pace=balanced&flightTolerance=medium&vibes=romance`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("fallback");
    expect(data.fallback.searches).toHaveLength(1);
  });

  it("preserves a quota-exceeded fallback when the service reports quota exhaustion", async () => {
    const { GET } = await import("@/app/api/social-video/route");
    getLeadSocialVideoResultMock.mockResolvedValue({
      status: "fallback",
      item: null,
      items: [],
      fallback: {
        reason: "quota-exceeded",
        headline: "지금은 YouTube 할당량이 잠시 다 찼어요",
        description: "오늘 할당량이 다시 열리면 대표 영상을 자동으로 붙여드릴게요.",
        searches: [
          {
            label: "도쿄 여행",
            url: "https://www.youtube.com/results?search_query=%EB%8F%84%EC%BF%84+%EC%97%AC%ED%96%89",
          },
        ],
      },
    });

    const request = new Request(
      `${TEST_BASE_URL}/api/social-video?destinationId=tokyo&partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=11&pace=balanced&flightTolerance=medium&vibes=romance`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("fallback");
    expect(data.fallback.reason).toBe("quota-exceeded");
  });

  it("returns fallback when the service throws", async () => {
    const { GET } = await import("@/app/api/social-video/route");
    getLeadSocialVideoResultMock.mockRejectedValue(new Error("quota exceeded"));

    const request = new Request(
      `${TEST_BASE_URL}/api/social-video?destinationId=tokyo&partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("fallback");
    expect(data.fallback.reason).toBe("request-failed");
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
