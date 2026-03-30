"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ComparisonSnapshot,
  RecommendationQuery,
  UserFutureTrip,
} from "@/lib/domain/contracts";
import {
  buildDestinationDetailPath,
  buildQueryNarrative,
  buildRecommendationDecisionFacts,
  buildRecommendationSearchParams,
  buildStructuredTripBrief,
  createRecommendationCards,
  formatDepartureAirport,
  formatEvidenceMode,
  formatResultVibeLabel,
  formatTravelMonth,
  type RecommendationApiResponse,
  type RecommendationCardView,
} from "@/lib/trip-compass/presentation";
import { buildRecommendationSnapshotPayload } from "@/lib/trip-compass/snapshot-payload";
import { authClient } from "@/lib/auth-client";
import {
  buildCurrentRoute,
  consumeMatchingPostAuthIntent,
  savePostAuthIntent,
} from "@/lib/post-auth-intent";
import { buildApiUrl } from "@/lib/runtime/url";
import { parseRecommendationQuery } from "@/lib/security/validation";
import {
  defaultHomeStepAnswers,
  deriveRecommendationQueryFromHomeStepAnswers,
  homeStepCompanionOptions,
  homeStepFlightPreferenceOptions,
  homeStepTravelStyleOptions,
  homeStepTripLengthOptions,
  homeStepTravelWindowOptions,
  type HomeStepAnswers,
  type HomeStepTravelStyle,
} from "@/lib/trip-compass/step-answer-adapter";
import {
  getFutureTripCtaTestId,
  getHomeChoiceTestId,
  getInstagramVibeTestId,
  getRelaxFilterActionTestId,
  getResultCardTestId,
  getResultFilterChipTestId,
  getResultTopItemTestId,
  getSaveSnapshotTestId,
  getSavedSnapshotTestId,
  testIds,
} from "@/lib/test-ids";

import { ExperienceShell } from "./experience-shell";
import { LandingPage } from "./home/landing-page";
import { ResultPage } from "./home/result-page";
import { StepQuestion } from "./home/step-question";
import { LeadSocialVideoPanel } from "./social-video-panel";
import { TravelSupportPanel } from "./travel-support-panel";

type FunnelStage = "landing" | "question" | "result";

type SaveState = {
  status: "idle" | "saving" | "saved" | "error";
  snapshotId?: string;
  shareUrl?: string;
};

type FutureTripState = {
  status: "idle" | "saving" | "saved" | "error";
  futureTripId?: string;
  sourceSnapshotId?: string;
};

type SavedSnapshotCard = {
  snapshotId: string;
  destinationId: string;
  destinationName: string;
  sharePath: string;
  shareUrl: string;
};

type RelaxationAction = {
  id: "trip-length" | "flight-tolerance" | "departure-airport" | "secondary-vibe" | "travel-month";
  label: string;
  description: string;
  nextQuery: RecommendationQuery;
};

type StepOptionValue = string | number | null;
type StepSelectionValue = StepOptionValue | StepOptionValue[];

type StepOptionView = {
  id: string;
  value: StepOptionValue;
  label: string;
  description: string;
};

type HomeFlowStep = {
  id: string;
  question: string;
  helper: string;
  selectedValue?: StepSelectionValue;
  options: StepOptionView[];
  onSelect: (value: StepOptionValue) => void;
  onNext?: () => void;
  nextDisabled?: boolean;
};

type SavedSnapshotCompactItemProps = {
  snapshot: SavedSnapshotCard;
  index: number;
  selected: boolean;
  onToggle: (snapshotId: string) => void;
  onCopy: (shareUrl: string) => void;
};

type CompactRecommendationItemProps = {
  card: RecommendationCardView;
  index: number;
  query: RecommendationQuery;
  showFutureTripCta: boolean;
  saveState: SaveState;
  futureTripState: FutureTripState;
  onSave: (card: RecommendationCardView) => void;
  onRegisterFutureTrip: (card: RecommendationCardView) => void;
  onCopy: (shareUrl: string) => void;
};

type ResultFilterKey = "all" | "short-flight" | "city" | "rest" | "balanced-budget";
type ResultSortKey = "fit" | "shortest-flight" | "budget";

const tripLengthRelaxationOrder = [3, 5, 8] as const;
const flightToleranceRelaxationOrder = ["short", "medium", "long"] as const;
const travelMonthRelaxationOrder = [7, 10, 12] as const;
const defaultAnswers: HomeStepAnswers = {
  whoWith: defaultHomeStepAnswers.whoWith,
  travelWindow: defaultHomeStepAnswers.travelWindow,
  tripLength: defaultHomeStepAnswers.tripLength,
  travelStyle: defaultHomeStepAnswers.travelStyle,
  flightPreference: defaultHomeStepAnswers.flightPreference,
};

const resultFilterOptions: Array<{ key: ResultFilterKey; label: string; description: string }> = [
  { key: "all", label: "전체", description: "지금 조건과 맞는 순서대로 봐요." },
  { key: "short-flight", label: "가까운 비행", description: "비행 부담이 낮은 곳부터 볼게요." },
  { key: "city", label: "도시 리듬", description: "도시 동선이 살아 있는 후보만 봐요." },
  { key: "rest", label: "아웃도어", description: "해변·풍경 쪽 후보를 먼저 볼게요." },
  { key: "balanced-budget", label: "예산 균형", description: "균형 예산 감각을 먼저 볼게요." },
];

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

function getFlightRank(flightBand: RecommendationCardView["destination"]["flightBand"]): number {
  if (flightBand === "short") {
    return 0;
  }

  if (flightBand === "medium") {
    return 1;
  }

  return 2;
}

function getBudgetRank(budgetBand: RecommendationCardView["destination"]["budgetBand"]): number {
  if (budgetBand === "budget") {
    return 0;
  }

  if (budgetBand === "mid") {
    return 1;
  }

  return 2;
}

function buildRelaxationActions(query: RecommendationQuery): RelaxationAction[] {
  const actions: RelaxationAction[] = [];
  const nextTripLength = getNextRelaxedOption(query.tripLengthDays, tripLengthRelaxationOrder);
  const nextFlightTolerance = getNextRelaxedOption(query.flightTolerance, flightToleranceRelaxationOrder);

  if (nextTripLength) {
    actions.push({
      id: "trip-length",
      label: `일정을 ${nextTripLength}일로 넓히기`,
      description: "짧은 일정 제약을 풀어 후보 풀을 조금 더 넓혀요.",
      nextQuery: { ...query, tripLengthDays: nextTripLength },
    });
  }

  if (nextFlightTolerance) {
    actions.push({
      id: "flight-tolerance",
      label: `비행 범위를 ${nextFlightTolerance === "short" ? "단거리" : nextFlightTolerance === "medium" ? "중거리" : "장거리"}까지 넓히기`,
      description: "거리 제한을 조금 풀어 더 넓은 후보를 확인해요.",
      nextQuery: { ...query, flightTolerance: nextFlightTolerance },
    });
  }

  if (query.departureAirport !== "ICN") {
    actions.push({
      id: "departure-airport",
      label: "출발 공항을 인천(ICN)으로 바꾸기",
      description: "노선 선택지가 가장 넓은 기준으로 다시 볼게요.",
      nextQuery: { ...query, departureAirport: "ICN" },
    });
  }

  if (query.vibes.length > 1) {
    actions.push({
      id: "secondary-vibe",
      label: "보조 분위기 조건 빼기",
      description: "대표 분위기 하나로 먼저 넓게 받아봐요.",
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
      label: `출발 시기를 ${formatTravelMonth(nextTravelMonth)}로 바꾸기`,
      description: "다른 대표 시즌으로 다시 맞춰 볼게요.",
      nextQuery: { ...query, travelMonth: nextTravelMonth },
    });
  }

  return actions
    .filter((action, index, source) => source.findIndex((item) => item.id === action.id) === index)
    .slice(0, 3);
}

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

function buildAbsoluteShareUrl(sharePath: string): string {
  return `${window.location.origin}${sharePath}`;
}

function getMotionBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function scrollToElementById(elementId: string, behavior: ScrollBehavior = getMotionBehavior()) {
  document.getElementById(elementId)?.scrollIntoView({
    behavior,
    block: "start",
  });
}

function scrollToPageTop(behavior: ScrollBehavior = "auto") {
  window.scrollTo({
    top: 0,
    behavior,
  });
}

function SavedSnapshotCompactItem({
  snapshot,
  index,
  selected,
  onToggle,
  onCopy,
}: SavedSnapshotCompactItemProps) {
  return (
    <article
      data-testid={getSavedSnapshotTestId(index)}
      className="rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-3.5"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="compass-editorial-kicker">저장한 여행 {index + 1}</p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">{snapshot.destinationName}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">다시 열어 보거나 비교 보드 후보로 바로 담을 수 있어요.</p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(snapshot.snapshotId)}
          className={`rounded-full px-3 py-2 text-xs font-semibold ${selected ? "compass-selected" : "compass-selection-chip"}`}
        >
          {selected ? "비교 포함" : "비교 담기"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={snapshot.sharePath}
          className="compass-action-secondary compass-soft-press rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em]"
        >
          저장 페이지
        </Link>
        <button
          type="button"
          onClick={() => onCopy(snapshot.shareUrl)}
          className="compass-action-secondary compass-soft-press rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em]"
        >
          링크 복사
        </button>
      </div>
    </article>
  );
}

function CompactRecommendationItem({
  card,
  index,
  query,
  showFutureTripCta,
  saveState,
  futureTripState,
  onSave,
  onRegisterFutureTrip,
  onCopy,
}: CompactRecommendationItemProps) {
  const detailPath = buildDestinationDetailPath(card.destination, query, saveState.snapshotId);
  const leadReason = card.recommendation.reasons[0] ?? card.recommendation.whyThisFits;
  const decisionFacts = buildRecommendationDecisionFacts(card.destination);
  const tags = card.destination.vibeTags.slice(0, 3).map((tag) => formatResultVibeLabel(tag));

  return (
    <article
      data-testid={getResultCardTestId(index)}
      className="rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              추천 {index + 1}
            </p>
            <span className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)]">
              {decisionFacts[0]?.value}
            </span>
            <span className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)]">
              {decisionFacts[1]?.value}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3
              data-testid={getResultTopItemTestId(index)}
              className="text-[1.05rem] font-semibold leading-none tracking-[-0.02em] text-[var(--color-funnel-text)]"
            >
              {card.destination.nameKo}
            </h3>
            <span className="text-[0.78rem] text-[var(--color-funnel-text-soft)]">
              {formatDepartureAirport(query.departureAirport)} 출발
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-[0.9rem] font-semibold leading-6 text-[var(--color-funnel-text)]">
            {leadReason}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={`${card.destination.id}-${tag}`}
                className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Link
            href={detailPath}
            className="inline-flex min-h-[2.25rem] items-center rounded-full bg-[var(--color-action-primary)] px-3 py-2 text-[0.72rem] font-semibold text-white transition-colors duration-200 hover:bg-[var(--color-action-primary-strong)]"
          >
            상세 보기
          </Link>
          {showFutureTripCta ? (
            <button
              type="button"
              data-testid={getFutureTripCtaTestId(index)}
              onClick={() => onRegisterFutureTrip(card)}
              disabled={futureTripState.status === "saving" || futureTripState.status === "saved"}
              className="inline-flex min-h-[2.25rem] items-center rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-2 text-[0.72rem] font-semibold text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {futureTripState.status === "saving"
                ? "담는 중..."
                : futureTripState.status === "saved"
                  ? "다음 여행 담음"
                  : "다음 여행 담기"}
            </button>
          ) : null}
          <button
            type="button"
            data-testid={getSaveSnapshotTestId(index)}
            onClick={() => onSave(card)}
            disabled={saveState.status === "saving"}
            className="inline-flex min-h-[2.25rem] items-center rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-2 text-[0.72rem] font-semibold text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-[var(--color-funnel-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveState.status === "saving"
              ? "저장 중..."
              : saveState.status === "saved"
                ? "담김"
                : "저장"}
          </button>
          {saveState.shareUrl ? (
            <button
              type="button"
              data-testid={testIds.snapshot.copyShareLink}
              onClick={() => {
                void onCopy(saveState.shareUrl ?? "");
              }}
              className="inline-flex min-h-[2.25rem] items-center rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-2 text-[0.72rem] font-semibold text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-[var(--color-funnel-muted)]"
            >
              링크 복사
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function HomeExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = authClient.useSession();
  const [stage, setStage] = useState<FunnelStage>("landing");
  const [answers, setAnswers] = useState<Partial<HomeStepAnswers>>(defaultAnswers);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [results, setResults] = useState<RecommendationApiResponse | null>(null);
  const [cards, setCards] = useState<RecommendationCardView[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [resultFilter, setResultFilter] = useState<ResultFilterKey>("all");
  const [resultSort, setResultSort] = useState<ResultSortKey>("fit");
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [futureTripStates, setFutureTripStates] = useState<Record<string, FutureTripState>>({});
  const [snapshotReferences, setSnapshotReferences] = useState<Record<string, SavedSnapshotCard>>({});
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshotCard[]>([]);
  const [copyFallbackUrl, setCopyFallbackUrl] = useState<string | null>(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const activeRecommendationRequestRef = useRef(0);
  const replayedIntentRef = useRef<string | null>(null);

  const currentQuery = useMemo(() => deriveRecommendationQueryFromHomeStepAnswers(answers), [answers]);
  const resultQuery = results?.query ?? currentQuery;
  const queryNarrative = useMemo(() => buildQueryNarrative(resultQuery), [resultQuery]);
  const briefItems = useMemo(() => buildStructuredTripBrief(resultQuery), [resultQuery]);
  const emptyStateActions = useMemo(() => buildRelaxationActions(resultQuery), [resultQuery]);
  const filteredCards = useMemo(() => {
    const nextCards = [...cards];

    const visibleByFilter = nextCards.filter((card) => {
      if (resultFilter === "all") {
        return true;
      }

      if (resultFilter === "short-flight") {
        return card.destination.flightBand === "short";
      }

      if (resultFilter === "city") {
        return card.destination.vibeTags.includes("city") || card.destination.kind === "city";
      }

      if (resultFilter === "rest") {
        return card.destination.vibeTags.includes("beach") || card.destination.vibeTags.includes("nature");
      }

      return card.destination.budgetBand === "mid";
    });

    visibleByFilter.sort((left, right) => {
      if (resultSort === "shortest-flight") {
        return (
          getFlightRank(left.destination.flightBand) - getFlightRank(right.destination.flightBand) ||
          right.recommendation.confidence - left.recommendation.confidence
        );
      }

      if (resultSort === "budget") {
        return (
          getBudgetRank(left.destination.budgetBand) - getBudgetRank(right.destination.budgetBand) ||
          right.recommendation.confidence - left.recommendation.confidence
        );
      }

      return (
        right.recommendation.scoreBreakdown.total - left.recommendation.scoreBreakdown.total ||
        right.recommendation.confidence - left.recommendation.confidence
      );
    });

    return visibleByFilter;
  }, [cards, resultFilter, resultSort]);

  const leadCard = filteredCards[0] ?? cards[0] ?? null;
  const secondaryCards = showAllResults ? filteredCards.slice(1) : filteredCards.slice(1, 4);
  const canCreateCompare = selectedCompareIds.length >= 2 && selectedCompareIds.length <= 4;
  const compareTrayDestinations = useMemo(() => {
    const selectedSnapshots = savedSnapshots.filter((snapshot) => selectedCompareIds.includes(snapshot.snapshotId));
    const previewSource = selectedSnapshots.length > 0 ? selectedSnapshots : savedSnapshots;

    return previewSource
      .slice(0, 2)
      .map((snapshot) => snapshot.destinationName)
      .join(" · ");
  }, [savedSnapshots, selectedCompareIds]);

  const steps: HomeFlowStep[] = [
    {
      id: "who-with",
      question: "누구와 가세요?",
      helper: "동행만 정해도 추천 결과의 결이 크게 달라져요.",
      selectedValue: answers.whoWith,
      options: homeStepCompanionOptions.map((option) => ({
        id: `who-with-${option.value}`,
        value: option.value,
        label: option.label,
        description: option.description,
      })),
      onSelect: (value) => {
        setAnswers((currentState) => ({
          ...currentState,
          whoWith: value as HomeStepAnswers["whoWith"],
        }));
      },
    },
    {
      id: "travel-window",
      question: "언제쯤 떠나고 싶으세요?",
      helper: "출발 시기 하나만 잡아도 시즌에 맞는 후보부터 정리돼요.",
      selectedValue: answers.travelWindow,
      options: homeStepTravelWindowOptions.map((option) => ({
        id: `travel-window-${option.value}`,
        value: option.value,
        label: option.label,
        description: option.description,
      })),
      onSelect: (value) => {
        setAnswers((currentState) => ({
          ...currentState,
          travelWindow: value as HomeStepAnswers["travelWindow"],
        }));
      },
    },
    {
      id: "trip-length",
      question: "며칠 정도 생각하고 있나요?",
      helper: "일정 길이가 정해지면 갈 수 있는 후보를 훨씬 현실적으로 좁힐 수 있어요.",
      selectedValue: answers.tripLength,
      options: homeStepTripLengthOptions.map((option) => ({
        id: `trip-length-${option.value}`,
        value: option.value,
        label: option.label,
        description: option.description,
      })),
      onSelect: (value) => {
        setAnswers((currentState) => ({
          ...currentState,
          tripLength: value as HomeStepAnswers["tripLength"],
        }));
      },
    },
    {
      id: "travel-style",
      question: "이번 여행에서는 뭐가 더 중요해요?",
      helper: "최대 3개까지 고를 수 있어요. 실제로 여행에서 먼저 챙기고 싶은 스타일을 골라 주세요.",
      selectedValue: answers.travelStyle ?? [],
      options: homeStepTravelStyleOptions.map((option) => ({
        id: `travel-style-${option.value}`,
        value: option.value,
        label: option.label,
        description: option.description,
      })),
      onSelect: (value) => {
        setAnswers((currentState) => ({
          ...currentState,
          travelStyle: toggleTravelStyleOption(currentState.travelStyle ?? [], value as HomeStepTravelStyle),
        }));
      },
      onNext: () => {
        setCurrentStepIndex((currentValue) => Math.min(currentValue + 1, steps.length - 1));
      },
      nextDisabled: (answers.travelStyle ?? []).length === 0,
    },
    {
      id: "flight-preference",
      question: "비행이나 이동 부담은 어느 정도 괜찮아요?",
      helper: "출발지는 기본값으로 두고, 갈 수 있는 거리 범위만 현실적으로 먼저 맞출게요.",
      selectedValue: answers.flightPreference,
      options: homeStepFlightPreferenceOptions.map((option) => ({
        id: `flight-preference-${option.value}`,
        value: option.value,
        label: option.label,
        description: option.description,
      })),
      onSelect: (value) => {
        setAnswers((currentState) => ({
          ...currentState,
          flightPreference: value as HomeStepAnswers["flightPreference"],
        }));
      },
    },
  ];

  const currentStep = steps[currentStepIndex] ?? steps[0];
  const compareButtonLabel = compareLoading
    ? "비교 보드 저장 중..."
    : canCreateCompare
      ? `${selectedCompareIds.length}곳 비교 보드 만들기`
      : "2개부터 선택하면 비교돼요";

  useEffect(() => {
    if (stage !== "landing" || isSubmitting || results) {
      return;
    }

    if (searchParams.get("start") === "1") {
      startFunnel();
    }
  }, [isSubmitting, results, searchParams, stage]);

  useEffect(() => {
    if (stage !== "landing" || results || isSubmitting) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (nextSearchParams.size === 0) {
      return;
    }

    try {
      const query = parseRecommendationQuery(nextSearchParams);
      void requestRecommendations(query);
    } catch {
    }
  }, [isSubmitting, results, searchParams, stage]);

  function resetFunnel() {
    activeRecommendationRequestRef.current += 1;
    setStage("landing");
    setAnswers(defaultAnswers);
    setCurrentStepIndex(0);
    setResults(null);
    setCards([]);
    setIsSubmitting(false);
    setSubmitError(null);
    setShowAllResults(false);
    setResultFilter("all");
    setResultSort("fit");
    setCopyFallbackUrl(null);
  }

  function startFunnel() {
    activeRecommendationRequestRef.current += 1;
    setStage("question");
    setCurrentStepIndex(0);
    setAnswers(defaultAnswers);
    setResults(null);
    setCards([]);
    setIsSubmitting(false);
    setSubmitError(null);
    setShowAllResults(false);
    setResultFilter("all");
    setResultSort("fit");
    setCopyFallbackUrl(null);
  }

  const copyShareUrl = useCallback(async (shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFallbackUrl(null);
      return true;
    } catch {
      setCopyFallbackUrl(shareUrl);
      return false;
    }
  }, []);

  const createSnapshotReference = useCallback(async (card: RecommendationCardView) => {
    if (!results) {
      return null;
    }

    const existingReference = snapshotReferences[card.destination.id];
    if (existingReference) {
      return existingReference;
    }

    const existingSavedSnapshot = savedSnapshots.find((savedSnapshot) => savedSnapshot.destinationId === card.destination.id);
    if (existingSavedSnapshot) {
      setSnapshotReferences((currentReferences) => ({
        ...currentReferences,
        [card.destination.id]: existingSavedSnapshot,
      }));
      return existingSavedSnapshot;
    }

    const response = await fetch(buildApiUrl("/api/snapshots"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(
        buildRecommendationSnapshotPayload(
          results.query,
          card,
          results.meta.scoringVersion,
          "private",
        ),
      ),
    });

    if (!response.ok) {
      throw new Error("save-failed");
    }

    const payload = (await response.json()) as { snapshotId: string };
    const sharePath = `/s/${payload.snapshotId}`;
    const shareUrl = buildAbsoluteShareUrl(sharePath);
    const snapshotReference: SavedSnapshotCard = {
      snapshotId: payload.snapshotId,
      destinationId: card.destination.id,
      destinationName: card.destination.nameKo,
      sharePath,
      shareUrl,
    };

    setSnapshotReferences((currentReferences) => ({
      ...currentReferences,
      [card.destination.id]: snapshotReference,
    }));

    return snapshotReference;
  }, [results, savedSnapshots, snapshotReferences]);

  const promoteSavedSnapshot = useCallback(
    async (card: RecommendationCardView, snapshotReference: SavedSnapshotCard) => {
      setSnapshotReferences((currentReferences) => ({
        ...currentReferences,
        [card.destination.id]: snapshotReference,
      }));
      setSaveStates((currentState) => ({
        ...currentState,
        [card.destination.id]: {
          status: "saved",
          snapshotId: snapshotReference.snapshotId,
          shareUrl: snapshotReference.shareUrl,
        },
      }));
      setSavedSnapshots((currentSnapshots) =>
        currentSnapshots.some((item) => item.snapshotId === snapshotReference.snapshotId)
          ? currentSnapshots
          : [...currentSnapshots, snapshotReference],
      );
      setSelectedCompareIds((currentSelection) =>
        currentSelection.includes(snapshotReference.snapshotId) || currentSelection.length >= 4
          ? currentSelection
          : [...currentSelection, snapshotReference.snapshotId],
      );
      await copyShareUrl(snapshotReference.shareUrl);
    },
    [copyShareUrl],
  );

  const saveCard = useCallback(async (card: RecommendationCardView) => {
    if (!results) {
      return;
    }

    if (!session.data?.user) {
      const currentRoute = buildCurrentRoute(
        "/",
        buildRecommendationSearchParams(results.query),
      );
      savePostAuthIntent({
        kind: "save-home-card",
        route: currentRoute,
        destinationId: card.destination.id,
      });
      router.push(`/auth?next=${encodeURIComponent(currentRoute)}&intent=save`);
      return;
    }

    const existingSnapshot = savedSnapshots.find((savedSnapshot) => savedSnapshot.destinationId === card.destination.id);

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

    const snapshotReference = snapshotReferences[card.destination.id];
    if (snapshotReference) {
      await promoteSavedSnapshot(card, snapshotReference);
      return;
    }

    setSaveStates((currentState) => ({
      ...currentState,
      [card.destination.id]: { status: "saving" },
    }));

    try {
      const nextSnapshotReference = await createSnapshotReference(card);
      if (!nextSnapshotReference) {
        throw new Error("save-failed");
      }

      await promoteSavedSnapshot(card, nextSnapshotReference);
    } catch {
      setSaveStates((currentState) => ({
        ...currentState,
        [card.destination.id]: { status: "error" },
      }));
    }
  }, [createSnapshotReference, promoteSavedSnapshot, results, router, savedSnapshots, session.data?.user, snapshotReferences]);

  const registerFutureTrip = useCallback(async (card: RecommendationCardView) => {
    if (!session.data?.user) {
      return;
    }

    const currentState = futureTripStates[card.destination.id];
    if (currentState?.status === "saved") {
      return;
    }

    setFutureTripStates((currentStates) => ({
      ...currentStates,
      [card.destination.id]: {
        ...currentStates[card.destination.id],
        status: "saving",
      },
    }));

    try {
      const sourceSnapshot =
        savedSnapshots.find((savedSnapshot) => savedSnapshot.destinationId === card.destination.id) ??
        snapshotReferences[card.destination.id] ??
        (await createSnapshotReference(card));

      if (!sourceSnapshot) {
        throw new Error("source-snapshot-missing");
      }

      const response = await fetch(buildApiUrl("/api/me/future-trips"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          destinationId: card.destination.id,
          sourceSnapshotId: sourceSnapshot.snapshotId,
        }),
      });

      if (!response.ok) {
        throw new Error("future-trip-create-failed");
      }

      const payload = (await response.json()) as { futureTrip: UserFutureTrip };

      setFutureTripStates((currentStates) => ({
        ...currentStates,
        [card.destination.id]: {
          status: "saved",
          futureTripId: payload.futureTrip.id,
          sourceSnapshotId: payload.futureTrip.sourceSnapshotId,
        },
      }));
    } catch {
      setFutureTripStates((currentStates) => ({
        ...currentStates,
        [card.destination.id]: {
          ...currentStates[card.destination.id],
          status: "error",
        },
      }));
    }
  }, [createSnapshotReference, futureTripStates, savedSnapshots, session.data?.user, snapshotReferences]);

  function toggleCompareSelection(snapshotId: string) {
    setCompareError(null);
    setSelectedCompareIds((currentSelection) => {
      if (currentSelection.includes(snapshotId)) {
        return currentSelection.filter((id) => id !== snapshotId);
      }

      if (currentSelection.length >= 4) {
        setCompareError("비교는 저장한 여행 2개부터 4개까지 가능해요.");
        return currentSelection;
      }

      return [...currentSelection, snapshotId];
    });
  }

  const createCompareSnapshot = useCallback(async () => {
    if (!session.data?.user) {
      const currentRoute = buildCurrentRoute(
        "/",
        results ? buildRecommendationSearchParams(results.query) : new URLSearchParams(window.location.search),
      );
      savePostAuthIntent({
        kind: "create-compare",
        route: currentRoute,
      });
      router.push(`/auth?next=${encodeURIComponent(currentRoute)}&intent=share`);
      return;
    }

    const selectedSnapshots = savedSnapshots.filter((snapshot) => selectedCompareIds.includes(snapshot.snapshotId));

    if (selectedSnapshots.length < 2 || selectedSnapshots.length > 4) {
      setCompareError("비교하려면 저장한 여행 2개부터 4개까지 선택해 주세요.");
      return;
    }

    setCompareLoading(true);
    setCompareError(null);

    try {
      const response = await fetch(buildApiUrl("/api/snapshots"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...buildComparisonSnapshotPayload(selectedSnapshots),
          visibility: "public",
        }),
      });

      if (!response.ok) {
        throw new Error("compare-create-failed");
      }

      const payload = (await response.json()) as { snapshotId: string };
      router.push(`/compare/${payload.snapshotId}`);
    } catch {
      setCompareError("비교 보드를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setCompareLoading(false);
    }
  }, [results, router, savedSnapshots, selectedCompareIds, session.data?.user]);

  useEffect(() => {
    if (session.isPending || !session.data?.user || !results) {
      return;
    }

    const currentRoute = buildCurrentRoute(window.location.pathname, new URLSearchParams(window.location.search));
    const intent = consumeMatchingPostAuthIntent(currentRoute);

    if (!intent) {
      return;
    }

    const intentKey = `${intent.kind}:${intent.route}`;
    if (replayedIntentRef.current === intentKey) {
      return;
    }

    replayedIntentRef.current = intentKey;

    if (intent.kind === "save-home-card") {
      const targetCard = cards.find((card) => card.destination.id === intent.destinationId);
      if (targetCard) {
        void saveCard(targetCard);
      }
      return;
    }

    if (intent.kind === "create-compare") {
      void createCompareSnapshot();
    }
  }, [cards, createCompareSnapshot, results, saveCard, session.data?.user, session.isPending]);

  async function requestRecommendations(nextQuery: RecommendationQuery) {
    const requestId = activeRecommendationRequestRef.current + 1;
    activeRecommendationRequestRef.current = requestId;

    setStage("result");
    setIsSubmitting(true);
    setSubmitError(null);
    setResults(null);
    setCards([]);

    try {
      const searchParams = buildRecommendationSearchParams(nextQuery);
      const response = await fetch(buildApiUrl(`/api/recommendations?${searchParams.toString()}`), {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("recommendation-failed");
      }

      const payload = (await response.json()) as RecommendationApiResponse;
      if (activeRecommendationRequestRef.current !== requestId) {
        return;
      }

      setResults(payload);
      setCards(createRecommendationCards(payload.recommendations));
      setResultFilter("all");
      setResultSort("fit");
      setShowAllResults(false);
      requestAnimationFrame(() => {
        scrollToPageTop("auto");
      });
    } catch {
      if (activeRecommendationRequestRef.current !== requestId) {
        return;
      }

      setResults(null);
      setCards([]);
      setSubmitError("지금은 추천 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      requestAnimationFrame(() => {
        scrollToPageTop("auto");
      });
    } finally {
      if (activeRecommendationRequestRef.current === requestId) {
        setIsSubmitting(false);
      }
    }
  }

  async function applyRelaxation(nextQuery: RecommendationQuery) {
    await requestRecommendations(nextQuery);
  }

  function resolveAnswerKey(stepId: HomeFlowStep["id"]): keyof HomeStepAnswers {
    if (stepId === "who-with") {
      return "whoWith";
    }

    if (stepId === "travel-window") {
      return "travelWindow";
    }

    if (stepId === "trip-length") {
      return "tripLength";
    }

    if (stepId === "travel-style") {
      return "travelStyle";
    }

    return "flightPreference";
  }

  function toggleTravelStyleOption(
    currentStyles: HomeStepAnswers["travelStyle"],
    nextStyle: HomeStepTravelStyle,
  ): HomeStepAnswers["travelStyle"] {
    if (currentStyles.includes(nextStyle)) {
      return currentStyles.filter((style) => style !== nextStyle);
    }

    if (currentStyles.length >= 3) {
      return [...currentStyles.slice(1), nextStyle];
    }

    return [...currentStyles, nextStyle];
  }

  function handleStepSelect(stepIndex: number, value: StepOptionValue) {
    if (isSubmitting) {
      return;
    }

    const step = steps[stepIndex];
    if (!step) {
      return;
    }

    if (step.id === "travel-style") {
      step.onSelect(value);
      return;
    }

    const answerKey = resolveAnswerKey(step.id);

    const nextAnswers: Partial<HomeStepAnswers> = {
      ...answers,
      [answerKey]: value as HomeStepAnswers[typeof answerKey],
    };

    setAnswers(nextAnswers);

    if (stepIndex === steps.length - 1) {
      void requestRecommendations(deriveRecommendationQueryFromHomeStepAnswers(nextAnswers));
      return;
    }

    setCurrentStepIndex(stepIndex + 1);
  }

  function goToPreviousStep() {
    if (currentStepIndex === 0) {
      setStage("landing");
      return;
    }

    setCurrentStepIndex((currentValue) => Math.max(0, currentValue - 1));
  }

  function reopenQuestionFlow() {
    activeRecommendationRequestRef.current += 1;
    setIsSubmitting(false);
    setStage("question");
    requestAnimationFrame(() => {
      scrollToElementById("home-question-flow", "auto");
    });
  }

  const landingStage = (
    <LandingPage
      testId={testIds.home.landing}
      heroTestId={testIds.home.heroVisual}
      onStart={startFunnel}
    />
  );

  const questionStage = (
    <div id="home-question-flow">
      <StepQuestion
        current={currentStepIndex + 1}
        total={steps.length}
        questionTestId={testIds.home.question}
        helperTestId={testIds.home.helper}
        progressTestId={testIds.home.progress}
        question={currentStep.question}
        helper={currentStep.helper}
        onBack={goToPreviousStep}
        onReset={resetFunnel}
        isSubmitting={isSubmitting}
        nextLabel="다음"
        onNext={currentStep.onNext}
        nextDisabled={currentStep.nextDisabled}
        options={currentStep.options.map((option, index) => ({
          id: option.id,
          label: option.label,
          description: option.description,
          selected: Array.isArray(currentStep.selectedValue)
            ? currentStep.selectedValue.includes(option.value)
            : currentStep.selectedValue === option.value,
          testId: getHomeChoiceTestId(index),
          onSelect: () => handleStepSelect(currentStepIndex, option.value),
        }))}
      />
    </div>
  );

  const resultStage = (
    <div id="home-results-anchor">
      <ResultPage
        testId={testIds.home.resultPage}
        leadTitle={leadCard ? leadCard.destination.nameKo : isSubmitting ? "추천 결과를 정리하고 있어요." : "다시 맞는 후보를 찾고 있어요."}
        leadReason={leadCard?.recommendation.reasons[0] ?? "결과가 나오면 가장 먼저 볼 목적지를 짧게 정리해 드릴게요."}
        leadDescription={leadCard ? leadCard.recommendation.whyThisFits : queryNarrative}
        leadTags={leadCard ? leadCard.destination.vibeTags.slice(0, 3).map((tag) => formatResultVibeLabel(tag)) : []}
        leadFacts={leadCard ? buildRecommendationDecisionFacts(leadCard.destination) : []}
        leadSupportSlot={
          leadCard ? (
            <LeadSocialVideoPanel
              key={`${leadCard.destination.id}-${resultQuery.partyType}-${resultQuery.partySize}-${resultQuery.budgetBand}-${resultQuery.tripLengthDays}-${resultQuery.departureAirport}-${resultQuery.travelMonth}-${resultQuery.pace}-${resultQuery.flightTolerance}-${resultQuery.vibes.join(",")}`}
              destinationId={leadCard.destination.id}
              destinationName={leadCard.destination.nameKo}
              leadReason={leadCard.recommendation.reasons[0] ?? leadCard.recommendation.whyThisFits}
              query={resultQuery}
            />
          ) : null
        }
        leadDetails={
          leadCard ? (
            (() => {
              const saveState = saveStates[leadCard.destination.id] ?? { status: "idle" };
              const futureTripState = futureTripStates[leadCard.destination.id] ?? { status: "idle" };
              const detailPath = buildDestinationDetailPath(leadCard.destination, results?.query ?? currentQuery, saveState.snapshotId);

              return (
                <div className="space-y-4">
                  <section data-testid={getInstagramVibeTestId(0)} className="space-y-2.5">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={detailPath}
                        className="inline-flex min-h-[2.9rem] items-center rounded-full bg-[var(--color-action-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--color-action-primary-strong)]"
                      >
                        상세 보기
                      </Link>
                      {session.data?.user ? (
                        <button
                          type="button"
                          data-testid={getFutureTripCtaTestId(0)}
                          onClick={() => {
                            void registerFutureTrip(leadCard);
                          }}
                          disabled={futureTripState.status === "saving" || futureTripState.status === "saved"}
                          className="inline-flex min-h-[2.9rem] items-center rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {futureTripState.status === "saving"
                            ? "담는 중..."
                            : futureTripState.status === "saved"
                              ? "다음 여행 담음"
                              : "다음 여행 담기"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        data-testid={getSaveSnapshotTestId(0)}
                        onClick={() => {
                          void saveCard(leadCard);
                        }}
                        disabled={saveState.status === "saving"}
                        className="inline-flex min-h-[2.9rem] items-center rounded-full border border-[color:var(--color-funnel-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-[var(--color-funnel-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saveState.status === "saving"
                          ? "담는 중..."
                          : saveState.status === "saved"
                            ? "일정에 담김"
                            : "일정 담기"}
                      </button>
                    </div>
                  </section>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-funnel-text-soft)]">
                    <button
                      type="button"
                      onClick={reopenQuestionFlow}
                      className="transition-colors duration-200 hover:text-[var(--color-funnel-text)]"
                    >
                      다시 고르기
                    </button>
                    <button type="button" onClick={resetFunnel} className="transition-colors duration-200 hover:text-[var(--color-funnel-text)]">
                      처음부터 다시 하기
                    </button>
                    {saveState.shareUrl ? (
                      <>
                        <Link
                          data-testid={testIds.snapshot.shareLink}
                          href={`/s/${saveState.snapshotId ?? ""}`}
                          className="transition-colors duration-200 hover:text-[var(--color-funnel-text)]"
                        >
                          공유 페이지 보기
                        </Link>
                        <button
                          type="button"
                          data-testid={testIds.snapshot.copyShareLink}
                          onClick={() => {
                            void copyShareUrl(saveState.shareUrl ?? "");
                          }}
                          className="transition-colors duration-200 hover:text-[var(--color-funnel-text)]"
                        >
                          링크 복사
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })()
          ) : null
        }
        resultMeta={
          <>
            {results ? (
              <>
                <span className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-funnel-text-soft)]">
                  결과 {results.meta.resultCount}곳
                </span>
                <span className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-funnel-text-soft)]">
                  {formatEvidenceMode(results.sourceSummary.mode)} 참고
                </span>
              </>
            ) : null}
          </>
        }
        personalized={Boolean(results?.meta.personalized)}
        briefItems={briefItems}
        leadWeatherSlot={
          leadCard ? (
            <TravelSupportPanel
              supplement={results?.leadSupplement}
              destinationName={leadCard.destination.nameKo}
              travelMonth={results?.query.travelMonth}
              layout="summary"
            />
          ) : null
        }
        filtersSlot={
          <article
            data-testid={testIds.result.filterBar}
            className="rounded-[1.75rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-funnel-text-soft)]">
                  결과 조정
                </p>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
                  대표 추천을 먼저 보고, 아래 후보만 짧게 비교해 보세요.
                </p>
              </div>

              <label className="grid gap-2 text-sm text-[var(--color-funnel-text)] lg:min-w-[12rem]">
                <span>정렬</span>
                <select
                  value={resultSort}
                  onChange={(event) => setResultSort(event.target.value as ResultSortKey)}
                  className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-funnel-text)]"
                >
                  <option value="fit">적합도 순</option>
                  <option value="shortest-flight">가까운 비행 순</option>
                  <option value="budget">예산 가벼운 순</option>
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {resultFilterOptions.map((option, index) => (
                <button
                  key={option.key}
                  type="button"
                  data-testid={getResultFilterChipTestId(index)}
                  onClick={() => setResultFilter(option.key)}
                  className={`rounded-full border px-3.5 py-2 text-xs font-semibold tracking-[0.04em] transition-colors duration-200 ${
                    resultFilter === option.key
                      ? "border-[color:var(--color-funnel-text)] bg-[var(--color-funnel-text)] text-white"
                      : "border-[color:var(--color-funnel-border)] bg-white text-[var(--color-funnel-text)] hover:bg-[var(--color-funnel-muted)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </article>
        }
        statusSlot={
          <>
            {submitError ? (
              <div className="rounded-[1.5rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-4 py-4 text-sm leading-6 text-[var(--color-funnel-text)]">
                <p>{submitError}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void requestRecommendations(currentQuery);
                    }}
                    className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-2 text-xs font-semibold tracking-[0.04em] text-[var(--color-funnel-text)]"
                  >
                    다시 시도
                  </button>
                  <button
                    type="button"
                    onClick={reopenQuestionFlow}
                    className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-2 text-xs font-semibold tracking-[0.04em] text-[var(--color-funnel-text)]"
                  >
                    질문 다시 고르기
                  </button>
                </div>
              </div>
            ) : null}

            {copyFallbackUrl ? (
              <div className="rounded-[1.5rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-4 shadow-[var(--shadow-funnel-card)]">
                <p className="text-sm font-semibold text-[var(--color-funnel-text)]">링크 복사가 실패했어요.</p>
                <p className="mt-1 text-sm leading-6 text-[var(--color-funnel-text-soft)]">아래 링크를 길게 눌러 복사해 주세요.</p>
                <input
                  type="text"
                  readOnly
                  value={copyFallbackUrl}
                  onFocus={(event) => event.currentTarget.select()}
                  className="mt-2 w-full rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-2.5 text-xs font-semibold text-[var(--color-funnel-text)]"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void copyShareUrl(copyFallbackUrl);
                    }}
                    className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-2 text-xs font-semibold tracking-[0.04em] text-[var(--color-funnel-text)]"
                  >
                    다시 시도
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCopyFallbackUrl(null);
                    }}
                    className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-2 text-xs font-semibold tracking-[0.04em] text-[var(--color-funnel-text)]"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : null}

            {isSubmitting ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((placeholder) => (
                  <div
                    key={`loading-card-${placeholder}`}
                    className="rounded-[1.5rem] border border-[color:var(--color-funnel-border)] bg-white p-5 shadow-[var(--shadow-funnel-card)]"
                  >
                    <div className="compass-skeleton-shimmer h-4 w-20 rounded-full" />
                    <div className="compass-skeleton-shimmer mt-4 h-8 w-2/3 rounded-full" />
                    <div className="compass-skeleton-shimmer mt-4 h-4 w-full rounded-full" />
                    <div className="compass-skeleton-shimmer mt-2 h-4 w-5/6 rounded-full" />
                  </div>
                ))}
              </div>
            ) : null}

            {results && cards.length === 0 ? (
              <div
                data-testid={testIds.result.emptyState}
                className="rounded-[1.5rem] border border-[color:var(--color-funnel-border)] bg-white p-4 shadow-[var(--shadow-funnel-card)]"
              >
                <p className="text-base font-semibold text-[var(--color-funnel-text)]">지금 조건에 딱 맞는 목적지가 없어요.</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-funnel-text-soft)]">아래에서 한 가지만 풀어도 바로 다시 볼 수 있어요.</p>
                <div data-testid={testIds.result.relaxableFilters} className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {emptyStateActions.map((action, index) => (
                    <button
                      key={action.id}
                      type="button"
                      data-testid={getRelaxFilterActionTestId(index)}
                      onClick={() => {
                        void applyRelaxation(action.nextQuery);
                      }}
                      disabled={isSubmitting}
                      className="rounded-[1.25rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-4 py-3.5 text-left disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="block text-xs font-semibold tracking-[0.04em] text-[var(--color-funnel-text-soft)]">바로 완화하기</span>
                      <span className="mt-2.5 block text-sm font-semibold text-[var(--color-funnel-text)]">{action.label}</span>
                      <span className="mt-2 block text-xs leading-5 text-[var(--color-funnel-text-soft)]">{action.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        }
        resultsSlot={
          secondaryCards.length > 0 ? (
            <div className="space-y-3.5">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-funnel-text-soft)]">
                    다른 후보
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
                    핵심만 간단히 비교하고 바로 저장하거나 비교 보드로 넘겨 보세요.
                  </p>
                </div>
                {filteredCards.length > 4 ? (
                  <button
                    type="button"
                    data-testid={testIds.result.showMoreResults}
                    onClick={() => setShowAllResults((currentValue) => !currentValue)}
                    className="inline-flex min-h-[2.9rem] items-center rounded-full border border-[color:var(--color-funnel-border)] bg-white px-4 py-3 text-sm font-semibold tracking-[0.04em] text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-[var(--color-funnel-muted)]"
                  >
                    {showAllResults ? "상위 결과만 보기" : `후보 ${filteredCards.length - 4}곳 더 보기`}
                  </button>
                ) : null}
              </div>

              <div data-testid={testIds.result.topList} className="grid gap-2.5">
                {secondaryCards.map((card, index) => {
                  const cardIndex = index + 1;
                  const saveState = saveStates[card.destination.id] ?? { status: "idle" };

                  return (
                    <CompactRecommendationItem
                      key={card.destination.id}
                      card={card}
                      index={cardIndex}
                      query={results?.query ?? currentQuery}
                      showFutureTripCta={Boolean(session.data?.user)}
                      saveState={saveState}
                      onSave={(nextCard) => {
                        void saveCard(nextCard);
                      }}
                      onCopy={(shareUrl) => {
                        void copyShareUrl(shareUrl);
                      }}
                      futureTripState={futureTripStates[card.destination.id] ?? { status: "idle" }}
                      onRegisterFutureTrip={(nextCard) => {
                        void registerFutureTrip(nextCard);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : null
        }
        savedSlot={
          <>
            {savedSnapshots.length > 0 ? (
              <article id="saved-snapshots-section" className="rounded-[var(--radius-card)] border border-[color:var(--color-funnel-border)] bg-white px-3.5 py-3.5 sm:px-4 sm:py-4">
                <div className="flex flex-col gap-3 border-b border-[color:var(--color-stage-divider)] pb-3.5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="compass-editorial-kicker">내 일정 후보</p>
                    <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                      마음에 드는 여행만 모아 비교 보드로 넘기면 마지막 결정이 더 쉬워져요.
                    </p>
                    <div
                      data-testid={testIds.snapshot.compareSelectionCount}
                      className="compass-metric-pill mt-2.5 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    >
                      선택 {selectedCompareIds.length}개 · 최대 4개
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid={testIds.snapshot.compareSnapshot}
                    onClick={() => {
                      void createCompareSnapshot();
                    }}
                    disabled={!canCreateCompare || compareLoading}
                    className="rounded-full bg-[var(--color-funnel-text)] px-4 py-3 text-sm font-semibold tracking-[0.04em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {compareButtonLabel}
                  </button>
                </div>

                <div className="mt-3 grid gap-2.5">
                  {savedSnapshots.map((snapshot, index) => (
                    <SavedSnapshotCompactItem
                      key={snapshot.snapshotId}
                      snapshot={snapshot}
                      index={index}
                      selected={selectedCompareIds.includes(snapshot.snapshotId)}
                      onToggle={toggleCompareSelection}
                      onCopy={(shareUrl) => {
                        void copyShareUrl(shareUrl);
                      }}
                    />
                  ))}
                </div>

                {compareError ? (
                  <p className="compass-warning-card mt-3 rounded-[calc(var(--radius-card)-10px)] px-4 py-3 text-sm leading-6">
                    {compareError}
                  </p>
      ) : null}
              </article>
            ) : null}

            {savedSnapshots.length > 0 ? (
              <div className="pointer-events-none fixed inset-x-4 bottom-4 z-30 md:hidden">
                <article
                  data-testid={testIds.snapshot.stickyCompareTray}
                  className="pointer-events-auto rounded-[calc(var(--radius-card)-6px)] border border-[color:var(--color-funnel-border)] bg-white px-4 py-3.5 shadow-[var(--shadow-funnel-card)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="compass-editorial-kicker">비교 트레이</p>
                      <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">
                        {compareTrayDestinations || `${savedSnapshots.length}개 저장 여행`}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">
                        저장 {savedSnapshots.length}개 · 선택 {selectedCompareIds.length}개
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollToElementById("saved-snapshots-section")}
                      className="compass-action-secondary compass-soft-press rounded-full px-3 py-2 text-[11px] font-semibold tracking-[0.04em]"
                    >
                      카드 보기
                    </button>
                  </div>

                  <button
                    type="button"
                    data-testid={testIds.snapshot.stickyCompareAction}
                    onClick={() => {
                      void createCompareSnapshot();
                    }}
                    disabled={!canCreateCompare || compareLoading}
                    className="compass-action-primary compass-soft-press mt-3 w-full rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {compareButtonLabel}
                  </button>
                </article>
              </div>
            ) : null}
          </>
        }
      />
    </div>
  );

  return (
    <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
      <div
        className={`-mx-3 min-h-screen bg-white sm:-mx-4 ${savedSnapshots.length > 0 && stage === "result" ? "pb-28 md:pb-0" : ""}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <div key={stage} className="space-y-4">
            {stage === "landing" ? landingStage : null}
            {stage === "question" ? questionStage : null}
            {stage === "result" ? resultStage : null}
          </div>
        </AnimatePresence>
      </div>
    </ExperienceShell>
  );
}
