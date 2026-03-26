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
      className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-12 sm:px-8"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
    >
      <div className="w-full max-w-2xl text-center">
        <h1
          aria-label="지금 맞는 여행지, 바로 좁혀 드려요."
          className="text-[2.6rem] font-semibold leading-[0.92] tracking-[-0.07em] text-[var(--color-funnel-text)] sm:text-[4.4rem]"
        >
          지금 맞는 여행지,
          <br className="hidden sm:block" /> 바로 좁혀 드려요.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-[var(--color-funnel-text-soft)] sm:text-base sm:leading-7">
          질문 다섯 개만 고르면 가장 잘 맞는 목적지를 먼저 보여드려요.
        </p>

        <div className="mt-12 flex justify-center">
          <HeroAnimation testId={heroTestId} />
        </div>

        <div className="mt-12 flex justify-center">
          <button
            type="button"
            data-testid={testIds.home.cta}
            onClick={onStart}
            aria-label="추천 여정 시작하기"
            className="inline-flex min-h-[3.5rem] items-center justify-center rounded-full bg-[var(--color-funnel-text)] px-8 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--color-funnel-text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-funnel-text)]"
          >
            추천 시작
          </button>
        </div>
      </div>
    </motion.section>
  );
}
