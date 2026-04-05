import { describe, expect, it } from "vitest";

import {
  type UserFutureTrip,
} from "@/lib/domain/contracts";
import { memoryStore } from "@/lib/persistence/memory-store";
import {
  deleteUserFutureTrip,
  listUserFutureTrips,
  upsertUserFutureTrip,
} from "@/lib/profile/service";

type FutureTripCardModel = {
  destinationNameKo: string;
  countryCode: string;
};

function futureTripKey(value: { userId: string; destinationId: string }) {
  return `${value.userId}:${value.destinationId}`;
}

function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 2);
  });
}

function resolveFutureTripCard(
  record: UserFutureTrip,
  resolveSnapshot: (sourceSnapshotId: string) => FutureTripCardModel | null,
) {
  let fromSnapshot: FutureTripCardModel | null = null;

  try {
    fromSnapshot = resolveSnapshot(record.sourceSnapshotId);
  } catch {
    fromSnapshot = null;
  }

  if (fromSnapshot) {
    return fromSnapshot;
  }

  return {
    destinationNameKo: record.destinationNameKo,
    countryCode: record.countryCode,
  };
}

describe("future trip contracts", () => {
  it("upserts the same user+destination without duplicates", async () => {
    memoryStore.futureTrips.clear();

    const first = await upsertUserFutureTrip("user-1", {
      destinationId: "kyoto",
      sourceSnapshotId: "11111111-1111-4111-8111-111111111111",
    });
    const second = await upsertUserFutureTrip("user-1", {
      destinationId: "kyoto",
      sourceSnapshotId: "22222222-2222-4222-8222-222222222222",
    });

    expect(await listUserFutureTrips("user-1")).toHaveLength(1);
    expect(second.id).toBe(first.id);
    expect(second).toMatchObject({
      userId: "user-1",
      destinationId: "kyoto",
      sourceSnapshotId: "22222222-2222-4222-8222-222222222222",
      destinationNameKo: "교토",
      countryCode: "JP",
    });
    expect(new Date(second.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(first.updatedAt).getTime());
  });

  it("lists only the current user's future trips in updated order", async () => {
    memoryStore.futureTrips.clear();

    const firstUserInitial = await upsertUserFutureTrip("user-1", {
      destinationId: "lisbon",
      sourceSnapshotId: "33333333-3333-4333-8333-333333333333",
    });
    await waitForNextTick();
    await upsertUserFutureTrip("user-2", {
      destinationId: "vienna",
      sourceSnapshotId: "44444444-4444-4444-8444-444444444444",
    });
    await waitForNextTick();
    const firstUserLatest = await upsertUserFutureTrip("user-1", {
      destinationId: "kyoto",
      sourceSnapshotId: "55555555-5555-4555-8555-555555555555",
    });

    const listed = await listUserFutureTrips("user-1");

    expect(listed).toHaveLength(2);
    expect(listed.map((record) => record.id)).toEqual([firstUserLatest.id, firstUserInitial.id]);
    expect(new Set(listed.map((record) => futureTripKey(record))).size).toBe(2);
  });

  it("keeps fallback display fields when source snapshot cannot be loaded", async () => {
    memoryStore.futureTrips.clear();

    const saved = await upsertUserFutureTrip("user-1", {
      destinationId: "vienna",
      sourceSnapshotId: "66666666-6666-4666-8666-666666666666",
    });

    const fromMissingSnapshot = resolveFutureTripCard(saved, () => null);
    const fromUnreadableSnapshot = resolveFutureTripCard(saved, () => {
      throw new Error("SNAPSHOT_READ_FAILED");
    });

    expect(fromMissingSnapshot).toEqual({
      destinationNameKo: "비엔나",
      countryCode: "AT",
    });
    expect(fromUnreadableSnapshot).toEqual({
      destinationNameKo: "비엔나",
      countryCode: "AT",
    });
  });

  it("deletes only the current user's future trip", async () => {
    memoryStore.futureTrips.clear();

    const owned = await upsertUserFutureTrip("user-1", {
      destinationId: "kyoto",
      sourceSnapshotId: "77777777-7777-4777-8777-777777777777",
    });

    expect(await deleteUserFutureTrip("user-2", owned.id)).toBe(false);
    expect(await deleteUserFutureTrip("user-1", owned.id)).toBe(true);
    expect(await listUserFutureTrips("user-1")).toHaveLength(0);
  });
});
