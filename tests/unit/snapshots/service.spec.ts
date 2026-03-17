import { describe, expect, it } from "vitest";

import { createSnapshot, readSnapshot } from "@/lib/snapshots/service";
import { resolveComparisonMatrix } from "@/lib/compare/service";
import { rankDestinations } from "@/lib/recommendation/engine";

/**
 * 테스트용 추천 질의로부터 단일 목적지 추천 스냅샷 payload를 만든다.
 * @param query 추천 질의
 * @returns 추천 스냅샷 payload
 */
function buildRecommendationPayload(query: Parameters<typeof rankDestinations>[0]) {
  const result = rankDestinations(query)[0];

  if (!result) {
    throw new Error("TEST_RECOMMENDATION_RESULT_NOT_FOUND");
  }

  return {
    v: 1 as const,
    kind: "recommendation" as const,
    query,
    destinationIds: [result.destinationId],
    results: [result],
    scoringVersionId: "mvp-v1",
    trendSnapshotIds: result.trendEvidence.map((item) => item.id),
  };
}

describe("snapshot service", () => {
  it("creates and restores a recommendation snapshot", async () => {
    const query = {
      partyType: "couple" as const,
      partySize: 2,
      budgetBand: "mid" as const,
      tripLengthDays: 5,
      departureAirport: "ICN" as const,
      travelMonth: 10,
      pace: "balanced" as const,
      flightTolerance: "medium" as const,
      vibes: ["romance", "food"] as const,
    };
    const created = await createSnapshot({
      kind: "recommendation",
      payload: buildRecommendationPayload(query),
    });

    const restored = await readSnapshot(created.id);

    expect(restored?.kind).toBe("recommendation");
    expect(restored?.payload.kind).toBe("recommendation");
    expect(restored?.payload.results).toHaveLength(1);
    expect(restored?.destinationIds).toEqual(restored?.payload.destinationIds);
  });

  it("creates a comparison snapshot and resolves its columns", async () => {
    const first = await createSnapshot({
      kind: "recommendation",
      payload: buildRecommendationPayload({
        partyType: "couple",
        partySize: 2,
        budgetBand: "mid",
        tripLengthDays: 5,
        departureAirport: "ICN",
        travelMonth: 10,
        pace: "balanced",
        flightTolerance: "medium",
        vibes: ["romance", "food"],
      }),
    });
    const second = await createSnapshot({
      kind: "recommendation",
      payload: buildRecommendationPayload({
        partyType: "friends",
        partySize: 4,
        budgetBand: "budget",
        tripLengthDays: 5,
        departureAirport: "ICN",
        travelMonth: 7,
        pace: "packed",
        flightTolerance: "medium",
        vibes: ["nightlife", "food"],
      }),
    });

    const comparison = await createSnapshot({
      kind: "comparison",
      payload: {
        v: 1,
        kind: "comparison",
        snapshotIds: [first.id, second.id],
        destinationIds: ["lisbon", "bangkok"],
      },
    });

    const restored = await readSnapshot(comparison.id);
    const columns = await resolveComparisonMatrix([first.id, second.id]);

    expect(restored?.kind).toBe("comparison");
    expect(restored?.payload.kind).toBe("comparison");
    expect(columns).toHaveLength(2);
    expect(columns[0]?.destinationNameKo).toBeTruthy();
  });

  it("rejects invalid compare bounds", async () => {
    await expect(resolveComparisonMatrix(["only-one"])).rejects.toThrow("COMPARE_SNAPSHOT_BOUNDS");
    await expect(
      resolveComparisonMatrix(["a", "b", "c", "d", "e"]),
    ).rejects.toThrow("COMPARE_SNAPSHOT_BOUNDS");
  });
});
