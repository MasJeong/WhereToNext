"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import type { ComparisonSnapshot, RecommendationQuery } from "@/lib/domain/contracts";
import {
  buildDestinationDetailPath,
  buildRecommendationEvidenceLead,
  buildQueryNarrative,
  buildRecommendationSearchParams,
  buildRecommendationTrustSignals,
  buildRecommendationVerdict,
  buildSnapshotPath,
  buildStructuredTripBrief,
  createRecommendationCards,
  formatBudgetBand,
  formatDepartureAirport,
  formatEvidenceMode,
  formatFlightBand,
  formatTravelMonth,
  formatVibeList,
  type RecommendationApiResponse,
  type RecommendationCardView,
} from "@/lib/trip-compass/presentation";
import { buildRecommendationSnapshotPayload } from "@/lib/trip-compass/snapshot-payload";
import {
  defaultHomeStepAnswers,
  deriveRecommendationQueryFromHomeStepAnswers,
  homeStepCompanionOptions,
  homeStepDepartureOptions,
  homeStepMainVibeOptions,
  homeStepTripRhythmOptions,
  type HomeStepAnswers,
} from "@/lib/trip-compass/step-answer-adapter";
import {
  getHomeChoiceTestId,
  getInstagramVibeTestId,
  getRelaxFilterActionTestId,
  getResultCardTestId,
  getResultTopItemTestId,
  getSaveSnapshotTestId,
  getSavedSnapshotTestId,
  testIds,
} from "@/lib/test-ids";

import { ExperienceShell } from "./experience-shell";

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

type RelaxationAction = {
  id: "trip-length" | "flight-tolerance" | "departure-airport" | "secondary-vibe" | "travel-month";
  label: string;
  description: string;
  nextQuery: RecommendationQuery;
};

type StepOptionValue = string | number | null;

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
  selectedValue?: StepOptionValue;
  options: StepOptionView[];
  onSelect: (value: StepOptionValue) => void;
};

type StepChoiceButtonProps = {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  testId: string;
};

type BrowsePreviewCardProps = {
  destinationId: string;
  query: RecommendationQuery;
};

type SavedSnapshotCompactItemProps = {
  snapshot: SavedSnapshotCard;
  index: number;
  selected: boolean;
  onToggle: (snapshotId: string) => void;
  onCopy: (shareUrl: string) => void;
};

type CompactRecommendationCardProps = {
  card: RecommendationCardView;
  index: number;
  query: RecommendationQuery;
  saveState: SaveState;
  onSave: (card: RecommendationCardView) => void;
  onCopy: (shareUrl: string) => void;
};

const tripLengthRelaxationOrder = [3, 5, 8] as const;
const flightToleranceRelaxationOrder = ["short", "medium", "long"] as const;
const travelMonthRelaxationOrder = [7, 10, 12] as const;
const homeMainVibeStepOptions = homeStepMainVibeOptions.filter((option) =>
  ["romance", "food", "nature", "city"].includes(option.value),
);
const homeTravelWindowStepOptions: StepOptionView[] = [
  {
    id: "travel-window-4",
    value: 4,
    label: "4월",
    description: "봄 날씨에 가볍게 움직이기 좋은 시기예요.",
  },
  {
    id: "travel-window-7",
    value: 7,
    label: "7월",
    description: "여름 휴가 흐름에 맞춰 바로 떠나기 좋아요.",
  },
  {
    id: "travel-window-10",
    value: 10,
    label: "10월",
    description: "날씨와 이동감이 안정적인 대표 시즌이에요.",
  },
  {
    id: "travel-window-12",
    value: 12,
    label: "12월",
    description: "연말 분위기와 겨울 장면을 기대하기 좋아요.",
  },
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

function buildRelaxationActions(query: RecommendationQuery): RelaxationAction[] {
  const actions: RelaxationAction[] = [];
  const nextTripLength = getNextRelaxedOption(query.tripLengthDays, tripLengthRelaxationOrder);
  const nextFlightTolerance = getNextRelaxedOption(
    query.flightTolerance,
    flightToleranceRelaxationOrder,
  );

  if (nextTripLength) {
    actions.push({
      id: "trip-length",
      label: `일정을 ${nextTripLength}일로 넓히기`,
      description: "짧은 일정 제약을 줄여 후보 풀을 조금 더 넓혀요.",
      nextQuery: { ...query, tripLengthDays: nextTripLength },
    });
  }

  if (nextFlightTolerance) {
    actions.push({
      id: "flight-tolerance",
      label: `비행 범위를 ${nextFlightTolerance === "short" ? "단거리" : nextFlightTolerance === "medium" ? "중거리" : "장거리"}까지 넓히기`,
      description: "거리 제한을 조금 풀어 더 넓은 후보군을 확인해요.",
      nextQuery: { ...query, flightTolerance: nextFlightTolerance },
    });
  }

  if (query.departureAirport !== "ICN") {
    actions.push({
      id: "departure-airport",
      label: "출발 공항을 인천(ICN)으로 바꾸기",
      description: "노선 선택지가 가장 넓은 기준으로 다시 찾아봐요.",
      nextQuery: { ...query, departureAirport: "ICN" },
    });
  }

  if (query.vibes.length > 1) {
    actions.push({
      id: "secondary-vibe",
      label: "보조 분위기 조건 빼기",
      description: "대표 분위기 하나만 남겨 먼저 넓게 추천을 받아요.",
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
      description: "다른 대표 시즌으로 바꿔 다시 확인해 봐요.",
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

function scrollToElementById(elementId: string) {
  document.getElementById(elementId)?.scrollIntoView({
    behavior: getMotionBehavior(),
    block: "start",
  });
}

function StepChoiceButton({ label, description, active, onClick, testId }: StepChoiceButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className={`compass-home-answer-card compass-soft-press rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5 text-left ${
        active ? "compass-selected" : "compass-selection-chip"
      }`}
    >
      <span className="block text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">{label}</span>
      <span className="mt-2 block text-xs leading-5 text-[var(--color-ink-soft)]">{description}</span>
    </button>
  );
}

function BrowsePreviewCard({ destinationId, query }: BrowsePreviewCardProps) {
  const destination = launchCatalog.find((item) => item.id === destinationId);

  if (!destination) {
    return null;
  }

  return (
    <Link
      href={buildDestinationDetailPath(destination, query)}
      className="compass-open-info compass-soft-press rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5"
    >
      <p className="compass-editorial-kicker">{destination.countryCode}</p>
      <p className="mt-1.5 font-display text-[0.98rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
        {destination.nameKo}
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{destination.nameEn}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
          {formatBudgetBand(destination.budgetBand)}
        </span>
        <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
          {formatVibeList(destination.vibeTags.slice(0, 2))}
        </span>
      </div>
    </Link>
  );
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
      className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="compass-editorial-kicker">저장한 카드 {index + 1}</p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">{snapshot.destinationName}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">
            다시 열거나 비교 후보로 바로 담을 수 있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(snapshot.snapshotId)}
          className={`rounded-full px-3 py-2 text-xs font-semibold ${
            selected ? "compass-selected" : "compass-selection-chip"
          }`}
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

function CompactRecommendationCard({
  card,
  index,
  query,
  saveState,
  onSave,
  onCopy,
}: CompactRecommendationCardProps) {
  const verdict = buildRecommendationVerdict(card, query);
  const trustSignals = buildRecommendationTrustSignals(card, query);
  const primaryEvidence = buildRecommendationEvidenceLead(card);
  const destination = card.destination;
  const detailPath = buildDestinationDetailPath(destination, query, saveState.snapshotId);

  return (
    <article
      data-testid={getResultCardTestId(index)}
      className="compass-top-summary rounded-[calc(var(--radius-card)-2px)] px-3.5 py-3.5 sm:px-4 sm:py-4"
    >
      <div className="flex flex-col gap-3 border-b border-[color:var(--color-stage-divider)] pb-3.5">
        <div className="flex items-start justify-between gap-3">
          <div data-testid={getResultTopItemTestId(index)}>
            <p className="compass-editorial-kicker">TOP {index + 1}</p>
            <h3 className="mt-1.5 font-display text-[1.2rem] leading-[0.96] tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.28rem]">
              {destination.nameKo}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              {destination.nameEn} · {destination.countryCode}
            </p>
          </div>

          <div className="flex flex-col gap-2 text-right">
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              {card.recommendation.scoreBreakdown.total}점
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              일치 {card.recommendation.confidence}%
            </span>
          </div>
        </div>

        <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3">
          <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
            먼저 보는 이유
          </p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">{verdict.headline}</p>
          <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
            {card.recommendation.whyThisFits}
          </p>
        </div>

        <div className="compass-fact-grid-compact">
          <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3">
            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">대표 분위기</p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">
              {formatVibeList(destination.vibeTags.slice(0, 2))}
            </p>
          </div>
          <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3">
            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">예산 감각</p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">
              {formatBudgetBand(destination.budgetBand)}
            </p>
          </div>
          <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3">
            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">비행 거리</p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">
              {formatFlightBand(destination.flightBand)}
            </p>
          </div>
          <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3">
            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">근거 모드</p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">{primaryEvidence.label}</p>
          </div>
        </div>
      </div>

      <div className="compass-compact-stack mt-3.5">
        <section className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
          <p className="compass-editorial-kicker">왜 먼저 봐야 하는지</p>
          <div className="compass-section-row mt-2.5">
            <p className="text-sm font-semibold text-[var(--color-ink)]">{verdict.support}</p>
          </div>
        </section>

        <section className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
          <p className="compass-editorial-kicker">먼저 확인할 신뢰 신호</p>
          <div className="mt-2.5 grid gap-2">
            {trustSignals.map((signal) => (
              <div key={signal.id} className="compass-section-row">
                <p className="text-[0.64rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                  {signal.label}
                </p>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{signal.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section
        data-testid={getInstagramVibeTestId(index)}
        className="compass-open-info mt-3.5 rounded-[calc(var(--radius-card)-10px)] px-4 py-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="compass-editorial-kicker">분위기 근거</p>
            <p className="mt-1.5 text-xs uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
              {primaryEvidence.label} · {primaryEvidence.sourceLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">{primaryEvidence.detail}</p>
          </div>
          {primaryEvidence.sourceUrl ? (
            <a
              href={primaryEvidence.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="compass-action-secondary rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
            >
              원문 보기
            </a>
          ) : null}
        </div>
      </section>

      <div className="mt-3.5 flex flex-wrap gap-2">
        <Link
          href={detailPath}
          className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
        >
          상세 보기
        </Link>
        <button
          type="button"
          data-testid={getSaveSnapshotTestId(index)}
          onClick={() => onSave(card)}
          disabled={saveState.status === "saving"}
          className="compass-action-primary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
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
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
            >
              공유 페이지 보기
            </Link>
            <button
              type="button"
              data-testid={testIds.snapshot.copyShareLink}
              onClick={() => onCopy(saveState.shareUrl ?? "")}
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
            >
              링크 복사
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export function HomeExperience() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<HomeStepAnswers>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [showBrowse, setShowBrowse] = useState(false);
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

  const currentQuery = useMemo(() => deriveRecommendationQueryFromHomeStepAnswers(answers), [answers]);
  const resultQuery = results?.query ?? currentQuery;
  const queryNarrative = useMemo(() => buildQueryNarrative(resultQuery), [resultQuery]);
  const structuredTripBrief = useMemo(() => buildStructuredTripBrief(resultQuery), [resultQuery]);
  const emptyStateActions = useMemo(() => buildRelaxationActions(resultQuery), [resultQuery]);
  const visibleCards = showAllResults ? cards : cards.slice(0, 3);
  const leadCard = cards[0] ?? null;
  const canCreateCompare = selectedCompareIds.length >= 2 && selectedCompareIds.length <= 4;
  const hasResultStage = Boolean(results || submitError || isSubmitting);
  const filteredBrowseDestinations = useMemo(() => {
    const loweredSearch = searchText.trim().toLowerCase();

    return launchCatalog
      .filter((destination) => {
        if (!loweredSearch) {
          return true;
        }

        return (
          destination.nameKo.includes(searchText.trim()) ||
          destination.nameEn.toLowerCase().includes(loweredSearch) ||
          destination.countryCode.toLowerCase().includes(loweredSearch)
        );
      })
      .slice(0, 4);
  }, [searchText]);
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

  const steps: HomeFlowStep[] = [
    {
      id: "who-with",
      question: "누구와 떠나세요?",
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
      options: homeTravelWindowStepOptions,
      onSelect: (value) => {
        setAnswers((currentState) => ({
          ...currentState,
          travelWindow: value as HomeStepAnswers["travelWindow"],
        }));
      },
    },
    {
      id: "trip-rhythm",
      question: "이번 여행 리듬은 어떤 쪽이 좋아요?",
      helper: "일정 길이, 밀도, 비행 부담을 한 번에 가볍게 맞춰요.",
      selectedValue: answers.tripRhythm,
      options: homeStepTripRhythmOptions.map((option) => ({
        id: `trip-rhythm-${option.value}`,
        value: option.value,
        label: option.label,
        description: option.description,
      })),
      onSelect: (value) => {
        setAnswers((currentState) => ({
          ...currentState,
          tripRhythm: value as HomeStepAnswers["tripRhythm"],
        }));
      },
    },
    {
      id: "main-vibe",
      question: "가장 먼저 챙기고 싶은 분위기는요?",
      helper: "대표 분위기 하나만 정하면 TOP 후보가 훨씬 빨리 좁혀져요.",
      selectedValue: answers.mainVibe,
      options: homeMainVibeStepOptions.map((option) => ({
        id: `main-vibe-${option.value}`,
        value: option.value,
        label: option.label,
        description: option.description,
      })),
      onSelect: (value) => {
        setAnswers((currentState) => ({
          ...currentState,
          mainVibe: value as HomeStepAnswers["mainVibe"],
        }));
      },
    },
    {
      id: "departure-choice",
      question: "출발은 어디 기준으로 볼까요?",
      helper: "한국 출발 흐름을 맞추기 위한 마지막 한 질문이에요.",
      selectedValue: answers.departureChoice,
      options: homeStepDepartureOptions.map((option) => ({
        id: `departure-choice-${option.value}`,
        value: option.value,
        label: option.label,
        description: option.description,
      })),
      onSelect: (value) => {
        setAnswers((currentState) => ({
          ...currentState,
          departureChoice: value as HomeStepAnswers["departureChoice"],
        }));
      },
    },
  ];

  const currentStep = steps[currentStepIndex] ?? steps[0];
  const answeredCount = steps.filter((step) => step.selectedValue !== undefined).length;
  const isLastStep = currentStepIndex === steps.length - 1;
  const canAdvance = currentStep.selectedValue !== undefined;
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;
  const compareButtonLabel = compareLoading
    ? "비교 보드 저장 중..."
    : canCreateCompare
      ? `${selectedCompareIds.length}곳 비교 보드 만들기`
      : "2개부터 선택하면 비교돼요";

  async function copyShareUrl(shareUrl: string) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch {
      return false;
    }
  }

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
      requestAnimationFrame(() => {
        scrollToElementById("home-results-anchor");
      });
    } catch {
      setResults(null);
      setCards([]);
      setSubmitError("지금은 추천 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      requestAnimationFrame(() => {
        scrollToElementById("home-results-anchor");
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function applyRelaxation(nextQuery: RecommendationQuery) {
    await requestRecommendations(nextQuery);
  }

  async function submitRecommendation() {
    await requestRecommendations(currentQuery);
  }

  function handlePrimaryAction() {
    if (isLastStep) {
      void submitRecommendation();
      return;
    }

    setCurrentStepIndex((currentValue) => Math.min(currentValue + 1, steps.length - 1));
  }

  return (
    <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader>
      <div className={`space-y-3.5 ${savedSnapshots.length > 0 ? "pb-28 md:pb-0" : ""}`}>
        <section className="compass-desk rounded-[var(--radius-card)] px-3.5 py-4 sm:px-4 sm:py-4">
          <div className="border-b border-[color:var(--color-stage-divider)] pb-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="compass-editorial-kicker">질문 {currentStepIndex + 1}</p>
                <p className="mt-1 text-[11px] leading-5 text-[var(--color-ink-soft)]">
                  기본은 {formatBudgetBand(defaultHomeStepAnswers.budgetFeel)} · {" "}
                  {formatDepartureAirport(defaultHomeStepAnswers.departureChoice)} 출발이에요.
                </p>
              </div>
              <span
                data-testid={testIds.home.progress}
                className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold"
              >
                {currentStepIndex + 1} / {steps.length}
              </span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-[color:var(--color-stage-divider)]">
              <div
                className="h-full rounded-full bg-[color:var(--color-action-primary)] transition-[width] duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <h1
              data-testid={testIds.home.question}
              className="mt-4 font-display text-[1.46rem] leading-[0.96] tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.72rem]"
            >
              {currentStep.question}
            </h1>
            <p
              data-testid={testIds.home.helper}
              className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]"
            >
              {currentStep.helper}
            </p>
          </div>

          <div className="compass-home-answer-grid mt-4">
            {currentStep.options.map((option, index) => (
              <StepChoiceButton
                key={option.id}
                label={option.label}
                description={option.description}
                active={currentStep.selectedValue === option.value}
                onClick={() => currentStep.onSelect(option.value)}
                testId={getHomeChoiceTestId(index)}
              />
            ))}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
            <button
              type="button"
              data-testid={testIds.home.previous}
              onClick={() => setCurrentStepIndex((currentValue) => Math.max(0, currentValue - 1))}
              disabled={currentStepIndex === 0}
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            <button
              type="button"
              data-testid={testIds.home.next}
              onClick={handlePrimaryAction}
              disabled={!canAdvance || isSubmitting}
              className="compass-action-primary compass-soft-press rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLastStep ? "TOP 추천 보기" : "다음 질문"}
            </button>
          </div>

          <button
            type="button"
            data-testid={testIds.query.submitRecommendation}
            onClick={() => {
              void submitRecommendation();
            }}
            disabled={isSubmitting}
            className="compass-action-secondary compass-soft-press mt-2.5 w-full rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "TOP 후보를 고르는 중..." : "지금 추천 보기"}
          </button>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              {answeredCount}개 선택 완료
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              {steps.length - answeredCount}개 남음
            </span>
          </div>
        </section>

        <section
          data-testid={testIds.home.browseStrip}
          className="compass-open-info rounded-[calc(var(--radius-card)-4px)] px-3.5 py-3.5 sm:px-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="compass-editorial-kicker">바로 찾기</p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                이름으로 먼저 보고 싶다면 여기서 빠르게 열어 보세요.
              </p>
            </div>
            <button
              type="button"
              data-testid={testIds.home.searchTrigger}
              onClick={() => setShowBrowse((currentValue) => !currentValue)}
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
            >
              {showBrowse ? "닫기" : "검색 열기"}
            </button>
          </div>

          {showBrowse ? (
            <div className="mt-3 grid gap-3">
              <label className="grid gap-2 text-sm text-[var(--color-ink)]">
                <span>목적지 검색</span>
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  className="compass-form-field-light rounded-[calc(var(--radius-card)-10px)] px-4 py-3"
                  placeholder="도쿄, 파리, JP처럼 검색해 보세요"
                />
              </label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {filteredBrowseDestinations.map((destination) => (
                  <BrowsePreviewCard
                    key={destination.id}
                    destinationId={destination.id}
                    query={currentQuery}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {hasResultStage ? (
          <section id="home-results-anchor" className="space-y-3.5">
            <article
              data-testid={testIds.home.topSummary}
              className="compass-top-summary rounded-[var(--radius-card)] px-3.5 py-3.5 sm:px-4 sm:py-4"
            >
              <div className="flex flex-col gap-3 border-b border-[color:var(--color-stage-divider)] pb-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="compass-editorial-kicker">TOP 요약</span>
                  {results ? (
                    <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                      결과 {results.meta.resultCount}곳
                    </span>
                  ) : null}
                  {results ? (
                    <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                      {formatEvidenceMode(results.sourceSummary.mode)} 근거
                    </span>
                  ) : null}
                </div>

                <div>
                  <h2 className="font-display text-[1.24rem] leading-[0.98] tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.46rem]">
                    {leadCard
                      ? `${leadCard.destination.nameKo}부터 보면 좋아요.`
                      : isSubmitting
                        ? "조건에 맞는 TOP 후보를 정리하고 있어요."
                        : "지금 조건으로 다시 맞는 후보를 찾고 있어요."}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                    {leadCard ? leadCard.recommendation.whyThisFits : queryNarrative}
                  </p>
                </div>
              </div>

              <div data-testid={testIds.result.querySummary} className="compass-fact-grid-compact mt-3.5">
                {structuredTripBrief.map((item) => (
                  <article key={item.id} className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                      {item.value}
                    </p>
                  </article>
                ))}
              </div>

              {results?.meta.personalized ? (
                <p
                  data-testid={testIds.shell.personalizedNote}
                  className="compass-open-info mt-3 rounded-[calc(var(--radius-card)-12px)] px-4 py-3.5 text-sm leading-6"
                >
                  개인화 안내 · 로그인한 여행 기록과 취향 모드가 함께 반영되고 있어요.
                </p>
              ) : null}
            </article>

            {submitError ? (
              <p className="compass-warning-card rounded-[calc(var(--radius-card)-4px)] px-4 py-3 text-sm leading-6">
                {submitError}
              </p>
            ) : null}

            {isSubmitting ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((placeholder) => (
                  <div
                    key={`loading-card-${placeholder}`}
                    className="compass-skeleton-card rounded-[calc(var(--radius-card)-4px)] p-5"
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
                className="compass-open-info rounded-[calc(var(--radius-card)-4px)] p-4"
              >
                <p className="text-base font-semibold text-[var(--color-ink)]">
                  지금 조건에 딱 맞는 목적지가 없어요.
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                  아래에서 한 가지만 풀어도 바로 다시 볼 수 있어요.
                </p>
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
                      className="compass-selection-chip rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5 text-left disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="block text-xs font-semibold tracking-[0.04em] text-[var(--color-sand-deep)]">
                        바로 완화하기
                      </span>
                      <span className="mt-2.5 block text-sm font-semibold text-[var(--color-ink)]">
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

            {visibleCards.length > 0 ? (
              <div data-testid={testIds.result.topList} className="grid gap-2.5">
                {visibleCards.map((card, index) => (
                  <CompactRecommendationCard
                    key={card.destination.id}
                    card={card}
                    index={index}
                    query={results?.query ?? currentQuery}
                    saveState={saveStates[card.destination.id] ?? { status: "idle" }}
                    onSave={(selectedCard) => {
                      void saveCard(selectedCard);
                    }}
                    onCopy={(shareUrl) => {
                      if (shareUrl) {
                        void copyShareUrl(shareUrl);
                      }
                    }}
                  />
                ))}
              </div>
            ) : null}

            {cards.length > 3 ? (
              <button
                type="button"
                data-testid={testIds.result.showMoreResults}
                onClick={() => setShowAllResults((currentValue) => !currentValue)}
                className="compass-action-secondary rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em]"
              >
                {showAllResults ? "상위 3개만 보기" : `후보 ${cards.length - 3}곳 더 보기`}
              </button>
            ) : null}

            {savedSnapshots.length > 0 ? (
              <article
                id="saved-snapshots-section"
                className="compass-sheet rounded-[var(--radius-card)] px-3.5 py-3.5 sm:px-4 sm:py-4"
              >
                <div className="flex flex-col gap-3 border-b border-[color:var(--color-stage-divider)] pb-3.5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="compass-editorial-kicker">저장한 카드</p>
                    <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                      마음에 드는 곳만 모아 비교 보드로 넘겨 보세요.
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
                    className="compass-action-primary compass-soft-press rounded-full px-4 py-3 text-sm font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
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
          </section>
        ) : null}

        {savedSnapshots.length > 0 ? (
          <div className="pointer-events-none fixed inset-x-4 bottom-4 z-30 md:hidden">
            <article
              data-testid={testIds.snapshot.stickyCompareTray}
              className="compass-sheet compass-sticky-tray pointer-events-auto rounded-[calc(var(--radius-card)-6px)] px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="compass-editorial-kicker">비교 트레이</p>
                  <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">
                    {compareTrayDestinations || `${savedSnapshots.length}개 저장 카드`}
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
      </div>
    </ExperienceShell>
  );
}
