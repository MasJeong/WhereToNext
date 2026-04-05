import { describe, expect, it } from "vitest";

import { rankDestinations } from "@/lib/recommendation/engine";
import type { TrendEvidenceSnapshot } from "@/lib/domain/contracts";

import { goldenFixtures } from "./golden-fixtures";

describe("rankDestinations", () => {
  it("keeps the top recommendations stable for named traveler fixtures", () => {
    for (const fixture of goldenFixtures) {
      const topIds = rankDestinations(fixture.query)
        .slice(0, 3)
        .map((item) => item.destinationId);

      expect(topIds, fixture.name).toEqual(fixture.expectedTopIds);
    }
  });

  it("never resurrects an ineligible long-haul destination with strong evidence", () => {
    const evidence = new Map<string, TrendEvidenceSnapshot[]>([
      [
        "paris",
        [
          {
            id: "trend-paris-1",
            destinationId: "paris",
            tier: "green",
            sourceType: "embed",
            sourceLabel: "Handpicked Paris reel",
            sourceUrl: "https://instagram.com/p/example",
            observedAt: "2026-03-17T00:00:00.000Z",
            freshnessState: "fresh",
            confidence: 100,
            summary: "Highly engaging Paris content.",
          },
        ],
      ],
    ]);

    const results = rankDestinations(
      {
        partyType: "couple",
        partySize: 2,
        budgetBand: "mid",
        tripLengthDays: 3,
        departureAirport: "ICN",
        travelMonth: 5,
        pace: "balanced",
        flightTolerance: "short",
        vibes: ["romance", "culture"],
      },
      undefined,
      evidence,
    );

    expect(results.some((result) => result.destinationId === "paris")).toBe(false);
  });

  it("writes recommendation reasons as product copy instead of raw vibe tags", () => {
    const [topResult] = rankDestinations({
      partyType: "couple",
      partySize: 2,
      budgetBand: "mid",
      tripLengthDays: 5,
      departureAirport: "ICN",
      travelMonth: 10,
      pace: "balanced",
      flightTolerance: "medium",
      vibes: ["beach", "culture"],
    });

    expect(topResult?.reasons[0]).toBe("쉬는 시간과 로컬 결을 한 번에 담기 좋습니다.");
    expect(topResult?.whyThisFits).toBe("풀빌라와 해변, 요가와 카페 감성이 함께 있는 휴양형 여행지입니다.");
    expect(topResult?.whyThisFits).not.toContain("분위기와 잘 맞습니다");
    expect(topResult?.whyThisFits).not.toContain("은(는)");
  });
});
