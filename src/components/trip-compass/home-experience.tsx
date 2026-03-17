"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";
import type { ComparisonSnapshot, RecommendationQuery } from "@/lib/domain/contracts";
import {
  buildQueryNarrative,
  buildRecommendationSearchParams,
  buildSnapshotPath,
  createRecommendationCards,
  defaultRecommendationQuery,
  departureAirportOptions,
  flightToleranceOptions,
  formatDepartureAirport,
  formatEvidenceMode,
  formatFlightTolerance,
  formatTravelMonth,
  formatVibeList,
  getPartySizeForType,
  optionalVibeOptions,
  paceOptions,
  partyOptions,
  primaryVibeOptions,
  tripLengthOptions,
  budgetOptions,
  travelMonthOptions,
  type RecommendationApiResponse,
  type RecommendationCardView,
} from "@/lib/trip-compass/presentation";
import {
  getRelaxFilterActionTestId,
  getSaveSnapshotTestId,
  getSavedSnapshotTestId,
  testIds,
} from "@/lib/test-ids";

import { ExperienceShell } from "./experience-shell";
import { RecommendationCard } from "./recommendation-card";

type SaveState = {
  status: "idle" | "saving" | "saved" | "error";
  snapshotId?: string;
  shareUrl?: string;
};

type SavedSnapshotCard = {
  snapshotId: string;
  destinationId: string;
  destinationName: string;
  sharePath: string;
  shareUrl: string;
};

type FlowStepProps<TValue extends string | number> = {
  step: string;
  title: string;
  caption: string;
  options: Array<{
    value: TValue;
    label: string;
    description: string;
    testId?: string;
  }>;
  activeValue: TValue;
  onSelect: (value: TValue) => void;
};

type ChoiceButtonProps = {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  testId?: string;
};

type SavedSnapshotCardProps = {
  snapshot: SavedSnapshotCard;
  index: number;
  selected: boolean;
  onToggle: (snapshotId: string) => void;
  onCopy: (shareUrl: string) => void;
};

type RelaxationAction = {
  id: "trip-length" | "flight-tolerance" | "departure-airport" | "secondary-vibe" | "travel-month";
  label: string;
  description: string;
  nextQuery: RecommendationQuery;
};

const tripLengthRelaxationOrder = [3, 5, 8] as const;
const flightToleranceRelaxationOrder = ["short", "medium", "long"] as const;
const travelMonthRelaxationOrder = [7, 10, 12] as const;

/**
 * Finds the next broader option in a predefined query sequence.
 * @param currentValue Currently selected value
 * @param options Ordered progression from strict to broad
 * @returns Next broader value or null when already at the broadest option
 */
function getNextRelaxedOption<TValue extends string | number>(
  currentValue: TValue,
  options: readonly TValue[],
): TValue | null {
  const currentIndex = options.indexOf(currentValue);

  if (currentIndex === -1 || currentIndex === options.length - 1) {
    return null;
  }

  return options[currentIndex + 1] ?? null;
}

/**
 * Builds actionable empty-state refinements from the current query.
 * @param query Active recommendation query
 * @returns Up to three one-tap relaxation actions
 */
function buildRelaxationActions(query: RecommendationQuery): RelaxationAction[] {
  const actions: RelaxationAction[] = [];

  const nextTripLength = getNextRelaxedOption(query.tripLengthDays, tripLengthRelaxationOrder);
  if (nextTripLength) {
    actions.push({
      id: "trip-length",
      label: `일정을 ${nextTripLength}일로 넓히기`,
      description: "짧은 일정 제약을 줄여 더 많은 목적지를 다시 찾아봐요.",
      nextQuery: { ...query, tripLengthDays: nextTripLength },
    });
  }

  const nextFlightTolerance = getNextRelaxedOption(
    query.flightTolerance,
    flightToleranceRelaxationOrder,
  );
  if (nextFlightTolerance) {
    actions.push({
      id: "flight-tolerance",
      label: `비행 범위를 ${formatFlightTolerance(nextFlightTolerance)}로 넓히기`,
      description: "거리 제한을 조금 풀어 더 넓은 후보군을 바로 다시 불러와요.",
      nextQuery: { ...query, flightTolerance: nextFlightTolerance },
    });
  }

  if (query.departureAirport !== "ICN") {
    actions.push({
      id: "departure-airport",
      label: "출발 공항을 인천(ICN)으로 바꾸기",
      description: "노선 선택지가 가장 넓은 출발지로 바로 다시 탐색해 봐요.",
      nextQuery: { ...query, departureAirport: "ICN" },
    });
  }

  if (query.vibes.length > 1) {
    actions.push({
      id: "secondary-vibe",
      label: "보조 분위기 조건 빼기",
      description: "대표 분위기만 남겨 목적지 후보를 덜 촘촘하게 걸러봐요.",
      nextQuery: { ...query, vibes: [query.vibes[0]] },
    });
  }

  const nextTravelMonth =
    getNextRelaxedOption(query.travelMonth, travelMonthRelaxationOrder) ??
    travelMonthRelaxationOrder.find((month) => month !== query.travelMonth) ??
    null;

  if (nextTravelMonth) {
    actions.push({
      id: "travel-month",
      label: `출발 월을 ${formatTravelMonth(nextTravelMonth)}로 바꾸기`,
      description: "다른 대표 시즌으로 바꿔 지금 조건에 맞는 목적지를 다시 확인해 봐요.",
      nextQuery: { ...query, travelMonth: nextTravelMonth },
    });
  }

  return actions.filter((action, index, source) => source.findIndex((item) => item.id === action.id) === index).slice(0, 3);
}

/**
 * Renders a labeled group of guided query choices.
 * @param props Step content and selection controls
 * @returns Guided step panel
 */
function FlowStep<TValue extends string | number>({
  step,
  title,
  caption,
  options,
  activeValue,
  onSelect,
}: FlowStepProps<TValue>) {
  return (
    <section className="space-y-3 rounded-[calc(var(--radius-card)-8px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-sand)]">
            {step}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--color-paper)]">{title}</h3>
        </div>
        <p className="max-w-52 text-right text-xs leading-5 text-[var(--color-muted)]">{caption}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {options.map((option) => (
          <ChoiceButton
            key={`${step}-${String(option.value)}`}
            active={option.value === activeValue}
            label={option.label}
            description={option.description}
            onClick={() => onSelect(option.value)}
            testId={option.testId}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Renders a single selectable query chip with descriptive copy.
 * @param props Choice state and click handler
 * @returns Interactive selection button
 */
function ChoiceButton({ label, description, active, onClick, testId }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-[calc(var(--radius-card)-10px)] border px-4 py-4 text-left transition ${
        active
          ? "border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] text-[var(--color-ink)]"
          : "border-[color:var(--color-frame)] bg-[color:var(--color-wash)] text-[var(--color-paper)] hover:border-[color:var(--color-frame-strong)]"
      }`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className={`mt-2 block text-xs leading-5 ${active ? "text-[var(--color-ink-soft)]" : "text-[var(--color-muted)]"}`}>
        {description}
      </span>
    </button>
  );
}

/**
 * Renders one saved snapshot chip inside the compare staging rail.
 * @param props Snapshot metadata and compare handlers
 * @returns Saved snapshot control card
 */
function SavedSnapshotRailCard({
  snapshot,
  index,
  selected,
  onToggle,
  onCopy,
}: SavedSnapshotCardProps) {
  return (
    <div
      data-testid={getSavedSnapshotTestId(index)}
      className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">저장한 카드</p>
          <p className="mt-2 text-base font-semibold text-[var(--color-paper)]">{snapshot.destinationName}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(snapshot.snapshotId)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            selected
              ? "border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] text-[var(--color-ink)]"
              : "border-[color:var(--color-frame)] text-[var(--color-paper)]"
          }`}
        >
          {selected ? "선택됨" : "선택"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={snapshot.sharePath}
          className="rounded-full border border-[color:var(--color-frame)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-paper)] transition hover:border-[color:var(--color-frame-strong)]"
        >
          공유 페이지 보기
        </Link>
        <button
          type="button"
          onClick={() => onCopy(snapshot.shareUrl)}
          className="rounded-full border border-[color:var(--color-frame)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--color-paper)] transition hover:border-[color:var(--color-frame-strong)]"
        >
          링크 복사
        </button>
      </div>
    </div>
  );
}

/**
 * Builds the single-destination recommendation snapshot payload.
 * @param query Typed recommendation query that produced the visible results
 * @param card Recommendation card being saved
 * @param scoringVersionId Active scoring version id from the API
 * @returns Recommendation snapshot payload
 */
function buildRecommendationSnapshotPayload(
  query: RecommendationQuery,
  card: RecommendationCardView,
  scoringVersionId: string,
) {
  return {
    kind: "recommendation" as const,
    payload: {
      v: 1 as const,
      kind: "recommendation" as const,
      query,
      destinationIds: [card.destination.id],
      results: [card.recommendation],
      scoringVersionId,
      trendSnapshotIds: card.recommendation.trendEvidence.map((item) => item.id),
    },
  };
}

/**
 * Builds the comparison snapshot payload from selected saved picks.
 * @param savedSnapshots Saved recommendation snapshots selected for compare
 * @returns Comparison snapshot payload
 */
function buildComparisonSnapshotPayload(
  savedSnapshots: SavedSnapshotCard[],
): { kind: "comparison"; payload: ComparisonSnapshot } {
  return {
    kind: "comparison",
    payload: {
      v: 1,
      kind: "comparison",
      snapshotIds: savedSnapshots.map((snapshot) => snapshot.snapshotId),
      destinationIds: savedSnapshots.map((snapshot) => snapshot.destinationId),
    },
  };
}

/**
 * Creates an absolute share URL from a relative snapshot path.
 * @param sharePath Relative app path
 * @returns Absolute share URL
 */
function buildAbsoluteShareUrl(sharePath: string): string {
  return `${window.location.origin}${sharePath}`;
}

/**
 * Home page client experience for the anonymous-first recommendation flow.
 * @returns Interactive Trip Compass home page
 */
export function HomeExperience() {
  const router = useRouter();
  const sessionState = authClient.useSession();
  const [query, setQuery] = useState<RecommendationQuery>(defaultRecommendationQuery);
  const [results, setResults] = useState<RecommendationApiResponse | null>(null);
  const [cards, setCards] = useState<RecommendationCardView[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshotCard[]>([]);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const queryNarrative = useMemo(() => buildQueryNarrative(query), [query]);
  const viewer = sessionState.data?.user ?? null;
  const isSessionPending = sessionState.isPending;
  const visibleCards = showAllResults ? cards : cards.slice(0, 3);
  const canCreateCompare = selectedCompareIds.length >= 2 && selectedCompareIds.length <= 4;
  const emptyStateActions = useMemo(() => buildRelaxationActions(query), [query]);
  const compareTrayDestinations = useMemo(() => {
    const selectedSnapshots = savedSnapshots.filter((snapshot) =>
      selectedCompareIds.includes(snapshot.snapshotId),
    );
    const previewSource = selectedSnapshots.length > 0 ? selectedSnapshots : savedSnapshots;

    return previewSource
      .slice(0, 2)
      .map((snapshot) => snapshot.destinationName)
      .join(" · ");
  }, [savedSnapshots, selectedCompareIds]);
  const compareButtonLabel = compareLoading
    ? "비교 보드 저장 중..."
    : canCreateCompare
      ? `${selectedCompareIds.length}곳 비교 보드 만들기`
      : "2개부터 선택하면 비교돼요";

  /**
   * Applies a typed query patch while preserving derived party size.
   * @param patch Partial query update
   */
  function updateQuery(patch: Partial<RecommendationQuery>) {
    setQuery((currentQuery) => {
      const nextQuery = { ...currentQuery, ...patch };

      if (patch.partyType) {
        nextQuery.partySize = getPartySizeForType(patch.partyType);
      }

      return nextQuery;
    });
  }

  /**
   * Replaces the primary vibe in the typed query.
   * @param vibe Selected primary vibe
   */
  function selectPrimaryVibe(vibe: RecommendationQuery["vibes"][number]) {
    setQuery((currentQuery) => {
      const secondaryVibe = currentQuery.vibes[1];

      if (secondaryVibe && secondaryVibe !== vibe) {
        return { ...currentQuery, vibes: [vibe, secondaryVibe] };
      }

      return { ...currentQuery, vibes: [vibe] };
    });
  }

  /**
   * Toggles the optional secondary vibe without removing the primary choice.
   * @param vibe Optional vibe to add or remove
   */
  function toggleSecondaryVibe(vibe: RecommendationQuery["vibes"][number]) {
    setQuery((currentQuery) => {
      const [primaryVibe, secondaryVibe] = currentQuery.vibes;

      if (primaryVibe === vibe) {
        return currentQuery;
      }

      if (secondaryVibe === vibe) {
        return { ...currentQuery, vibes: [primaryVibe] };
      }

      return { ...currentQuery, vibes: [primaryVibe, vibe] };
    });
  }

  /**
   * Copies a share URL to the clipboard.
   * @param shareUrl Absolute share URL
   * @returns 성공 여부
   */
  async function copyShareUrl(shareUrl: string) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Saves one destination card as a recommendation snapshot.
   * @param card Recommendation card to save
   */
  async function saveCard(card: RecommendationCardView) {
    if (!results) {
      return;
    }

    const existingSnapshot = savedSnapshots.find(
      (savedSnapshot) => savedSnapshot.destinationId === card.destination.id,
    );

    if (existingSnapshot) {
      setSaveStates((currentState) => ({
        ...currentState,
        [card.destination.id]: {
          status: "saved",
          snapshotId: existingSnapshot.snapshotId,
          shareUrl: existingSnapshot.shareUrl,
        },
      }));
      return;
    }

    setSaveStates((currentState) => ({
      ...currentState,
      [card.destination.id]: { status: "saving" },
    }));

    try {
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(
          buildRecommendationSnapshotPayload(results.query, card, results.meta.scoringVersion),
        ),
      });

      if (!response.ok) {
        throw new Error("save-failed");
      }

      const payload = (await response.json()) as { snapshotId: string };
      const sharePath = buildSnapshotPath(payload.snapshotId, "recommendation");
      const shareUrl = buildAbsoluteShareUrl(sharePath);
      const savedSnapshot: SavedSnapshotCard = {
        snapshotId: payload.snapshotId,
        destinationId: card.destination.id,
        destinationName: card.destination.nameKo,
        sharePath,
        shareUrl,
      };

      setSaveStates((currentState) => ({
        ...currentState,
        [card.destination.id]: {
          status: "saved",
          snapshotId: payload.snapshotId,
          shareUrl,
        },
      }));
      setSavedSnapshots((currentSnapshots) => [...currentSnapshots, savedSnapshot]);
      setSelectedCompareIds((currentSelection) =>
        currentSelection.length >= 4 ? currentSelection : [...currentSelection, payload.snapshotId],
      );
      await copyShareUrl(shareUrl);
    } catch {
      setSaveStates((currentState) => ({
        ...currentState,
        [card.destination.id]: { status: "error" },
      }));
    }
  }

  /**
   * Selects or deselects a saved snapshot for comparison.
   * @param snapshotId Saved recommendation snapshot id
   */
  function toggleCompareSelection(snapshotId: string) {
    setCompareError(null);
    setSelectedCompareIds((currentSelection) => {
      if (currentSelection.includes(snapshotId)) {
        return currentSelection.filter((id) => id !== snapshotId);
      }

      if (currentSelection.length >= 4) {
        setCompareError("비교는 저장한 카드 2개부터 4개까지 가능해요.");
        return currentSelection;
      }

      return [...currentSelection, snapshotId];
    });
  }

  /**
   * Creates a saved comparison snapshot and navigates to the compare page.
   */
  async function createCompareSnapshot() {
    const selectedSnapshots = savedSnapshots.filter((snapshot) =>
      selectedCompareIds.includes(snapshot.snapshotId),
    );

    if (selectedSnapshots.length < 2 || selectedSnapshots.length > 4) {
      setCompareError("비교하려면 저장한 카드 2개부터 4개까지 선택해 주세요.");
      return;
    }

    setCompareLoading(true);
    setCompareError(null);

    try {
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildComparisonSnapshotPayload(selectedSnapshots)),
      });

      if (!response.ok) {
        throw new Error("compare-create-failed");
      }

      const payload = (await response.json()) as { snapshotId: string };
      router.push(buildSnapshotPath(payload.snapshotId, "comparison"));
    } catch {
      setCompareError("비교 보드를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setCompareLoading(false);
    }
  }

  /**
   * Requests recommendations for a specific query state.
   * @param nextQuery Query state to submit
   */
  async function requestRecommendations(nextQuery: RecommendationQuery) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const searchParams = buildRecommendationSearchParams(nextQuery);
      const response = await fetch(`/api/recommendations?${searchParams.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("recommendation-failed");
      }

      const payload = (await response.json()) as RecommendationApiResponse;
      setResults(payload);
      setCards(createRecommendationCards(payload.recommendations));
      setShowAllResults(false);
    } catch {
      setResults(null);
      setCards([]);
      setSubmitError("지금은 추천 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Applies a one-tap empty-state refinement and refreshes results.
   * @param nextQuery Relaxed query state to submit
   */
  async function applyRelaxation(nextQuery: RecommendationQuery) {
    setQuery(nextQuery);
    await requestRecommendations(nextQuery);
  }

  /**
   * Submits the active query state to the recommendation API.
   */
  async function submitRecommendation() {
    await requestRecommendations(query);
  }

  return (
    <ExperienceShell
      eyebrow="Trip Compass"
      title="한국에서 떠나는 해외여행, 취향에 맞는 목적지를 빠르게 골라보세요."
      intro="여행 조건을 한 번만 정하면 Trip Compass가 목적지를 추립니다. 인스타그램 감도는 분위기를 확인하는 보조 근거로만 쓰고, 순위는 설명 가능한 추천 로직이 결정해요."
      capsule="추천이 먼저, 분위기 근거는 그다음. 로그인 없이 바로 쓸 수 있어요."
      headerAside={
        <article
          data-testid={testIds.shell.identityCard}
          className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] px-4 py-4 text-[var(--color-paper)]"
        >
          {isSessionPending ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                Travel Profile
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                저장된 여행 기록을 확인하고 있어요.
              </p>
            </>
          ) : viewer ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                기억이 연결된 추천
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--color-paper)]">
                {viewer.name}님의 여행 프로필
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                선호와 방문 이력을 관리하면 다음 추천에 바로 반영돼요.
              </p>
              <Link
                data-testid={testIds.shell.accountLink}
                href="/account"
                className="mt-4 inline-flex rounded-full border border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:-translate-y-0.5"
              >
                여행 프로필 열기
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                Optional Memory
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--color-paper)]">
                마음에 든 여행을 남겨 다음 추천까지 이어보세요.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                익명 추천은 그대로 두고, 로그인하면 취향과 여행 이력만 가볍게 덧붙일 수 있어요.
              </p>
              <Link
                data-testid={testIds.shell.authCta}
                href="/auth"
                className="mt-4 inline-flex rounded-full border border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:-translate-y-0.5"
              >
                로그인 · 회원가입
              </Link>
            </>
          )}
        </article>
      }
    >
      <>
        <div
          className={`grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(22rem,1.08fr)] ${savedSnapshots.length > 0 ? "pb-32 md:pb-0" : ""}`}
        >
          <section className="space-y-6">
            <article className="compass-panel rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
                    현재 여행 조건
                  </p>
                  <h2 className="font-display text-4xl leading-none tracking-[-0.05em] text-[var(--color-paper)] sm:text-5xl">
                    빠르게 끝나는 맞춤 추천 흐름
                  </h2>
                  <p
                    data-testid={testIds.result.querySummary}
                    className="max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base"
                  >
                    {queryNarrative}
                  </p>
                </div>

                <div className="instagram-card rounded-[calc(var(--radius-card)-6px)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-paper)]">
                    조건 미리보기
                  </p>
                  <p className="font-display mt-10 text-4xl leading-none tracking-[-0.05em] text-[var(--color-paper)]">
                    {formatTravelMonth(query.travelMonth)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-paper)]">
                    {formatDepartureAirport(query.departureAirport)} 출발 · {query.tripLengthDays}일 일정 · {formatVibeList(query.vibes)}
                  </p>
                </div>
              </div>
            </article>

            <article className="compass-panel rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7">
              <div className="flex flex-col gap-4 border-b border-[color:var(--color-frame)] pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
                    추천 흐름
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--color-paper)]">
                    5단계로 여행 방향을 정해보세요.
                  </h2>
                </div>
                <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
                  아래 선택은 모두 하나의 추천 조건으로 쌓여요. 기본 흐름을 정한 뒤에는 출발 공항, 일정 밀도, 비행 거리 허용 범위, 보조 분위기까지 같은 화면에서 바로 다듬을 수 있어요.
                </p>
              </div>

            <div className="mt-5 space-y-4">
              <FlowStep
                step="1단계"
                title="누가 함께 가나요?"
                caption="동행 유형에 따라 인원수와 목적지 적합도 기준이 함께 바뀌어요."
                options={partyOptions}
                activeValue={query.partyType}
                onSelect={(value) => updateQuery({ partyType: value })}
              />
              <FlowStep
                step="2단계"
                title="예산 감각은 어느 쪽인가요?"
                caption="예산 기준을 분명히 두어야 추천 이유도 더 명확해져요."
                options={budgetOptions}
                activeValue={query.budgetBand}
                onSelect={(value) => updateQuery({ budgetBand: value })}
              />
              <FlowStep
                step="3단계"
                title="여행 기간은 얼마나 되나요?"
                caption="여행 일수에 따라 장거리 가능 여부와 추천 점수가 달라져요."
                options={tripLengthOptions}
                activeValue={query.tripLengthDays}
                onSelect={(value) => updateQuery({ tripLengthDays: value })}
              />
              <FlowStep
                step="4단계"
                title="언제 떠날 예정인가요?"
                caption="여행 월은 계절 적합도를 가르는 핵심 조건이에요."
                options={travelMonthOptions}
                activeValue={query.travelMonth}
                onSelect={(value) => updateQuery({ travelMonth: value })}
              />
              <FlowStep
                step="5단계"
                title="가장 중요한 분위기는 무엇인가요?"
                caption="대표 분위기를 먼저 고르고, 필요하면 아래에서 한 가지를 더 얹을 수 있어요."
                options={primaryVibeOptions}
                activeValue={query.vibes[0]}
                onSelect={selectPrimaryVibe}
              />

              <section className="grid gap-4 rounded-[calc(var(--radius-card)-8px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4 sm:p-5 lg:grid-cols-3">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                    출발 공항
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {departureAirportOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        data-testid={option.testId}
                        onClick={() => updateQuery({ departureAirport: option.value })}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                          query.departureAirport === option.value
                            ? "border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] text-[var(--color-ink)]"
                            : "border-[color:var(--color-frame)] text-[var(--color-paper)]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                    일정 밀도
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {paceOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        data-testid={option.testId}
                        onClick={() => updateQuery({ pace: option.value })}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                          query.pace === option.value
                            ? "border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] text-[var(--color-ink)]"
                            : "border-[color:var(--color-frame)] text-[var(--color-paper)]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                    비행 거리 허용 범위
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {flightToleranceOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        data-testid={option.testId}
                        onClick={() => updateQuery({ flightTolerance: option.value })}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                          query.flightTolerance === option.value
                            ? "border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] text-[var(--color-ink)]"
                            : "border-[color:var(--color-frame)] text-[var(--color-paper)]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 lg:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                    보조 분위기
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {optionalVibeOptions.map((option) => {
                      const active = query.vibes[1] === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleSecondaryVibe(option.value)}
                          className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                            active
                              ? "border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] text-[var(--color-ink)]"
                              : "border-[color:var(--color-frame)] text-[var(--color-paper)]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  data-testid={testIds.query.submitRecommendation}
                  onClick={submitRecommendation}
                  disabled={isSubmitting}
                  className="rounded-full border border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-ink)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "추천 목적지를 찾는 중..." : "추천 받기"}
                </button>
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  로그인 없이 바로 이용할 수 있어요. 계정도, 로그인도, 저장된 프로필도 필요 없어요.
                </p>
              </div>
            </div>
            </article>
          </section>

        <section className="space-y-6">
          {savedSnapshots.length > 0 ? (
            <article
              id="saved-snapshots-section"
              className="compass-panel rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7 xl:sticky xl:top-6"
            >
              <div className="flex flex-col gap-4 border-b border-[color:var(--color-frame)] pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
                    저장한 카드
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--color-paper)]">
                    공유하거나, 바로 비교 후보로 모아보세요.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                    저장한 순간부터 비교 준비가 돼요. 모바일에서는 고정 트레이에서 바로 비교 보드를 만들 수 있어요.
                  </p>
                </div>

                <div
                  data-testid={testIds.snapshot.compareSelectionCount}
                  className="rounded-full border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] px-4 py-2 text-sm text-[var(--color-paper)]"
                >
                  선택 {selectedCompareIds.length}개 · 최대 4개
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                {savedSnapshots.map((snapshot, index) => (
                  <SavedSnapshotRailCard
                    key={snapshot.snapshotId}
                    index={index}
                    snapshot={snapshot}
                    selected={selectedCompareIds.includes(snapshot.snapshotId)}
                    onToggle={toggleCompareSelection}
                    onCopy={(shareUrl) => {
                      void copyShareUrl(shareUrl);
                    }}
                  />
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  먼저 마음에 드는 목적지 카드를 저장해 주세요. 저장한 카드 2개부터 4개까지 한 번에 비교할 수 있어요.
                </p>
                <button
                  type="button"
                  data-testid={testIds.snapshot.compareSnapshot}
                  onClick={createCompareSnapshot}
                  disabled={!canCreateCompare || compareLoading}
                  className="rounded-full border border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {compareButtonLabel}
                </button>
              </div>

              {compareError ? (
                <p className="mt-3 text-sm text-[var(--color-accent-soft)]">{compareError}</p>
              ) : null}
            </article>
          ) : null}

          <article className="compass-panel rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7">
            <div className="flex flex-col gap-4 border-b border-[color:var(--color-frame)] pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
                  추천 결과
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--color-paper)]">
                  한눈에 보는 목적지 카드
                </h2>
              </div>

              {results ? (
                <div className="rounded-full border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] px-4 py-2 text-sm text-[var(--color-paper)]">
                  추천 {results.meta.resultCount}곳 · {formatEvidenceMode(results.sourceSummary.mode)} 근거 모드
                </div>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              {submitError ? (
                <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-5 text-sm leading-7 text-[var(--color-paper)]">
                  {submitError}
                </div>
              ) : null}

              {!results && !submitError ? (
                <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-5 text-sm leading-7 text-[var(--color-muted)]">
                  여행 조건을 제출하면 우선 상위 추천지를 불러와요. 처음에는 상위 3개만 보여주고, 필요하면 전체 카드를 더 펼쳐볼 수 있어요.
                </div>
              ) : null}

              {results && cards.length === 0 ? (
                <div
                  data-testid={testIds.result.emptyState}
                  className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-5"
                >
                  <p className="text-lg font-semibold text-[var(--color-paper)]">
                    지금 조건에 딱 맞는 목적지가 없어요.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    현재 조건이 꽤 엄격해서 추천이 걸러졌어요. 아래 항목 중 하나를 완화해 다시 추천받아 보세요.
                  </p>
                  <div
                    data-testid={testIds.result.relaxableFilters}
                    className="mt-4 grid gap-3 sm:grid-cols-2"
                  >
                    {emptyStateActions.map((action, index) => (
                      <button
                        key={action.id}
                        type="button"
                        data-testid={getRelaxFilterActionTestId(index)}
                        onClick={() => {
                          void applyRelaxation(action.nextQuery);
                        }}
                        disabled={isSubmitting}
                        className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--color-frame-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-sand)]">
                          바로 완화하기
                        </span>
                        <span className="mt-3 block text-sm font-semibold text-[var(--color-paper)]">
                          {action.label}
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-[var(--color-muted)]">
                          {action.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {results?.meta.personalized ? (
                <div
                  data-testid={testIds.shell.personalizedNote}
                  className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame-strong)] bg-[color:rgb(240_220_185_/_0.12)] px-4 py-4 text-sm leading-6 text-[var(--color-paper)]"
                >
                  개인화 안내 · 지금 추천에는 로그인한 여행 기록과 선호가 함께 반영되고 있어요.
                </div>
              ) : null}

              {visibleCards.map((card, index) => {
                const saveState = saveStates[card.destination.id] ?? { status: "idle" as const };

                return (
                  <RecommendationCard
                    key={card.destination.id}
                    card={card}
                    index={index}
                    query={results?.query}
                    actionSlot={
                      <>
                        <button
                          type="button"
                          data-testid={getSaveSnapshotTestId(index)}
                          onClick={() => {
                            void saveCard(card);
                          }}
                          disabled={saveState.status === "saving"}
                          className="rounded-full border border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saveState.status === "saving"
                            ? "저장 중..."
                            : saveState.status === "saved"
                              ? "저장 완료"
                              : "이 카드 저장"}
                        </button>
                        {saveState.shareUrl ? (
                          <>
                            <Link
                              data-testid={testIds.snapshot.shareLink}
                              href={buildSnapshotPath(saveState.snapshotId ?? "", "recommendation")}
                              className="rounded-full border border-[color:var(--color-frame)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-paper)] transition hover:border-[color:var(--color-frame-strong)]"
                            >
                              공유 페이지 보기
                            </Link>
                            <button
                              type="button"
                              data-testid={testIds.snapshot.copyShareLink}
                              onClick={() => {
                                if (saveState.shareUrl) {
                                  void copyShareUrl(saveState.shareUrl);
                                }
                              }}
                              className="rounded-full border border-[color:var(--color-frame)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-paper)] transition hover:border-[color:var(--color-frame-strong)]"
                            >
                              링크 복사
                            </button>
                          </>
                        ) : null}
                        {saveState.status === "error" ? (
                          <span className="text-sm text-[var(--color-accent-soft)]">
                            저장에 실패했어요. 다시 시도해 주세요.
                          </span>
                        ) : null}
                      </>
                    }
                  />
                );
              })}

              {cards.length > 3 ? (
                <button
                  type="button"
                  data-testid={testIds.result.showMoreResults}
                  onClick={() => setShowAllResults((currentValue) => !currentValue)}
                  className="w-full rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-paper)] transition hover:border-[color:var(--color-frame-strong)]"
                >
                  {showAllResults ? "상위 3개만 다시 보기" : `목적지 카드 ${cards.length - 3}개 더 보기`}
                </button>
              ) : null}
            </div>
          </article>
        </section>
        </div>

        {savedSnapshots.length > 0 ? (
          <div className="pointer-events-none fixed inset-x-4 bottom-4 z-30 md:hidden">
            <article
              data-testid={testIds.snapshot.stickyCompareTray}
              className="compass-panel pointer-events-auto rounded-[calc(var(--radius-card)-6px)] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                    비교 트레이
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-paper)]">
                    {compareTrayDestinations || `${savedSnapshots.length}개 저장 카드`}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                    저장 {savedSnapshots.length}개 · 선택 {selectedCompareIds.length}개
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("saved-snapshots-section")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className="rounded-full border border-[color:var(--color-frame)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-paper)]"
                >
                  카드 보기
                </button>
              </div>

              <button
                type="button"
                data-testid={testIds.snapshot.stickyCompareAction}
                onClick={createCompareSnapshot}
                disabled={!canCreateCompare || compareLoading}
                className="mt-4 w-full rounded-full border border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)] transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {compareButtonLabel}
              </button>

              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                저장한 카드에서 2개부터 4개까지 고르면 바로 비교 보드를 만들 수 있어요.
              </p>
            </article>
          </div>
        ) : null}
      </>
    </ExperienceShell>
  );
}
