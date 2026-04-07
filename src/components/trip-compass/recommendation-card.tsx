"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import type { RecommendationQuery } from "@/lib/domain/contracts";
import {
  buildDestinationDetailPath,
  buildRecommendationDayFlow,
  buildRecommendationDecisionFacts,
  buildRecommendationEvidenceLead,
  buildRecommendationSceneCopy,
  buildRecommendationVerdict,
  formatDestinationWithCountry,
  formatVibeList,
  type RecommendationCardView,
} from "@/lib/trip-compass/presentation";
import { getInstagramVibeTestId, getResultCardTestId, getResultTopItemTestId } from "@/lib/test-ids";

type RecommendationCardProps = {
  card: RecommendationCardView;
  index: number;
  query?: RecommendationQuery;
  actionSlot?: ReactNode;
  snapshotId?: string;
};

function resolveVisualStyle(card: RecommendationCardView, index: number): CSSProperties {
  const leadVibe = card.destination.vibeTags[0] ?? "city";

  if (leadVibe === "beach" || leadVibe === "nature") {
    return {
      background:
        "linear-gradient(180deg, rgb(255 255 255 / 0.12), transparent), linear-gradient(135deg, rgb(81 195 189 / 0.86), rgb(18 132 164 / 0.82) 54%, rgb(12 65 102 / 0.9))",
    };
  }

  if (leadVibe === "food") {
    return {
      background:
        "linear-gradient(180deg, rgb(255 255 255 / 0.14), transparent), linear-gradient(135deg, rgb(255 194 102 / 0.92), rgb(240 128 46 / 0.88) 52%, rgb(113 54 23 / 0.9))",
    };
  }

  if (leadVibe === "romance") {
    return {
      background:
        "linear-gradient(180deg, rgb(255 255 255 / 0.12), transparent), linear-gradient(135deg, rgb(244 164 160 / 0.88), rgb(165 88 141 / 0.86) 52%, rgb(60 39 78 / 0.9))",
    };
  }

  return {
    background:
      index % 2 === 0
        ? "linear-gradient(180deg, rgb(255 255 255 / 0.12), transparent), linear-gradient(135deg, rgb(77 144 224 / 0.88), rgb(32 84 153 / 0.88) 54%, rgb(17 34 65 / 0.92))"
        : "linear-gradient(180deg, rgb(255 255 255 / 0.12), transparent), linear-gradient(135deg, rgb(39 67 91 / 0.9), rgb(23 91 115 / 0.86) 52%, rgb(10 33 58 / 0.92))",
  };
}

const disclosureVariants = {
  collapsed: { opacity: 0, height: 0 },
  open: { opacity: 1, height: "auto" },
};

export function RecommendationCard({
  card,
  index,
  query,
  actionSlot,
  snapshotId,
}: RecommendationCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const destination = card.destination;
  const detailPath = buildDestinationDetailPath(destination, query, snapshotId);
  const verdict = buildRecommendationVerdict(card, query);
  const primaryEvidence = buildRecommendationEvidenceLead(card);
  const sceneCopy = buildRecommendationSceneCopy(card, query);
  const dayFlow = buildRecommendationDayFlow(card, query);
  const decisionFacts = buildRecommendationDecisionFacts(destination);
  const leadReason = card.recommendation.reasons[0] ?? verdict.headline;
  const visualStyle = resolveVisualStyle(card, index);

  return (
    <article
      data-testid={getResultCardTestId(index)}
      className="compass-open-result compass-stage-reveal text-[var(--color-ink)]"
      style={{ animationDelay: `${140 + index * 80}ms` }}
    >
      <div className="compass-result-card compass-card-settle rounded-[var(--radius-card)] p-3.5 sm:p-4">
        {/* Hero — always visible */}
        <div className="rounded-[calc(var(--radius-card)-10px)] p-4 text-white shadow-[0_20px_40px_rgb(16_21_27_/_0.22)]" style={visualStyle}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div data-testid={getResultTopItemTestId(index)} className="min-w-0">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/72">{sceneCopy.eyebrow}</p>
              <h2 className="mt-2 font-display text-[1.38rem] leading-[0.92] tracking-[-0.05em] sm:text-[1.6rem]">
                {formatDestinationWithCountry(destination)}
              </h2>
              <p className="mt-1 text-sm text-white/76">{destination.nameEn}</p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-semibold tracking-[0.04em] text-white">
                TOP {index + 1}
              </span>
              <span className="rounded-full border border-white/16 bg-white/12 px-3 py-1 text-[11px] font-semibold tracking-[0.04em] text-white/88">
                일치 {card.recommendation.confidence}%
              </span>
            </div>
          </div>

          <p className="mt-4 max-w-md text-lg font-semibold leading-7 tracking-[-0.02em] text-white">{sceneCopy.headline}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-white/16 bg-white/12 px-3 py-1 font-semibold text-white/88">
              {sceneCopy.supportingLabel}
            </span>
            <span className="rounded-full border border-white/16 bg-white/12 px-3 py-1 font-semibold text-white/88">
              {formatVibeList(destination.vibeTags.slice(0, 2))}
            </span>
          </div>
        </div>

        {/* Summary strip — always visible */}
        <div className="mt-3">
          <section className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="compass-editorial-kicker">추천 이유</span>
              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">{verdict.label}</span>
            </div>
            <p className="mt-2 text-base font-semibold leading-6 tracking-[-0.02em] text-[var(--color-ink)]">{leadReason}</p>
          </section>
        </div>

        {/* Actions + toggle */}
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {actionSlot}
          <Link
            href={detailPath}
            className="compass-action-primary compass-soft-press inline-flex min-h-[2.25rem] items-center rounded-full border border-[color:var(--color-stage-divider)] bg-white px-4 py-2 text-xs font-semibold tracking-[0.04em] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-funnel-muted)]"
          >
            상세 보기
          </Link>
          <button
            type="button"
            onClick={() => setDetailOpen((prev) => !prev)}
            className="inline-flex min-h-[2.25rem] items-center rounded-full px-3.5 py-2 text-xs font-semibold text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
          >
            {detailOpen ? "접기" : "더 보기"}
          </button>
        </div>

        {/* Collapsible detail sections */}
        <AnimatePresence initial={false}>
          {detailOpen ? (
            <motion.div
              key="card-detail"
              className="mt-3 grid gap-3 overflow-hidden xl:grid-cols-[minmax(0,1.04fr)_minmax(17rem,0.96fr)] xl:items-start"
              variants={disclosureVariants}
              initial="collapsed"
              animate="open"
              exit="collapsed"
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="space-y-3">
                <section className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
                  <p className="compass-editorial-kicker">왜 잘 맞나요</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">{card.recommendation.whyThisFits}</p>
                </section>

                <section className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
                  <p className="compass-editorial-kicker">Day-flow</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {dayFlow.map((step) => (
                      <article key={step.id} className="rounded-[calc(var(--radius-card)-14px)] border border-[color:var(--color-stage-divider)] bg-white/60 px-3 py-3">
                        <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">{step.label}</p>
                        <p className="mt-1.5 text-sm font-semibold leading-5 text-[var(--color-ink)]">{step.title}</p>
                        <p className="mt-1.5 text-xs leading-5 text-[var(--color-ink-soft)]">{step.detail}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="space-y-3">
                <section className="compass-note rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
                  <p className="compass-editorial-kicker">결정 포인트</p>
                  <div className="mt-3 grid gap-2.5">
                    {decisionFacts.map((fact) => (
                      <article key={fact.id} className="rounded-[calc(var(--radius-card)-14px)] border border-[color:var(--color-stage-divider)] bg-white/58 px-3 py-3">
                        <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">{fact.label}</p>
                        <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">{fact.value}</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">{fact.detail}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section
                  data-testid={getInstagramVibeTestId(index)}
                  className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4"
                >
                  <p className="compass-editorial-kicker">분위기 메모</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{primaryEvidence.label}</p>
                  <p className="mt-1.5 text-xs leading-5 text-[var(--color-ink-soft)]">{primaryEvidence.detail}</p>
                </section>
              </aside>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </article>
  );
}
