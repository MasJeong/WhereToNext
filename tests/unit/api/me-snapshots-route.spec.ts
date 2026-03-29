import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSessionOrNull = vi.fn();

vi.mock("@/lib/auth-session", () => ({
  getSessionOrNull: () => mockGetSessionOrNull(),
}));

import { GET as getSnapshot } from "@/app/api/me/snapshots/[snapshotId]/route";
import { PATCH as patchSnapshot } from "@/app/api/me/snapshots/[snapshotId]/route";
import { GET as listSnapshots } from "@/app/api/me/snapshots/route";
import type { RecommendationQuery } from "@/lib/domain/contracts";
import { rankDestinations } from "@/lib/recommendation/engine";
import { createSnapshot } from "@/lib/snapshots/service";
import { memoryStore } from "@/lib/persistence/memory-store";

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

describe("me snapshots routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoryStore.snapshots.clear();
  });

  it("requires auth for saved snapshot routes", async () => {
    mockGetSessionOrNull.mockResolvedValue(null);

    const listResponse = await listSnapshots();
    const getResponse = await getSnapshot(new Request("http://localhost:4010/api/me/snapshots/test"), {
      params: Promise.resolve({ snapshotId: "test" }),
    });
    const patchResponse = await patchSnapshot(new Request("http://localhost:4010/api/me/snapshots/test", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "planned" }),
    }), {
      params: Promise.resolve({ snapshotId: "test" }),
    });

    expect(listResponse.status).toBe(401);
    expect(getResponse.status).toBe(401);
    expect(patchResponse.status).toBe(401);
  });

  it("lists and reads only the signed-in user's private recommendation snapshots", async () => {
    mockGetSessionOrNull.mockResolvedValue({
      user: { id: "user-1", name: "Saved User", email: "saved@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
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

    const owned = await createSnapshot(
      {
        kind: "recommendation",
        visibility: "private",
        payload: buildRecommendationPayload(query),
      },
      { visibility: "private", ownerUserId: "user-1" },
    );
    await createSnapshot(
      {
        kind: "recommendation",
        visibility: "private",
        payload: buildRecommendationPayload(query),
      },
      { visibility: "private", ownerUserId: "user-2" },
    );
    await createSnapshot(
      {
        kind: "recommendation",
        visibility: "public",
        payload: buildRecommendationPayload(query),
      },
      { visibility: "public", ownerUserId: null },
    );

    const listResponse = await listSnapshots();
    const listPayload = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listPayload.snapshots).toHaveLength(1);
    expect(listPayload.snapshots[0]?.id).toBe(owned.id);

    const getResponse = await getSnapshot(new Request(`http://localhost:4010/api/me/snapshots/${owned.id}`), {
      params: Promise.resolve({ snapshotId: owned.id }),
    });
    const getPayload = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(getPayload.snapshot.id).toBe(owned.id);
    expect(getPayload.snapshot.visibility).toBe("private");

    const patchResponse = await patchSnapshot(new Request(`http://localhost:4010/api/me/snapshots/${owned.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "planned" }),
    }), {
      params: Promise.resolve({ snapshotId: owned.id }),
    });
    const patchPayload = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(patchPayload.snapshot.id).toBe(owned.id);
    expect(patchPayload.snapshot.payload.meta.status).toBe("planned");
  });
});
