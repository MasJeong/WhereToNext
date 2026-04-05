import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/recommendations/route";

const TEST_BASE_URL = "http://localhost:4010";

vi.mock("@/lib/travel-support/service", () => ({
  getDestinationTravelSupplement: vi.fn(async () => ({
    location: {
      latitude: 35.68,
      longitude: 139.76,
      countryCode: "JP",
      countryName: "Japan",
      currencyCode: "JPY",
    },
    weather: {
      summary: "맑아요",
      temperatureC: 18,
      apparentTemperatureC: 17,
      minTemperatureC: 12,
      maxTemperatureC: 21,
      precipitationProbability: 10,
      observedAt: "2026-03-27T00:00:00.000Z",
    },
    travelMonthWeather: {
      travelMonth: 10,
      summary: "10월엔 걷기 무난한 편이고 비 변수는 낮은 편이에요.",
      averageMinTemperatureC: 13.2,
      averageMaxTemperatureC: 21.4,
      rainyDayRatio: 18,
      basedOnYears: 5,
    },
    fetchedAt: "2026-03-27T00:00:00.000Z",
  })),
}));

describe("GET /api/recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ranked results for a valid query", async () => {
    const request = new Request(
      `${TEST_BASE_URL}/api/recommendations?partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance,food`,
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendations[0]?.destinationId).toBeTruthy();
    expect(data.recommendations[0]?.scoreBreakdown.total).toBeGreaterThan(0);
    expect(data.meta.scoringVersion).toBe("mvp-v1");
    expect(data.leadSupplement?.location?.countryCode).toBeTruthy();
    expect(data.leadSupplement?.travelMonthWeather?.travelMonth).toBe(10);
  });

  it("rejects invalid queries with a stable code", async () => {
    const request = new Request(
      `${TEST_BASE_URL}/api/recommendations?partyType=couple&partySize=-1&travelMonth=13`,
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_QUERY");
  });
});
