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
  budgetOptions,
  createRecommendationCards,
  defaultRecommendationQuery,
  departureAirportOptions,
  flightToleranceOptions,
  formatBudgetBand,
  formatEvidenceMode,
  formatFlightTolerance,
  formatPartyType,
  formatTravelMonth,
  getPartySizeForType,
  optionalVibeOptions,
  paceOptions,
  partyOptions,
  primaryVibeOptions,
  tripLengthOptions,
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

type IntentPreset = {
  id: string;
  label: string;
  description: string;
  patch: Partial<RecommendationQuery>;
  testId: string;
};

type IntentChipProps = {
  preset: IntentPreset;
  active: boolean;
  onSelect: (preset: IntentPreset) => void;
};

type DiscoveryCueProps = {
  title: string;
  detail: string;
};

const tripLengthRelaxationOrder = [3, 5, 8] as const;
const flightToleranceRelaxationOrder = ["short", "medium", "long"] as const;
const travelMonthRelaxationOrder = [7, 10, 12] as const;
const quickIntentPresets: IntentPreset[] = [
  {
    id: "first-europe",
    label: "첫 유럽 여행",
    description: "여유 일정과 긴 비행도 감수하고, 도시 감도를 먼저 보고 싶어요.",
    patch: {
      partyType: "couple",
      budgetBand: "premium",
      tripLengthDays: 8,
      departureAirport: "ICN",
      travelMonth: 10,
      pace: "balanced",
      flightTolerance: "long",
      vibes: ["city", "culture"],
    },
    testId: testIds.query.intentFirstEurope,
  },
  {
    id: "short-flight-city",
    label: "비행 짧은 도시 여행",
    description: "비행 피로는 줄이고, 걷고 먹고 구경하는 밀도는 놓치고 싶지 않아요.",
    patch: {
      partyType: "friends",
      budgetBand: "mid",
      tripLengthDays: 5,
      departureAirport: "GMP",
      travelMonth: 10,
      pace: "packed",
      flightTolerance: "short",
      vibes: ["city", "food"],
    },
    testId: testIds.query.intentShortFlightCity,
  },
  {
    id: "couple-night-view",
    label: "커플 5일 야경 여행",
    description: "야경, 산책, 식사 분위기가 자연스럽게 이어지는 목적지를 찾고 있어요.",
    patch: {
      partyType: "couple",
      budgetBand: "mid",
      tripLengthDays: 5,
      departureAirport: "ICN",
      travelMonth: 12,
      pace: "balanced",
      flightTolerance: "medium",
      vibes: ["romance", "food"],
    },
    testId: testIds.query.intentCoupleNightView,
  },
  {
    id: "family-reset",
    label: "가족과 느긋한 휴양",
    description: "이동 부담은 줄이고, 쉬는 시간과 자연 풍경을 넉넉하게 담고 싶어요.",
    patch: {
      partyType: "family",
      budgetBand: "mid",
      tripLengthDays: 5,
      departureAirport: "ICN",
      travelMonth: 7,
      pace: "slow",
      flightTolerance: "medium",
      vibes: ["beach", "nature"],
    },
    testId: testIds.query.intentFamilyReset,
  },
];

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

  return actions
    .filter((action, index, source) => source.findIndex((item) => item.id === action.id) === index)
    .slice(0, 3);
}

/**
 * Checks whether the active query matches a quick-start intent preset.
 * @param query Active recommendation query
 * @param patch Preset query subset
 * @returns True when every preset field matches the current query
 */
function matchesIntentPreset(query: RecommendationQuery, patch: Partial<RecommendationQuery>): boolean {
  return Object.entries(patch).every(([key, value]) => {
    const queryValue = query[key as keyof RecommendationQuery];

    if (Array.isArray(value) && Array.isArray(queryValue)) {
      return value.length === queryValue.length && value.every((item, index) => item === queryValue[index]);
    }

    return queryValue === value;
  });
}

/**
 * Renders one editorial quick-start intent chip.
 * @param props Preset content and selection handler
 * @returns One-tap query starter
 */
function IntentChip({ preset, active, onSelect }: IntentChipProps) {
  return (
    <button
      type="button"
      data-testid={preset.testId}
      aria-pressed={active}
      onClick={() => onSelect(preset)}
      className={`rounded-[calc(var(--radius-card)-10px)] border px-4 py-4 text-left transition ${
        active
          ? "compass-selected shadow-[0_14px_32px_rgb(177_141_70_/_0.16)]"
          : "border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-elevated)] text-[var(--color-ink)] hover:-translate-y-0.5 hover:border-[color:var(--color-sand)]"
      }`}
    >
      <span className="block text-base font-semibold">{preset.label}</span>
      <span className="mt-2 block text-sm leading-6 text-[var(--color-ink-soft)]">
        {preset.description}
      </span>
    </button>
  );
}

const discoveryCues: DiscoveryCueProps[] = [
  {
    title: "추천 이유를 먼저 보여줘요",
    detail: "결과 화면에서는 상위 3곳과 함께 왜 맞는지, 시즌과 비행 부담이 어떤지부터 바로 확인할 수 있어요.",
  },
  {
    title: "저장하면 바로 비교 준비가 돼요",
    detail: "마음에 드는 카드를 저장하면 모바일 비교 트레이에 쌓여서 2곳부터 바로 비교 보드를 만들 수 있어요.",
  },
  {
    title: "로그인 없이 바로 시작돼요",
    detail: "계정이 없어도 추천과 저장 흐름은 그대로 열려 있고, 로그인은 여행 기억을 이어 붙이는 선택 기능이에요.",
  },
];

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
    <section className="compass-sheet space-y-3 rounded-[calc(var(--radius-card)-8px)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-sand-deep)]">{step}</p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
        </div>
        <p className="max-w-52 text-right text-xs leading-5 text-[var(--color-ink-soft)]">
          {caption}
        </p>
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
          ? "compass-selected shadow-[0_12px_30px_rgb(177_141_70_/_0.14)]"
          : "border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-elevated)] text-[var(--color-ink)] hover:border-[color:var(--color-sand)] hover:-translate-y-0.5"
      }`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="mt-2 block text-xs leading-5 text-[var(--color-ink-soft)]">
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
      className="compass-sheet rounded-[calc(var(--radius-card)-10px)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-sand-deep)]">저장한 카드</p>
          <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{snapshot.destinationName}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(snapshot.snapshotId)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.04em] ${
            selected
              ? "compass-selected"
              : "border-[color:var(--color-frame-soft)] text-[var(--color-ink)]"
          }`}
        >
          {selected ? "선택됨" : "선택"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={snapshot.sharePath}
          className="compass-action-secondary rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em] transition hover:border-[color:var(--color-sand)]"
        >
          공유 페이지 보기
        </Link>
        <button
          type="button"
          onClick={() => onCopy(snapshot.shareUrl)}
          className="compass-action-secondary rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em] transition hover:border-[color:var(--color-sand)]"
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
 * @returns Interactive SooGo home page
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
  const activeIntentPresetId = useMemo(
    () => quickIntentPresets.find((preset) => matchesIntentPreset(query, preset.patch))?.id ?? null,
    [query],
  );
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
   * Scrolls the user to the guided recommendation-start section.
   */
  function scrollToRecommendationStart() {
    document.getElementById("recommendation-start-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  /**
   * Expands or collapses the secondary query controls.
   */
  function toggleAdvancedFiltersVisibility() {
    setShowAdvancedFilters((currentValue) => !currentValue);
  }

  /**
   * Applies one discovery-first intent preset to the active query.
   * @param preset Quick-start preset selected by the user
   */
  function applyIntentPreset(preset: IntentPreset) {
    updateQuery(preset.patch);
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
      eyebrow="추천 시작"
      title="어디로 갈지 아직 몰라도, 내 여행 조건으로 목적지를 먼저 추려드려요."
      intro="SooGo는 한국 출발 여행자를 위해 일정, 예산, 비행 부담, 분위기를 바탕으로 해외여행 후보를 빠르게 압축하는 발견형 추천 서비스예요. 검색보다 발견, 감성보다 신뢰, 저장 뒤 비교까지 한 흐름으로 이어집니다."
      capsule="조건 3~5개만 고르면 상위 3곳을 먼저 보여드리고, 저장한 카드로 바로 비교까지 이어져요."
      headerAside={
        <article
          data-testid={testIds.shell.identityCard}
          className="compass-trust-card rounded-[calc(var(--radius-card)-10px)] px-4 py-4"
        >
          {isSessionPending ? (
            <>
                <p className="text-sm font-semibold text-[var(--color-sand-deep)]">여행 기억 확인 중</p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  저장된 여행 기록을 확인하고 있어요.
                </p>
            </>
          ) : viewer ? (
            <>
                <p className="text-sm font-semibold text-[var(--color-sand-deep)]">기억이 연결된 추천</p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">
                  {viewer.name}님의 여행 프로필
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                  선호와 방문 이력을 관리하면 다음 추천에 바로 반영돼요.
                </p>
                <Link
                  data-testid={testIds.shell.accountLink}
                  href="/account"
                  className="compass-action-secondary mt-4 inline-flex rounded-full px-4 py-3 text-xs font-semibold tracking-[0.04em] transition hover:-translate-y-0.5"
                >
                  여행 프로필 열기
                </Link>
            </>
          ) : (
            <>
                <p className="text-sm font-semibold text-[var(--color-sand-deep)]">로그인은 선택</p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-ink)]">
                  마음에 든 여행을 남겨 다음 추천까지 이어보세요.
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                  익명 추천은 그대로 두고, 로그인하면 취향과 여행 이력만 가볍게 덧붙일 수 있어요.
                </p>
                <Link
                  data-testid={testIds.shell.authCta}
                  href="/auth"
                  className="compass-action-secondary mt-4 inline-flex rounded-full px-4 py-3 text-xs font-semibold tracking-[0.04em] transition hover:-translate-y-0.5"
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
            <article className="compass-desk rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-sand-deep)]">빠른 시작 의도</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--color-ink)] sm:text-4xl">
                      여행의 결부터 고르면, 목적지는 그다음에 좁혀져요.
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-ink-soft)] sm:text-base">
                      아직 도시를 정하지 못했어도 괜찮아요. 자주 나오는 여행 의도부터 한 번에 고른 뒤, 아래 조건 카드에서 바로 다듬어 추천을 시작할 수 있어요.
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        data-testid={testIds.shell.heroStartCta}
                        onClick={scrollToRecommendationStart}
                        className="compass-action-primary rounded-full px-5 py-3 text-sm font-semibold tracking-[0.04em] transition hover:-translate-y-0.5"
                      >
                        내 여행 조건으로 추천 받기
                      </button>
                      <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                        먼저 시작하고 싶다면 아래 빠른 의도 칩 하나만 골라도 돼요.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {quickIntentPresets.map((preset) => (
                      <IntentChip
                        key={preset.id}
                        preset={preset}
                        active={activeIntentPresetId === preset.id}
                        onSelect={applyIntentPreset}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="compass-sheet rounded-[calc(var(--radius-card)-6px)] px-4 py-5 sm:px-5">
                    <p className="text-sm font-semibold text-[var(--color-sand-deep)]">지금 고르는 기준</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="compass-surface-muted rounded-full px-3 py-1 text-xs font-semibold">
                        {formatPartyType(query.partyType)}
                      </span>
                      <span className="compass-surface-muted rounded-full px-3 py-1 text-xs font-semibold">
                        {query.tripLengthDays}일 일정
                      </span>
                      <span className="compass-surface-muted rounded-full px-3 py-1 text-xs font-semibold">
                        {formatTravelMonth(query.travelMonth)} 출발
                      </span>
                      <span className="compass-surface-muted rounded-full px-3 py-1 text-xs font-semibold">
                        {formatBudgetBand(query.budgetBand)}
                      </span>
                    </div>
                    <p
                      data-testid={testIds.result.querySummary}
                      className="mt-4 text-sm leading-7 text-[var(--color-ink-soft)]"
                    >
                      {queryNarrative}
                    </p>
                  </div>

                  <div className="compass-note rounded-[calc(var(--radius-card)-8px)] px-4 py-5 sm:px-5">
                    <p className="text-sm font-semibold compass-kicker">추천 흐름 요약</p>
                    <div className="mt-4 grid gap-3">
                      {discoveryCues.map((cue) => (
                        <div key={cue.title} className="border-b border-[color:var(--color-trust-info-border)] pb-3 last:border-b-0 last:pb-0">
                          <p className="text-sm font-semibold text-[var(--color-ink)]">{cue.title}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">{cue.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article
              id="recommendation-start-section"
              className="compass-sheet rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7"
            >
              <div className="flex flex-col gap-4 border-b border-[color:var(--color-frame-soft)] pb-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-sand-deep)]">추천 시작 흐름</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--color-ink)] sm:text-3xl">
                    조건 3~5개만 정하면 추천이 바로 시작돼요.
                  </h2>
                </div>
                <p className="max-w-3xl text-sm leading-7 text-[var(--color-ink-soft)]">
                  홈과 조건 입력은 한 흐름이에요. 아래에서 핵심 조건을 고른 뒤, 필요하면 세부 조정만 가볍게 더하고 바로 추천받아 보세요.
                </p>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <FlowStep
                  step="1. 동행"
                  title="누가 함께 가나요?"
                  caption="동행 유형에 따라 인원수와 추천 기준이 함께 바뀌어요."
                  options={partyOptions}
                  activeValue={query.partyType}
                  onSelect={(value) => updateQuery({ partyType: value })}
                />
                <FlowStep
                  step="2. 예산"
                  title="예산 감각은 어느 쪽인가요?"
                  caption="예산 기준이 분명할수록 추천 이유도 더 또렷해져요."
                  options={budgetOptions}
                  activeValue={query.budgetBand}
                  onSelect={(value) => updateQuery({ budgetBand: value })}
                />
                <FlowStep
                  step="3. 일정"
                  title="여행 기간은 얼마나 되나요?"
                  caption="일정 길이에 따라 장거리 가능 여부와 만족도가 달라져요."
                  options={tripLengthOptions}
                  activeValue={query.tripLengthDays}
                  onSelect={(value) => updateQuery({ tripLengthDays: value })}
                />
                <FlowStep
                  step="4. 시즌"
                  title="언제 떠날 예정인가요?"
                  caption="출발 월은 계절 적합도와 분위기를 가르는 핵심 조건이에요."
                  options={travelMonthOptions}
                  activeValue={query.travelMonth}
                  onSelect={(value) => updateQuery({ travelMonth: value })}
                />
                <div className="xl:col-span-2">
                  <FlowStep
                    step="5. 분위기"
                    title="가장 중요한 분위기는 무엇인가요?"
                    caption="대표 분위기를 먼저 고르고, 필요하면 아래에서 한 가지를 더 얹을 수 있어요."
                    options={primaryVibeOptions}
                    activeValue={query.vibes[0]}
                    onSelect={selectPrimaryVibe}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-[calc(var(--radius-card)-8px)] border border-[color:var(--color-frame-soft)] bg-[color:rgb(255_250_243_/_0.7)] px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-sand-deep)]">세부 조건은 필요할 때만</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-ink-soft)]">
                      출발 공항, 일정 밀도, 비행 부담, 보조 분위기는 추천을 더 미세하게 다듬고 싶을 때만 열어 보세요.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid={testIds.shell.advancedFiltersToggle}
                    aria-expanded={showAdvancedFilters}
                    onClick={toggleAdvancedFiltersVisibility}
                    className="compass-action-secondary rounded-full px-4 py-2 text-sm font-semibold tracking-[0.04em] transition hover:border-[color:var(--color-sand)]"
                  >
                    {showAdvancedFilters ? "세부 조건 접기" : "세부 조건 더 조정하기"}
                  </button>
                </div>

                {showAdvancedFilters ? (
                  <section
                    data-testid={testIds.shell.advancedFiltersPanel}
                    className="compass-note mt-4 grid gap-4 rounded-[calc(var(--radius-card)-10px)] p-4 sm:p-5 lg:grid-cols-3"
                  >
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--color-sand-deep)]">출발 공항</p>
                      <div className="flex flex-wrap gap-2">
                        {departureAirportOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            data-testid={option.testId}
                            onClick={() => updateQuery({ departureAirport: option.value })}
                            className={`rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.04em] ${
                              query.departureAirport === option.value
                                ? "compass-selected"
                                : "border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-elevated)] text-[var(--color-ink)]"
                             }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--color-sand-deep)]">일정 밀도</p>
                      <div className="flex flex-wrap gap-2">
                        {paceOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            data-testid={option.testId}
                            onClick={() => updateQuery({ pace: option.value })}
                            className={`rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.04em] ${
                              query.pace === option.value
                                ? "compass-selected"
                                : "border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-elevated)] text-[var(--color-ink)]"
                             }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--color-sand-deep)]">비행 부담</p>
                      <div className="flex flex-wrap gap-2">
                        {flightToleranceOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            data-testid={option.testId}
                            onClick={() => updateQuery({ flightTolerance: option.value })}
                            className={`rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.04em] ${
                              query.flightTolerance === option.value
                                ? "compass-selected"
                                : "border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-elevated)] text-[var(--color-ink)]"
                             }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 lg:col-span-3">
                      <p className="text-sm font-semibold text-[var(--color-sand-deep)]">보조 분위기</p>
                      <div className="flex flex-wrap gap-2">
                        {optionalVibeOptions.map((option) => {
                          const active = query.vibes[1] === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => toggleSecondaryVibe(option.value)}
                              className={`rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.04em] ${
                                active
                                  ? "compass-selected"
                                  : "border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-elevated)] text-[var(--color-ink)]"
                               }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid={testIds.query.submitRecommendation}
                  onClick={submitRecommendation}
                  disabled={isSubmitting}
                  className="compass-action-primary rounded-full px-5 py-3 text-sm font-semibold tracking-[0.04em] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "조건에 맞는 목적지를 고르는 중..." : "이 조건으로 여행지 추천 받기"}
                </button>
                <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                  익명으로 바로 시작돼요. 저장과 비교까지 모두 같은 흐름 안에서 이어집니다.
                </p>
              </div>
            </article>
          </section>

          <section className="space-y-6">
            {savedSnapshots.length > 0 ? (
              <article
                id="saved-snapshots-section"
                className="compass-desk rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7 xl:sticky xl:top-6"
              >
                <div className="flex flex-col gap-4 border-b border-[color:var(--color-frame-soft)] pb-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-sand-deep)]">저장한 카드</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                      공유하거나, 바로 비교 후보로 모아보세요.
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">
                      저장한 순간부터 비교 준비가 돼요. 모바일에서는 고정 트레이에서 바로 비교 보드를 만들 수 있어요.
                    </p>
                  </div>

                  <div
                    data-testid={testIds.snapshot.compareSelectionCount}
                    className="compass-surface-muted rounded-full px-4 py-2 text-sm"
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
                  <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                    먼저 마음에 드는 목적지 카드를 저장해 주세요. 저장한 카드 2개부터 4개까지 한 번에 비교할 수 있어요.
                  </p>
                  <button
                    type="button"
                    data-testid={testIds.snapshot.compareSnapshot}
                    onClick={createCompareSnapshot}
                    disabled={!canCreateCompare || compareLoading}
                    className="compass-action-primary rounded-full px-5 py-3 text-sm font-semibold tracking-[0.04em] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {compareButtonLabel}
                  </button>
                </div>

                {compareError ? (
                  <p className="compass-warning-card mt-3 rounded-[calc(var(--radius-card)-12px)] px-3 py-3 text-sm">
                    {compareError}
                  </p>
                ) : null}
              </article>
            ) : null}

            <article className="compass-desk rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7">
              <div className="flex flex-col gap-4 border-b border-[color:var(--color-frame-soft)] pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-sand-deep)]">추천 결과</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                    상위 3곳부터, 저장과 비교까지 바로 이어지게 정리해드려요.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">
                    추천 이유와 신뢰 신호를 먼저 보고, 마음에 드는 카드는 저장해 비교 후보로 바로 모을 수 있어요.
                  </p>
                </div>

                {results ? (
                    <div className="compass-surface-muted rounded-full px-4 py-2 text-sm">
                      추천 {results.meta.resultCount}곳 · {formatEvidenceMode(results.sourceSummary.mode)} 근거 모드
                    </div>
                ) : null}
              </div>

              <div className="mt-5 space-y-4">
                {submitError ? (
                  <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] p-5 text-sm leading-7 text-[var(--color-ink)]">
                    {submitError}
                  </div>
                ) : null}

                {isSubmitting ? (
                  <div className="grid gap-3">
                    {[0, 1, 2].map((placeholder) => (
                      <div
                        key={`loading-card-${placeholder}`}
                        className="compass-sheet animate-pulse rounded-[calc(var(--radius-card)-10px)] p-5"
                      >
                        <div className="h-4 w-24 rounded-full bg-[color:rgb(17_32_29_/_0.08)]" />
                        <div className="mt-5 h-10 w-2/3 rounded-full bg-[color:rgb(17_32_29_/_0.12)]" />
                        <div className="mt-4 h-4 w-full rounded-full bg-[color:rgb(17_32_29_/_0.08)]" />
                        <div className="mt-2 h-4 w-5/6 rounded-full bg-[color:rgb(17_32_29_/_0.08)]" />
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          <div className="h-20 rounded-[calc(var(--radius-card)-12px)] bg-[color:rgb(17_32_29_/_0.08)]" />
                          <div className="h-20 rounded-[calc(var(--radius-card)-12px)] bg-[color:rgb(17_32_29_/_0.08)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {!results && !submitError && !isSubmitting ? (
                  <div className="compass-note rounded-[calc(var(--radius-card)-10px)] p-5">
                    <p className="text-sm font-semibold compass-kicker">추천 결과는 이렇게 읽어요</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">상위 3곳부터</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">결정이 빨라지도록 후보를 먼저 압축해요.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">이유와 신뢰 신호</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">왜 맞는지와 왜 믿어도 되는지를 먼저 봐요.</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">저장 후 바로 비교</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">마음에 드는 카드만 남겨 결정 단계로 넘어가요.</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {results && cards.length === 0 ? (
                  <div
                    data-testid={testIds.result.emptyState}
                    className="compass-sheet rounded-[calc(var(--radius-card)-10px)] p-5"
                  >
                    <p className="text-lg font-semibold text-[var(--color-ink)]">
                      지금 조건에 딱 맞는 목적지가 없어요.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-ink-soft)]">
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
                        className="compass-action-secondary rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--color-sand)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="block text-xs font-semibold tracking-[0.04em] text-[var(--color-sand-deep)]">
                            바로 완화하기
                          </span>
                          <span className="mt-3 block text-sm font-semibold text-[var(--color-ink)]">
                            {action.label}
                          </span>
                          <span className="mt-2 block text-xs leading-5 text-[var(--color-ink-soft)]">
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
                    className="compass-trust-card rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm leading-6"
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
                            className="compass-action-primary rounded-full px-4 py-3 text-xs font-semibold tracking-[0.04em] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
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
                                className="compass-action-secondary rounded-full px-4 py-3 text-xs font-semibold tracking-[0.04em] transition hover:border-[color:var(--color-sand)]"
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
                                className="compass-action-secondary rounded-full px-4 py-3 text-xs font-semibold tracking-[0.04em] transition hover:border-[color:var(--color-sand)]"
                              >
                                링크 복사
                              </button>
                            </>
                          ) : null}
                          {saveState.status === "error" ? (
                            <span className="compass-warning-card rounded-full px-3 py-2 text-xs font-semibold">
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
                    className="compass-action-secondary w-full rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm font-semibold tracking-[0.04em] transition hover:border-[color:var(--color-sand)]"
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
              className="compass-desk pointer-events-auto rounded-[calc(var(--radius-card)-6px)] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-sand-deep)]">비교 트레이</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
                    {compareTrayDestinations || `${savedSnapshots.length}개 저장 카드`}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">
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
                  className="compass-action-secondary rounded-full px-3 py-2 text-[11px] font-semibold tracking-[0.04em]"
                >
                  카드 보기
                </button>
              </div>

              <button
                type="button"
                data-testid={testIds.snapshot.stickyCompareAction}
                onClick={createCompareSnapshot}
                disabled={!canCreateCompare || compareLoading}
                className="compass-action-primary mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em] transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {compareButtonLabel}
              </button>

              <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">
                저장한 카드에서 2개부터 4개까지 고르면 바로 비교 보드를 만들 수 있어요.
              </p>
            </article>
          </div>
        ) : null}
      </>
    </ExperienceShell>
  );
}
