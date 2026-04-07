"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

import type { ComparisonColumnView } from "@/lib/trip-compass/restore";
import {
  buildDestinationDetailPath,
  buildRecommendationEvidenceLead,
  buildRecommendationVerdict,
  formatBudgetBand,
  formatFlightBand,
  formatMonthList,
  formatVibeList,
} from "@/lib/trip-compass/presentation";
import { getCompareColumnTestId, testIds } from "@/lib/test-ids";

type CompareBoardProps = {
  columns: ComparisonColumnView[];
};

type CompareRow = {
  label: string;
  value: (column: ComparisonColumnView) => string;
  warning?: boolean;
};

function buildCompareRows(): CompareRow[] {
  return [
    {
      label: "한 줄 판정",
      value: (column) => buildRecommendationVerdict(column.card).headline,
    },
    {
      label: "잘 맞는 이유",
      value: (column) => column.card.recommendation.whyThisFits,
    },
    {
      label: "핵심 정보",
      value: (column) =>
        `${formatMonthList(column.card.destination.bestMonths)} · ${formatBudgetBand(column.card.destination.budgetBand)} · ${formatFlightBand(column.card.destination.flightBand)}`,
    },
    {
      label: "대표 분위기",
      value: (column) => formatVibeList(column.card.destination.vibeTags.slice(0, 3)),
    },
    {
      label: "근거 한 줄",
      value: (column) => {
        const evidence = buildRecommendationEvidenceLead(column.card);
        return `${evidence.label} · ${evidence.detail}`;
      },
    },
    {
      label: "체크할 점",
      value: (column) => column.card.recommendation.watchOuts.slice(0, 2).join(" / "),
      warning: true,
    },
  ];
}

function isSameRow(row: CompareRow, visibleColumns: ComparisonColumnView[]): boolean {
  const values = visibleColumns.map((column) => row.value(column));
  return values.every((value) => value === values[0]);
}

export function CompareBoard({ columns }: CompareBoardProps) {
  const rows = useMemo(() => buildCompareRows(), []);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(true);
  const [mobileStartIndex, setMobileStartIndex] = useState(0);

  const mobileColumns = columns.slice(mobileStartIndex, mobileStartIndex + 2);
  const desktopRows = showDifferencesOnly
    ? rows.filter((row) => row.label === "한 줄 판정" || !isSameRow(row, columns))
    : rows;
  const mobileRows = showDifferencesOnly
    ? rows.filter((row) => row.label === "한 줄 판정" || !isSameRow(row, mobileColumns))
    : rows;
  const canMoveNext = mobileStartIndex + 2 < columns.length;
  const canMovePrev = mobileStartIndex > 0;
  const differenceCount = rows.filter((row) => !isSameRow(row, columns)).length;
  const mobileDifferenceCount = rows.filter((row) => !isSameRow(row, mobileColumns)).length;

  return (
    <section className="space-y-3.5">
      <div className="compass-compare-toolbar compass-stage-reveal flex flex-col gap-3.5 rounded-[var(--radius-card)] p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="compass-editorial-kicker">비교 화면</p>
            <h3 className="mt-1.5 text-[1.04rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.16rem]">
              차이만 빠르게 보고 마지막 후보를 좁혀 보세요.
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
              먼저 한 줄 판정과 체크할 점부터 보면 결정이 빨라져요.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="compass-metric-pill rounded-full px-3 py-2 text-xs font-semibold">
              후보 {columns.length}곳
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-2 text-xs font-semibold">
              <span className="md:hidden">차이 {mobileDifferenceCount}개</span>
              <span className="hidden md:inline">차이 {differenceCount}개</span>
            </span>
            <button
              type="button"
              data-testid={testIds.compare.differencesToggle}
              onClick={() => setShowDifferencesOnly((currentState) => !currentState)}
              className={`${showDifferencesOnly ? "compass-selected" : "compass-action-secondary"} compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]`}
            >
              {showDifferencesOnly ? (
                <>
                  <span className="md:hidden">보이는 후보 전체 보기</span>
                  <span className="hidden md:inline">차이만 보기 해제</span>
                </>
              ) : (
                <>
                  <span className="md:hidden">보이는 후보 차이만 보기</span>
                  <span className="hidden md:inline">차이만 보기</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {columns.map((column, index) => (
            <article
              key={column.snapshotId}
              data-testid={getCompareColumnTestId(index)}
              className="compass-desk rounded-[calc(var(--radius-card)-10px)] px-3.5 py-3.5"
            >
              <p className="compass-editorial-kicker">후보 {index + 1}</p>
              <p className="mt-1.5 text-[1rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                {column.card.destination.nameKo}
              </p>
              <p className="mt-1 text-sm font-semibold leading-5 text-[var(--color-ink)]">
                {buildRecommendationVerdict(column.card).headline}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">
                {column.card.recommendation.whyThisFits}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className="compass-metric-pill rounded-full px-3 py-1.5 text-[11px] font-semibold">
                  총점 {column.card.recommendation.scoreBreakdown.total}
                </span>
                <span className="compass-metric-pill rounded-full px-3 py-1.5 text-[11px] font-semibold">
                  일치 {column.card.recommendation.confidence}%
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={buildDestinationDetailPath(column.card.destination, undefined, column.snapshotId)}
                  className="compass-action-secondary compass-soft-press rounded-full px-3 py-2 text-[11px] font-semibold tracking-[0.04em]"
                >
                  상세 보기
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 md:hidden">
          <div className="min-w-0">
            <p className="text-xs leading-5 text-[var(--color-ink-soft)]">
              후보 {mobileStartIndex + 1}-{Math.min(mobileStartIndex + mobileColumns.length, columns.length)} / {columns.length}
            </p>
            <p className="text-[11px] leading-5 text-[var(--color-ink-soft)]">
              {showDifferencesOnly ? "차이만 보기는 지금 보이는 후보 기준이에요." : "지금 보이는 후보를 모두 보고 있어요."}
            </p>
          </div>
          <button
            type="button"
            data-testid={testIds.compare.mobilePrev}
            onClick={() => setMobileStartIndex((currentIndex) => Math.max(0, currentIndex - 1))}
            disabled={!canMovePrev}
            className="compass-action-secondary compass-soft-press rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em] disabled:opacity-40"
          >
            이전
          </button>
          <button
            type="button"
            data-testid={testIds.compare.mobileNext}
            onClick={() => setMobileStartIndex((currentIndex) => (canMoveNext ? currentIndex + 1 : currentIndex))}
            disabled={!canMoveNext}
            className="compass-action-secondary compass-soft-press rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em] disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>

      <div className="compass-compare-wrap compass-stage-reveal rounded-[var(--radius-card)] md:hidden">
        <div
          className="compass-compare-grid grid w-full gap-px rounded-[var(--radius-card)]"
          style={{
            gridTemplateColumns: `minmax(5.8rem, 6.4rem) repeat(${mobileColumns.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="compass-compare-label px-3 py-3 text-xs font-semibold">비교 질문</div>
          {mobileColumns.map((column) => (
            <div key={`mobile-header-${column.snapshotId}`} className="compass-compare-column px-3 py-3">
              <div className="compass-compare-header-block">
                <p className="compass-editorial-kicker">보드 후보</p>
                <p className="text-[0.98rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                  {column.card.destination.nameKo}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  {column.card.recommendation.scoreBreakdown.total}점 · {column.card.recommendation.confidence}%
                </p>
              </div>
            </div>
          ))}

          {mobileRows.map((row) => (
            <Fragment key={`mobile-${row.label}`}>
              <div
                data-testid={row.label === "한 줄 판정" ? testIds.compare.verdictRow : undefined}
                className={`${row.label === "한 줄 판정" ? "compass-decision-card" : "compass-compare-label"} px-3 py-3 text-xs font-semibold`}
              >
                {row.label}
              </div>
              {mobileColumns.map((column) => (
                <div
                  key={`mobile-${row.label}-${column.snapshotId}`}
                  className={`${row.warning ? "compass-compare-cell compass-compare-cell-warning" : "compass-compare-cell"} px-3 py-3 text-xs leading-5`}
                >
                  {row.value(column)}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="compass-compare-wrap hidden overflow-x-auto rounded-[var(--radius-card)] md:block compass-stage-reveal compass-stage-reveal-delayed">
        <div
          className="compass-compare-grid grid min-w-[56rem] gap-px rounded-[var(--radius-card)]"
          style={{
            gridTemplateColumns: `minmax(9rem, 11rem) repeat(${columns.length}, minmax(14rem, 1fr))`,
          }}
        >
          <div className="compass-compare-label px-4 py-3.5 text-sm font-semibold">비교 질문</div>
          {columns.map((column, index) => (
            <div key={`desktop-header-${column.snapshotId}`} className="compass-compare-column px-4 py-3.5">
              <div className="compass-compare-header-block">
                <p className="compass-editorial-kicker">보드 후보 {index + 1}</p>
                <p className="text-[1.02rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                  {column.card.destination.nameKo}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  {column.card.recommendation.scoreBreakdown.total}점 · {column.card.recommendation.confidence}% 일치
                </p>
                <p className="text-xs leading-5 text-[var(--color-ink-soft)]">
                  {buildRecommendationVerdict(column.card).headline}
                </p>
              </div>
            </div>
          ))}

          {desktopRows.map((row) => (
            <Fragment key={`desktop-${row.label}`}>
              <div
                data-testid={row.label === "한 줄 판정" ? testIds.compare.verdictRow : undefined}
                className={`${row.label === "한 줄 판정" ? "compass-decision-card" : "compass-compare-label"} px-4 py-3.5 text-sm font-semibold`}
              >
                {row.label}
              </div>
              {columns.map((column) => (
                <div
                  key={`desktop-${row.label}-${column.snapshotId}`}
                  className={`${row.warning ? "compass-compare-cell compass-compare-cell-warning" : "compass-compare-cell"} px-4 py-3.5 text-sm leading-6`}
                >
                  {row.value(column)}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
