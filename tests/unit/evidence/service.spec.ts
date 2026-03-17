import { describe, expect, it } from "vitest";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { buildEvidenceMap, getDestinationEvidence } from "@/lib/evidence/service";

describe("evidence service", () => {
  it("returns normalized evidence with tier and freshness", async () => {
    const result = await getDestinationEvidence(launchCatalog.find((item) => item.id === "tokyo")!);

    expect(result.mode).toBe("live");
    expect(result.snapshots[0]?.sourceLabel).toBeTruthy();
    expect(result.snapshots[0]?.tier).toBeTruthy();
    expect(result.snapshots[0]?.freshnessState).toBeTruthy();
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
});
