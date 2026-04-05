import { motion, useReducedMotion } from "framer-motion";

type ProgressBarProps = {
  current: number;
  total: number;
  testId: string;
};

export function ProgressBar({ current, total, testId }: ProgressBarProps) {
  const percent = Math.max(0, Math.min(100, Math.round((current / total) * 100)));
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-[12rem] space-y-2" data-testid={testId}>
      <div className="flex items-center justify-between gap-3 text-[0.68rem] font-semibold text-[var(--color-funnel-text-soft)]">
        <span>{current} / {total}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-funnel-accent-subtle)]">
        <motion.div
          className="h-full rounded-full bg-[var(--color-funnel-text)] transition-[width] duration-200"
          animate={{ width: `${percent}%` }}
          initial={false}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
