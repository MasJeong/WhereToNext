import { afterEach, describe, expect, it } from "vitest";

import {
  buildCurrentRoute,
  clearPostAuthIntent,
  consumeMatchingPostAuthIntent,
  readPostAuthIntent,
  savePostAuthIntent,
} from "@/lib/post-auth-intent";

describe("post auth intent", () => {
  afterEach(() => {
    clearPostAuthIntent();
  });

  it("replays the saved intent exactly once for the matching route", () => {
    savePostAuthIntent({
      kind: "save-home-card",
      route: "/?step=result",
      destinationId: "tokyo-japan",
    });

    expect(readPostAuthIntent()).toEqual({
      kind: "save-home-card",
      route: "/?step=result",
      destinationId: "tokyo-japan",
    });

    const consumed = consumeMatchingPostAuthIntent("/?step=result");
    expect(consumed).toEqual({
      kind: "save-home-card",
      route: "/?step=result",
      destinationId: "tokyo-japan",
    });
    expect(readPostAuthIntent()).toBeNull();
    expect(consumeMatchingPostAuthIntent("/?step=result")).toBeNull();
  });

  it("does not consume an intent when the route does not match", () => {
    savePostAuthIntent({
      kind: "save-detail-card",
      route: "/destinations/tokyo-japan?snapshotId=123",
      destinationId: "tokyo-japan",
    });

    expect(consumeMatchingPostAuthIntent("/")).toBeNull();
    expect(readPostAuthIntent()).not.toBeNull();
  });

  it("builds a stable route with query string", () => {
    const route = buildCurrentRoute(
      "/destinations/tokyo-japan",
      new URLSearchParams("snapshotId=abc&intent=save"),
    );

    expect(route).toBe("/destinations/tokyo-japan?snapshotId=abc&intent=save");
  });
});
