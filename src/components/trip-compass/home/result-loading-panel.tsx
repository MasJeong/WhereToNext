"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { testIds } from "@/lib/test-ids";

type ResultLoadingPanelProps = {
  queryNarrative: string;
};

const loadingStages = [
  { label: "조건 정리" },
  { label: "후보 비교" },
  { label: "추천 완성" },
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
      className="mx-auto max-w-2xl space-y-5"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
    >
      {/* Main loading card — single column, centered */}
      <div className="overflow-hidden rounded-[1.75rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] px-6 py-8 shadow-[var(--shadow-funnel-soft)] sm:px-10 sm:py-10">
        <div className="flex flex-col items-center text-center">
          {/* Animated loading icon */}
          <motion.div
            className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.4rem] bg-[linear-gradient(145deg,#1e88e5_0%,#42a5f5_100%)] shadow-[0_10px_28px_rgba(30,136,229,0.22)]"
            animate={prefersReducedMotion ? {} : { scale: [1, 1.05, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 36 36" fill="none" className="h-9 w-9" aria-hidden="true">
              {/* Compass ring */}
              <circle cx="18" cy="18" r="13" stroke="white" strokeWidth="2" opacity="0.35" />
              {/* North needle */}
              <motion.g
                style={{ originX: "18px", originY: "18px" }}
                animate={prefersReducedMotion ? {} : { rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <path d="M18 7 L20.5 18 L18 16.5 L15.5 18 Z" fill="white" />
                <path d="M18 29 L20.5 18 L18 19.5 L15.5 18 Z" fill="white" opacity="0.4" />
              </motion.g>
              {/* Center dot */}
              <circle cx="18" cy="18" r="2" fill="white" />
            </svg>
          </motion.div>

          <h2 className="mt-6 text-[1.55rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--color-funnel-text)] sm:text-[1.85rem]">
            여행지를 비교하고 있어요
          </h2>

          <p className="mx-auto mt-2.5 max-w-sm text-[0.88rem] leading-6 text-[var(--color-funnel-text-soft)]">
            {queryNarrative}
          </p>

          {/* Horizontal stepper */}
          <div className="mt-8 w-full max-w-[16rem]">
            {/* Circle + line row */}
            <div className="flex items-center">
              {loadingStages.map((stage, index) => {
                const isDone = index < activeStageIndex;
                const isActive = index === activeStageIndex;

                return (
                  <div key={stage.label} className={`flex items-center ${index > 0 ? "flex-1" : ""}`}>
                    {index > 0 ? (
                      <div
                        className={[
                          "h-[2px] flex-1 rounded-full transition-colors duration-500",
                          isDone ? "bg-[var(--color-action-primary)]" : "bg-[var(--color-funnel-border)]",
                        ].join(" ")}
                      />
                    ) : null}
                    <span
                      className={[
                        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold transition-all duration-500",
                        isDone
                          ? "bg-[var(--color-action-primary)] text-white shadow-[0_2px_8px_rgba(30,136,229,0.3)]"
                          : isActive
                            ? "border-2 border-[var(--color-action-primary)] bg-white text-[var(--color-action-primary)] shadow-[0_0_0_4px_rgba(30,136,229,0.08)]"
                            : "border border-[var(--color-funnel-border)] bg-[var(--color-funnel-muted)] text-[var(--color-funnel-text-soft)]",
                      ].join(" ")}
                    >
                      {isDone ? "✓" : `${index + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Label row */}
            <div className="mt-2 flex">
              {loadingStages.map((stage, index) => {
                const isDone = index < activeStageIndex;
                const isActive = index === activeStageIndex;

                return (
                  <span
                    key={stage.label}
                    className={[
                      "flex-1 text-center text-[0.68rem] font-medium transition-colors duration-500",
                      index === 0 ? "text-left" : index === loadingStages.length - 1 ? "text-right" : "",
                      isDone || isActive ? "text-[var(--color-funnel-text)]" : "text-[var(--color-funnel-text-soft)]",
                    ].join(" ")}
                  >
                    {stage.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 w-full overflow-hidden rounded-full bg-[var(--color-funnel-accent-subtle)] p-0.5">
            <div className="compass-result-loading-progress h-1.5 rounded-full bg-[linear-gradient(90deg,#4ab4ff_0%,#1e88e5_52%,#0b63ce_100%)]" />
          </div>
        </div>
      </div>

      {/* Skeleton preview — what's being prepared */}
      <div className="overflow-hidden rounded-[1.35rem] border border-[color:var(--color-funnel-border)] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)] sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-[var(--color-action-primary)] px-2.5 py-1 text-[0.64rem] font-semibold text-white">
            1순위 추천
          </span>
          <span className="h-2 w-14 animate-pulse rounded-full bg-[var(--color-funnel-muted)]" />
        </div>
        <div className="mt-3.5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <div className="h-6 w-32 animate-pulse rounded-full bg-[var(--color-funnel-muted)]" />
            <div className="h-3.5 w-full animate-pulse rounded-full bg-[var(--color-funnel-muted)]" />
            <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-[var(--color-funnel-muted)]" />
          </div>
          <div className="flex items-end gap-2">
            <div className="h-9 w-24 animate-pulse rounded-full bg-[var(--color-funnel-muted)]" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-[var(--color-funnel-muted)]" />
          </div>
        </div>
      </div>

      {/* Ad slot — styled as native content card */}
      <aside
        data-testid={testIds.home.loadingSponsor}
        className="overflow-hidden rounded-[1.35rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_8px_20px_rgba(15,23,42,0.03)]"
      >
        <div
          data-testid="loading-ad-slot"
          className="flex min-h-[6rem] items-center justify-center px-5 py-5"
        >
          <p className="text-[0.72rem] text-[var(--color-funnel-text-soft)]">
            광고 영역
          </p>
        </div>
      </aside>
    </motion.section>
  );
}
