import { beforeEach, describe, expect, it } from "vitest";

import { deleteUserAccount } from "@/lib/account/service";
import { signUpWithEmailPassword } from "@/lib/auth";
import { type RecommendationQuery } from "@/lib/domain/contracts";
import { memoryStore } from "@/lib/persistence/memory-store";
import { createUserDestinationHistory, upsertUserFutureTrip, upsertUserPreferenceProfile } from "@/lib/profile/service";
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
    meta: {
      status: "saved" as const,
    },
  };
}

describe("deleteUserAccount", () => {
  beforeEach(() => {
    memoryStore.users.clear();
    memoryStore.accounts.clear();
    memoryStore.sessions.clear();
    memoryStore.preferences.clear();
    memoryStore.history.clear();
    memoryStore.futureTrips.clear();
    memoryStore.snapshots.clear();
  });

  it("removes the user's account, sessions, profile data, and owned snapshots", async () => {
    const signUpResult = await signUpWithEmailPassword({
      name: "Delete User",
      email: "delete-user@example.com",
      password: "password-1234",
    });

    const userId = signUpResult.data?.user.id;
    if (!userId) {
      throw new Error("TEST_SIGN_UP_FAILED");
    }
    await upsertUserPreferenceProfile(userId, "discover");
    await createUserDestinationHistory(userId, {
      destinationId: "tokyo",
      rating: 5,
      tags: ["food", "city"],
      customTags: ["야시장"],
      wouldRevisit: true,
      visitedAt: "2026-02-01T00:00:00.000Z",
      memo: "다시 가고 싶어요.",
      images: [],
    });
    await upsertUserFutureTrip(userId, {
      destinationId: "lisbon",
      sourceSnapshotId: "11111111-1111-4111-8111-111111111111",
    });

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

    const privateSnapshot = await createSnapshot(
      {
        kind: "recommendation",
        visibility: "private",
        payload: buildRecommendationPayload(query),
      },
      { visibility: "private", ownerUserId: userId },
    );

    const deleted = await deleteUserAccount(userId);

    expect(deleted).toBe(true);
    expect(memoryStore.users.has(userId)).toBe(false);
    expect([...memoryStore.accounts.values()].some((account) => account.userId === userId)).toBe(false);
    expect([...memoryStore.sessions.values()].some((session) => session.userId === userId)).toBe(false);
    expect(memoryStore.preferences.has(userId)).toBe(false);
    expect([...memoryStore.history.values()].some((entry) => entry.userId === userId)).toBe(false);
    expect([...memoryStore.futureTrips.values()].some((entry) => entry.userId === userId)).toBe(false);
    expect(memoryStore.snapshots.has(privateSnapshot.id)).toBe(false);
    expect(await readSnapshot(privateSnapshot.id, userId)).toBeNull();
  });
});
