"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { testIds } from "@/lib/test-ids";

type ResultLoadingPanelProps = {
  queryNarrative: string;
};

const loadingStages = [
  {
    label: "조건 읽는 중",
    title: "지금 고른 여행 조건을 먼저 정리하고 있어요.",
    description: "누구와 가는지, 일정 길이와 분위기까지 한 번에 묶어 봅니다.",
  },
  {
    label: "후보 비교 중",
    title: "잘 맞는 도시를 빠르게 걸러내고 있어요.",
    description: "시기, 비행 부담, 예산 감각이 크게 어긋나는 후보는 먼저 덜어냅니다.",
  },
  {
    label: "추천 완성 중",
    title: "가장 먼저 보여드릴 1순위를 정리하고 있어요.",
    description: "저장할지 바로 판단할 수 있게 지도와 보조 정보도 함께 붙입니다.",
  },
] as const;

const previewReasons = [
  "시기와 분위기가 맞는지 다시 확인",
  "비행 부담과 예산 감각 비교",
  "1순위부터 바로 저장 가능한 형태로 정리",
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

  const activeStage = loadingStages[activeStageIndex] ?? loadingStages[0];

  return (
    <motion.section
      data-testid={testIds.home.loadingState}
      className="overflow-hidden rounded-[1.75rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-5 shadow-[var(--shadow-funnel-soft)] sm:p-6"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-stretch">
        <section className="rounded-[1.35rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              추천 결과 준비 중
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-1 text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-action-primary)] animate-pulse" />
              {activeStage.label}
            </span>
          </div>

          <h2 className="mt-4 text-[1.85rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-funnel-text)] sm:text-[2.35rem]">
            조건에 맞는 여행지를
            <br />
            한 번 더 비교하고 있어요.
          </h2>

          <p className="mt-3 text-sm leading-7 text-[var(--color-funnel-text-soft)] sm:text-[0.98rem]">
            {queryNarrative}
          </p>

          <div className="mt-5 overflow-hidden rounded-full bg-[var(--color-funnel-accent-subtle)] p-1">
            <div className="compass-result-loading-progress h-2.5 rounded-full bg-[linear-gradient(90deg,#4ab4ff_0%,#1e88e5_52%,#0b63ce_100%)]" />
          </div>

          <div className="mt-5 rounded-[1.15rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-4 py-3.5">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              지금 하고 있는 일
            </p>
            <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
              {activeStage.title}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-funnel-text-soft)]">
              {activeStage.description}
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            {loadingStages.map((stage, index) => {
              const isActive = index === activeStageIndex;
              const isDone = index < activeStageIndex;

              return (
                <article
                  key={stage.label}
                  className={[
                    "flex items-start gap-3 rounded-[1rem] border px-3.5 py-3 transition-colors duration-200",
                    isActive
                      ? "border-[var(--color-action-primary)] bg-[var(--color-funnel-accent-subtle)]"
                      : "border-[color:var(--color-funnel-border)] bg-white",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold",
                      isDone
                        ? "bg-[var(--color-action-primary)] text-white"
                        : isActive
                          ? "compass-result-loading-orbit bg-white text-[var(--color-action-primary-strong)]"
                          : "bg-[var(--color-funnel-muted)] text-[var(--color-funnel-text-soft)]",
                    ].join(" ")}
                    style={isActive ? { animationDelay: `${index * 0.35}s` } : undefined}
                  >
                    {isDone ? "✓" : index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.84rem] font-semibold text-[var(--color-funnel-text)]">
                      {stage.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-funnel-text-soft)]">
                      {stage.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside
          data-testid={testIds.home.loadingSponsor}
          className="rounded-[1.35rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#eef7ff_100%)] px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:px-5 sm:py-5"
        >
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
            곧 보게 될 화면
          </p>

          <div className="mt-3 rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white p-3.5">
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

          <div className="mt-4 rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white p-3.5">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              정리 기준
            </p>
            <div className="mt-3 grid gap-2">
              {previewReasons.map((reason) => (
                <div
                  key={reason}
                  className="rounded-[0.9rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-2.5"
                >
                  <p className="text-[0.8rem] font-semibold text-[var(--color-funnel-text)]">{reason}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[0.78rem] leading-6 text-[var(--color-funnel-text-soft)]">
            결과는 바로 띄우기보다, 저장해도 납득되는 1순위로 먼저 정리해 보여드릴게요.
          </p>
        </aside>
      </div>
    </motion.section>
  );
}
