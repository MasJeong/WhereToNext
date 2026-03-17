import Link from "next/link";

import type { ComparisonColumnView } from "@/lib/trip-compass/restore";
import {
  describeSourceBadge,
  formatBudgetBand,
  formatFlightBand,
  formatMonthList,
  formatVibeList,
} from "@/lib/trip-compass/presentation";
import { getCompareColumnTestId } from "@/lib/test-ids";

type CompareBoardProps = {
  columns: ComparisonColumnView[];
};

/**
 * Renders the saved comparison matrix for two to four destinations.
 * @param props Compare columns restored from saved snapshots
 * @returns Responsive comparison board
 */
export function CompareBoard({ columns }: CompareBoardProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {columns.map((column, index) => {
        const evidence = column.card.recommendation.trendEvidence[0];

        return (
          <article
            key={column.snapshotId}
            data-testid={getCompareColumnTestId(index)}
            className="compass-card rounded-[var(--radius-card)] p-5 sm:p-6"
          >
            <div className="flex h-full flex-col gap-5">
              <div className="flex items-start justify-between gap-4 border-b border-[color:var(--color-frame)] pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-sand)]">
                    저장한 카드 {index + 1}
                  </p>
                  <h2 className="font-display mt-2 text-4xl tracking-[-0.04em] text-[var(--color-paper)]">
                    {column.card.destination.nameKo}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {column.card.destination.nameEn}
                  </p>
                </div>

                <Link
                  href={column.sharePath}
                  className="rounded-full border border-[color:var(--color-frame)] px-4 py-2 text-sm text-[var(--color-paper)] transition hover:border-[color:var(--color-frame-strong)]"
                >
                  공유 페이지 보기
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">예산 감각</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-paper)]">
                    {formatBudgetBand(column.card.destination.budgetBand)}
                  </p>
                </div>
                <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">비행 거리</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-paper)]">
                    {formatFlightBand(column.card.destination.flightBand)}
                  </p>
                </div>
                <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">추천 시기</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-paper)]">
                    {formatMonthList(column.card.destination.bestMonths)}
                  </p>
                </div>
                <div className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">분위기</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-paper)]">
                    {formatVibeList(column.card.destination.vibeTags)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                  추천 이유
                </p>
                <p className="text-sm leading-7 text-[var(--color-paper)] sm:text-base">
                  {column.card.recommendation.whyThisFits}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
                  체크할 점
                </p>
                <div className="grid gap-3">
                  {column.card.recommendation.watchOuts.map((watchOut) => (
                    <div
                      key={watchOut}
                      className="rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4 text-sm leading-6 text-[var(--color-muted)]"
                    >
                      {watchOut}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[calc(var(--radius-card)-6px)] border border-[color:var(--color-frame)] bg-[color:var(--color-paper-soft)] p-4 text-[var(--color-ink)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                  인스타그램 분위기 요약
                </p>
                <p className="mt-3 text-lg font-semibold">{describeSourceBadge(evidence)}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {evidence.summary}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                  {evidence.sourceLabel}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
