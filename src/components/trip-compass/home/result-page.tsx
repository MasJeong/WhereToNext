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
  leadTags: string[];
  leadFacts: RecommendationDecisionFactView[];
  leadSupportSlot?: ReactNode;
  leadWeatherSlot?: ReactNode;
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
  leadTags,
  leadFacts,
  leadSupportSlot,
  leadWeatherSlot,
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
      className="mx-auto max-w-6xl space-y-5 px-5 py-6 sm:px-8 sm:py-8"
      data-testid={testId}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
    >
      <article
        data-testid={testIds.home.topSummary}
        className="overflow-hidden rounded-[1.6rem] border border-[color:var(--color-funnel-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]"
      >
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.04fr)_minmax(24rem,0.96fr)]">
          <div className="border-b border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 sm:p-5 lg:p-6 xl:border-b-0 xl:border-r">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                가장 잘 맞는 추천
              </span>
              {resultMeta}
            </div>

            <div className="mt-4">
              {leadSupportSlot ? (
                leadSupportSlot
              ) : (
                <article className="rounded-[1.4rem] border border-[color:var(--color-funnel-border)] bg-white px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                    대표 콘텐츠
                  </p>
                  <p className="mt-3 text-[1.5rem] font-semibold tracking-[-0.04em] text-[var(--color-funnel-text)]">
                    {leadTitle}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
                    영상이 준비되면 이 자리에서 바로 보실 수 있게 붙여 드릴게요.
                  </p>
                </article>
              )}
            </div>

          </div>

          <div data-testid={testIds.result.card0} className="flex flex-col p-5 sm:p-6 lg:p-7">
            <h2 className="text-[2.15rem] font-semibold leading-[0.96] tracking-[-0.05em] text-[var(--color-funnel-text)] sm:text-[3rem]">
              {leadTitle}
            </h2>
            <p className="mt-3 text-[0.98rem] font-semibold leading-7 text-[var(--color-funnel-text)] sm:text-[1.02rem]">
              {leadReason}
            </p>
            <p className="mt-1.5 line-clamp-2 text-[0.9rem] leading-6 text-[var(--color-funnel-text-soft)] sm:text-[0.95rem]">
              {leadDescription}
            </p>

            {leadTags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {leadTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            {leadWeatherSlot ? <div className="mt-4">{leadWeatherSlot}</div> : null}

            <div className="mt-5 divide-y divide-[color:var(--color-funnel-border)] rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)]">
              {leadFacts.map((fact) => (
                <article key={fact.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                      {fact.label}
                    </p>
                  </div>
                  <p className="shrink-0 text-[0.95rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
                    {fact.value}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-5">{leadDetails}</div>
          </div>
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
        className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {briefItems.map((item) => (
          <article
            key={item.id}
            className="rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-white px-3.5 py-3"
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

      {statusSlot}
      {filtersSlot}
      {resultsSlot}
      {savedSlot}
    </motion.section>
  );
}
