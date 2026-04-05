import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSessionFromHeaders = vi.fn();

vi.mock("@/lib/auth", () => ({
  getSessionFromHeaders: (headers: Headers) => mockGetSessionFromHeaders(headers),
}));

import { POST } from "@/app/api/affiliate/clicks/route";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("POST /api/affiliate/clicks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoryStore.affiliateClicks.clear();
  });

  it("stores an anonymous affiliate click without blocking on auth", async () => {
    mockGetSessionFromHeaders.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:4010/api/affiliate/clicks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          destinationId: "tokyo",
          partner: "skyscanner",
          category: "flight",
          pageType: "destination-detail",
          departureAirport: "ICN",
          travelMonth: 10,
          tripLengthDays: 5,
          flightTolerance: "medium",
          sessionId: "anon-session-1",
        }),
      }),
    );

    expect(response.status).toBe(204);
    expect(memoryStore.affiliateClicks.size).toBe(1);

    const click = [...memoryStore.affiliateClicks.values()][0];

    expect(click?.destinationId).toBe("tokyo");
    expect(click?.partner).toBe("skyscanner");
    expect(click?.userId).toBeNull();
  });

  it("returns 400 for invalid affiliate click payloads", async () => {
    mockGetSessionFromHeaders.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:4010/api/affiliate/clicks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          destinationId: "unknown",
          partner: "skyscanner",
          category: "flight",
          pageType: "destination-detail",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("INVALID_AFFILIATE_CLICK");
  });
});
