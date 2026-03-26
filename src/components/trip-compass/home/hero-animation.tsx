import { motion, useReducedMotion } from "framer-motion";

type HeroAnimationProps = {
  testId: string;
};

export function HeroAnimation({ testId }: HeroAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      data-testid={testId}
      className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-[2rem] border border-[color:var(--color-funnel-border)] bg-white"
      aria-hidden="true"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
    >
      <motion.div
        className="absolute inset-x-0 top-0 h-[48%] bg-[var(--color-funnel-accent-subtle)]"
        animate={prefersReducedMotion ? undefined : { opacity: [1, 0.92, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-white" />
      <div className="absolute left-6 top-6 inline-flex items-center rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3 py-1 text-[0.64rem] font-semibold tracking-[0.08em] text-[var(--color-funnel-text-soft)]">
        한 화면씩 바로 선택
      </div>
      <div className="absolute right-7 top-7 h-14 w-14 rounded-full border border-[color:var(--color-funnel-border)] bg-white" />
      <div className="absolute left-1/2 top-[24%] h-16 w-16 -translate-x-1/2 rounded-full border border-[color:var(--color-funnel-border)] bg-white" />

      <div className="absolute inset-x-6 bottom-16 flex items-end justify-between">
        <span className="h-16 w-10 rounded-t-[1rem] bg-[var(--color-funnel-accent-muted)]" />
        <span className="h-24 w-12 rounded-t-[1rem] bg-[var(--color-funnel-text)]" />
        <span className="h-14 w-10 rounded-t-[0.9rem] bg-[var(--color-funnel-accent-soft)]" />
        <span className="h-20 w-11 rounded-t-[1rem] bg-[var(--color-funnel-text)]" />
        <span className="h-12 w-9 rounded-t-[0.8rem] bg-[var(--color-funnel-accent-muted)]" />
      </div>

      <motion.div
        className="home-funnel-hero-orbit absolute bottom-20 left-10 h-16 w-16 rounded-full border-2 border-[color:var(--color-funnel-text)]"
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="home-funnel-hero-orbit absolute bottom-16 left-14 h-4 w-4 rounded-full bg-[var(--color-funnel-text)]"
        animate={prefersReducedMotion ? undefined : { y: [0, -4, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="home-funnel-hero-traveler absolute bottom-10 right-16"
        animate={prefersReducedMotion ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="absolute bottom-10 left-3 h-5 w-5 rounded-full bg-[var(--color-funnel-text)]" />
        <span className="absolute bottom-2 left-4 h-10 w-4 rounded-full bg-[var(--color-funnel-text)]" />
        <span className="absolute bottom-0 left-2 h-7 w-[0.32rem] rounded-full bg-[var(--color-funnel-text)]" />
        <span className="absolute bottom-0 left-7 h-7 w-[0.32rem] rounded-full bg-[var(--color-funnel-text)]" />
        <span className="absolute bottom-7 -left-1 h-4 w-4 rounded-[0.7rem] border border-[color:var(--color-funnel-text)] bg-white" />
      </motion.div>
    </motion.div>
  );
}
