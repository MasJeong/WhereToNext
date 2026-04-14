import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeExperience } from "@/components/trip-compass/home-experience";
import type { RecommendationQuery } from "@/lib/domain/contracts";
import { rankDestinations } from "@/lib/recommendation/engine";
import { getSaveSnapshotTestId, testIds } from "@/lib/test-ids";
import type { RecommendationApiResponse } from "@/lib/trip-compass/presentation";

const query: RecommendationQuery = {
  partyType: "couple",
  partySize: 2,
  budgetBand: "mid",
  tripLengthDays: 5,
  departureAirport: "ICN",
  travelMonth: 10,
  pace: "balanced",
  flightTolerance: "medium",
  vibes: ["food"],
};

const searchParams = new URLSearchParams({
  partyType: query.partyType,
  partySize: String(query.partySize),
  budgetBand: query.budgetBand,
  tripLengthDays: String(query.tripLengthDays),
  departureAirport: query.departureAirport,
  travelMonth: String(query.travelMonth),
  pace: query.pace,
  flightTolerance: query.flightTolerance,
  vibes: query.vibes.join(","),
  stage: "result",
});

const { mockPush, mockSession } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSession: {
    data: {
      user: {
        id: "user-1",
        name: "테스트 사용자",
      },
    },
    isPending: false,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => searchParams,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => mockSession,
  },
}));

function buildRecommendationResponse(): RecommendationApiResponse {
  return {
    query,
    recommendations: rankDestinations(query).slice(0, 4),
    meta: {
      scoringVersion: "mvp-v1",
      resultCount: 4,
      personalized: false,
    },
    sourceSummary: {
      mode: "fallback",
      evidenceCount: 0,
      tiers: [],
    },
    leadSupplement: null,
  };
}

describe("HomeExperience future-trip result CTA", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    Object.assign(mockSession, {
      data: {
        user: {
          id: "user-1",
          name: "테스트 사용자",
        },
      },
      isPending: false,
    });

    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Element.prototype.scrollIntoView = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("creates a source snapshot, auto-registers a future trip, and keeps users on the results page", async () => {
    const recommendationResponse = buildRecommendationResponse();
    const leadDestinationId = recommendationResponse.recommendations[0]?.destinationId;
    const sourceSnapshotId = "11111111-1111-4111-8111-111111111111";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/recommendations?")) {
        return new Response(JSON.stringify(recommendationResponse), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.endsWith("/api/snapshots")) {
        return new Response(JSON.stringify({ snapshotId: sourceSnapshotId }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.endsWith("/api/me/future-trips")) {
        return new Response(
          JSON.stringify({
            futureTrip: {
              id: "future-1",
              userId: "user-1",
              destinationId: leadDestinationId,
              sourceSnapshotId,
              destinationNameKo: "도쿄",
              countryCode: "JP",
              createdAt: "2026-03-29T00:00:00.000Z",
              updatedAt: "2026-03-29T00:00:00.000Z",
            },
          }),
          {
            status: 201,
            headers: { "content-type": "application/json" },
          },
        );
      }

      throw new Error(`UNHANDLED_FETCH:${url}`);
    });

    render(<HomeExperience />);

    await expectResultCard();

    fireEvent.click(screen.getByTestId(getSaveSnapshotTestId(0)));

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "계정에서 보기" }).length).toBeGreaterThan(0);
    });

    expect(screen.getByTestId(testIds.home.resultPage)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(fetchSpy.mock.calls.filter(([input]) => String(input).includes("/api/snapshots"))).toHaveLength(1);
      expect(fetchSpy.mock.calls.filter(([input]) => String(input).includes("/api/me/future-trips"))).toHaveLength(1);
    });

    const futureTripCall = fetchSpy.mock.calls.find(([input]) => String(input).includes("/api/me/future-trips"));
    expect(futureTripCall?.[1]).toMatchObject({
      method: "POST",
      credentials: "include",
    });
    expect(JSON.parse(String(futureTripCall?.[1]?.body))).toEqual({
      destinationId: leadDestinationId,
      sourceSnapshotId,
    });
  });

  it("does not create duplicate requests after the integrated save flow completes", async () => {
    const recommendationResponse = buildRecommendationResponse();
    const leadDestinationId = recommendationResponse.recommendations[0]?.destinationId;
    const sourceSnapshotId = "22222222-2222-4222-8222-222222222222";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/recommendations?")) {
        return new Response(JSON.stringify(recommendationResponse), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.endsWith("/api/snapshots")) {
        return new Response(JSON.stringify({ snapshotId: sourceSnapshotId }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.endsWith("/api/me/future-trips")) {
        return new Response(
          JSON.stringify({
            futureTrip: {
              id: "future-2",
              userId: "user-1",
              destinationId: leadDestinationId,
              sourceSnapshotId,
              destinationNameKo: "도쿄",
              countryCode: "JP",
              createdAt: "2026-03-29T00:00:00.000Z",
              updatedAt: "2026-03-29T00:00:00.000Z",
            },
          }),
          {
            status: 201,
            headers: { "content-type": "application/json" },
          },
        );
      }

      throw new Error(`UNHANDLED_FETCH:${url}`);
    });

    render(<HomeExperience />);

    await expectResultCard();

    fireEvent.click(screen.getByTestId(getSaveSnapshotTestId(0)));

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "계정에서 보기" }).length).toBeGreaterThan(0);
    });

    expect(fetchSpy.mock.calls.filter(([input]) => String(input).includes("/api/snapshots"))).toHaveLength(1);
    expect(fetchSpy.mock.calls.filter(([input]) => String(input).includes("/api/me/future-trips"))).toHaveLength(1);

    const futureTripCall = fetchSpy.mock.calls.find(([input]) => String(input).includes("/api/me/future-trips"));
    expect(JSON.parse(String(futureTripCall?.[1]?.body))).toEqual({
      destinationId: leadDestinationId,
      sourceSnapshotId,
    });
  });

  it("reuses the freshly created snapshot when save also auto-registers a future trip", async () => {
    const recommendationResponse = buildRecommendationResponse();
    const leadDestinationId = recommendationResponse.recommendations[0]?.destinationId;
    const sourceSnapshotId = "33333333-3333-4333-8333-333333333333";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/recommendations?")) {
        return new Response(JSON.stringify(recommendationResponse), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.endsWith("/api/snapshots")) {
        return new Response(JSON.stringify({ snapshotId: sourceSnapshotId }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.endsWith("/api/me/future-trips")) {
        return new Response(
          JSON.stringify({
            futureTrip: {
              id: "future-3",
              userId: "user-1",
              destinationId: leadDestinationId,
              sourceSnapshotId,
              destinationNameKo: "도쿄",
              countryCode: "JP",
              createdAt: "2026-03-29T00:00:00.000Z",
              updatedAt: "2026-03-29T00:00:00.000Z",
            },
          }),
          {
            status: 201,
            headers: { "content-type": "application/json" },
          },
        );
      }

      throw new Error(`UNHANDLED_FETCH:${url}`);
    });

    render(<HomeExperience />);

    await expectResultCard();

    fireEvent.click(screen.getByTestId(getSaveSnapshotTestId(0)));

    await waitFor(() => {
      expect(fetchSpy.mock.calls.filter(([input]) => String(input).includes("/api/snapshots"))).toHaveLength(1);
      expect(fetchSpy.mock.calls.filter(([input]) => String(input).includes("/api/me/future-trips"))).toHaveLength(1);
    });

    const futureTripCall = fetchSpy.mock.calls.find(([input]) => String(input).includes("/api/me/future-trips"));
    expect(JSON.parse(String(futureTripCall?.[1]?.body))).toEqual({
      destinationId: leadDestinationId,
      sourceSnapshotId,
    });
  });

  it("rerolls results without previously shown destinations when users ask again", async () => {
    const firstResponse = buildRecommendationResponse();
    const secondQueryCapture: string[] = [];
    let recommendationRequestCount = 0;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/recommendations?")) {
        recommendationRequestCount += 1;

        if (recommendationRequestCount === 1) {
          return new Response(JSON.stringify(firstResponse), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        secondQueryCapture.push(url);
        return new Response(JSON.stringify({
          ...firstResponse,
          query: {
            ...firstResponse.query,
            excludedDestinationIds: firstResponse.recommendations.map((item) => item.destinationId),
          },
          recommendations: rankDestinations({
            ...query,
            excludedDestinationIds: firstResponse.recommendations.map((item) => item.destinationId),
          }).slice(0, 4),
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      throw new Error(`UNHANDLED_FETCH:${url}`);
    });

    render(<HomeExperience />);

    await expectResultCard();

    fireEvent.click(screen.getByRole("button", { name: "다시 고르기" }));

    await waitFor(() => {
      expect(secondQueryCapture.length).toBeGreaterThan(0);
    });

    const rerollMatch = secondQueryCapture
      .map((value) => new URL(value, "http://localhost:4010"))
      .find((value) => value.searchParams.has("excludedDestinationIds"));

    expect(rerollMatch?.searchParams.get("excludedDestinationIds")?.split(",")).toEqual(
      firstResponse.recommendations.map((item) => item.destinationId),
    );
  });
});

async function expectResultCard() {
  await waitFor(() => {
    expect(screen.getByTestId(testIds.home.resultPage)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.result.card0)).toBeInTheDocument();
    expect(screen.getByTestId(getSaveSnapshotTestId(0))).toBeInTheDocument();
  });
}
