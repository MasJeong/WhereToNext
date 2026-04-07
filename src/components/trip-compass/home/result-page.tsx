"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { testIds } from "@/lib/test-ids";
import type { WorkspaceBriefItemView } from "@/lib/trip-compass/presentation";

type ResultPageProps = {
  testId: string;
  leadTitle: string;
  leadDescription: string;
  leadMetaTags?: string[];
  leadTags: string[];
  leadHeroAsideSlot?: ReactNode;
  leadSupportSlot?: ReactNode;
  leadWeatherSlot?: ReactNode;
  leadActionsSlot?: ReactNode;
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
  leadDescription,
  leadMetaTags = [],
  leadTags,
  leadHeroAsideSlot,
  leadSupportSlot,
  leadWeatherSlot,
  leadActionsSlot,
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
  const visibleTags = leadTags.slice(0, 2);

  return (
    <motion.section
      className="mx-auto max-w-6xl space-y-4 px-5 py-6 sm:px-8 sm:py-8"
      data-testid={testId}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
    >
      {/* Query summary — inline tag strip */}
      {briefItems.length > 0 ? (
        <div
          data-testid={testIds.result.querySummary}
          className="flex flex-wrap items-center gap-2 rounded-[1.15rem] border border-[color:var(--color-funnel-border)] bg-white px-3.5 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:px-4"
        >
          {briefItems.map((item) => (
            <span
              key={item.id}
              className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-1.5 text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]"
            >
              {item.label} <span className="text-[var(--color-funnel-text)]">{item.value}</span>
            </span>
          ))}
          {resultMeta}
          {personalized ? (
            <span
              data-testid={testIds.shell.personalizedNote}
              className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-1.5 text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]"
            >
              개인화 반영
            </span>
          ) : null}
        </div>
      ) : null}

      <div data-testid={testIds.home.topSummary} className="space-y-4">
        <section
          data-testid={testIds.result.card0}
          className="overflow-hidden rounded-[1.4rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
        >
          <div className="space-y-4 p-4 sm:p-5">
            <div className="rounded-[1.05rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-4">
              <div className={`grid gap-4 ${leadHeroAsideSlot ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.65fr)] lg:items-start" : ""}`}>
                <div className="max-w-[34rem] space-y-3">
                  <span className="inline-block rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-funnel-text-soft)]">
                    지금 조건 기준 1순위
                  </span>

                  <h2 className="text-[1.9rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--color-funnel-text)] sm:text-[2.3rem]">
                    {leadTitle}
                  </h2>

                  <p className="line-clamp-3 text-[0.95rem] leading-7 tracking-[-0.01em] text-[var(--color-funnel-text)]">
                    {leadDescription}
                  </p>

                  {visibleTags.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {visibleTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {leadMetaTags.slice(0, 1).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {leadHeroAsideSlot ? <div>{leadHeroAsideSlot}</div> : null}
              </div>
            </div>

            <div className="rounded-[1.05rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-4">
              {leadDetails}
            </div>
          </div>
        </section>

        {leadWeatherSlot ? <div>{leadWeatherSlot}</div> : null}

        {leadSupportSlot ? (
          <section className="space-y-3 rounded-[1.3rem] border border-[color:var(--color-funnel-border)] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-5">
            <p className="text-[0.95rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
              대표 영상으로 분위기 확인
            </p>
            <p className="text-sm leading-6 text-[var(--color-funnel-text-soft)]">
              영상으로 분위기를 먼저 확인해 보세요
            </p>
            {leadSupportSlot}
          </section>
        ) : (
          <div className="overflow-hidden rounded-[1.25rem] border border-[color:var(--color-funnel-border)] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="flex min-h-[16rem] flex-col justify-between gap-4 p-5 sm:min-h-[18rem] sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <p className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                  YouTube
                </p>
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-1 text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-action-primary)] animate-pulse" />
                  준비 중
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-[1rem] font-semibold tracking-[-0.03em] text-[var(--color-funnel-text)]">
                  관련 영상을 붙이는 중입니다
                </p>
                <p className="max-w-xl text-sm leading-6 text-[var(--color-funnel-text-soft)]">
                  결과는 먼저 보여드리고, 영상은 뒤에서 조용히 이어 붙입니다.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_11rem]">
                <div className="space-y-2 rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-3">
                  <div className="h-3 w-24 rounded-full bg-white" />
                  <div className="h-3 w-full rounded-full bg-white" />
                  <div className="h-3 w-5/6 rounded-full bg-white" />
                </div>
                <div className="rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-3">
                  <div className="aspect-[4/3] rounded-[0.8rem] bg-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {leadActionsSlot ? <div>{leadActionsSlot}</div> : null}
      </div>

      {statusSlot}
      {filtersSlot}
      {resultsSlot}
      {savedSlot}
    </motion.section>
  );
}
