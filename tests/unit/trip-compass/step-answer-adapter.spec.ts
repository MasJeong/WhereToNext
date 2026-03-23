import { describe, expect, it } from "vitest";

import { recommendationQuerySchema } from "@/lib/domain/contracts";
import {
  defaultHomeStepAnswers,
  deriveRecommendationQueryFromHomeStepAnswers,
  homeStepTripRhythmOptions,
} from "@/lib/trip-compass/step-answer-adapter";
import { defaultRecommendationQuery } from "@/lib/trip-compass/presentation";

describe("deriveRecommendationQueryFromHomeStepAnswers", () => {
  it("fills a valid recommendation query from defaults", () => {
    const query = deriveRecommendationQueryFromHomeStepAnswers();

    expect(recommendationQuerySchema.parse(query)).toEqual(defaultRecommendationQuery);
    expect(defaultHomeStepAnswers.tripRhythm).toBe("steady-highlights");
  });

  it("maps a representative simplified answer set to the existing API contract", () => {
    const query = deriveRecommendationQueryFromHomeStepAnswers({
      whoWith: "friends",
      budgetFeel: "budget",
      travelWindow: 7,
      tripRhythm: "quick-reset",
      mainVibe: "city",
      extraVibe: "food",
      departureChoice: "GMP",
    });

    expect(recommendationQuerySchema.parse(query)).toEqual({
      partyType: "friends",
      partySize: 4,
      budgetBand: "budget",
      tripLengthDays: 3,
      departureAirport: "GMP",
      travelMonth: 7,
      pace: "balanced",
      flightTolerance: "short",
      vibes: ["city", "food"],
    });
  });

  it("keeps omitted fields on defaults and removes duplicate extra vibes", () => {
    const query = deriveRecommendationQueryFromHomeStepAnswers({
      whoWith: "family",
      tripRhythm: "slow-reset",
      mainVibe: "nature",
      extraVibe: "nature",
    });

    expect(recommendationQuerySchema.parse(query)).toEqual({
      partyType: "family",
      partySize: 4,
      budgetBand: "mid",
      tripLengthDays: 5,
      departureAirport: "ICN",
      travelMonth: 10,
      pace: "slow",
      flightTolerance: "medium",
      vibes: ["nature"],
    });
  });

  it("defines four deterministic trip rhythm presets for the future step flow", () => {
    expect(homeStepTripRhythmOptions.map((option) => option.value)).toEqual([
      "quick-reset",
      "steady-highlights",
      "slow-reset",
      "far-and-full",
    ]);
  });
});
