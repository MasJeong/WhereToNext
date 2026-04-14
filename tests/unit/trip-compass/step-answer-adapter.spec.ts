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
      travelWindow: 7,
      tripRhythm: "quick-reset",
      mainVibe: "city",
      departureChoice: "GMP",
    });

    expect(recommendationQuerySchema.parse(query)).toEqual({
      partyType: "friends",
      partySize: 4,
      budgetBand: "mid",
      tripLengthDays: 3,
      departureAirport: "GMP",
      travelMonth: 7,
      pace: "balanced",
      flightTolerance: "short",
      vibes: ["city"],
    });
  });

  it("keeps omitted fields on defaults for unanswered questions", () => {
    const query = deriveRecommendationQueryFromHomeStepAnswers({
      whoWith: "family",
      tripRhythm: "slow-reset",
      mainVibe: "nature",
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

  it("keeps the default answer snapshot aligned to the strict question flow", () => {
    expect(defaultHomeStepAnswers).toMatchObject({
      whoWith: "couple",
      travelWindow: 10,
      tripRhythm: "steady-highlights",
      mainVibe: "romance",
      departureChoice: "ICN",
      budgetFeel: "mid",
    });
    expect(defaultHomeStepAnswers).not.toHaveProperty("extraVibe");
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
