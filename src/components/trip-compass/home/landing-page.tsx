import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { HeroAnimation } from "./hero-animation";
import { testIds } from "@/lib/test-ids";

type LandingPageProps = {
  testId: string;
  heroTestId: string;
  onStart: () => void;
  trendingDestinations?: string[] | null;
  trendingLoading?: boolean;
  todayCount?: number;
};

export function LandingPage({ testId, heroTestId, onStart, trendingDestinations, trendingLoading, todayCount }: LandingPageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [showSticky, setShowSticky] = useState(false);

  const displayDestinations =
    trendingDestinations && trendingDestinations.length > 0
      ? trendingDestinations.slice(0, 3)
      : null;

  useEffect(() => {
    function handleScroll() {
      setShowSticky(window.scrollY > 260);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.section
      data-testid={testId}
      className="relative mx-auto flex min-h-[92vh] max-w-[72rem] flex-col items-center justify-center overflow-hidden px-5 py-8 sm:px-8 sm:py-10"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
    >
      <div className="relative w-full max-w-[56rem] text-center">
        <h1
          aria-label="다음 여행, 아직 정하지 못했다면"
          className="text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.045em] text-[var(--color-funnel-text)] sm:text-[2.6rem] sm:leading-[1.08]"
        >
          다음 여행,
          <br /> 아직 정하지 못했다면
        </h1>

        <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-7 text-[var(--color-funnel-text-soft)] sm:text-[1rem]">
          취향에 맞는 여행지를 찾아드려요
        </p>

        <div className="mt-8 flex justify-center">
          <HeroAnimation testId={heroTestId} />
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            type="button"
            data-testid={testIds.home.cta}
            onClick={onStart}
            aria-label="내 여행지 찾기"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-action-primary)] px-10 py-4 text-[0.95rem] font-semibold text-white shadow-[0_4px_14px_rgba(var(--color-action-primary-rgb,59,130,246),0.35)] transition-all duration-200 hover:bg-[var(--color-action-primary-strong)] hover:shadow-[0_6px_20px_rgba(var(--color-action-primary-rgb,59,130,246),0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-action-primary)]"
          >
            내 여행지 찾기
          </button>

          <p className="text-[0.78rem] text-[var(--color-funnel-text-soft)]">
            무료 · 약 1분 · 로그인 불필요
            {todayCount != null && todayCount >= 20 ? (
              <span className="ml-1.5 text-[var(--color-funnel-text)]">
                · 오늘 {todayCount.toLocaleString()}명이 여행지를 찾았어요
              </span>
            ) : null}
          </p>
        </div>

        {displayDestinations ? (
          <div className="mx-auto mt-10 flex items-center justify-center gap-2">
            <span className="text-[0.72rem] font-medium text-[var(--color-funnel-text-soft)]">
              지금 인기
            </span>
            {trendingLoading
              ? Array.from({ length: 3 }, (_, i) => (
                  <span
                    key={i}
                    className="h-[1.65rem] w-14 animate-pulse rounded-full bg-[var(--color-funnel-muted)]"
                  />
                ))
              : displayDestinations.map((dest) => (
                  <span
                    key={dest}
                    className="rounded-full border border-[color:var(--color-funnel-border)] bg-white/80 px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]"
                  >
                    {dest}
                  </span>
                ))}
          </div>
        ) : null}
      </div>

      {/* Mobile sticky bottom CTA */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-funnel-border)] bg-white/92 px-5 pb-[env(safe-area-inset-bottom,0.5rem)] pt-3 backdrop-blur-md sm:hidden"
        initial={{ y: 80 }}
        animate={{ y: showSticky ? 0 : 80 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-full bg-[var(--color-action-primary)] py-3.5 text-[0.9rem] font-semibold text-white shadow-[0_2px_10px_rgba(var(--color-action-primary-rgb,59,130,246),0.3)] transition-colors duration-200 hover:bg-[var(--color-action-primary-strong)]"
        >
          내 여행지 찾기
        </button>
      </motion.div>
    </motion.section>
  );
}
