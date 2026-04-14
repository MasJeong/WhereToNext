import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { testIds } from "@/lib/test-ids";

type ResultLoadingPanelProps = {
  queryNarrative: string;
};

const loadingSteps = [
  "여행 조건 정리",
  "어울리는 도시 비교",
  "대표 추천 완성",
] as const;

const sponsoredLoadingCard = {
  label: "Sponsored",
  partner: "Partner Offer",
  title: "공항 이동과 eSIM을 한 번에 준비해 보세요.",
  description: "추천 결과를 기다리는 동안, 출발 직전에 가장 자주 챙기는 준비 항목을 먼저 확인할 수 있어요.",
  cta: "파트너 보기",
  href: "/destinations/tokyo?ref=sponsored-loading-slot",
};

export function ResultLoadingPanel({ queryNarrative }: ResultLoadingPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      data-testid={testIds.home.loadingState}
      className="overflow-hidden rounded-[1.75rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f4f9ff_100%)] p-5 shadow-[var(--shadow-funnel-soft)] sm:p-6"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-funnel-text-soft)]">
            Finding Your Match
          </p>
          <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.05em] text-[var(--color-funnel-text)] sm:text-[2.4rem]">
            조건에 맞는 여행지를
            <br />
            차분하게 고르고 있어요.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-funnel-text-soft)] sm:text-[0.98rem]">
            {queryNarrative}
          </p>

          <div className="mt-5 overflow-hidden rounded-full bg-[var(--color-funnel-accent-subtle)] p-1">
            <div className="compass-result-loading-progress h-2.5 rounded-full bg-[linear-gradient(90deg,#4ab4ff_0%,#1e88e5_52%,#0b63ce_100%)]" />
          </div>
          <p className="mt-2 text-[0.76rem] font-medium text-[var(--color-funnel-text-soft)]">
            성급하게 바로 보여주기보다, 조건을 한 번 더 비교해서 정리합니다.
          </p>
        </div>

        <div className="grid gap-2.5 lg:min-w-[20rem]">
          <aside
            data-testid={testIds.home.loadingSponsor}
            className="overflow-hidden rounded-[1.35rem] border border-[color:var(--color-funnel-border-strong)] bg-[linear-gradient(180deg,#ffffff_0%,#eef7ff_100%)] shadow-[var(--shadow-funnel-card)]"
          >
            <div className="border-b border-[color:var(--color-funnel-border)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[var(--color-funnel-text)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white">
                  {sponsoredLoadingCard.label}
                </span>
                <span className="text-[0.72rem] font-medium text-[var(--color-funnel-text-soft)]">
                  {sponsoredLoadingCard.partner}
                </span>
              </div>
              <p className="mt-3 text-base font-semibold leading-6 text-[var(--color-funnel-text)]">
                {sponsoredLoadingCard.title}
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--color-funnel-text-soft)]">
                {sponsoredLoadingCard.description}
              </p>
            </div>

            <div className="space-y-2 px-4 py-3">
              {loadingSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-white/90 px-3 py-2.5"
                >
                  <span
                    className="compass-result-loading-orbit inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-funnel-accent-subtle)] text-[0.7rem] font-semibold text-[var(--color-action-primary-strong)]"
                    style={{ animationDelay: `${index * 0.55}s` }}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.82rem] font-semibold text-[var(--color-funnel-text)]">{step}</p>
                  </div>
                </div>
              ))}

              <Link
                href={sponsoredLoadingCard.href}
                className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-full bg-[var(--color-action-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--color-action-primary-strong)]"
              >
                {sponsoredLoadingCard.cta}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </motion.section>
  );
}
