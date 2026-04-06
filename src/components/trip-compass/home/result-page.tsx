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
          className="flex flex-wrap items-center gap-2"
        >
          {briefItems.map((item) => (
            <span
              key={item.id}
              className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-1.5 text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]"
            >
              {item.label}{" "}
              <span className="text-[var(--color-funnel-text)]">{item.value}</span>
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

      {/* Lead — 2-column: videos left, sticky info right */}
      <div
        data-testid={testIds.home.topSummary}
        className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]"
      >
        {/* Left — YouTube video panel */}
        <div className="min-w-0">
          {leadSupportSlot ? (
            leadSupportSlot
          ) : (
            <div className="overflow-hidden rounded-[1.25rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ed_100%)] shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
              <div className="flex min-h-[16rem] flex-col justify-between gap-4 p-5 sm:min-h-[18rem] sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="rounded-full bg-white px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                    YouTube
                  </p>
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[0.72rem] font-semibold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    영상 생성 중
                  </span>
                </div>
                <div className="space-y-2.5">
                  <p className="text-[1.35rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-funnel-text)] sm:text-[1.6rem]">
                    추천 결과를 더 실감 나게 볼 영상을 고르고 있어요
                  </p>
                  <p className="max-w-xl text-sm leading-6 text-[var(--color-funnel-text-soft)]">
                    목적지는 이미 정리됐고, 지금은 추천 이유가 바로 읽히는 YouTube 영상을 메인부터 차례로 붙이는 중이에요.
                  </p>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <article className="rounded-[1.1rem] border border-amber-200 bg-white px-4 py-3">
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                      지금 보는 단계
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-[var(--color-funnel-text)]">
                      가장 먼저 볼 영상부터 정리
                    </p>
                  </article>
                  <article className="rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white/80 px-4 py-3">
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                      이어서
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-[var(--color-funnel-text)]">
                      비교해서 볼 보조 영상까지 이어서 정리
                    </p>
                  </article>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded-full bg-white/90" />
                  <div className="h-3 w-full rounded-full bg-white/70" />
                  <div className="h-3 w-4/5 rounded-full bg-white/70" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — sticky info panel */}
        <div
          data-testid={testIds.result.card0}
          className="lg:sticky lg:top-4"
        >
          <div className="space-y-4 rounded-[1.25rem] border border-[color:var(--color-funnel-border)] bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--color-action-primary)] px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-white">
                가장 잘 맞는 추천
              </span>
            </div>

            <div>
              <h2 className="text-[1.75rem] font-semibold leading-[1] tracking-[-0.04em] text-[var(--color-funnel-text)] sm:text-[2.25rem]">
                {leadTitle}
              </h2>
              <p className="mt-3 text-[0.95rem] font-semibold leading-7 text-[var(--color-funnel-text)]">
                {leadReason}
              </p>
              <p className="mt-1.5 line-clamp-2 text-[0.88rem] leading-6 text-[var(--color-funnel-text-soft)]">
                {leadDescription}
              </p>
            </div>

            {leadTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
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

            {/* Key facts */}
            {leadFacts.length > 0 ? (
              <div className="divide-y divide-[color:var(--color-funnel-border)] rounded-[0.75rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)]">
                {leadFacts.slice(0, 3).map((fact) => (
                  <div key={fact.id} className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-[0.72rem] text-[var(--color-funnel-text-soft)]">
                      {fact.label}
                    </span>
                    <span className="text-[0.82rem] font-semibold text-[var(--color-funnel-text)]">
                      {fact.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Weather */}
            {leadWeatherSlot ? <div>{leadWeatherSlot}</div> : null}

            {/* CTA */}
            <div>{leadDetails}</div>
          </div>
        </div>
      </div>

      {statusSlot}
      {filtersSlot}
      {resultsSlot}
      {savedSlot}
    </motion.section>
  );
}
