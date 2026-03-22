import { describe, expect, it } from "vitest";

import { recommendationQuerySchema } from "@/lib/domain/contracts";
import { testIds } from "@/lib/test-ids";

describe("recommendationQuerySchema", () => {
  it("accepts the supported MVP payload", () => {
    const parsed = recommendationQuerySchema.parse({
      partyType: "couple",
      partySize: 2,
      budgetBand: "mid",
      tripLengthDays: 5,
      departureAirport: "ICN",
      travelMonth: 10,
      pace: "balanced",
      flightTolerance: "medium",
      vibes: ["romance", "food"],
      ignoredField: "should strip",
    });

    expect(parsed).toEqual({
      partyType: "couple",
      partySize: 2,
      budgetBand: "mid",
      tripLengthDays: 5,
      departureAirport: "ICN",
      travelMonth: 10,
      pace: "balanced",
      flightTolerance: "medium",
      vibes: ["romance", "food"],
    });
  });

  it("rejects invalid ranges and too many vibes", () => {
    const result = recommendationQuerySchema.safeParse({
      partyType: "couple",
      partySize: -1,
      budgetBand: "mid",
      tripLengthDays: 5,
      departureAirport: "ICN",
      travelMonth: 13,
      pace: "balanced",
      flightTolerance: "medium",
      vibes: ["romance", "food", "nature"],
    });

    expect(result.success).toBe(false);
  });

  it("exports stable selectors for the query and result shell", () => {
    expect(testIds.query.partyTypeCouple).toBe("party-type-couple");
    expect(testIds.query.submitRecommendation).toBe("submit-recommendation");
    expect(testIds.result.card0).toBe("result-card-0");
    expect(testIds.result.instagramVibe0).toBe("instagram-vibe-0");
    expect(testIds.snapshot.saveSnapshot).toBe("save-snapshot");
    expect(testIds.snapshot.restoreBrief).toBe("restore-brief");
    expect(testIds.snapshot.compareSnapshot).toBe("compare-snapshot");
    expect(testIds.compare.summary).toBe("compare-summary");
  });
});
