import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSessionOrNull = vi.fn();

vi.mock("@/lib/auth-session", () => ({
  getSessionOrNull: () => mockGetSessionOrNull(),
}));

import { DELETE as deleteFutureTrip } from "@/app/api/me/future-trips/[futureTripId]/route";
import { GET, POST } from "@/app/api/me/future-trips/route";
import { memoryStore } from "@/lib/persistence/memory-store";
import { upsertUserFutureTrip } from "@/lib/profile/service";

describe("future trips authz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoryStore.futureTrips.clear();
  });

  it("rejects unauthenticated create", async () => {
    mockGetSessionOrNull.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:4010/api/me/future-trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationId: "kyoto",
          sourceSnapshotId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects invalid future trip input", async () => {
    mockGetSessionOrNull.mockResolvedValue({
      user: { id: "user-1", name: "Future User", email: "future@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });

    const response = await POST(
      new Request("http://localhost:4010/api/me/future-trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationId: "unknown-city",
          sourceSnapshotId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects cross-user delete by returning not found", async () => {
    const owned = await upsertUserFutureTrip("user-1", {
      destinationId: "kyoto",
      sourceSnapshotId: "22222222-2222-4222-8222-222222222222",
    });

    mockGetSessionOrNull.mockResolvedValue({
      user: { id: "user-2", name: "Other User", email: "other@example.com" },
      session: { id: "session-2", expiresAt: new Date().toISOString() },
    });

    const response = await deleteFutureTrip(
      new Request(`http://localhost:4010/api/me/future-trips/${owned.id}`, { method: "DELETE" }),
      { params: Promise.resolve({ futureTripId: owned.id }) },
    );

    expect(response.status).toBe(404);
  });

  it("omits other users' future trips from list", async () => {
    await upsertUserFutureTrip("user-1", {
      destinationId: "kyoto",
      sourceSnapshotId: "33333333-3333-4333-8333-333333333333",
    });
    await upsertUserFutureTrip("user-2", {
      destinationId: "lisbon",
      sourceSnapshotId: "44444444-4444-4444-8444-444444444444",
    });

    mockGetSessionOrNull.mockResolvedValue({
      user: { id: "user-1", name: "Future User", email: "future@example.com" },
      session: { id: "session-1", expiresAt: new Date().toISOString() },
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.futureTrips).toHaveLength(1);
    expect(payload.futureTrips[0]?.userId).toBe("user-1");
  });
});
