import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/recommendations/route";

const TEST_BASE_URL = "http://localhost:4010";

describe("GET /api/recommendations", () => {
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
