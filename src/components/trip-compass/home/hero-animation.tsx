import { motion, useReducedMotion } from "framer-motion";

type HeroAnimationProps = {
  testId: string;
};

export function HeroAnimation({ testId }: HeroAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      data-testid={testId}
      className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,rgb(255_255_255),rgb(249_252_255))]"
      aria-hidden="true"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
    >
      <div className="absolute inset-x-0 top-0 h-[50%] bg-[linear-gradient(180deg,var(--color-funnel-accent-soft),var(--color-funnel-accent-subtle))]" />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-white" />
      <div className="absolute left-6 top-6 h-20 w-20 rounded-full bg-[radial-gradient(circle,_rgb(74_180_255_/_0.26),_transparent_68%)] blur-md" />
      <div className="absolute left-1/2 top-[21%] h-16 w-16 -translate-x-1/2 rounded-full border border-[color:rgb(74_180_255_/_0.34)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.96),rgb(238_247_255_/_0.94))] shadow-[0_10px_24px_rgb(74_180_255_/_0.16)]" />
      <div className="absolute inset-x-10 top-[46%] h-px bg-[linear-gradient(90deg,transparent,rgb(74_180_255_/_0.6),transparent)]" />

      <div className="absolute inset-x-6 bottom-16 flex items-end justify-between">
        <span className="h-16 w-10 rounded-t-[1rem] bg-[linear-gradient(180deg,var(--color-funnel-accent-muted),var(--color-funnel-accent-soft))]" />
        <span className="h-24 w-12 rounded-t-[1rem] bg-[linear-gradient(180deg,var(--color-action-primary),var(--color-sand-deep))]" />
        <span className="h-14 w-10 rounded-t-[0.9rem] bg-[var(--color-funnel-accent-soft)]" />
        <span className="h-20 w-11 rounded-t-[1rem] bg-[linear-gradient(180deg,var(--color-sand-deep),#0f4ea6)]" />
        <span className="h-12 w-9 rounded-t-[0.8rem] bg-[linear-gradient(180deg,var(--color-funnel-accent-muted),#93d4ff)]" />
      </div>

      <motion.div
        className="home-funnel-hero-orbit absolute bottom-20 left-10 h-16 w-16 rounded-full border-2 border-[color:var(--color-action-primary)]"
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="home-funnel-hero-orbit absolute bottom-16 left-14 h-4 w-4 rounded-full bg-[var(--color-action-primary)] shadow-[0_0_0_6px_rgb(74_180_255_/_0.16)]"
        animate={prefersReducedMotion ? undefined : { y: [0, -4, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="home-funnel-hero-traveler absolute bottom-10 right-16"
        animate={prefersReducedMotion ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="absolute bottom-10 left-3 h-5 w-5 rounded-full bg-[var(--color-funnel-text)]" />
        <span className="absolute bottom-2 left-4 h-10 w-4 rounded-full bg-[linear-gradient(180deg,var(--color-action-primary),var(--color-sand-deep))]" />
        <span className="absolute bottom-0 left-2 h-7 w-[0.32rem] rounded-full bg-[var(--color-funnel-text)]" />
        <span className="absolute bottom-0 left-7 h-7 w-[0.32rem] rounded-full bg-[var(--color-funnel-text)]" />
        <span className="absolute bottom-7 -left-1 h-4 w-4 rounded-[0.7rem] border border-[color:var(--color-action-primary)] bg-[var(--color-paper-soft)]" />
      </motion.div>
    </motion.div>
  );
}
