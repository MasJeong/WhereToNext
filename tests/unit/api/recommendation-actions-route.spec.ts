import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_BASE_URL = "http://localhost:4010";

const getRecommendationActionsResultMock = vi.fn();

vi.mock("@/lib/ai/recommendation-actions", () => ({
  getRecommendationActionsResult: getRecommendationActionsResultMock,
}));

describe("POST /api/ai/recommendation-actions", () => {
  beforeEach(() => {
    vi.resetModules();
    getRecommendationActionsResultMock.mockReset();
  });

  it("returns action cards when the generator succeeds", async () => {
    const { POST } = await import("@/app/api/ai/recommendation-actions/route");
    getRecommendationActionsResultMock.mockResolvedValue({
      status: "ok",
      actions: [
        {
          id: "signature",
          label: "대표 경험",
          title: "가든스 바이 더 베이부터 가보세요",
          description: "싱가포르 감을 가장 빨리 잡는 시작입니다.",
          placeLabel: "가든스 바이 더 베이",
        },
      ],
      compactSummary: "가든스 바이 더 베이부터 시작하면 싱가포르 무드가 빨리 옵니다.",
      detailBlocks: [
        {
          id: "signature",
          title: "대표 경험",
          body: "가든스 바이 더 베이부터 보면 도시 무드가 빨리 옵니다.",
        },
      ],
    });

    const request = new Request(`${TEST_BASE_URL}/api/ai/recommendation-actions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        destinationId: "singapore",
        destinationName: "싱가포르",
        destinationSummary: "도시 리듬과 야경이 강한 도시예요.",
        leadReason: "야간 동선과 먹거리 흐름이 잘 맞아요.",
        whyThisFits: "먹고 걷는 일정과 잘 맞는 도시예요.",
        watchOuts: ["야외 이동이 길어질 수 있어요."],
        query: {
          partyType: "couple",
          partySize: 2,
          budgetBand: "mid",
          tripLengthDays: 5,
          departureAirport: "ICN",
          travelMonth: 10,
          pace: "balanced",
          flightTolerance: "medium",
          vibes: ["food", "city"],
          excludedCountryCodes: [],
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.actions[0].title).toBe("가든스 바이 더 베이부터 가보세요");
  });

  it("rejects invalid bodies with a stable code", async () => {
    const { POST } = await import("@/app/api/ai/recommendation-actions/route");

    const request = new Request(`${TEST_BASE_URL}/api/ai/recommendation-actions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        destinationId: "unknown",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_BODY");
  });

  it("returns a stable server error when generation throws", async () => {
    const { POST } = await import("@/app/api/ai/recommendation-actions/route");
    getRecommendationActionsResultMock.mockRejectedValue(new Error("provider failed"));

    const request = new Request(`${TEST_BASE_URL}/api/ai/recommendation-actions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        destinationId: "singapore",
        destinationName: "싱가포르",
        destinationSummary: "도시 리듬과 야경이 강한 도시예요.",
        leadReason: "야간 동선과 먹거리 흐름이 잘 맞아요.",
        whyThisFits: "먹고 걷는 일정과 잘 맞는 도시예요.",
        watchOuts: [],
        query: {
          partyType: "couple",
          partySize: 2,
          budgetBand: "mid",
          tripLengthDays: 5,
          departureAirport: "ICN",
          travelMonth: 10,
          pace: "balanced",
          flightTolerance: "medium",
          vibes: ["food"],
          excludedCountryCodes: [],
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("ACTION_GENERATION_FAILED");
  });
});
