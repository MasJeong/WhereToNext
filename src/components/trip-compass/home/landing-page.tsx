import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { HeroAnimation } from "./hero-animation";
import { testIds } from "@/lib/test-ids";

const FALLBACK_DESTINATIONS = ["다낭", "오사카", "방콕"];

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

  useEffect(() => {
    function handleScroll() {
      setShowSticky(window.scrollY > 260);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const displayDestinations =
    trendingDestinations && trendingDestinations.length > 0
      ? trendingDestinations
      : FALLBACK_DESTINATIONS;

  return (
    <motion.section
      data-testid={testId}
      className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center overflow-hidden px-5 py-10 sm:px-8"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
    >
      <div className="relative w-full max-w-3xl text-center">
        {/* Headline — pain-point driven */}
        <h1
          aria-label="다음 여행, 아직 정하지 못했다면"
          className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.04em] text-[var(--color-funnel-text)] sm:text-[2.5rem] sm:leading-[1.1]"
        >
          다음 여행,
          <br /> 아직 정하지 못했다면
        </h1>

        {/* Subtext — benefit + time cost */}
        <p className="mx-auto mt-4 max-w-lg text-[0.95rem] leading-6 text-[var(--color-funnel-text-soft)] sm:text-[1rem] sm:leading-7">
          취향, 일정, 예산에 맞는 여행지를 찾아드려요.
          <br />
          날씨, 환율, 유튜브 영상까지 한눈에.
        </p>

        {/* Hero showcase */}
        <div className="mt-8 flex justify-center">
          <HeroAnimation testId={heroTestId} />
        </div>

        {/* CTA button with shine effect */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            data-testid={testIds.home.cta}
            onClick={onStart}
            aria-label="내 여행지 찾기"
            className="group relative inline-flex min-h-[3.75rem] items-center justify-center overflow-hidden rounded-full border border-[var(--color-action-primary-border)] bg-[linear-gradient(135deg,var(--color-action-primary),var(--color-action-primary-strong))] px-10 py-3 text-[0.95rem] font-semibold text-white shadow-[var(--shadow-hero)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgb(11_99_206_/_0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-action-primary)]"
          >
            내 여행지 찾기
            {/* Shine sweep */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
          </button>

          {/* Time + effort indicator */}
          <p className="text-[0.72rem] tracking-[-0.01em] text-[var(--color-funnel-text-soft)]">
            무료 · 약 1분 · 로그인 불필요
          </p>
          {todayCount != null && todayCount >= 10 ? (
            <p className="text-[0.72rem] tracking-[-0.01em] text-[var(--color-funnel-text-soft)]">
              오늘 <span className="font-semibold text-[var(--color-funnel-text)]">{todayCount.toLocaleString()}명</span>이 여행지를 찾았어요
            </p>
          ) : null}
        </div>

        {/* Social proof — trending */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[0.72rem] font-medium tracking-[-0.01em] text-[var(--color-funnel-text-soft)]">
            최근 인기 여행지
          </p>
          <div className="flex gap-2">
            {trendingLoading
              ? Array.from({ length: 3 }, (_, i) => (
                  <span
                    key={i}
                    className="h-[1.625rem] w-14 animate-pulse rounded-full bg-[var(--color-funnel-muted)]"
                  />
                ))
              : displayDestinations.map((dest) => (
                  <span
                    key={dest}
                    className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-1 text-[0.72rem] font-semibold text-[var(--color-funnel-text)]"
                  >
                    {dest}
                  </span>
                ))}
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom CTA */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-funnel-border)] bg-white/90 px-5 pb-[env(safe-area-inset-bottom,0.5rem)] pt-3 backdrop-blur-md sm:hidden"
        initial={{ y: 80 }}
        animate={{ y: showSticky ? 0 : 80 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-full bg-[linear-gradient(135deg,var(--color-action-primary),var(--color-action-primary-strong))] py-3.5 text-[0.9rem] font-semibold text-white shadow-[var(--shadow-hero)]"
        >
          내 여행지 찾기
        </button>
      </motion.div>
    </motion.section>
  );
}
