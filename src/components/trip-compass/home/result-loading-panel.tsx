"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { testIds } from "@/lib/test-ids";

type ResultLoadingPanelProps = {
  queryNarrative: string;
};

const loadingStages = [
  { label: "조건 정리 중" },
  { label: "후보 비교 중" },
  { label: "추천 완성 중" },
] as const;

export function ResultLoadingPanel({ queryNarrative }: ResultLoadingPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  useEffect(() => {
    const timers = loadingStages.slice(1).map((_, index) =>
      window.setTimeout(() => {
        setActiveStageIndex(index + 1);
      }, (index + 1) * 1200),
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  return (
    <motion.section
      data-testid={testIds.home.loadingState}
      className="overflow-hidden rounded-[1.75rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-5 shadow-[var(--shadow-funnel-soft)] sm:p-6"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-stretch">
        {/* Left — status */}
        <section className="flex flex-col justify-between rounded-[1.35rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:px-5 sm:py-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-1 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-action-primary)] animate-pulse" />
              {loadingStages[activeStageIndex]?.label ?? loadingStages[0].label}
            </span>

            <h2 className="mt-4 text-[1.85rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-funnel-text)] sm:text-[2.35rem]">
              조건에 맞는 여행지를
              <br />
              비교하고 있어요
            </h2>

            <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--color-funnel-text-soft)]">
              {queryNarrative}
            </p>
          </div>

          {/* Stepper — labels only */}
          <div className="mt-6">
            <div className="flex items-center gap-1">
              {loadingStages.map((stage, index) => {
                const isDone = index < activeStageIndex;
                const isActive = index === activeStageIndex;

                return (
                  <div key={stage.label} className="flex items-center gap-1">
                    {index > 0 ? (
                      <div
                        className={[
                          "h-px w-6 transition-colors duration-300",
                          isDone ? "bg-[var(--color-action-primary)]" : "bg-[var(--color-funnel-border)]",
                        ].join(" ")}
                      />
                    ) : null}
                    <span
                      className={[
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.72rem] font-semibold transition-colors duration-300",
                        isDone
                          ? "bg-[var(--color-action-primary)] text-white"
                          : isActive
                            ? "border border-[var(--color-action-primary)] bg-[var(--color-funnel-accent-subtle)] text-[var(--color-action-primary)]"
                            : "bg-[var(--color-funnel-muted)] text-[var(--color-funnel-text-soft)]",
                      ].join(" ")}
                    >
                      {isDone ? "✓" : `${index + 1}`}
                      <span className="hidden sm:inline">{stage.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 overflow-hidden rounded-full bg-[var(--color-funnel-accent-subtle)] p-0.5">
              <div className="compass-result-loading-progress h-2 rounded-full bg-[linear-gradient(90deg,#4ab4ff_0%,#1e88e5_52%,#0b63ce_100%)]" />
            </div>
          </div>
        </section>

        {/* Right — ad slot + skeleton preview */}
        <aside
          data-testid={testIds.home.loadingSponsor}
          className="flex flex-col gap-4 rounded-[1.35rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#eef7ff_100%)] px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:px-5 sm:py-5"
        >
          {/* Skeleton preview */}
          <div className="rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--color-action-primary)] px-2.5 py-1 text-[0.64rem] font-semibold text-white">
                1순위 추천
              </span>
              <span className="h-2 w-16 rounded-full bg-[var(--color-funnel-muted)]" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-7 w-36 rounded-full bg-[var(--color-funnel-muted)]" />
              <div className="h-4 w-full rounded-full bg-[var(--color-funnel-muted)]" />
              <div className="h-4 w-5/6 rounded-full bg-[var(--color-funnel-muted)]" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="h-10 w-28 rounded-full bg-[var(--color-funnel-muted)]" />
              <div className="h-10 w-24 rounded-full bg-[var(--color-funnel-muted)]" />
            </div>
          </div>

          {/* Ad slot placeholder — replace with real ad component after launch */}
          <div
            data-testid="loading-ad-slot"
            className="flex flex-1 items-center justify-center rounded-[1.1rem] border border-dashed border-[color:var(--color-funnel-border)] bg-white/60 p-4"
          >
            <p className="text-center text-[0.72rem] leading-5 text-[var(--color-funnel-text-soft)]">
              광고 영역
            </p>
          </div>
        </aside>
      </div>
    </motion.section>
  );
}
