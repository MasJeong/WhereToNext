import { describe, expect, it } from "vitest";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { rankDestinations } from "@/lib/recommendation/engine";
import { defaultRecommendationQuery } from "@/lib/trip-compass/presentation";

describe("rankDestinations", () => {
  it("hard-filters destinations from excluded countries", () => {
    const recommendations = rankDestinations({
      ...defaultRecommendationQuery,
      excludedCountryCodes: ["JP"],
    }, launchCatalog);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(
      recommendations.some((recommendation) => {
        const destination = launchCatalog.find((item) => item.id === recommendation.destinationId);
        return destination?.countryCode === "JP";
      }),
    ).toBe(false);
  });

  it("hard-filters destinations that were already shown in previous results", () => {
    const recommendations = rankDestinations({
      ...defaultRecommendationQuery,
      excludedDestinationIds: ["tokyo", "osaka"],
    }, launchCatalog);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some((recommendation) => recommendation.destinationId === "tokyo")).toBe(false);
    expect(recommendations.some((recommendation) => recommendation.destinationId === "osaka")).toBe(false);
  });
});
