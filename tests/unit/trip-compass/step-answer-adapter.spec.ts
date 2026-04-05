import { describe, expect, it } from "vitest";

import { recommendationQuerySchema } from "@/lib/domain/contracts";
import {
  defaultHomeStepAnswers,
  deriveRecommendationQueryFromHomeStepAnswers,
  homeStepTravelWindowOptions,
  homeStepTravelStyleOptions,
  resolveTravelMonthFromHomeWindow,
} from "@/lib/trip-compass/step-answer-adapter";
import { defaultRecommendationQuery } from "@/lib/trip-compass/presentation";

describe("deriveRecommendationQueryFromHomeStepAnswers", () => {
  it("fills a valid recommendation query from defaults", () => {
    const query = deriveRecommendationQueryFromHomeStepAnswers();

    expect(recommendationQuerySchema.parse(query)).toEqual(defaultRecommendationQuery);
    expect(defaultHomeStepAnswers.travelStyle).toEqual([]);
  });

  it("maps a representative simplified answer set to the existing API contract", () => {
    const query = deriveRecommendationQueryFromHomeStepAnswers({
      whoWith: "friends",
      travelWindow: "q3",
      tripLength: 3,
      travelStyle: ["sns-hotplace", "shopping", "foodie"],
      flightPreference: "short",
    });

    expect(recommendationQuerySchema.parse(query)).toEqual({
      partyType: "friends",
      partySize: 4,
      budgetBand: "mid",
      tripLengthDays: 3,
      departureAirport: "ICN",
      travelMonth: 7,
      pace: "packed",
      flightTolerance: "short",
      vibes: ["city", "shopping", "food"],
    });
  });

  it("keeps omitted fields on defaults for unanswered questions", () => {
    const query = deriveRecommendationQueryFromHomeStepAnswers({
      whoWith: "family",
      tripLength: 5,
      travelStyle: ["nature"],
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
      travelWindow: "q4",
      tripLength: 5,
      travelStyle: [],
      flightPreference: "medium",
      budgetFeel: "mid",
    });
    expect(defaultHomeStepAnswers).not.toHaveProperty("departureChoice");
  });

  it("keeps trip-length defaults mapped to representative values behind grouped labels", () => {
    expect(defaultRecommendationQuery.tripLengthDays).toBe(5);
  });

  it("defines travel-style options based on concrete travel behaviors", () => {
    expect(homeStepTravelStyleOptions.map((option) => option.value)).toEqual([
      "activity",
      "sns-hotplace",
      "nature",
      "must-see",
      "healing",
      "culture-history",
      "local-atmosphere",
      "shopping",
      "foodie",
    ]);
  });

  it("exposes every month as a selectable departure window", () => {
    expect(homeStepTravelWindowOptions.map((option) => option.value)).toEqual(["soon", "q1", "q2", "q3", "q4"]);
  });

  it("maps grouped departure windows to representative months", () => {
    expect(resolveTravelMonthFromHomeWindow("q1")).toBe(1);
    expect(resolveTravelMonthFromHomeWindow("q2")).toBe(4);
    expect(resolveTravelMonthFromHomeWindow("q3")).toBe(7);
    expect(resolveTravelMonthFromHomeWindow("q4")).toBe(10);
  });
});
