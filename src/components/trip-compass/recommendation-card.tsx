import type { CSSProperties, ReactNode } from "react";

import type { RecommendationQuery, TrendEvidenceSnapshot } from "@/lib/domain/contracts";
import {
  buildRecommendationPlanningFacts,
  buildRecommendationPriorityBadge,
  buildRecommendationTrustSignals,
  buildRecommendationVerdict,
  describeSourceBadge,
  formatBudgetBand,
  formatDepartureAirport,
  formatDestinationKind,
  formatFlightBand,
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
 * 추천 카드를 verdict-first 구조로 렌더링한다.
 * @param props 카드 뷰 모델과 액션 영역
 * @returns 추천 카드 UI
 */
export function RecommendationCard({ card, index, query, actionSlot }: RecommendationCardProps) {
  const primaryEvidence = card.recommendation.trendEvidence[0];
  const destination = card.destination;
  const trustSignals = buildRecommendationTrustSignals(card, query);
  const planningFacts = buildRecommendationPlanningFacts(card);
  const compactWatchOut = card.recommendation.watchOuts[0];
  const secondaryWatchOuts = card.recommendation.watchOuts.slice(1, 3);
  const leadReasons = card.recommendation.reasons.slice(0, 2);
  const verdictBadge = buildRecommendationPriorityBadge(card.recommendation.scoreBreakdown.total);
  const verdict = buildRecommendationVerdict(card, query);
  const shortlistLabel = `Shortlist ${index + 1}`;
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
        className={`compass-result-card ${resultToneClass} flex flex-col gap-4 rounded-[calc(var(--radius-card)-2px)] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6`}
      >
        <div className="flex flex-col gap-4 border-b border-[color:var(--color-stage-divider)] pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="compass-stage-list-number">{index + 1}</span>
              <p className="compass-editorial-kicker">
                {shortlistLabel} · {formatDestinationKind(destination.kind)} 추천
              </p>
              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                {verdictBadge}
              </span>
              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                근거 {card.recommendation.trendEvidence.length}개
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                {formatBudgetBand(destination.budgetBand)}
              </span>
              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                {formatFlightBand(destination.flightBand)}
              </span>
              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                {query
                  ? `${formatDepartureAirport(query.departureAirport)} · ${formatTravelMonth(query.travelMonth)}`
                  : destination.countryCode}
              </span>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(17rem,0.92fr)] xl:items-start">
            <div className="space-y-4">
              <div className="compass-result-accent space-y-2.5">
                <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-sand-deep)]">
                  목적지 브리프
                </p>
                <div className="space-y-1.5">
                  <h2 className="font-display text-[1.24rem] leading-[0.98] tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.6rem]">
                    {destination.nameKo}
                  </h2>
                  <p className="text-[0.92rem] text-[var(--color-ink-soft)]">
                    {destination.nameEn} · {destination.countryCode}
                  </p>
                </div>
                <p className="max-w-3xl text-[0.98rem] leading-7 text-[var(--color-ink)]">
                  {card.recommendation.whyThisFits}
                </p>
                <p className="max-w-3xl text-xs leading-6 tracking-[0.02em] text-[var(--color-ink-soft)]">
                  {destination.nameEn} · {destination.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {leadReasons.map((reason) => (
                  <span
                    key={reason}
                    className="compass-metric-pill rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>

            <section className="compass-story-note rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5">
              <p className="compass-editorial-kicker">왜 먼저 봐야 하는지</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                {verdict.label}
              </p>
              <p className="mt-2 font-display text-[1.08rem] leading-tight tracking-[-0.02em] sm:text-[1.16rem]">
                {verdict.headline}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                {verdict.support} {describeTrustLead(primaryEvidence, card.recommendation.trendEvidence.length)}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    대표 근거
                  </p>
                  <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                    {describeSourceBadge(primaryEvidence)}
                  </p>
                </div>
                <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    여행 결
                  </p>
                  <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                    {formatBudgetBand(destination.budgetBand)} · {formatFlightBand(destination.flightBand)}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] xl:items-start">
          <div className="space-y-4">
            <section className="space-y-2">
              <p className="compass-editorial-kicker">먼저 확인할 신뢰 신호</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {trustSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-frost)] px-3 py-3"
                  >
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                      {signal.label}
                    </p>
                    <p className="mt-1 text-[0.95rem] font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                      {signal.value}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">{signal.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <p className="compass-editorial-kicker">여행 설계 힌트</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {planningFacts.map((fact) => (
                  <div
                    key={fact.id}
                    className="rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-frost)] px-3.5 py-3"
                  >
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                      {fact.label}
                    </p>
                    <p className="mt-1.5 text-[0.95rem] font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                      {fact.value}
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-[var(--color-ink-soft)]">
                      {fact.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-1.5" data-testid={getInstagramVibeTestId(index)}>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
                <p className="compass-editorial-kicker">분위기 근거</p>
              </div>
              <div className="compass-result-source-strip rounded-[calc(var(--radius-card)-12px)] px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                        {describeSourceBadge(primaryEvidence)}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
                        {primaryEvidence.sourceLabel}
                      </span>
                    </div>
                    <p className="mt-2.5 max-w-2xl text-sm leading-6 text-[var(--color-ink)]">
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
          </div>

          <aside className="space-y-3">
            <section className="compass-result-scoreboard rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm sm:px-5 sm:py-5">
              <div>
                <p className="compass-editorial-kicker">Decision readout</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                  점수와 대표 근거를 한 번에 보고 shortlist의 우선순위를 빠르게 잡아요.
                </p>
              </div>
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
              <div className="compass-result-score-row">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                  출발 조건
                </p>
                <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                  {query
                    ? `${formatDepartureAirport(query.departureAirport)} · ${formatTravelMonth(query.travelMonth)}`
                    : destination.summary}
                </p>
              </div>
            </section>

            <section className="compass-warning-card rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-sm sm:px-5 sm:py-5">
              <p className="compass-editorial-kicker text-[var(--color-warning-text)]">
                비교 보드에 넘기기 전 체크
              </p>
              <p className="mt-2 leading-6">{compactWatchOut}</p>
              {secondaryWatchOuts.length > 0 ? (
                <div className="mt-3 grid gap-2 border-t border-[color:var(--color-warning-border)] pt-3">
                  {secondaryWatchOuts.map((watchOut) => (
                    <p key={watchOut} className="text-xs leading-5 text-[var(--color-warning-text)]">
                      {watchOut}
                    </p>
                  ))}
                </div>
              ) : null}
            </section>

            {actionSlot ? <div className="compass-action-rail pt-0">{actionSlot}</div> : null}
          </aside>
        </div>
      </div>
    </article>
  );
}
