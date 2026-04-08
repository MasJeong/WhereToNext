import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountExperience } from "@/components/trip-compass/account-experience";
import type {
  RecommendationSnapshot,
  RecommendationQuery,
  UserDestinationHistory,
  UserPreferenceProfile,
} from "@/lib/domain/contracts";
import { rankDestinations } from "@/lib/recommendation/engine";
import {
  getAccountFutureTripEntryTestId,
  getAccountFutureTripDeleteTestId,
  getAccountFutureTripViewTestId,
  getAccountHistoryEntryTestId,
  getSavedSnapshotDeleteCancelTestId,
  getSavedSnapshotDeleteConfirmTestId,
  getSavedSnapshotDeleteDialogTestId,
  getSavedSnapshotDeleteTestId,
  getSavedSnapshotPlanTestId,
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
    replace: vi.fn(),
  }),
  usePathname: () => "/account",
  useSearchParams: () => new URLSearchParams("tab=future-trips"),
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
  customTags: [],
  wouldRevisit: true,
  visitedAt: "2026-02-01T00:00:00.000Z",
  memo: "다음에도 밤 산책 코스로 다시 가고 싶어요.",
  images: [],
  visibility: "private",
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

function buildSavedSnapshotPayload(status: "saved" | "planned" = "saved"): RecommendationSnapshot {
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
    meta: {
      status,
    },
  };
}

function renderAccountExperience(options?: { plannedSnapshots?: number }) {
  return render(
    <AccountExperience
      userName="테스트 사용자"
      initialTab="future-trips"
      initialProfile={profile}
      initialHistory={[historyEntry]}
      initialSavedSnapshots={[
        {
          id: "saved-1",
          createdAt: "2026-03-03T00:00:00.000Z",
          payload: buildSavedSnapshotPayload(),
        },
        ...(options?.plannedSnapshots === 0
          ? []
          : [
              {
                id: "saved-2",
                createdAt: "2026-03-04T00:00:00.000Z",
                payload: buildSavedSnapshotPayload("planned"),
              },
            ]),
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
    renderAccountExperience({ plannedSnapshots: 0 });

    expect(screen.getByTestId(testIds.account.tabFutureTrips)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.account.futureTripList)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.account.futureTripEmptyState)).toHaveTextContent(
      "아직 예정된 여행이 없습니다",
    );
    expect(screen.queryByTestId(getAccountFutureTripEntryTestId(0))).not.toBeInTheDocument();
  });

  it("shows planned snapshots as a separate read-only list and preserves history", () => {
    renderAccountExperience();

    const futureTripEntry = screen.getByTestId(getAccountFutureTripEntryTestId(0));

    expect(futureTripEntry).toHaveTextContent("리스본");
    expect(futureTripEntry).toHaveTextContent("예정된 여행");
    expect(screen.getByTestId(getAccountFutureTripViewTestId(0))).toHaveAttribute("href", "/s/saved-2");
    expect(screen.getByTestId(getAccountFutureTripDeleteTestId(0))).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(testIds.account.tabHistory));
    expect(screen.getByTestId(getAccountHistoryEntryTestId(0))).toHaveTextContent("도쿄");

    fireEvent.click(screen.getByTestId(testIds.account.tabSaved));
    expect(screen.getByTestId(getSavedSnapshotTestId(0))).toHaveTextContent("리스본");
  });

  it("promotes a saved snapshot into the planned list without forcing a tab change", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        snapshot: {
          id: "saved-1",
          createdAt: "2026-03-03T00:00:00.000Z",
          payload: buildSavedSnapshotPayload("planned"),
        },
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(
      <AccountExperience
        userName="테스트 사용자"
        initialTab="saved"
        initialProfile={profile}
        initialHistory={[historyEntry]}
        initialSavedSnapshots={[
          {
            id: "saved-1",
            createdAt: "2026-03-03T00:00:00.000Z",
            payload: buildSavedSnapshotPayload("saved"),
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByTestId(getSavedSnapshotPlanTestId(0)));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/me/snapshots/saved-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "planned" }),
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId(getSavedSnapshotTestId(0))).not.toBeInTheDocument();
    });

    expect(screen.getByText("아직 저장한 추천이 없습니다")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(testIds.account.tabFutureTrips));
    expect(screen.getByTestId(getAccountFutureTripEntryTestId(0))).toBeInTheDocument();
  });

  it("deletes a planned snapshot from the future trips tab after confirmation", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    renderAccountExperience();

    fireEvent.click(screen.getByTestId(getAccountFutureTripDeleteTestId(0)));
    expect(screen.getByTestId(getSavedSnapshotDeleteDialogTestId(0))).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(getSavedSnapshotDeleteConfirmTestId(0)));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/me/snapshots/saved-2", {
        method: "DELETE",
        credentials: "include",
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId(getAccountFutureTripEntryTestId(0))).not.toBeInTheDocument();
    });
  });

  it("deletes a saved snapshot after confirmation", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(
      <AccountExperience
        userName="테스트 사용자"
        initialTab="saved"
        initialProfile={profile}
        initialHistory={[historyEntry]}
        initialSavedSnapshots={[
          {
            id: "saved-1",
            createdAt: "2026-03-03T00:00:00.000Z",
            payload: buildSavedSnapshotPayload("saved"),
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByTestId(getSavedSnapshotDeleteTestId(0)));
    expect(screen.getByTestId(getSavedSnapshotDeleteDialogTestId(0))).toBeInTheDocument();
    expect(screen.getByTestId(getSavedSnapshotDeleteCancelTestId(0))).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(getSavedSnapshotDeleteConfirmTestId(0)));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/me/snapshots/saved-1", {
        method: "DELETE",
        credentials: "include",
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId(getSavedSnapshotTestId(0))).not.toBeInTheDocument();
    });
  });
});
