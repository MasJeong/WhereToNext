import { describe, expect, it } from "vitest";

import {
  userDestinationHistoryImageMaxCount,
  userDestinationHistoryImageSchema,
  userDestinationHistoryInputSchema,
} from "@/lib/domain/contracts";

describe("user destination history image schema", () => {
  it("accepts allowed image types with matching data urls", () => {
    const parsed = userDestinationHistoryImageSchema.parse({
      name: "trip-photo.webp",
      contentType: "image/webp",
      dataUrl: "data:image/webp;base64,AAAA",
    });

    expect(parsed.contentType).toBe("image/webp");
  });

  it("rejects unsupported image types such as svg", () => {
    expect(() =>
      userDestinationHistoryImageSchema.parse({
        name: "weird.svg",
        contentType: "image/svg+xml",
        dataUrl: "data:image/svg+xml;base64,AAAA",
      }),
    ).toThrow();
  });

  it("rejects mismatched file metadata and data urls", () => {
    expect(() =>
      userDestinationHistoryImageSchema.parse({
        name: "trip-photo.jpg",
        contentType: "image/jpeg",
        dataUrl: "data:image/png;base64,AAAA",
      }),
    ).toThrow();
  });

  it("normalizes omitted images to an empty array", () => {
    const parsed = userDestinationHistoryInputSchema.parse({
      destinationId: "tokyo",
      rating: 5,
      tags: ["city"],
      customTags: undefined,
      wouldRevisit: true,
      visitedAt: "2026-02-01T00:00:00.000Z",
      memo: null,
    });

    expect(parsed.images).toEqual([]);
    expect(parsed.customTags).toEqual([]);
  });

  it("normalizes custom hashtags by trimming the leading hash", () => {
    const parsed = userDestinationHistoryInputSchema.parse({
      destinationId: "tokyo",
      rating: 5,
      tags: ["city"],
      customTags: [" #야경맛집 "],
      wouldRevisit: true,
      visitedAt: "2026-02-01T00:00:00.000Z",
      memo: null,
    });

    expect(parsed.customTags).toEqual(["야경맛집"]);
  });

  it("rejects invalid custom hashtags", () => {
    expect(() =>
      userDestinationHistoryInputSchema.parse({
        destinationId: "tokyo",
        rating: 5,
        tags: ["city"],
        customTags: ["야경 맛집"],
        wouldRevisit: true,
        visitedAt: "2026-02-01T00:00:00.000Z",
        memo: null,
      }),
    ).toThrow();
  });

  it("rejects more than ten images in one history entry", () => {
    expect(() =>
      userDestinationHistoryInputSchema.parse({
        destinationId: "tokyo",
        rating: 5,
        tags: ["city"],
        wouldRevisit: true,
        visitedAt: "2026-02-01T00:00:00.000Z",
        memo: null,
        images: Array.from({ length: userDestinationHistoryImageMaxCount + 1 }, (_, index) => ({
          name: `trip-${index}.jpg`,
          contentType: "image/jpeg",
          dataUrl: "data:image/jpeg;base64,AAAA",
        })),
      }),
    ).toThrow();
  });
});
