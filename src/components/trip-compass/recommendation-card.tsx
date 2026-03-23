import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import type { RecommendationQuery, TrendEvidenceSnapshot } from "@/lib/domain/contracts";
import {
  buildDestinationDetailPath,
  buildRecommendationEvidenceLead,
  buildRecommendationPriorityBadge,
  buildRecommendationTrustSignals,
  buildRecommendationVerdict,
  describeSourceBadge,
  formatBudgetBand,
  formatFlightBand,
  formatMonthList,
  formatTravelMonth,
  formatVibeList,
  type RecommendationCardView,
} from "@/lib/trip-compass/presentation";
import { getInstagramVibeTestId, getResultCardTestId } from "@/lib/test-ids";

type RecommendationCardProps = {
  card: RecommendationCardView;
  index: number;
  query?: RecommendationQuery;
  actionSlot?: ReactNode;
  snapshotId?: string;
};

function describeTrustLead(evidence: TrendEvidenceSnapshot, evidenceCount: number): string {
  if (evidence.tier === "fallback") {
    return `대체 소스를 포함해 ${evidenceCount}개의 근거를 함께 보고 판단할 수 있어요.`;
  }

  if (evidence.sourceType === "partner_account") {
    return "공식 계정 흐름과 설명 가능한 점수를 함께 보여줘요.";
  }

  return `${describeSourceBadge(evidence)} 기준으로 분위기와 근거를 함께 확인해요.`;
}

export function RecommendationCard({
  card,
  index,
  query,
  actionSlot,
  snapshotId,
}: RecommendationCardProps) {
  const primaryEvidence = buildRecommendationEvidenceLead(card);
  const destination = card.destination;
  const trustSignals = buildRecommendationTrustSignals(card, query);
  const verdictBadge = buildRecommendationPriorityBadge(card.recommendation.scoreBreakdown.total);
  const verdict = buildRecommendationVerdict(card, query);
  const leadReasons = card.recommendation.reasons.slice(0, 3);
  const revealStyle = {
    animationDelay: `${160 + index * 90}ms`,
  } satisfies CSSProperties;
  const detailPath = buildDestinationDetailPath(destination, query, snapshotId);

  return (
    <article
      data-testid={getResultCardTestId(index)}
      className="compass-open-result compass-stage-reveal text-[var(--color-ink)]"
      style={revealStyle}
    >
      <div className="compass-result-card compass-card-settle rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 border-b border-[color:var(--color-stage-divider)] pb-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="compass-stage-list-number">{index + 1}</span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              {verdictBadge}
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              적합 점수 {card.recommendation.scoreBreakdown.total}점
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              근거 {card.recommendation.trendEvidence.length}개
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(16rem,0.88fr)] lg:items-start">
            <div className="space-y-3">
              <div>
                <p className="compass-editorial-kicker">TOP {index + 1}</p>
                <h2 className="mt-2 font-display text-[1.34rem] leading-[0.96] tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.7rem]">
                  {destination.nameKo}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  {destination.nameEn} · {destination.countryCode}
                </p>
              </div>

              <p className="text-[0.98rem] leading-7 text-[var(--color-ink)]">
                {card.recommendation.whyThisFits}
              </p>
              <p className="text-sm leading-6 text-[var(--color-ink-soft)]">{destination.summary}</p>

              <div className="flex flex-wrap gap-2">
                {leadReasons.map((reason) => (
                  <span key={reason} className="compass-metric-pill rounded-full px-3 py-1 text-xs font-semibold">
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
              <p className="mt-2 font-display text-[1.08rem] leading-tight tracking-[-0.02em] text-[var(--color-ink)]">
                {verdict.headline}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                {verdict.support}
                {card.recommendation.trendEvidence.length > 0
                  ? ` ${describeTrustLead(card.recommendation.trendEvidence[0], card.recommendation.trendEvidence.length)}`
                  : " 핵심 정보와 체크할 점을 먼저 보고 판단해 보세요."}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    출발 기준
                  </p>
                  <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                    {query ? formatTravelMonth(query.travelMonth) : formatMonthList(destination.bestMonths)}
                  </p>
                </div>
                <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    대표 근거
                  </p>
                    <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                      {primaryEvidence.label}
                    </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)] lg:items-start">
          <div className="space-y-4">
            <section>
              <p className="compass-editorial-kicker">핵심 정보</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <article className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    추천 시기
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
                    {formatMonthList(destination.bestMonths)}
                  </p>
                </article>
                <article className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    예산 감각
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
                    {formatBudgetBand(destination.budgetBand)}
                  </p>
                </article>
                <article className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    비행 거리
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
                    {formatFlightBand(destination.flightBand)}
                  </p>
                </article>
                <article className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5">
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    대표 분위기
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
                    {formatVibeList(destination.vibeTags.slice(0, 3))}
                  </p>
                </article>
              </div>
            </section>

            <section>
              <p className="compass-editorial-kicker">먼저 확인할 신뢰 신호</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {trustSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5"
                  >
                    <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                      {signal.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                      {signal.value}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">
                      {signal.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section data-testid={getInstagramVibeTestId(index)}>
              <p className="compass-editorial-kicker">분위기 근거</p>
              <div className="compass-result-source-strip mt-3 rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                        {primaryEvidence.label}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                        {primaryEvidence.sourceLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-ink)]">
                      {primaryEvidence.detail}
                    </p>
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
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="compass-note rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5">
              <p className="compass-editorial-kicker">한눈에 보기</p>
              <div className="mt-3 grid gap-3 text-sm">
                <div>
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    일치도
                  </p>
                  <p className="mt-1.5 text-[1.2rem] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                    {card.recommendation.confidence}%
                  </p>
                </div>
                <div>
                  <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    체크할 점
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                    {card.recommendation.watchOuts[0]}
                  </p>
                </div>
              </div>
            </section>

            <section className="compass-warning-card rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5">
              <p className="compass-editorial-kicker text-[var(--color-warning-text)]">
                비교 보드에 넘기기 전 체크
              </p>
              <div className="mt-3 grid gap-2">
                {card.recommendation.watchOuts.slice(0, 3).map((watchOut) => (
                  <p key={watchOut} className="text-sm leading-6 text-[var(--color-warning-text)]">
                    {watchOut}
                  </p>
                ))}
              </div>
            </section>

            <div className="compass-action-rail gap-2 pt-0">
              <Link
                href={detailPath}
                className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
              >
                상세 페이지 보기
              </Link>
              {actionSlot}
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
