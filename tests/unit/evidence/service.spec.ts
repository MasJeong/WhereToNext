import { describe, expect, it } from "vitest";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { destinationEvidenceCatalog } from "@/lib/evidence/catalog";
import { buildEvidenceMap, getDestinationEvidence } from "@/lib/evidence/service";

describe("evidence service", () => {
  it("returns normalized evidence with tier and freshness", async () => {
    const result = await getDestinationEvidence(launchCatalog.find((item) => item.id === "tokyo")!);

    expect(result.mode).toBe("live");
    expect(result.snapshots[0]?.sourceLabel).toBeTruthy();
    expect(result.snapshots[0]?.tier).toBeTruthy();
    expect(result.snapshots[0]?.freshnessState).toBeTruthy();
  });

  it("returns curated evidence for a newly added destination", async () => {
    const result = await getDestinationEvidence(launchCatalog.find((item) => item.id === "miyakojima")!);

    expect(result.mode).toBe("live");
    expect(result.snapshots[0]?.sourceType).toBeTruthy();
    expect(result.snapshots[0]?.summary).toContain("휴양");
  });

  it("falls back to editorial when no curated instagram source exists", async () => {
    const result = await getDestinationEvidence(launchCatalog.find((item) => item.id === "vienna")!);

    expect(result.mode).toBe("fallback");
    expect(result.snapshots[0]?.sourceType).toBe("editorial");
  });

  it("builds an evidence map for multiple destinations", async () => {
    const map = await buildEvidenceMap(launchCatalog.slice(0, 3));

    expect(map.size).toBe(3);
  });

  it("keeps curated evidence keys aligned with launch catalog destination ids", () => {
    const destinationIds = new Set(launchCatalog.map((item) => item.id));

    for (const destinationId of Object.keys(destinationEvidenceCatalog)) {
      expect(destinationIds.has(destinationId), destinationId).toBe(true);
    }
  });
});
