import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountExperience } from "@/components/trip-compass/account-experience";
import type {
  RecommendationSnapshot,
  RecommendationQuery,
  UserDestinationHistory,
  UserFutureTrip,
  UserPreferenceProfile,
} from "@/lib/domain/contracts";
import { rankDestinations } from "@/lib/recommendation/engine";
import {
  getAccountFutureTripDeleteTestId,
  getAccountFutureTripEntryTestId,
  getAccountHistoryEntryTestId,
  getSavedSnapshotTestId,
  testIds,
} from "@/lib/test-ids";

const { mockPush, mockRefresh, mockSignOut } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: mockSignOut,
    useSession: () => ({
      data: {
        user: {
          id: "user-1",
          name: "테스트 사용자",
        },
      },
    }),
  },
}));

const profile: UserPreferenceProfile = {
  userId: "user-1",
  explorationPreference: "balanced",
};

const historyEntry: UserDestinationHistory = {
  id: "history-1",
  userId: "user-1",
  destinationId: "tokyo",
  rating: 5,
  tags: ["city", "food"],
  wouldRevisit: true,
  visitedAt: "2026-02-01T00:00:00.000Z",
  memo: "다음에도 밤 산책 코스로 다시 가고 싶어요.",
  image: null,
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

const futureTripEntry: UserFutureTrip = {
  id: "future-1",
  userId: "user-1",
  destinationId: "osaka",
  sourceSnapshotId: "11111111-1111-4111-8111-111111111111",
  destinationNameKo: "오사카",
  countryCode: "JP",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-02T00:00:00.000Z",
};

function buildSavedSnapshotPayload(): RecommendationSnapshot {
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
  const result = rankDestinations(query)[0];

  if (!result) {
    throw new Error("TEST_RECOMMENDATION_RESULT_NOT_FOUND");
  }

  return {
    v: 1,
    kind: "recommendation",
    query,
    destinationIds: [result.destinationId],
    results: [result],
    scoringVersionId: "mvp-v1",
    trendSnapshotIds: result.trendEvidence.map((item) => item.id),
  };
}

function renderAccountExperience(options?: { futureTrips?: UserFutureTrip[] }) {
  return render(
    <AccountExperience
      userName="테스트 사용자"
      initialTab="future-trips"
      initialProfile={profile}
      initialHistory={[historyEntry]}
      initialFutureTrips={options?.futureTrips ?? [futureTripEntry]}
      initialSavedSnapshots={[
        {
          id: "saved-1",
          createdAt: "2026-03-03T00:00:00.000Z",
          payload: buildSavedSnapshotPayload(),
        },
      ]}
    />,
  );
}

describe("AccountExperience future trips tab", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockRefresh.mockReset();
    mockSignOut.mockReset();
  });

  it("renders a dedicated empty state when no future trips are loaded", () => {
    renderAccountExperience({ futureTrips: [] });

    expect(screen.getByTestId(testIds.account.tabFutureTrips)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.account.futureTripList)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.account.futureTripEmptyState)).toHaveTextContent(
      "아직 앞으로 갈 곳이 없어요.",
    );
    expect(screen.queryByTestId(getAccountFutureTripEntryTestId(0))).not.toBeInTheDocument();
  });

  it("deletes only future trips and preserves history plus saved snapshot state", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    renderAccountExperience();

    expect(screen.getByTestId(getAccountFutureTripEntryTestId(0))).toHaveTextContent("오사카");

    fireEvent.click(screen.getByTestId(getAccountFutureTripDeleteTestId(0)));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/me/future-trips/future-1", {
        method: "DELETE",
        credentials: "include",
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId(getAccountFutureTripEntryTestId(0))).not.toBeInTheDocument();
    });

    expect(screen.getByTestId(testIds.account.futureTripEmptyState)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(testIds.account.tabHistory));
    expect(screen.getByTestId(getAccountHistoryEntryTestId(0))).toHaveTextContent("도쿄");

    fireEvent.click(screen.getByTestId(testIds.account.tabSaved));
    expect(screen.getByTestId(getSavedSnapshotTestId(0))).toHaveTextContent("리스본");
  });
});
