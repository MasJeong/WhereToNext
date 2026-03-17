import type { ReactNode } from "react";

import {
  describeSourceBadge,
  formatBudgetBand,
  formatDestinationKind,
  formatFlightBand,
  formatFreshnessState,
  formatMonthList,
  type RecommendationCardView,
} from "@/lib/trip-compass/presentation";
import { getInstagramVibeTestId, getResultCardTestId } from "@/lib/test-ids";

type RecommendationCardProps = {
  card: RecommendationCardView;
  index: number;
  actionSlot?: ReactNode;
};

/**
 * Renders a single summary-first recommendation card.
 * @param props Card view model and optional action controls
 * @returns Recommendation card UI
 */
export function RecommendationCard({ card, index, actionSlot }: RecommendationCardProps) {
  const primaryEvidence = card.recommendation.trendEvidence[0];
  const supportingEvidence = card.recommendation.trendEvidence[1] ?? primaryEvidence;
  const destination = card.destination;

  return (
    <article
      data-testid={getResultCardTestId(index)}
      className="compass-card rounded-[var(--radius-card)] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 border-b border-[color:var(--color-frame)] pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-sand)]">
              {formatDestinationKind(destination.kind)} 추천
            </p>
            <div>
              <h2 className="font-display text-4xl tracking-[-0.05em] text-[var(--color-paper)] sm:text-5xl">
                {destination.nameKo}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {destination.nameEn} · {destination.countryCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start rounded-full border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] px-4 py-2 text-sm text-[var(--color-paper)]">
            <span className="text-[var(--color-sand)]">점수</span>
            <strong className="text-base font-semibold">{card.recommendation.scoreBreakdown.total}</strong>
          </div>
        </div>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
            추천 이유
          </p>
          <p className="text-base leading-7 text-[var(--color-paper)] sm:text-lg">
            {card.recommendation.whyThisFits}
          </p>
          <div className="flex flex-wrap gap-2">
            {card.recommendation.reasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] px-3 py-1 text-xs text-[var(--color-muted)]"
              >
                {reason}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
            여행 정보
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">추천 시기</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-paper)]">
                {formatMonthList(destination.bestMonths)}
              </p>
            </div>
            <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">예산 감각</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-paper)]">
                {formatBudgetBand(destination.budgetBand)}
              </p>
            </div>
            <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">비행 거리</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-paper)]">
                {formatFlightBand(destination.flightBand)}
              </p>
            </div>
            <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">일치도</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-paper)]">
                {card.recommendation.confidence}% 일치
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3" data-testid={getInstagramVibeTestId(index)}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
            인스타그램 분위기
          </p>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,0.65fr)]">
            <div className="instagram-card rounded-[calc(var(--radius-card)-6px)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-[color:var(--color-frame)] bg-[color:var(--color-paper-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--color-ink)]">
                  {describeSourceBadge(primaryEvidence)}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-paper)]">
                  {primaryEvidence.sourceLabel}
                </span>
              </div>
              <div className="mt-12 space-y-2">
                <p className="font-display text-3xl leading-none tracking-[-0.04em] text-[var(--color-paper)]">
                  {destination.nameKo}
                </p>
                <p className="max-w-md text-sm leading-6 text-[var(--color-paper)]">
                  {primaryEvidence.summary}
                </p>
              </div>
            </div>

            <div className="rounded-[calc(var(--radius-card)-6px)] border border-[color:var(--color-frame)] bg-[color:var(--color-paper-soft)] p-4 text-[var(--color-ink)]">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                    근거 신호
                  </p>
                  <p className="mt-2 text-xl font-semibold">{describeSourceBadge(supportingEvidence)}</p>
                </div>
                <div className="space-y-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                  <p>{supportingEvidence.sourceLabel}</p>
                  <p>{formatFreshnessState(supportingEvidence.freshnessState)}</p>
                  <p>{supportingEvidence.confidence}% 신뢰도</p>
                </div>
              </div>
            </div>

            <a
              href={primaryEvidence.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-[calc(var(--radius-card)-6px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--color-frame-strong)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-sand)]">
                원문 보기
              </p>
              <p className="mt-10 font-display text-3xl leading-none tracking-[-0.04em] text-[var(--color-paper)]">
                분위기 레퍼런스
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                이 목적지의 분위기 근거를 원문에서 바로 확인해 보세요.
              </p>
            </a>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
            체크할 점
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {card.recommendation.watchOuts.map((watchOut) => (
              <div
                key={watchOut}
                className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4 text-sm leading-6 text-[var(--color-muted)]"
              >
                {watchOut}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
            다음 행동
          </p>
          <div className="flex flex-wrap gap-3">{actionSlot}</div>
        </section>
      </div>
    </article>
  );
}
