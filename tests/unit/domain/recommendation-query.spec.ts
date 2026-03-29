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
      vibes: ["romance", "food", "nature"],
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
      vibes: ["romance", "food", "nature"],
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
      vibes: ["romance", "food", "nature", "city"],
    });

    expect(result.success).toBe(false);
  });

  it("exports stable selectors for the rebuilt flow and result shell", () => {
    expect(testIds.shell.header).toBe("app-header");
    expect(testIds.home.question).toBe("home-step-question");
    expect(testIds.home.searchEntry).toBe("home-search-entry");
    expect(testIds.home.choice0).toBe("home-step-choice-0");
    expect(testIds.query.submitRecommendation).toBe("submit-recommendation");
    expect(testIds.result.card0).toBe("result-card-0");
    expect(testIds.result.filterBar).toBe("result-filter-bar");
    expect(testIds.result.filterChip0).toBe("result-filter-chip-0");
    expect(testIds.result.instagramVibe0).toBe("instagram-vibe-0");
    expect(testIds.socialVideo.block).toBe("social-video-block");
    expect(testIds.socialVideo.thumbnail).toBe("social-video-thumbnail");
    expect(testIds.socialVideo.title).toBe("social-video-title");
    expect(testIds.socialVideo.link).toBe("social-video-link");
    expect(testIds.detail.tasteSubmit).toBe("destination-taste-submit");
    expect(testIds.account.root).toBe("my-taste-root");
    expect(testIds.snapshot.saveSnapshot).toBe("save-snapshot");
    expect(testIds.snapshot.restoreBrief).toBe("restore-brief");
    expect(testIds.snapshot.compareSnapshot).toBe("compare-snapshot");
    expect(testIds.compare.summary).toBe("compare-summary");
  });
});
