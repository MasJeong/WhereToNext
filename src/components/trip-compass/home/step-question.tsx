import { motion, useReducedMotion } from "framer-motion";

import { ProgressBar } from "./progress-bar";
import { testIds } from "@/lib/test-ids";

type StepOption = {
  id: string;
  label: string;
  description: string;
  selected: boolean;
  testId: string;
  onSelect: () => void;
};

type StepQuestionProps = {
  current: number;
  total: number;
  questionTestId: string;
  helperTestId: string;
  progressTestId: string;
  question: string;
  helper: string;
  options: StepOption[];
  onBack: () => void;
  onReset: () => void;
  isSubmitting: boolean;
};

export function StepQuestion({
  current,
  total,
  questionTestId,
  helperTestId,
  progressTestId,
  question,
  helper,
  options,
  onBack,
  onReset,
  isSubmitting,
}: StepQuestionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-8 sm:px-8 sm:py-10"
      initial={prefersReducedMotion ? false : { opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, x: -18 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
    >
      <div className="w-full">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            data-testid={testIds.home.previous}
            onClick={onBack}
            className="inline-flex min-h-[2.75rem] items-center rounded-full border border-[color:var(--color-funnel-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-[var(--color-funnel-muted)]"
          >
            이전
          </button>

          <ProgressBar current={current} total={total} testId={progressTestId} />

          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[2.75rem] items-center rounded-full border border-[color:var(--color-funnel-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-[var(--color-funnel-muted)]"
          >
            처음으로
          </button>
        </div>

        <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl flex-col items-center justify-center py-8 text-center sm:py-10">
          <h2
            data-testid={questionTestId}
            className="max-w-2xl text-[2.4rem] font-semibold leading-[0.94] tracking-[-0.07em] text-[var(--color-funnel-text)] sm:text-[4rem]"
          >
            {question}
          </h2>
          <p
            data-testid={helperTestId}
            className="mt-4 max-w-xl text-sm leading-6 text-[var(--color-funnel-text-soft)] sm:text-base sm:leading-7"
          >
            {helper}
          </p>

          <div className="mt-12 grid w-full gap-3 sm:grid-cols-2">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                data-testid={option.testId}
                aria-pressed={option.selected}
                disabled={isSubmitting}
                onClick={option.onSelect}
                className={`min-h-[7.25rem] rounded-[1.5rem] border px-5 py-5 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  option.selected
                    ? "border-[color:var(--color-funnel-text)] bg-[var(--color-funnel-muted)]"
                    : "border-[color:var(--color-funnel-border)] bg-white hover:bg-[var(--color-funnel-muted)]"
                }`}
              >
                <span className="block text-lg font-semibold tracking-[-0.03em] text-[var(--color-funnel-text)]">
                  {option.label}
                </span>
                <span className="mt-2 block text-sm leading-6 text-[var(--color-funnel-text-soft)]">
                  {option.description}
                </span>
              </button>
            ))}
          </div>

          {isSubmitting ? (
            <p className="mt-6 text-sm leading-6 text-[var(--color-funnel-text-soft)]">조건에 맞는 목적지를 정리하고 있어요.</p>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
