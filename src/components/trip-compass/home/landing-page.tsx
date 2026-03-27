import { motion, useReducedMotion } from "framer-motion";

import { HeroAnimation } from "./hero-animation";
import { testIds } from "@/lib/test-ids";

type LandingPageProps = {
  testId: string;
  heroTestId: string;
  onStart: () => void;
};

export function LandingPage({ testId, heroTestId, onStart }: LandingPageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      data-testid={testId}
      className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center overflow-hidden px-6 py-10 sm:px-8"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
    >
      <div className="relative w-full max-w-2xl text-center">
        <h1
          aria-label="여행지, 바로 추천받기"
          className="text-[2.15rem] font-semibold leading-[0.96] tracking-[-0.06em] text-[var(--color-funnel-text)] sm:text-[3.5rem]"
        >
          여행지,
          <br className="hidden sm:block" /> 바로 추천받기
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-6 text-[var(--color-funnel-text-soft)] sm:text-[1rem] sm:leading-7">
          몇 가지 선택만 하면 지금의 여행 취향에 맞는 곳을 바로 보여드려요.
        </p>

        <div className="mt-8 flex justify-center">
          <HeroAnimation testId={heroTestId} />
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            data-testid={testIds.home.cta}
            onClick={onStart}
            aria-label="추천 여정 시작하기"
            className="inline-flex min-h-[3.75rem] items-center justify-center rounded-full border border-[var(--color-action-primary-border)] bg-[linear-gradient(135deg,var(--color-action-primary),var(--color-action-primary-strong))] px-9 py-3 text-sm font-semibold text-white shadow-[var(--shadow-hero)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgb(11_99_206_/_0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-action-primary)]"
          >
            추천 시작
          </button>
        </div>
      </div>
    </motion.section>
  );
}
