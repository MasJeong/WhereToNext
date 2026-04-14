import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { homeStepCompanionOptions } from "@/lib/trip-compass/step-answer-adapter";
import { testIds } from "@/lib/test-ids";

type CompanionValue = (typeof homeStepCompanionOptions)[number]["value"];

export type TrendingDestinationView = {
  nameKo: string;
  imageUrl?: string;
};

type LandingPageProps = {
  testId: string;
  heroTestId: string;
  onStart: () => void;
  onStartWithCompanion?: (value: CompanionValue) => void;
  trendingDestinations?: TrendingDestinationView[] | null;
  trendingLoading?: boolean;
  todayCount?: number;
};

const companionEmojis: Record<string, string> = {
  couple: "\u{1F491}",
  friends: "\u{1F91D}",
  family: "\u{1F46A}",
  solo: "\u{1F9D1}",
};

const trendingGradients = [
  "from-rose-300 to-orange-200",
  "from-sky-300 to-cyan-200",
  "from-violet-300 to-fuchsia-200",
];

type SeasonTheme = { emoji: string; title: string; description: string; destinations: string };

function getSeasonThemes(month: number): SeasonTheme[] {
  if (month >= 3 && month <= 5) {
    return [
      { emoji: "\u{1F338}", title: "벚꽃 \u00B7 감성 산책", description: "골목과 사원, 분홍빛 거리", destinations: "교토 \u00B7 도쿄 \u00B7 타이베이" },
      { emoji: "\u{1F3D6}\uFE0F", title: "바다 \u00B7 리조트 휴양", description: "맑은 바다에서 느긋하게", destinations: "다낭 \u00B7 세부 \u00B7 오키나와" },
      { emoji: "\u{1F35C}", title: "미식 \u00B7 야시장 투어", description: "현지 맛집과 야시장 탐방", destinations: "오사카 \u00B7 방콕 \u00B7 후쿠오카" },
    ];
  }
  if (month >= 6 && month <= 8) {
    return [
      { emoji: "\u{1F30A}", title: "풀빌라 \u00B7 섬 휴양", description: "일상 탈출, 바다 앞 힐링", destinations: "발리 \u00B7 오키나와 \u00B7 푸켓" },
      { emoji: "\u{26F0}\uFE0F", title: "피서 \u00B7 자연 속으로", description: "시원한 공기와 드라이브", destinations: "삿포로 \u00B7 밴쿠버 \u00B7 취리히" },
      { emoji: "\u{1F3D9}\uFE0F", title: "도시 \u00B7 쇼핑 탐방", description: "트렌디한 거리와 쇼핑", destinations: "싱가포르 \u00B7 뉴욕 \u00B7 도쿄" },
    ];
  }
  if (month >= 9 && month <= 11) {
    return [
      { emoji: "\u{1F341}", title: "단풍 \u00B7 가을 감성", description: "색이 물드는 거리와 카페", destinations: "교토 \u00B7 도쿄 \u00B7 멜버른" },
      { emoji: "\u{1F496}", title: "로맨스 \u00B7 감성 여행", description: "분위기 있는 골목과 노을", destinations: "파리 \u00B7 프라하 \u00B7 리스본" },
      { emoji: "\u{1F6CD}\uFE0F", title: "쇼핑 \u00B7 야경 도시", description: "도심 야경과 나이트라이프", destinations: "홍콩 \u00B7 바르셀로나 \u00B7 뉴욕" },
    ];
  }
  return [
    { emoji: "\u2744\uFE0F", title: "겨울 \u00B7 설경 여행", description: "눈 내리는 도시와 온천", destinations: "삿포로 \u00B7 프라하 \u00B7 비엔나" },
    { emoji: "\u{1F3D6}\uFE0F", title: "따뜻한 바다 탈출", description: "추위 피해 떠나는 휴양", destinations: "푸꾸옥 \u00B7 괌 \u00B7 두바이" },
    { emoji: "\u{1F30F}", title: "연말 특별 여행", description: "크리스마스 마켓과 불꽃", destinations: "뉴욕 \u00B7 홍콩 \u00B7 방콕" },
  ];
}

function getSeasonLabel(month: number): string {
  return `${month}월의 추천`;
}

export function LandingPage({
  testId,
  heroTestId,
  onStart,
  onStartWithCompanion,
  trendingDestinations,
  trendingLoading,
  todayCount,
}: LandingPageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [showSticky, setShowSticky] = useState(false);

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const seasonThemes = useMemo(() => getSeasonThemes(currentMonth), [currentMonth]);
  const seasonLabel = useMemo(() => getSeasonLabel(currentMonth), [currentMonth]);

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

  function handleCompanionSelect(value: CompanionValue) {
    if (onStartWithCompanion) {
      onStartWithCompanion(value);
    } else {
      onStart();
    }
  }

  return (
    <motion.section
      data-testid={testId}
      className="relative mx-auto flex min-h-[92vh] max-w-[72rem] flex-col overflow-hidden"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
    >
      {/* ── Hero ── */}
      <div
        data-testid={heroTestId}
        className="bg-gradient-to-b from-[#f7f9ff] via-[#f2f6fe] to-white px-5 pb-6 pt-12 sm:px-8 sm:pt-16"
      >
        <div className="mx-auto max-w-lg">
          {/* Season tag */}
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-action-primary)]/8 px-3.5 py-1.5 text-[0.8rem] font-medium text-[var(--color-action-primary)]">
            🌸 {seasonLabel}
          </span>

          {/* Heading */}
          <h1
            aria-label="다음 여행, 어디로 떠나볼까?"
            className="text-[1.75rem] font-bold leading-[1.3] tracking-[-0.04em] text-[var(--color-funnel-text)] sm:text-[2.4rem]"
          >
            다음 여행,
            <br />
            어디로{" "}
            <span className="bg-gradient-to-r from-[var(--color-action-primary)] to-[#8b5cf6] bg-clip-text text-transparent">
              떠나볼까
            </span>
            ?
          </h1>

          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--color-funnel-text-soft)]">
            취향 몇 가지만 알려주세요.
            <br />
            딱 맞는 여행지를 찾아드릴게요.
          </p>

          {/* CTA */}
          <button
            type="button"
            data-testid={testIds.home.cta}
            onClick={onStart}
            aria-label="내 여행지 찾기"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-funnel-text)] px-6 py-4 text-[0.95rem] font-semibold text-white transition-colors hover:bg-[var(--color-funnel-text-strong)]"
          >
            내 여행지 찾기
            <span className="opacity-60">&rarr;</span>
          </button>

          {/* Friction reducers */}
          <p className="mt-3 flex items-center justify-center gap-2 text-[0.75rem] text-[var(--color-funnel-text-soft)]">
            <span>6개 질문</span>
            <span className="h-0.5 w-0.5 rounded-full bg-[var(--color-funnel-text-soft)]" />
            <span>약 20초</span>
            <span className="h-0.5 w-0.5 rounded-full bg-[var(--color-funnel-text-soft)]" />
            <span>무료</span>
          </p>
        </div>
      </div>

      {/* ── Inline first question ── */}
      <div className="px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-lg rounded-2xl border border-[var(--color-funnel-border)] bg-[var(--color-funnel-muted)] p-5">
          <p className="text-[0.78rem] text-[var(--color-funnel-text-soft)]">혹시 바로 시작할래요?</p>
          <p className="mt-1.5 text-[1rem] font-semibold text-[var(--color-funnel-text)]">
            누구와 함께 떠나나요?
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {homeStepCompanionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleCompanionSelect(option.value)}
                className="rounded-full border border-[var(--color-funnel-border)] bg-white px-4 py-2 text-[0.85rem] text-[var(--color-funnel-text)] transition-all hover:border-[var(--color-action-primary)] hover:bg-[var(--color-funnel-accent-subtle)] hover:text-[var(--color-action-primary)]"
              >
                {companionEmojis[option.value] ?? ""} {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Social proof ── */}
      {todayCount != null && todayCount >= 20 ? (
        <div className="mx-5 mb-6 flex items-center justify-center gap-2 sm:mx-8">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
          </span>
          <p className="text-[0.78rem] text-[var(--color-funnel-text-soft)]">
            오늘{" "}
            <strong className="font-semibold text-[var(--color-funnel-text)]">
              {todayCount.toLocaleString()}명
            </strong>
            이 여행지를 추천받았어요
          </p>
        </div>
      ) : null}

      {/* ── Trending destinations ── */}
      {displayDestinations ? (
        <div className="px-5 pb-6 sm:px-8">
          <div className="mx-auto max-w-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[1.05rem] font-bold text-[var(--color-funnel-text)]">
                🔥 지금 뜨는 여행지
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {trendingLoading
                ? Array.from({ length: 3 }, (_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] animate-pulse rounded-2xl bg-[var(--color-funnel-muted)]"
                    />
                  ))
                : displayDestinations.map((dest, i) => (
                    <div
                      key={dest.nameKo}
                      className="overflow-hidden rounded-2xl bg-[var(--color-funnel-muted)]"
                    >
                      <div
                        className={`relative flex aspect-[4/3] items-end p-2.5 ${dest.imageUrl ? "" : `bg-gradient-to-br ${trendingGradients[i % trendingGradients.length]}`}`}
                      >
                        {dest.imageUrl ? (
                          <>
                            <Image
                              src={dest.imageUrl}
                              alt={`${dest.nameKo} 여행 풍경`}
                              fill
                              sizes="(max-width: 640px) 33vw, 160px"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          </>
                        ) : null}
                        <span className="relative z-10 rounded-lg bg-black/50 px-2 py-0.5 text-[0.68rem] font-semibold text-white backdrop-blur-sm">
                          🏁 {i + 1}위
                        </span>
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="text-[0.85rem] font-semibold text-[var(--color-funnel-text)]">
                          {dest.nameKo}
                        </p>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Season themes ── */}
      <div className="px-5 pb-10 sm:px-8">
        <div className="mx-auto max-w-lg">
          <h3 className="mb-3 text-[1.05rem] font-bold text-[var(--color-funnel-text)]">
            {currentMonth}월에 가기 좋은 테마
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {seasonThemes.map((theme) => (
              <div
                key={theme.title}
                className="rounded-2xl bg-[var(--color-funnel-muted)] p-4 text-center"
              >
                <p className="text-[1.6rem]">{theme.emoji}</p>
                <p className="mt-2 text-[0.85rem] font-semibold text-[var(--color-funnel-text)]">
                  {theme.title}
                </p>
                <p className="mt-1 text-[0.62rem] leading-relaxed text-[var(--color-funnel-text-soft)]">
                  {theme.description}
                </p>
                <p className="mt-1.5 text-[0.62rem] font-medium text-[var(--color-action-primary)]">
                  {theme.destinations}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom CTA ── */}
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
