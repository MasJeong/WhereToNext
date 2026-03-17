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
});
