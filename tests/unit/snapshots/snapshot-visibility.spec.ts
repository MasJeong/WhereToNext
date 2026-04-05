import { describe, expect, it } from "vitest";

import type { RecommendationQuery } from "@/lib/domain/contracts";
import { rankDestinations } from "@/lib/recommendation/engine";
import { createSnapshot, readSnapshot } from "@/lib/snapshots/service";

function buildRecommendationPayload(query: RecommendationQuery) {
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

describe("snapshot visibility", () => {
  it("keeps public snapshots readable without a viewer", async () => {
    const query: RecommendationQuery = {
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

    const created = await createSnapshot({
      kind: "recommendation",
      payload: buildRecommendationPayload(query),
    });

    const restored = await readSnapshot(created.id);

    expect(created.visibility).toBe("public");
    expect(created.ownerUserId).toBeNull();
    expect(restored?.id).toBe(created.id);
  });

  it("fails closed for anonymous reads of private snapshots", async () => {
    const query: RecommendationQuery = {
      partyType: "friends",
      partySize: 4,
      budgetBand: "budget",
      tripLengthDays: 4,
      departureAirport: "ICN",
      travelMonth: 7,
      pace: "packed",
      flightTolerance: "medium",
      vibes: ["nightlife", "food"],
    };

    const created = await createSnapshot(
      {
        kind: "recommendation",
        payload: buildRecommendationPayload(query),
      },
      { visibility: "private", ownerUserId: "user-private-1" },
    );

    const anonymousRead = await readSnapshot(created.id);
    const ownerRead = await readSnapshot(created.id, "user-private-1");
    const otherUserRead = await readSnapshot(created.id, "user-private-2");

    expect(created.visibility).toBe("private");
    expect(created.ownerUserId).toBe("user-private-1");
    expect(anonymousRead).toBeNull();
    expect(ownerRead?.id).toBe(created.id);
    expect(otherUserRead).toBeNull();
  });
});
