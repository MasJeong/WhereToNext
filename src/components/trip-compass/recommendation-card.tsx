import type { ReactNode } from "react";

import type { RecommendationQuery, TrendEvidenceSnapshot } from "@/lib/domain/contracts";
import {
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
 * Maps a weighted score into a trust-focused label.
 * @param score Achieved score within the category
 * @param maxScore Maximum possible score in the category
 * @returns Readable fit label for the UI
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
 * Builds a short trust note for the lead evidence source.
 * @param evidence Primary evidence snapshot
 * @param evidenceCount Number of evidence items on the card
 * @returns Trust-oriented source note
 */
function describeTrustLead(evidence: TrendEvidenceSnapshot, evidenceCount: number): string {
  if (evidence.tier === "fallback") {
    return `대표 근거는 대체 소스예요. 현재 카드에는 ${evidenceCount}개의 근거를 함께 보여 주고, 원문까지 바로 확인할 수 있어요.`;
  }

  if (evidence.sourceType === "partner_account") {
    return `대표 근거는 공식 계정 흐름이에요. 설명 가능한 점수와 ${evidenceCount}개의 근거를 함께 보고 결정할 수 있어요.`;
  }

  return `대표 근거는 ${describeSourceBadge(evidence)} 레이어예요. 점수와 이유를 먼저 보고, 분위기는 뒤에서 차분히 확인할 수 있어요.`;
}

/**
 * Builds trust-first signals that explain why a card surfaced.
 * @param card Recommendation card view model
 * @param query Active recommendation query when available
 * @returns Ordered trust signals for the card
 */
function buildTrustSignals(card: RecommendationCardView, query?: RecommendationQuery): TrustSignal[] {
  const primaryEvidence = card.recommendation.trendEvidence[0];
  const scoreBreakdown = card.recommendation.scoreBreakdown;
  const evidenceCount = card.recommendation.trendEvidence.length;

  return [
    {
      label: "시즌 적합도",
      value: formatFitStrength(scoreBreakdown.seasonFit, 14),
      detail: query
        ? `${formatTravelMonth(query.travelMonth)} 여행 기준 · ${scoreBreakdown.seasonFit}/14점`
        : `추천 시즌 기준 · ${scoreBreakdown.seasonFit}/14점`,
    },
    {
      label: "비행 적합도",
      value: formatFitStrength(scoreBreakdown.flightToleranceFit, 12),
      detail: query
        ? `${formatDepartureAirport(query.departureAirport)} 출발 · ${formatFlightTolerance(query.flightTolerance)}`
        : `한국 출발 기준 · ${formatFlightBand(card.destination.flightBand)}`,
    },
    {
      label: "근거 출처",
      value: describeSourceBadge(primaryEvidence),
      detail: `${primaryEvidence.sourceLabel} · ${formatFreshnessState(primaryEvidence.freshnessState)}`,
    },
    {
      label: "근거 수",
      value: `${evidenceCount}개 확인`,
      detail: `${primaryEvidence.confidence}% 신뢰도 · ${card.recommendation.reasons[0]}`,
    },
  ];
}

/**
 * Renders a single summary-first recommendation card.
 * @param props Card view model and optional action controls
 * @returns Recommendation card UI
 */
export function RecommendationCard({ card, index, query, actionSlot }: RecommendationCardProps) {
  const primaryEvidence = card.recommendation.trendEvidence[0];
  const supportingEvidence = card.recommendation.trendEvidence[1] ?? primaryEvidence;
  const destination = card.destination;
  const trustSignals = buildTrustSignals(card, query);
  const leadReasons = card.recommendation.reasons.slice(0, 2).join(" · ");

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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                먼저 확인할 신뢰 신호
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                설명 가능한 점수, 시즌 적합도, 비행 부담, 근거 출처를 먼저 보여드려요.
              </p>
            </div>
            <div className="compass-pill self-start px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-paper)]">
              근거 {card.recommendation.trendEvidence.length}개
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="rounded-[calc(var(--radius-card)-6px)] border border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] p-4 text-[var(--color-ink)] sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                신뢰 요약
              </p>
              <p className="font-display mt-4 text-4xl leading-none tracking-[-0.05em] sm:text-5xl">
                {card.recommendation.scoreBreakdown.total}점
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--color-ink-soft)]">
                {card.recommendation.confidence}% 일치 {leadReasons ? `· ${leadReasons}` : ""}
              </p>
              <p className="mt-4 text-sm leading-6 text-[var(--color-ink-soft)]">
                {describeTrustLead(primaryEvidence, card.recommendation.trendEvidence.length)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {trustSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    {signal.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--color-paper)]">{signal.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{signal.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
              분위기 참고
            </p>
            <p className="text-xs leading-5 text-[var(--color-muted)]">
              신뢰 신호를 본 뒤 마지막으로 감도를 확인하는 보조 레이어예요.
            </p>
          </div>
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
