import { describe, expect, it } from "vitest";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { resolveDestinationFlightAffiliateLink } from "@/lib/affiliate/links";
import type { RecommendationQuery } from "@/lib/domain/contracts";

const recommendationQuery: RecommendationQuery = {
  partyType: "couple",
  partySize: 2,
  budgetBand: "mid",
  tripLengthDays: 5,
  departureAirport: "ICN",
  travelMonth: 10,
  pace: "balanced",
  flightTolerance: "medium",
  vibes: ["romance", "food"],
};

describe("flight affiliate service", () => {
  it("builds a Skyscanner deeplink for supported destinations", () => {
    const link = resolveDestinationFlightAffiliateLink(launchCatalog[0], recommendationQuery);

    expect(link).not.toBeNull();
    expect(link?.partner).toBe("skyscanner");
    expect(link?.url).toBe(
      "https://www.skyscanner.co.kr/routes/icn/tyoa/incheon-international-airport-to-tokyo.html",
    );
  });

  it("falls back to Trip.com when the active partner has no destination mapping", () => {
    const link = resolveDestinationFlightAffiliateLink(
      {
        id: "unsupported-destination",
        nameKo: "테스트 목적지",
      },
      recommendationQuery,
    );

    expect(link).toBeNull();
  });
});
