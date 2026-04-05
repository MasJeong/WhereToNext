import { describe, expect, it } from "vitest";

import { rankDestinations } from "@/lib/recommendation/engine";

describe("recommendation personalization", () => {
  it("boosts repeat-friendly destinations when the user wants repeats", () => {
    const results = rankDestinations(
      {
        partyType: "couple",
        partySize: 2,
        budgetBand: "mid",
        tripLengthDays: 5,
        departureAirport: "ICN",
        travelMonth: 10,
        pace: "balanced",
        flightTolerance: "medium",
        vibes: ["romance"],
      },
      undefined,
      new Map(),
      {
        explorationPreference: "repeat",
        history: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            userId: "user-1",
            destinationId: "kyoto",
            rating: 5,
            tags: ["romance", "culture"],
            customTags: ["벚꽃야경"],
            wouldRevisit: true,
            visitedAt: "2026-03-17T00:00:00.000Z",
            images: [],
            createdAt: "2026-03-17T00:00:00.000Z",
            updatedAt: "2026-03-17T00:00:00.000Z",
          },
        ],
      },
    );

    expect(results[0]?.reasons[0]).toContain("눈여겨봤어요");
  });

  it("penalizes already visited destinations when the user prefers discovery", () => {
    const results = rankDestinations(
      {
        partyType: "couple",
        partySize: 2,
        budgetBand: "mid",
        tripLengthDays: 5,
        departureAirport: "ICN",
        travelMonth: 10,
        pace: "balanced",
        flightTolerance: "medium",
        vibes: ["romance"],
      },
      undefined,
      new Map(),
      {
        explorationPreference: "discover",
        history: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            userId: "user-1",
            destinationId: "lisbon",
            rating: 5,
            tags: ["romance", "food"],
            customTags: ["골목산책"],
            wouldRevisit: false,
            visitedAt: "2026-03-17T00:00:00.000Z",
            images: [],
            createdAt: "2026-03-17T00:00:00.000Z",
            updatedAt: "2026-03-17T00:00:00.000Z",
          },
        ],
      },
    );

    expect(results[0]?.destinationId).not.toBe("lisbon");
  });

  it("keeps custom hashtags out of personalization overlap", () => {
    const results = rankDestinations(
      {
        partyType: "couple",
        partySize: 2,
        budgetBand: "mid",
        tripLengthDays: 5,
        departureAirport: "ICN",
        travelMonth: 10,
        pace: "balanced",
        flightTolerance: "medium",
        vibes: ["romance"],
      },
      undefined,
      new Map(),
      {
        explorationPreference: "balanced",
        history: [
          {
            id: "33333333-3333-3333-3333-333333333333",
            userId: "user-1",
            destinationId: "berlin",
            rating: 5,
            tags: ["culture"],
            customTags: ["food"],
            wouldRevisit: false,
            visitedAt: "2026-03-17T00:00:00.000Z",
            images: [],
            createdAt: "2026-03-17T00:00:00.000Z",
            updatedAt: "2026-03-17T00:00:00.000Z",
          },
        ],
      },
    );

    expect(results[0]?.reasons.join(" ")).not.toContain("여행 태그와 맞는 편이라 추천 이유에 반영했어요");
  });
});
