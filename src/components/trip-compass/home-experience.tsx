"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";

import type { ComparisonSnapshot, RecommendationQuery } from "@/lib/domain/contracts";
import {
  buildStructuredTripBrief,
  buildQueryNarrative,
  buildRecommendationSearchParams,
  buildSnapshotPath,
  budgetOptions,
  createRecommendationCards,
  defaultRecommendationQuery,
  departureAirportOptions,
  flightToleranceOptions,
  formatEvidenceMode,
  formatFlightTolerance,
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

type ChoiceButtonProps = {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  testId?: string;
};

type QueryChoiceOption<TValue extends string | number> = {
  value: TValue;
  label: string;
  description: string;
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

type PlannerFilterGroupProps = {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

const tripLengthRelaxationOrder = [3, 5, 8] as const;
const flightToleranceRelaxationOrder = ["short", "medium", "long"] as const;
const travelMonthRelaxationOrder = [7, 10, 12] as const;
const quickIntentPresets: IntentPreset[] = [
  {
    id: "first-europe",
    label: "첫 유럽",
    description: "긴 비행도 괜찮고, 처음 보는 유럽 도시의 감도를 우선해요.",
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
    label: "짧은 도시",
    description: "비행은 짧게, 먹고 걷고 구경하는 밀도는 선명하게 챙겨요.",
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
    label: "커플 야경",
    description: "야경과 산책, 식사 분위기가 자연스럽게 이어지는 밤을 찾고 있어요.",
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
    label: "가족 휴양",
    description: "이동 부담은 덜고, 쉬는 시간과 자연 풍경은 넉넉하게 담아요.",
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

const editorialGuideSteps = [
  {
    id: "brief",
    label: "01",
    title: "여행의 기본 결부터 정리해요.",
    description: "동행, 예산, 일정처럼 크게 흔들리지 않는 기준부터 먼저 잡으면 목적지 후보의 톤이 빠르게 정리돼요.",
  },
  {
    id: "read",
    label: "02",
    title: "추천은 이유와 체크 포인트를 같이 읽어요.",
    description: "상위 후보 카드마다 왜 맞는지, 무엇을 더 확인해야 하는지를 한 번에 보여줘서 바로 판단할 수 있어요.",
  },
  {
    id: "save",
    label: "03",
    title: "마음에 드는 후보는 저장해 바로 비교해요.",
    description: "저장한 카드만 골라 비교 보드로 넘길 수 있어서 여행지 결정을 한 화면에서 이어갈 수 있어요.",
  },
] as const;

const workspaceBoardSteps = [
  {
    id: "brief",
    label: "선택한 조건",
    title: "조건을 먼저 정하기",
    description: "동행, 예산, 일정, 분위기를 먼저 한 묶음으로 정리해 같은 기준으로 계속 판단해요.",
  },
  {
    id: "shortlist",
    label: "추천 결과",
    title: "이유가 보이는 후보만 저장",
    description: "추천 이유와 체크 포인트를 읽은 뒤 비교할 만한 카드만 남겨요.",
  },
  {
    id: "board",
    label: "결정 보드",
    title: "저장한 여행지 비교하기",
    description: "2개 이상 저장하면 공유 가능한 비교 보드로 바로 넘어가요.",
  },
] as const;

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
 * Renders one compact advanced-filter group with shared workbench framing.
 * @param props Group title and body content
 * @returns Reusable planner filter section
 */
function PlannerFilterGroup({
  title,
  children,
  className,
  bodyClassName,
}: PlannerFilterGroupProps) {
  return (
    <section
      className={`rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-frost)] p-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.56),0_12px_28px_rgb(30_24_18_/_0.06)] lg:p-2.5 ${className ?? ""}`}
    >
      <p className="border-b border-[color:var(--color-frame-soft)] pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-sand-deep)] lg:pb-1.5">
        {title}
      </p>
      <div className={bodyClassName ?? "mt-2.5 flex flex-wrap gap-1.5 sm:gap-2 lg:mt-1.5 lg:gap-1"}>
        {children}
      </div>
    </section>
  );
}

type PlannerColumnProps<TValue extends string | number> = {
  title: string;
  options: ReadonlyArray<QueryChoiceOption<TValue>>;
  activeValue: TValue;
  onSelect: (value: TValue) => void;
};

/**
 * 선택형 옵션 목록에서 현재 값에 대응하는 라벨을 찾는다.
 * @param options 선택 가능한 옵션 목록
 * @param activeValue 현재 선택 값
 * @returns 현재 값에 대응하는 표시 라벨
 */
function resolveQueryChoiceLabel<TValue extends string | number>(
  options: ReadonlyArray<QueryChoiceOption<TValue>>,
  activeValue: TValue,
): string {
  return options.find((option) => option.value === activeValue)?.label ?? String(activeValue);
}

/**
 * Renders one column inside the compact planner-first grid.
 * @param props Column heading and choices
 * @returns Compact planner column
 */
function PlannerColumn<TValue extends string | number>({
  title,
  options,
  activeValue,
  onSelect,
}: PlannerColumnProps<TValue>) {
  const activeLabel = resolveQueryChoiceLabel(options, activeValue);

  return (
    <section className="flex h-full flex-col rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-frost)] px-3 py-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.56),0_14px_30px_rgb(30_24_18_/_0.06)] sm:px-3.5 sm:py-3.5 lg:min-h-[12rem] lg:px-3 lg:py-3">
      <div className="flex items-start justify-between gap-2 border-b border-[color:var(--color-frame-soft)] pb-2 lg:items-center lg:pb-1.5">
        <h3 className="text-[0.84rem] font-semibold tracking-[-0.015em] text-[var(--color-ink)] sm:text-[0.88rem] lg:text-[0.82rem]">
          {title}
        </h3>
        <span className="compass-metric-pill rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.04em] text-[var(--color-ink)]">
          {activeLabel}
        </span>
      </div>

      <div className="mt-2.5 grid flex-1 content-start gap-1.5 sm:grid-cols-2 lg:mt-1.5 lg:gap-1">
        {options.map((option) => (
          <ChoiceButton
            key={`${title}-${String(option.value)}`}
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
 * Renders a single selectable query chip.
 * @param props Choice state and click handler
 * @returns Interactive selection button
 */
function ChoiceButton({ label, active, onClick, testId }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-[3.35rem] w-full flex-col items-start justify-center rounded-[calc(var(--radius-card)-14px)] px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgb(255_255_255_/_0.42)] lg:min-h-[3rem] lg:px-2.5 lg:py-2 ${
        active ? "compass-selected shadow-[0_10px_24px_rgb(184_138_74_/_0.14)]" : "compass-selection-chip"
      }`}
    >
      <span className="block text-[0.72rem] font-semibold leading-4 tracking-[-0.01em] sm:text-[0.76rem] lg:text-[0.72rem]">
        {label}
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
      className="compass-sheet compass-lift-card rounded-[calc(var(--radius-card)-10px)] p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[color:var(--color-frame-soft)] pb-4">
        <div>
          <p className="compass-editorial-kicker">보드 후보 {index + 1}</p>
          <p className="mt-2 font-display text-[1.15rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
            {snapshot.destinationName}
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">
            저장 링크를 공유하거나 바로 비교 보드 후보로 담아 둘 수 있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(snapshot.snapshotId)}
          className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.04em] ${
            selected
              ? "compass-selected"
              : "compass-selection-chip"
           }`}
        >
          {selected ? "보드에 담김" : "보드에 담기"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
          recommendation snapshot
        </span>
        <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
          restore-safe
        </span>
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

function scrollToNamedSection(sectionId: string) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.getElementById(sectionId)?.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

/**
 * Home page client experience for the anonymous-first recommendation flow.
 * @returns Interactive SooGo home page
 */
export function HomeExperience() {
  const router = useRouter();
  const [query, setQuery] = useState<RecommendationQuery>(defaultRecommendationQuery);
  const [results, setResults] = useState<RecommendationApiResponse | null>(null);
  const [cards, setCards] = useState<RecommendationCardView[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [showRefinementStep, setShowRefinementStep] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshotCard[]>([]);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const queryNarrative = useMemo(() => buildQueryNarrative(query), [query]);
  const visibleCards = showAllResults ? cards : cards.slice(0, 3);
  const canCreateCompare = selectedCompareIds.length >= 2 && selectedCompareIds.length <= 4;
  const emptyStateActions = useMemo(() => buildRelaxationActions(query), [query]);
  const activeIntentPresetId = useMemo(
    () => quickIntentPresets.find((preset) => matchesIntentPreset(query, preset.patch))?.id ?? null,
    [query],
  );
  const structuredTripBrief = useMemo(() => buildStructuredTripBrief(query), [query]);
  const plannerSummary = useMemo(
    () => [
      {
        id: "party",
        label: "동행",
        value: resolveQueryChoiceLabel(partyOptions, query.partyType),
      },
      {
        id: "budget",
        label: "예산",
        value: resolveQueryChoiceLabel(budgetOptions, query.budgetBand),
      },
      {
        id: "duration",
        label: "기간",
        value: resolveQueryChoiceLabel(tripLengthOptions, query.tripLengthDays),
      },
    ],
    [query.budgetBand, query.partyType, query.tripLengthDays],
  );
  const plannerCapsule = useMemo(
    () => plannerSummary.map((item) => item.value).join(" · "),
    [plannerSummary],
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
  const workspaceProgress = useMemo(
    () => [
      {
        id: "brief",
        label: "선택한 조건",
        title: "지금 고른 조건이에요",
        description: queryNarrative,
        active: true,
      },
      {
        id: "shortlist",
        label: "추천 결과",
        title: results ? `${cards.length}곳을 추천 결과로 보고 있어요` : "아직 추천 전이에요",
        description: results
          ? "각 여행지의 장점과 확인할 점을 바로 비교할 수 있어요."
          : "조건을 정하면 아래에 추천 결과가 바로 열려요.",
        active: Boolean(results),
      },
      {
        id: "board",
        label: "비교 준비",
        title:
          savedSnapshots.length > 0
            ? `저장 ${savedSnapshots.length}개 · 비교 선택 ${selectedCompareIds.length}개`
            : "아직 저장한 카드가 없어요",
        description: canCreateCompare
          ? "지금 바로 비교 화면으로 넘어갈 수 있어요."
          : "마음에 드는 여행지를 저장하면 바로 비교할 수 있어요.",
        active: savedSnapshots.length > 0,
      },
    ],
    [canCreateCompare, cards.length, queryNarrative, results, savedSnapshots.length, selectedCompareIds.length],
  );

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

  function revealRefinementStep() {
    setShowRefinementStep(true);
    window.setTimeout(() => {
      scrollToNamedSection("recommendation-details-section");
    }, 30);
  }

  const activePartyLabel = resolveQueryChoiceLabel(partyOptions, query.partyType);
  const hasResultStage = Boolean(results || submitError || isSubmitting);
  const guideStageIndex = hasResultStage ? "04" : "03";

  return (
    <ExperienceShell
      eyebrow="SooGo"
      title="이번 여행, 누구와 떠나나요?"
      intro=""
      capsule=""
    >
      <>
        <div className={`compass-stage-stack ${savedSnapshots.length > 0 ? "pb-28 md:pb-0" : ""}`}>
          <article
            id="recommendation-start-section"
            className="compass-sheet compass-form-stage compass-stage-shell compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-4 py-3 sm:px-5 sm:py-3.5 lg:px-4 lg:py-3 xl:px-4 xl:py-3.5"
          >
            <div className="space-y-4 lg:space-y-4">
              <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
                <div className="space-y-2.5">
                  <div className="compass-stage-meta">
                    <span className="compass-stage-index">01</span>
                    <p className="compass-editorial-kicker">시작</p>
                  </div>
                  <div>
                    <h2 className="font-display text-[1.18rem] leading-tight tracking-[-0.025em] text-[var(--color-ink)] sm:text-[1.36rem] lg:text-[1.42rem]">
                      동행만 먼저 고르면 바로 시작할 수 있어요.
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {partyOptions.map((option) => (
                  <ChoiceButton
                    key={`home-party-${option.value}`}
                    label={option.label}
                    description={option.description}
                    active={query.partyType === option.value}
                    onClick={() => updateQuery({ partyType: option.value })}
                    testId={option.testId}
                  />
                ))}
              </div>

              <div className="rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-frost)] px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    data-testid={testIds.query.submitRecommendation}
                    onClick={submitRecommendation}
                    disabled={isSubmitting}
                    className="compass-action-primary compass-soft-press w-full rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "조건에 맞는 목적지를 고르는 중..." : `${activePartyLabel} 기준으로 바로 추천 받기`}
                  </button>
                  <button
                    type="button"
                    onClick={revealRefinementStep}
                    className="compass-action-secondary compass-soft-press w-full rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em]"
                  >
                    예산과 일정도 먼저 고르기
                  </button>
                </div>
              </div>
            </div>
          </article>

          {showRefinementStep || hasResultStage ? (
            <article
              id="recommendation-details-section"
              className="compass-sheet compass-form-stage compass-stage-shell compass-stage-reveal compass-stage-reveal-delayed rounded-[var(--radius-card)] px-4 py-3 sm:px-5 sm:py-3.5 lg:px-4 lg:py-3 xl:px-4 xl:py-3.5"
            >
              <div className="space-y-4 lg:space-y-4">
                <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
                  <div className="space-y-2.5">
                  <div className="compass-stage-meta">
                    <span className="compass-stage-index">02</span>
                    <p className="compass-editorial-kicker">조건 더 고르기</p>
                  </div>
                  <div>
                    <h2 className="font-display text-[1.12rem] leading-tight tracking-[-0.02em] text-[var(--color-ink)] sm:text-[1.28rem] lg:text-[1.22rem]">
                      더 맞추고 싶다면 예산과 기간만 먼저 고르세요.
                    </h2>
                  </div>
                </div>
              </div>

              <div
                className={`compass-desk p-2 lg:p-2 ${
                  showAdvancedFilters
                    ? "rounded-t-[calc(var(--radius-card)-10px)] rounded-b-[calc(var(--radius-card)-16px)] border-b-0 pb-1"
                    : "rounded-[calc(var(--radius-card)-10px)]"
                }`}
              >
                  <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_14.5rem] lg:items-start lg:gap-2 xl:grid-cols-[minmax(0,1.18fr)_15.5rem]">
                    <div className="grid gap-2 lg:grid-cols-2 lg:gap-1.5 xl:gap-2">
                      <PlannerColumn
                        title="예산은 어느 정도인가요?"
                        options={budgetOptions}
                        activeValue={query.budgetBand}
                        onSelect={(value) => updateQuery({ budgetBand: value })}
                      />
                      <PlannerColumn
                        title="여행은 며칠 가나요?"
                        options={tripLengthOptions}
                        activeValue={query.tripLengthDays}
                        onSelect={(value) => updateQuery({ tripLengthDays: value })}
                    />
                  </div>

                  <section className="compass-sheet flex h-full flex-col gap-2 rounded-[calc(var(--radius-card)-12px)] px-3 py-3 sm:px-3.5 sm:py-3.5 lg:px-2.5 lg:py-2.5">
                    <div className="overflow-hidden rounded-[calc(var(--radius-card)-14px)] border border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-frost)]">
                      {plannerSummary.map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between gap-3 px-3 py-2 text-[var(--color-ink)] lg:px-2.5 lg:py-2 ${
                            index > 0 ? "border-t border-[color:var(--color-frame-soft)]" : ""
                          }`}
                        >
                          <span className="block text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                            {item.label}
                          </span>
                          <span className="block text-sm font-semibold tracking-[-0.01em] lg:text-[0.82rem]">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-1.5 pt-0.5 lg:mt-auto lg:border-t lg:border-[color:var(--color-frame-soft)] lg:pt-2">
                      <button
                        type="button"
                        data-testid={testIds.shell.advancedFiltersToggle}
                        aria-expanded={showAdvancedFilters}
                        onClick={toggleAdvancedFiltersVisibility}
                        className="compass-action-secondary compass-soft-press w-full rounded-full px-3 py-2 text-[10px] font-semibold tracking-[0.04em]"
                      >
                        {showAdvancedFilters ? "세부 조건 접기" : "세부 조건 더 조정하기"}
                      </button>

                      <button
                        type="button"
                        onClick={submitRecommendation}
                        disabled={isSubmitting}
                        className="compass-action-primary compass-soft-press w-full rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60 lg:py-2.5"
                      >
                        {isSubmitting ? "조건에 맞는 목적지를 고르는 중..." : "이 조건으로 여행지 추천 받기"}
                      </button>
                    </div>
                  </section>
                </div>
              </div>

              {showAdvancedFilters ? (
                <section
                  data-testid={testIds.shell.advancedFiltersPanel}
                  className="compass-note mt-0 rounded-t-[calc(var(--radius-card)-16px)] rounded-b-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame-soft)] border-t-0 p-3 pt-3.5 sm:p-3.5 lg:rounded-t-[calc(var(--radius-card)-18px)] lg:rounded-b-[calc(var(--radius-card)-12px)] lg:p-2.5 lg:pt-3"
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.18fr)_minmax(13.5rem,0.82fr)] lg:gap-2 xl:grid-cols-[minmax(0,1.24fr)_minmax(14.5rem,0.88fr)]">
                    <div className="grid gap-3 sm:grid-cols-2 lg:gap-2">
                      <div className="sm:col-span-2">
                        <PlannerFilterGroup
                          title="빠른 시작"
                          bodyClassName="mt-2.5 grid gap-1.5 sm:grid-cols-2 lg:mt-1.5 lg:grid-cols-4 lg:gap-1"
                        >
                          {quickIntentPresets.map((preset) => {
                            const active = activeIntentPresetId === preset.id;

                            return (
                              <button
                                key={preset.id}
                                type="button"
                                data-testid={preset.testId}
                                aria-pressed={active}
                                onClick={() => applyIntentPreset(preset)}
                                className={`rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3 text-left ${
                                  active ? "compass-selected" : "compass-selection-chip"
                                }`}
                              >
                                <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-sand-deep)]">
                                  {preset.label}
                                </span>
                              </button>
                            );
                          })}
                        </PlannerFilterGroup>
                      </div>

                      <div className="sm:col-span-2">
                        <PlannerFilterGroup title="출발 월">
                          {travelMonthOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              data-testid={option.testId}
                              onClick={() => updateQuery({ travelMonth: option.value })}
                              className={`rounded-[calc(var(--radius-card)-14px)] px-3 py-2 text-xs font-semibold tracking-[0.04em] lg:px-2.5 lg:py-1.5 ${
                                query.travelMonth === option.value
                                  ? "compass-selected"
                                  : "compass-selection-chip"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </PlannerFilterGroup>
                      </div>

                      <PlannerFilterGroup title="대표 분위기">
                        {primaryVibeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            data-testid={option.testId}
                            onClick={() => selectPrimaryVibe(option.value)}
                            className={`rounded-[calc(var(--radius-card)-14px)] px-3 py-2 text-xs font-semibold tracking-[0.04em] lg:px-2.5 lg:py-1.5 ${
                              query.vibes[0] === option.value
                                ? "compass-selected"
                                : "compass-selection-chip"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </PlannerFilterGroup>

                      <PlannerFilterGroup title="보조 분위기">
                        {optionalVibeOptions.map((option) => {
                          const active = query.vibes[1] === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => toggleSecondaryVibe(option.value)}
                              className={`rounded-[calc(var(--radius-card)-14px)] px-3 py-2 text-xs font-semibold tracking-[0.04em] lg:px-2.5 lg:py-1.5 ${
                                active ? "compass-selected" : "compass-selection-chip"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </PlannerFilterGroup>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-2">
                      <PlannerFilterGroup title="출발 공항">
                        {departureAirportOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            data-testid={option.testId}
                            onClick={() => updateQuery({ departureAirport: option.value })}
                            className={`rounded-[calc(var(--radius-card)-14px)] px-3 py-2 text-xs font-semibold tracking-[0.04em] lg:px-2.5 lg:py-1.5 ${
                              query.departureAirport === option.value
                                ? "compass-selected"
                                : "compass-selection-chip"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </PlannerFilterGroup>

                      <PlannerFilterGroup title="일정 밀도">
                        {paceOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            data-testid={option.testId}
                            onClick={() => updateQuery({ pace: option.value })}
                            className={`rounded-[calc(var(--radius-card)-14px)] px-3 py-2 text-xs font-semibold tracking-[0.04em] lg:px-2.5 lg:py-1.5 ${
                              query.pace === option.value ? "compass-selected" : "compass-selection-chip"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </PlannerFilterGroup>

                      <PlannerFilterGroup title="비행 부담">
                        {flightToleranceOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            data-testid={option.testId}
                            onClick={() => updateQuery({ flightTolerance: option.value })}
                            className={`rounded-[calc(var(--radius-card)-14px)] px-3 py-2 text-xs font-semibold tracking-[0.04em] lg:px-2.5 lg:py-1.5 ${
                              query.flightTolerance === option.value
                                ? "compass-selected"
                                : "compass-selection-chip"
                            }`}
                          >
                              {option.label}
                          </button>
                          ))}
                        </PlannerFilterGroup>
                    </div>
                  </div>
                </section>
              ) : null}
              </div>
            </article>
          ) : null}

          {hasResultStage ? (
            <article className="compass-editorial-band compass-stage-shell compass-stage-reveal compass-stage-reveal-later rounded-[var(--radius-card)] px-5 py-5 sm:px-6 sm:py-6 lg:px-6 lg:py-6">
              <>
                <div className="compass-stage-header">
                    <div className="space-y-2.5">
                      <div className="compass-stage-meta">
                        <span className="compass-stage-index">03</span>
                        <p className="compass-editorial-kicker">선택한 조건 → 추천 결과 → 비교</p>
                      </div>
                      <div>
                        <h2 className="font-display text-[1.24rem] leading-[1.02] tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.5rem]">
                          선택한 조건을 기준으로 추천 결과를 보고, 마음에 드는 곳만 비교해요.
                        </h2>
                        <p className="compass-stage-caption mt-2 text-sm leading-6">
                          지금 고른 조건을 먼저 확인하고, 추천 이유와 비교할 점을 같은 화면에서 바로 읽을 수 있어요.
                        </p>
                      </div>
                    </div>

                  <div className="compass-stage-aside">
                    <div className="compass-stage-panel rounded-[calc(var(--radius-card)-8px)] px-4 py-3 sm:px-5 sm:py-4">
                        {results ? (
                          <>
                            <p className="text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                              추천 {results.meta.resultCount}곳 · {formatEvidenceMode(results.sourceSummary.mode)} 근거 모드
                            </p>
                            <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">{queryNarrative}</p>
                          </>
                        ) : (
                          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                            결과가 준비되면 추천 이유와 저장 기능이 바로 열려요.
                          </p>
                        )}
                      </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(19rem,0.88fr)] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="compass-editorial-kicker">선택한 조건</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                          추천 결과를 어떤 기준으로 보는지 한눈에 확인할 수 있어요.
                        </p>
                      </div>
                    </div>

                    <div className="compass-brief-grid mt-4">
                      {structuredTripBrief.map((item) => (
                        <article
                          key={item.id}
                          className="compass-brief-card rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5"
                        >
                          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                            {item.label}
                          </p>
                          <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                            {item.value}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">
                            {item.detail}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <article className="compass-story-note rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5">
                      <p className="compass-editorial-kicker">결과 요약</p>
                      <p className="mt-3 font-display text-[1.02rem] leading-tight tracking-[-0.025em] text-[var(--color-ink)]">
                        {results
                          ? `${results.meta.resultCount}곳을 같은 기준으로 보고 있어요.`
                          : "추천 결과가 열리면 여기에 핵심만 정리돼요."}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                        {results
                          ? `${formatEvidenceMode(results.sourceSummary.mode)} 근거를 바탕으로 추천하고 있고, 저장한 여행지는 바로 비교할 수 있어요.`
                          : "결과가 준비되면 추천 이유와 확인할 점이 카드마다 정리돼요."}
                      </p>
                    </article>

                    <div className="compass-workspace-board">
                      {workspaceProgress.map((step) => (
                        <article
                          key={step.id}
                          className={`compass-board-step rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5 ${step.active ? "compass-board-step-active" : ""}`}
                        >
                          <p className="compass-editorial-kicker">{step.label}</p>
                          <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                            {step.title}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">
                            {step.description}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`mt-5 grid gap-6 ${savedSnapshots.length > 0 ? "xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.42fr)] xl:items-start" : ""}`}>
                  <div className="space-y-5">
                    {submitError ? (
                      <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] p-5 text-sm leading-7 text-[var(--color-ink)]">
                        {submitError}
                      </div>
                    ) : null}

                    {isSubmitting ? (
                      <div className="grid gap-3">
                        {[0, 1, 2].map((placeholder) => (
                          <div
                            key={`loading-card-${placeholder}`}
                            className="compass-skeleton-card rounded-[calc(var(--radius-card)-10px)] p-5"
                          >
                            <div className="compass-skeleton-shimmer h-4 w-24 rounded-full" />
                            <div className="compass-skeleton-shimmer mt-5 h-10 w-2/3 rounded-full" />
                            <div className="compass-skeleton-shimmer mt-4 h-4 w-full rounded-full" />
                            <div className="compass-skeleton-shimmer mt-2 h-4 w-5/6 rounded-full" />
                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                              <div className="compass-skeleton-shimmer h-20 rounded-[calc(var(--radius-card)-12px)]" />
                              <div className="compass-skeleton-shimmer h-20 rounded-[calc(var(--radius-card)-12px)]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {results && cards.length === 0 ? (
                      <div
                        data-testid={testIds.result.emptyState}
                        className="compass-open-info rounded-[calc(var(--radius-card)-12px)] p-5"
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
                              className="compass-selection-chip rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-4 py-4 text-sm leading-6"
                      >
                        개인화 안내 · 지금 추천에는 로그인한 여행 기록과 선호가 함께 반영되고 있어요.
                      </div>
                    ) : null}

                    {visibleCards.length > 0 ? (
                      <div className="space-y-4 pt-2">
                        <div className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="compass-editorial-kicker">추천 결과</p>
                              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                                각 카드는 판단 문장, 신뢰 신호, 저장 액션이 한 묶음으로 보이도록 정리되어 있어요.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                                상위 {visibleCards.length}곳
                              </span>
                              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                                저장 후 복원 가능
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="compass-result-flow">
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
                                      className="compass-action-primary compass-soft-press rounded-full px-4 py-3 text-xs font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
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
                                          className="compass-action-secondary rounded-full px-4 py-3 text-xs font-semibold tracking-[0.04em]"
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
                                          className="compass-action-secondary rounded-full px-4 py-3 text-xs font-semibold tracking-[0.04em]"
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
                        </div>
                      </div>
                    ) : null}

                    {cards.length > 3 ? (
                      <button
                        type="button"
                        data-testid={testIds.result.showMoreResults}
                        onClick={() => setShowAllResults((currentValue) => !currentValue)}
                        className="compass-action-secondary mx-auto block w-full max-w-xl rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm font-semibold tracking-[0.04em]"
                      >
                        {showAllResults ? "상위 3개만 다시 보기" : `목적지 카드 ${cards.length - 3}개 더 보기`}
                      </button>
                    ) : null}
                  </div>

                  {savedSnapshots.length > 0 ? (
                    <aside
                      id="saved-snapshots-section"
                      className="compass-desk compass-sidebar-stage rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7 xl:sticky xl:top-8"
                    >
                      <div className="flex flex-col gap-4 border-b border-[color:var(--color-frame-soft)] pb-5">
                        <div>
                          <p className="compass-editorial-kicker">저장한 여행지</p>
                          <h3 className="mt-2 font-display text-[1.35rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                            저장한 여행지 중에서 비교할 곳만 고르세요.
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                            저장, 공유, 비교를 한곳에서 바로 이어서 할 수 있어요.
                          </p>
                        </div>

                        <div
                          data-testid={testIds.snapshot.compareSelectionCount}
                          className="compass-metric-pill w-fit rounded-full px-4 py-2 text-sm"
                        >
                          선택 {selectedCompareIds.length}개 · 최대 4개
                        </div>

                        <div className="compass-decision-strip">
                          {workspaceBoardSteps.map((step, index) => (
                            <div
                              key={step.id}
                              className={`compass-decision-strip-item rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3 ${index === 2 && canCreateCompare ? "compass-board-step-active" : ""}`}
                            >
                              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                                {step.label}
                              </p>
                              <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                                {step.title}
                              </p>
                            </div>
                          ))}
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

                      <div className="mt-5 flex flex-col gap-3">
                        <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                          저장한 여행지 2개부터 4개까지 바로 비교할 수 있어요.
                        </p>
                        <button
                          type="button"
                          data-testid={testIds.snapshot.compareSnapshot}
                          onClick={createCompareSnapshot}
                          disabled={!canCreateCompare || compareLoading}
                          className="compass-action-primary compass-soft-press rounded-full px-5 py-3 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {compareButtonLabel}
                        </button>
                      </div>

                      {compareError ? (
                        <p className="compass-warning-card mt-3 rounded-[calc(var(--radius-card)-12px)] px-3 py-3 text-sm">
                          {compareError}
                        </p>
                      ) : null}
                    </aside>
                  ) : null}
                </div>
              </>
            </article>
          ) : null}

          {hasResultStage ? (
            <article className="compass-editorial-band compass-stage-shell compass-stage-reveal compass-stage-reveal-slower rounded-[var(--radius-card)] px-5 py-5 sm:px-6 sm:py-6 lg:px-6 lg:py-6">
            <div className="compass-stage-header">
              <div className="space-y-2.5">
                <div className="compass-stage-meta">
                  <span className="compass-stage-index">{guideStageIndex}</span>
                  <p className="compass-editorial-kicker">이용 안내</p>
                </div>
                <div>
                  <h2 className="font-display text-[1.2rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.38rem]">
                    추천받고 저장하고 비교하는 흐름만 짧게 정리해 뒀어요.
                  </h2>
                  <p className="compass-stage-caption mt-2 text-sm leading-6">
                    위에서는 바로 추천을 시작하고, 여기서는 결과를 보고 저장하고 비교하는 순서만 다시 확인할 수 있어요.
                  </p>
                </div>
              </div>

              <div className="compass-stage-aside">
                <div className="compass-stage-panel rounded-[calc(var(--radius-card)-8px)] px-4 py-3 sm:px-5 sm:py-4">
                  <p className="text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                    지금은 {plannerCapsule} 기준으로 추천하고 있어요.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">{queryNarrative}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)] xl:items-start">
              <div className="grid gap-3 lg:grid-cols-3">
                {editorialGuideSteps.map((step) => (
                  <article
                    key={step.id}
                    className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5"
                  >
                    <div className="flex items-start gap-3 border-b border-[color:var(--color-frame-soft)] pb-3">
                      <div className="compass-stage-list-number shrink-0">{step.label}</div>
                      <div>
                        <p className="text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                          {step.title}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">{step.description}</p>
                  </article>
                ))}
              </div>

              <div className="compass-workspace-board">
                {workspaceProgress.map((step) => (
                  <article
                    key={step.id}
                    className={`compass-board-step rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5 ${step.active ? "compass-board-step-active" : ""}`}
                  >
                    <p className="compass-editorial-kicker">{step.label}</p>
                    <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                      {step.title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">{step.description}</p>
                  </article>
                ))}
              </div>
            </div>
            </article>
          ) : null}
        </div>

        {savedSnapshots.length > 0 ? (
          <div className="pointer-events-none fixed inset-x-4 bottom-4 z-30 md:hidden">
            <article
              data-testid={testIds.snapshot.stickyCompareTray}
              className="compass-panel compass-sticky-tray pointer-events-auto rounded-[calc(var(--radius-card)-6px)] px-4 py-4 text-[var(--color-paper)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="compass-editorial-kicker text-[var(--color-sand)]">보드 트레이</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-paper)]">
                    {compareTrayDestinations || `${savedSnapshots.length}개 저장 카드`}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-paper-soft)]">
                    저장 {savedSnapshots.length}개 · 선택 {selectedCompareIds.length}개
                  </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

                      document.getElementById("saved-snapshots-section")?.scrollIntoView({
                        behavior: prefersReducedMotion ? "auto" : "smooth",
                        block: "start",
                      });
                    }}
                    className="compass-action-secondary compass-soft-press rounded-full px-3 py-2 text-[11px] font-semibold tracking-[0.04em]"
                  >
                  카드 보기
                </button>
              </div>

              <button
                type="button"
                data-testid={testIds.snapshot.stickyCompareAction}
                onClick={createCompareSnapshot}
                disabled={!canCreateCompare || compareLoading}
                className="compass-action-primary compass-soft-press mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {compareButtonLabel}
              </button>

              <p className="mt-2 text-xs leading-5 text-[var(--color-paper-soft)]">
                    저장한 여행지 2개부터 4개를 고르면 바로 비교 화면으로 넘어갈 수 있어요.
              </p>
            </article>
          </div>
        ) : null}
      </>
    </ExperienceShell>
  );
}
