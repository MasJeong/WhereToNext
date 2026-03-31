import { describe, expect, it } from "vitest";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { activeScoringVersion } from "@/lib/catalog/scoring-version";
import { getCountryMetadata } from "@/lib/travel-support/country-metadata";

describe("launchCatalog", () => {
  it("contains the curated 60-destination launch set", () => {
    expect(launchCatalog).toHaveLength(60);
  });

  it("ensures every destination has localized names and recommendation content", () => {
    for (const destination of launchCatalog) {
      expect(destination.nameKo.length).toBeGreaterThan(0);
      expect(destination.nameEn.length).toBeGreaterThan(0);
      expect(destination.bestMonths.length).toBeGreaterThan(0);
      expect(destination.vibeTags.length).toBeGreaterThan(0);
      expect(destination.watchOuts.length).toBeGreaterThan(0);
      expect(destination.summary.length).toBeGreaterThan(0);
    }
  });

  it("ensures every destination country code resolves to travel support metadata", () => {
    for (const destination of launchCatalog) {
      expect(getCountryMetadata(destination.countryCode), destination.id).not.toBeNull();
    }
  });

  it("locks the active scoring version contract", () => {
    expect(activeScoringVersion.id).toBe("mvp-v1");
    expect(activeScoringVersion.weights.vibeMatch).toBe(25);
    expect(activeScoringVersion.tieBreakerCap).toBe(3);
  });
});
