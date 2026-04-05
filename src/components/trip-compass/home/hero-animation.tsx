import Image from "next/image";
import type { PanInfo } from "framer-motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

type HeroAnimationProps = {
  testId: string;
};

const destinations = [
  { name: "시드니", nameEn: "Sydney", country: "호주", image: "https://images.unsplash.com/photo-1524293581917-878a6d017c71?w=1280&q=80" },
  { name: "도쿄", nameEn: "Tokyo", country: "일본", image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1280&q=80" },
  { name: "파리", nameEn: "Paris", country: "프랑스", image: "https://images.unsplash.com/photo-1431274172761-fca41d930114?w=1280&q=80" },
  { name: "발리", nameEn: "Bali", country: "인도네시아", image: "https://images.unsplash.com/photo-1604999333679-b86d54738315?w=1280&q=80" },
  { name: "바르셀로나", nameEn: "Barcelona", country: "스페인", image: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1280&q=80" },
];

const blurredPreviews = [
  { rank: 1, label: "1순위 추천", score: "95", tags: ["#휴양", "#맛집"] },
  { rank: 2, label: "2순위 추천", score: "89", tags: ["#도시", "#쇼핑"] },
  { rank: 3, label: "3순위 추천", score: "84", tags: ["#문화", "#자연"] },
];

const dragThreshold = 60;

export function HeroAnimation({ testId }: HeroAnimationProps) {
  const prefersReducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);

  const showNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % destinations.length);
  }, []);

  const showPrevious = useCallback(() => {
    setCurrent((prev) => (prev - 1 + destinations.length) % destinations.length);
  }, []);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x <= -dragThreshold) {
        showNext();
        return;
      }

      if (info.offset.x >= dragThreshold) {
        showPrevious();
      }
    },
    [showNext, showPrevious],
  );

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(showNext, 4000);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, showNext]);

  const dest = destinations[current];

  return (
    <div data-testid={testId} className="w-full max-w-xl space-y-5">
      {/* Destination photo showcase */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.5rem] bg-[var(--color-funnel-muted)] shadow-[var(--shadow-card)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={dest.nameEn}
            className="absolute inset-0"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={handleDragEnd}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, ease: "easeInOut" }}
            whileDrag={prefersReducedMotion ? undefined : { scale: 0.985 }}
            style={{ touchAction: "pan-y" }}
          >
            <Image
              src={dest.image}
              alt={`${dest.name} 여행 풍경`}
              fill
              className="cursor-grab object-cover active:cursor-grabbing"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
          </motion.div>
        </AnimatePresence>

        {/* Destination label */}
        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/70">
              {dest.country}
            </p>
            <p className="text-[1.6rem] font-semibold leading-tight tracking-[-0.04em] text-white drop-shadow-sm sm:text-[2rem]">
              {dest.name}
            </p>
          </div>
          <div className="flex gap-1.5">
            {destinations.map((_, i) => (
              <button
                type="button"
                key={destinations[i].nameEn}
                onClick={() => setCurrent(i)}
                aria-label={`${destinations[i].name} 보기`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Blurred preview cards — value sneak peek */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-2">
          {blurredPreviews.map((preview) => (
            <div
              key={preview.rank}
              className="relative overflow-hidden rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-white px-3 py-3"
            >
              <div className="select-none blur-[6px]">
                <p className="text-[1.3rem] font-bold tracking-[-0.04em] text-[var(--color-funnel-text)]">
                  ████
                </p>
                <p className="mt-1 text-[0.7rem] font-semibold text-[var(--color-action-primary)]">
                  {preview.score}점
                </p>
                <div className="mt-1.5 flex gap-1">
                  {preview.tags.map((tag) => (
                    <span key={tag} className="text-[0.6rem] text-[var(--color-funnel-text-soft)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {/* Rank badge — visible through blur */}
              <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-action-primary)] text-[0.6rem] font-bold text-white">
                {preview.rank}
              </div>
            </div>
          ))}
        </div>
        {/* Overlay prompt */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-full bg-white/90 px-4 py-1.5 text-[0.75rem] font-semibold tracking-[-0.02em] text-[var(--color-funnel-text)] shadow-sm backdrop-blur-sm">
            질문에 답하면 내 여행지가 보여요
          </p>
        </div>
      </div>
    </div>
  );
}
