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
      className="relative mx-auto flex min-h-screen max-w-[72rem] flex-col items-center justify-center overflow-hidden px-5 py-10 sm:px-8"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
    >
      <div className="relative w-full max-w-[56rem] text-center">
        <p className="mx-auto text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-funnel-text-soft)]">
          질문 6개로 찾는 해외여행 추천
        </p>

        <h1
          aria-label="다음 여행, 아직 정하지 못했다면"
          className="mt-3 text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.045em] text-[var(--color-funnel-text)] sm:text-[2.6rem] sm:leading-[1.08]"
        >
          다음 여행,
          <br /> 아직 정하지 못했다면
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-6 text-[var(--color-funnel-text-soft)] sm:text-[1rem] sm:leading-7">
          취향, 일정, 예산에 맞는 여행지를 찾아드려요.
          <br />
          날씨, 환율, 유튜브 영상까지 한눈에.
        </p>

        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
          <span className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3.5 py-1.5 text-[0.74rem] font-semibold text-[var(--color-funnel-text)] shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            무료
          </span>
          <span className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3.5 py-1.5 text-[0.74rem] font-semibold text-[var(--color-funnel-text)] shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            약 1분
          </span>
          <span className="rounded-full border border-[color:var(--color-funnel-border)] bg-white px-3.5 py-1.5 text-[0.74rem] font-semibold text-[var(--color-funnel-text)] shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            로그인 불필요
          </span>
          {todayCount != null && todayCount >= 10 ? (
            <span className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-1.5 text-[0.74rem] font-semibold text-[var(--color-funnel-text)] shadow-[0_8px_18px_rgba(15,23,42,0.03)]">
              오늘 {todayCount.toLocaleString()}명이 여행지를 찾았어요
            </span>
          ) : null}
        </div>

        <div className="mx-auto mt-3 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          <span className="text-[0.74rem] font-medium text-[var(--color-funnel-text-soft)]">
            최근 인기 여행지
          </span>
          {trendingLoading
            ? Array.from({ length: 3 }, (_, i) => (
                <span
                  key={i}
                  className="h-[1.75rem] w-16 animate-pulse rounded-full bg-[var(--color-funnel-muted)]"
                />
              ))
            : displayDestinations.map((dest) => (
                <span
                  key={dest}
                  className="rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-1.5 text-[0.73rem] font-semibold text-[var(--color-funnel-text)]"
                >
                  {dest}
                </span>
              ))}
        </div>

        <div className="mt-8 flex justify-center">
          <HeroAnimation testId={heroTestId} />
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            data-testid={testIds.home.cta}
            onClick={onStart}
            aria-label="내 여행지 찾기"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-action-primary)] px-8 py-3.5 text-[0.92rem] font-semibold text-white transition-colors duration-200 hover:bg-[var(--color-action-primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-action-primary)]"
          >
            내 여행지 찾기
          </button>
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
          className="w-full rounded-full bg-[var(--color-action-primary)] py-3.5 text-[0.9rem] font-semibold text-white transition-colors duration-200 hover:bg-[var(--color-action-primary-strong)]"
        >
          내 여행지 찾기
        </button>
      </motion.div>
    </motion.section>
  );
}
