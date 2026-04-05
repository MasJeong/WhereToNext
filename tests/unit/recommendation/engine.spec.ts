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
});
