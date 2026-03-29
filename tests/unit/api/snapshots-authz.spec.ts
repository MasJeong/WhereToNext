import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/snapshots/route";
import { signUpWithEmailPassword } from "@/lib/auth";

const TEST_BASE_URL = "http://localhost:4010";

function buildComparisonBody(visibility: "public" | "private") {
  return {
    kind: "comparison",
    visibility,
    payload: {
      v: 1,
      kind: "comparison",
      snapshotIds: ["a", "b"],
      destinationIds: ["a", "b"],
    },
  };
}

describe("POST /api/snapshots authz", () => {
  it("requires auth for private snapshots and allows public snapshots anonymously", async () => {
    const anonymousPrivateResponse = await POST(
      new Request(`${TEST_BASE_URL}/api/snapshots`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildComparisonBody("private")),
      }),
    );

    expect(anonymousPrivateResponse.status).toBe(401);

    const publicResponse = await POST(
      new Request(`${TEST_BASE_URL}/api/snapshots`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildComparisonBody("public")),
      }),
    );
    const publicPayload = await publicResponse.json();

    expect(publicResponse.status).toBe(200);
    expect(publicPayload.visibility).toBe("public");
  });

  it("creates a private owner-bound snapshot when signed in", async () => {
    const signUpResult = await signUpWithEmailPassword({
      name: "Snapshot User",
      email: `snapshot-${Date.now()}@example.com`,
      password: "password-1234",
    });

    if (!signUpResult.token) {
      throw new Error("TEST_SIGN_UP_FAILED");
    }

    const response = await POST(
      new Request(`${TEST_BASE_URL}/api/snapshots`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `trip_compass_session=${signUpResult.token}`,
        },
        body: JSON.stringify(buildComparisonBody("private")),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.visibility).toBe("private");
  });
});
