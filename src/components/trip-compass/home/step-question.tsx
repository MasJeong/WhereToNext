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
  nextLabel?: string;
  onNext?: () => void;
  nextDisabled?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  selectedChips?: Array<{
    id: string;
    label: string;
    onRemove: () => void;
  }>;
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
  nextLabel,
  onNext,
  nextDisabled,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  emptyMessage,
  selectedChips,
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
          <div className="min-w-[4rem] text-right">
            <button
              type="button"
              onClick={onReset}
              className="text-sm font-medium text-[var(--color-funnel-text-soft)] transition-colors duration-200 hover:text-[var(--color-funnel-text)]"
            >
              처음으로
            </button>
          </div>
        </div>

        <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl flex-col items-center justify-center py-8 text-center sm:py-10">
          <h2
            data-testid={questionTestId}
            className="max-w-2xl text-[2rem] font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--color-funnel-text)] sm:text-[3.15rem]"
          >
            {question}
          </h2>
          <p
            data-testid={helperTestId}
            className="mt-3 max-w-lg text-[0.95rem] leading-6 text-[var(--color-funnel-text-soft)] sm:text-[1rem] sm:leading-7"
          >
            {helper}
          </p>

          {onSearchChange ? (
            <div className="mt-8 w-full max-w-2xl">
              <input
                type="text"
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder ?? "검색"}
                autoComplete="off"
                spellCheck={false}
                aria-label={searchPlaceholder ?? "검색"}
                className="w-full rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-3 text-[0.95rem] text-[var(--color-funnel-text)] outline-none transition-colors focus:border-[color:var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary)]/15"
              />
            </div>
          ) : null}

          {selectedChips && selectedChips.length > 0 ? (
            <div className="mt-4 flex w-full max-w-2xl flex-wrap gap-2">
              {selectedChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border border-[color:var(--color-action-primary)] bg-[var(--color-selected)] px-3.5 py-2 text-[0.84rem] font-medium text-[var(--color-funnel-text)] transition-colors hover:bg-[var(--color-funnel-muted)]"
                >
                  <span>{chip.label}</span>
                  <span className="text-[0.8rem] text-[var(--color-funnel-text-soft)]">삭제</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
            {options.length > 0 ? options.map((option) => (
              <button
                key={option.id}
                type="button"
                data-testid={option.testId}
                aria-pressed={option.selected}
                disabled={isSubmitting}
                onClick={option.onSelect}
                className={`min-h-[6.5rem] rounded-[1.35rem] border px-5 py-4.5 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  option.selected
                    ? "border-[color:var(--color-action-primary)] bg-[var(--color-selected)]"
                    : "border-[color:var(--color-funnel-border)] bg-white hover:bg-[var(--color-funnel-muted)]"
                }`}
              >
                <span className="block text-[1rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)]">
                  {option.label}
                </span>
                <span className="mt-1.5 block text-[0.92rem] leading-6 text-[var(--color-funnel-text-soft)]">
                  {option.description}
                </span>
              </button>
            )) : emptyMessage ? (
              <p className="col-span-full rounded-[1.35rem] border border-dashed border-[color:var(--color-funnel-border)] bg-white px-5 py-8 text-center text-[0.92rem] leading-6 text-[var(--color-funnel-text-soft)]">
                {emptyMessage ?? "검색 결과가 없어요."}
              </p>
            ) : null}
          </div>

          {onNext ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                data-testid={testIds.home.next}
                onClick={onNext}
                disabled={nextDisabled || isSubmitting}
                className="inline-flex min-h-[3rem] items-center rounded-full bg-[var(--color-action-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--color-action-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {nextLabel ?? "다음"}
              </button>
            </div>
          ) : null}

          {isSubmitting ? (
            <p className="mt-6 text-sm leading-6 text-[var(--color-funnel-text-soft)]">조건에 맞는 목적지를 정리하고 있어요.</p>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
