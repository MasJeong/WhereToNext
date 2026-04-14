import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { testIds } from "@/lib/test-ids";
import type {
  RecommendationDecisionFactView,
  WorkspaceBriefItemView,
} from "@/lib/trip-compass/presentation";

type ResultPageProps = {
  testId: string;
  leadTitle: string;
  leadReason: string;
  leadDescription: string;
  leadVisual: ReactNode;
  leadTags: string[];
  leadFacts: RecommendationDecisionFactView[];
  leadSupportSlot?: ReactNode;
  leadDetails: ReactNode;
  resultMeta?: ReactNode;
  personalized: boolean;
  briefItems: WorkspaceBriefItemView[];
  filtersSlot: ReactNode;
  statusSlot: ReactNode;
  resultsSlot: ReactNode;
  savedSlot: ReactNode;
};

export function ResultPage({
  testId,
  leadTitle,
  leadReason,
  leadDescription,
  leadVisual,
  leadTags,
  leadFacts,
  leadSupportSlot,
  leadDetails,
  resultMeta,
  personalized,
  briefItems,
  filtersSlot,
  statusSlot,
  resultsSlot,
  savedSlot,
}: ResultPageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className="mx-auto max-w-5xl space-y-6 px-6 py-8 sm:px-8 sm:py-10"
      data-testid={testId}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
    >
      <article
        data-testid={testIds.home.topSummary}
        className="overflow-hidden rounded-[2rem] border border-[color:var(--color-funnel-border)] bg-white"
      >
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <div className="border-b border-[color:var(--color-funnel-border)] p-4 sm:p-5 lg:border-b-0 lg:border-r">
            {leadVisual}
          </div>

          <div className="flex flex-col p-5 sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-funnel-text-soft)]">
                가장 잘 맞는 추천
              </span>
              {resultMeta}
            </div>

            <h2 className="mt-4 text-[2.2rem] font-semibold leading-[0.94] tracking-[-0.06em] text-[var(--color-funnel-text)] sm:text-[3.2rem]">
              {leadTitle}
            </h2>
            <p className="mt-3 text-[1rem] font-semibold leading-7 text-[var(--color-funnel-text)]">{leadReason}</p>
            <p className="mt-2 text-[0.95rem] leading-6 text-[var(--color-funnel-text-soft)] sm:text-[1rem] sm:leading-7">
              {leadDescription}
            </p>

            {leadTags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {leadTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-funnel-text-soft)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {leadFacts.map((fact) => (
                <article
                  key={fact.id}
                  className="rounded-[1.15rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-4 py-3.5"
                >
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                    {fact.label}
                  </p>
                  <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
                    {fact.value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-funnel-text-soft)]">{fact.detail}</p>
                </article>
              ))}
            </div>

            {leadSupportSlot ? <div className="mt-4">{leadSupportSlot}</div> : null}
          </div>
        </div>

        <div data-testid={testIds.result.card0} className="border-t border-[color:var(--color-funnel-border)] px-5 py-5 sm:px-6 lg:px-7">
          {leadDetails}
        </div>

        {personalized ? (
          <p
            data-testid={testIds.shell.personalizedNote}
            className="border-t border-[color:var(--color-funnel-border)] px-5 py-4 text-xs leading-5 text-[var(--color-funnel-text-soft)] sm:px-6 lg:px-7"
          >
            개인화 안내 · 로그인한 여행 기록과 취향 모드가 함께 반영되고 있어요.
          </p>
        ) : null}
      </article>

      <div
        data-testid={testIds.result.querySummary}
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        {briefItems.map((item) => (
          <article
            key={item.id}
            className="rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white px-3.5 py-3"
          >
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              {item.label}
            </p>
            <p className="mt-1.5 text-sm font-semibold leading-5 tracking-[-0.02em] text-[var(--color-funnel-text)]">
              {item.value}
            </p>
          </article>
        ))}
      </div>

      {filtersSlot}
      {statusSlot}
      {resultsSlot}
      {savedSlot}
    </motion.section>
  );
}
