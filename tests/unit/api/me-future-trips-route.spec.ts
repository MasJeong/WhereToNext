import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSessionOrNull = vi.fn();

vi.mock("@/lib/auth-session", () => ({
  getSessionOrNull: () => mockGetSessionOrNull(),
}));

import { DELETE as deleteFutureTrip } from "@/app/api/me/future-trips/[futureTripId]/route";
import { GET, POST } from "@/app/api/me/future-trips/route";
import { memoryStore } from "@/lib/persistence/memory-store";

describe("me future trips routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoryStore.futureTrips.clear();
  });

  it("requires auth for future trip routes", async () => {
    mockGetSessionOrNull.mockResolvedValue(null);

    const listResponse = await GET();
    const createResponse = await POST(
      new Request("http://localhost:4010/api/me/future-trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationId: "kyoto",
          sourceSnapshotId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );
    const deleteResponse = await deleteFutureTrip(
      new Request("http://localhost:4010/api/me/future-trips/test", { method: "DELETE" }),
      { params: Promise.resolve({ futureTripId: "test" }) },
    );

    expect(listResponse.status).toBe(401);
    expect(createResponse.status).toBe(401);
    expect(deleteResponse.status).toBe(401);
  });

  it("upserts future trip by destination for the same signed-in user", async () => {
    mockGetSessionOrNull.mockResolvedValue({
      user: { id: "user-1", name: "Future User", email: "future@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });

    const firstResponse = await POST(
      new Request("http://localhost:4010/api/me/future-trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationId: "kyoto",
          sourceSnapshotId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );
    const firstPayload = await firstResponse.json();
    const secondResponse = await POST(
      new Request("http://localhost:4010/api/me/future-trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationId: "kyoto",
          sourceSnapshotId: "22222222-2222-4222-8222-222222222222",
        }),
      }),
    );
    const secondPayload = await secondResponse.json();
    const listResponse = await GET();
    const listPayload = await listResponse.json();

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(secondPayload.futureTrip.id).toBe(firstPayload.futureTrip.id);
    expect(secondPayload.futureTrip.sourceSnapshotId).toBe("22222222-2222-4222-8222-222222222222");
    expect(listPayload.futureTrips).toHaveLength(1);
  });

  it("lists only the signed-in user's future trips and allows owner delete", async () => {
    mockGetSessionOrNull.mockResolvedValue({
      user: { id: "user-1", name: "Future User", email: "future@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });

    const ownedCreate = await POST(
      new Request("http://localhost:4010/api/me/future-trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationId: "kyoto",
          sourceSnapshotId: "33333333-3333-4333-8333-333333333333",
        }),
      }),
    );
    await POST(
      new Request("http://localhost:4010/api/me/future-trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationId: "lisbon",
          sourceSnapshotId: "44444444-4444-4444-8444-444444444444",
        }),
      }),
    );

    memoryStore.futureTrips.set("other-user-trip", {
      id: "55555555-5555-4555-8555-555555555555",
      userId: "user-2",
      destinationId: "vienna",
      sourceSnapshotId: "66666666-6666-4666-8666-666666666666",
      destinationNameKo: "비엔나",
      countryCode: "AT",
      createdAt: "2026-03-29T00:00:00.000Z",
      updatedAt: "2026-03-29T00:00:00.000Z",
    });

    const ownedPayload = await ownedCreate.json();
    const listResponse = await GET();
    const listPayload = await listResponse.json();
    const deleteResponse = await deleteFutureTrip(
      new Request(`http://localhost:4010/api/me/future-trips/${ownedPayload.futureTrip.id}`, { method: "DELETE" }),
      { params: Promise.resolve({ futureTripId: ownedPayload.futureTrip.id }) },
    );

    expect(listResponse.status).toBe(200);
    expect(listPayload.futureTrips).toHaveLength(2);
    expect(listPayload.futureTrips.every((entry: { userId: string }) => entry.userId === "user-1")).toBe(true);
    expect(deleteResponse.status).toBe(200);
  });
});
