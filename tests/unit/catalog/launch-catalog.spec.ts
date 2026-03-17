import { describe, expect, it } from "vitest";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { activeScoringVersion } from "@/lib/catalog/scoring-version";

describe("launchCatalog", () => {
  it("contains the curated 36-destination launch set", () => {
    expect(launchCatalog).toHaveLength(36);
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

  it("locks the active scoring version contract", () => {
    expect(activeScoringVersion.id).toBe("mvp-v1");
    expect(activeScoringVersion.weights.vibeMatch).toBe(25);
    expect(activeScoringVersion.tieBreakerCap).toBe(3);
  });
});
