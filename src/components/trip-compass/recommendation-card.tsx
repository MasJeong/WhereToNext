import type { CSSProperties, ReactNode } from "react";

import type { RecommendationQuery, TrendEvidenceSnapshot } from "@/lib/domain/contracts";
import {
  buildRecommendationVerdict,
  describeSourceBadge,
  formatBudgetBand,
  formatDepartureAirport,
  formatDestinationKind,
  formatFlightBand,
  formatFlightTolerance,
  formatFreshnessState,
  formatMonthList,
  formatTravelMonth,
  type RecommendationCardView,
} from "@/lib/trip-compass/presentation";
import { getInstagramVibeTestId, getResultCardTestId } from "@/lib/test-ids";

type RecommendationCardProps = {
  card: RecommendationCardView;
  index: number;
  query?: RecommendationQuery;
  actionSlot?: ReactNode;
};

type TrustSignal = {
  label: string;
  value: string;
  detail: string;
};

/**
 * 점수 범위를 사람이 읽기 쉬운 적합도 라벨로 변환한다.
 * @param score 현재 획득 점수
 * @param maxScore 최대 가능 점수
 * @returns 적합도 라벨
 */
function formatFitStrength(score: number, maxScore: number): string {
  const ratio = maxScore === 0 ? 0 : score / maxScore;

  if (ratio >= 0.85) {
    return "강하게 맞아요";
  }

  if (ratio >= 0.6) {
    return "대체로 잘 맞아요";
  }

  return "한 번 더 체크해 보세요";
}

/**
 * 상단 추천 카드가 왜 먼저 노출되는지에 대한 짧은 판정 배지를 만든다.
 * @param totalScore 카드 총점
 * @returns 카드 상단 배지 문구
 */
function buildVerdictBadge(totalScore: number): string {
  if (totalScore >= 80) {
    return "가장 먼저 볼 후보";
  }

  if (totalScore >= 70) {
    return "우선 비교할 후보";
  }

  return "조건을 더 보고 판단할 후보";
}

/**
 * 대표 근거에 대한 짧은 신뢰 설명을 만든다.
 * @param evidence 대표 근거 블록
 * @param evidenceCount 현재 카드의 총 근거 수
 * @returns 짧은 근거 설명 문장
 */
function describeTrustLead(evidence: TrendEvidenceSnapshot, evidenceCount: number): string {
  if (evidence.tier === "fallback") {
    return `대체 소스를 포함해 ${evidenceCount}개의 근거를 함께 보고 판단할 수 있어요.`;
  }

  if (evidence.sourceType === "partner_account") {
    return `공식 계정 흐름과 설명 가능한 점수를 함께 보여줘요.`;
  }

  return `${describeSourceBadge(evidence)} 기준으로 분위기와 근거를 함께 확인해요.`;
}

/**
 * 카드에서 빠르게 판단할 최소한의 신뢰 신호를 구성한다.
 * @param card 추천 카드 뷰 모델
 * @param query 현재 추천 질의
 * @returns 간결한 신뢰 신호 목록
 */
function buildTrustSignals(card: RecommendationCardView, query?: RecommendationQuery): TrustSignal[] {
  const primaryEvidence = card.recommendation.trendEvidence[0];
  const scoreBreakdown = card.recommendation.scoreBreakdown;

  return [
    {
      label: "시즌",
      value: formatFitStrength(scoreBreakdown.seasonFit, 14),
      detail: query
        ? `${formatTravelMonth(query.travelMonth)} 기준 · ${scoreBreakdown.seasonFit}/14점`
        : `${scoreBreakdown.seasonFit}/14점`,
    },
    {
      label: "비행",
      value: formatFitStrength(scoreBreakdown.flightToleranceFit, 12),
      detail: query
        ? `${formatDepartureAirport(query.departureAirport)} 출발 · ${formatFlightTolerance(query.flightTolerance)}`
        : formatFlightBand(card.destination.flightBand),
    },
    {
      label: "근거",
      value: describeSourceBadge(primaryEvidence),
      detail: `${primaryEvidence.sourceLabel} · ${formatFreshnessState(primaryEvidence.freshnessState)}`,
    },
  ];
}

/**
 * 추천 카드를 verdict-first 구조로 렌더링한다.
 * @param props 카드 뷰 모델과 액션 영역
 * @returns 추천 카드 UI
 */
export function RecommendationCard({ card, index, query, actionSlot }: RecommendationCardProps) {
  const primaryEvidence = card.recommendation.trendEvidence[0];
  const destination = card.destination;
  const trustSignals = buildTrustSignals(card, query);
  const compactWatchOut = card.recommendation.watchOuts[0];
  const leadReasons = card.recommendation.reasons.slice(0, 3);
  const verdictBadge = buildVerdictBadge(card.recommendation.scoreBreakdown.total);
  const verdict = buildRecommendationVerdict(card, query);
  const resultToneClass =
    index === 0
      ? "compass-result-card-primary"
      : index === 1
        ? "compass-result-card-secondary"
        : "compass-result-card-tertiary";
  const revealStyle = {
    animationDelay: `${180 + index * 90}ms`,
  } satisfies CSSProperties;

  return (
    <article
      data-testid={getResultCardTestId(index)}
      className="compass-open-result compass-stage-reveal text-[var(--color-ink)]"
      style={revealStyle}
    >
      <div
        className={`compass-result-card ${resultToneClass} flex flex-col gap-7 rounded-[calc(var(--radius-card)-2px)] px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-8`}
      >
        <div className="compass-result-layout gap-6">
          <div className="space-y-6">
            <div className="compass-result-accent space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="compass-editorial-kicker">
                  {formatDestinationKind(destination.kind)} 추천
                </p>
                <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                  {verdictBadge}
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-[2.65rem] leading-[0.94] tracking-[-0.06em] text-[var(--color-ink)] sm:text-[3.7rem]">
                  {destination.nameKo}
                </h2>
                <p className="text-sm text-[var(--color-ink-soft)] sm:text-base">
                  {destination.nameEn} · {destination.countryCode}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="compass-editorial-kicker">왜 먼저 봐야 하는지</p>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                {verdict.label}
              </p>
              <p className="font-display text-3xl leading-tight tracking-[-0.05em] sm:text-4xl">
                {verdict.headline}
              </p>
              <p className="text-sm leading-6 text-[var(--color-ink-soft)]">{verdict.support}</p>
              <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
                {describeTrustLead(primaryEvidence, card.recommendation.trendEvidence.length)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {leadReasons.map((reason) => (
                <span
                  key={reason}
                  className="compass-metric-pill rounded-full px-3 py-1 text-xs"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>

          <aside className="compass-result-scoreboard rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm sm:px-5 sm:py-5">
            <div className="compass-result-score-row">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                적합 점수
              </p>
              <p className="compass-result-score-value">{card.recommendation.scoreBreakdown.total}점</p>
            </div>
            <div className="compass-result-score-row">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                일치도
              </p>
              <p className="compass-result-score-value">{card.recommendation.confidence}%</p>
            </div>
            <div className="compass-result-score-row">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                대표 근거
              </p>
              <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                {describeSourceBadge(primaryEvidence)}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                {primaryEvidence.sourceLabel}
              </p>
            </div>
          </aside>
        </div>

        <div className="compass-result-section compass-result-layout gap-6">
          <section className="space-y-3">
            <p className="compass-editorial-kicker">먼저 확인할 신뢰 신호</p>
            <div className="compass-result-signal-list">
              {trustSignals.map((signal) => (
                <div key={signal.label} className="compass-result-signal-row">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                    {signal.label}
                  </p>
                  <p className="mt-1 text-base font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                    {signal.value}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-ink-soft)]">{signal.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="compass-result-sidepanel rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5">
            <p className="compass-editorial-kicker">여행 정보</p>
            <div className="compass-result-facts-grid mt-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">추천 시기</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">{formatMonthList(destination.bestMonths)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">예산 감각</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">{formatBudgetBand(destination.budgetBand)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">비행 거리</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">{formatFlightBand(destination.flightBand)}</p>
              </div>
            </div>
            <div className="compass-warning-card mt-5 rounded-[calc(var(--radius-card)-12px)] px-4 py-4 text-sm">
              <p className="compass-editorial-kicker text-[var(--color-warning-text)]">먼저 체크할 점</p>
              <p className="mt-3 leading-6">{compactWatchOut}</p>
            </div>
          </section>
        </div>

        <section className="compass-result-section space-y-3" data-testid={getInstagramVibeTestId(index)}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="compass-editorial-kicker">분위기 참고</p>
            <p className="text-xs leading-5 text-[var(--color-ink-soft)]">
              저장 여부를 거의 정했을 때, 마지막으로 감도만 확인하는 보조 레이어예요.
            </p>
          </div>
          <div className="compass-result-source-strip rounded-[calc(var(--radius-card)-12px)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                    {describeSourceBadge(primaryEvidence)}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
                    {primaryEvidence.sourceLabel}
                  </span>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-ink)]">
                  {primaryEvidence.summary}
                </p>
              </div>
              <a
                href={primaryEvidence.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="compass-action-secondary rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
              >
                원문 보기
              </a>
            </div>
          </div>
        </section>

        <section className="compass-result-section space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="compass-editorial-kicker">다음 행동</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                저장해 비교 후보로 넘기거나, 공유 링크로 바로 다시 볼 수 있어요.
              </p>
            </div>
            <div className="compass-action-rail pt-0">{actionSlot}</div>
          </div>
        </section>
      </div>
    </article>
  );
}
