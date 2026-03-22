"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

import type { ComparisonColumnView } from "@/lib/trip-compass/restore";
import {
  buildRecommendationVerdict,
  describeSourceBadge,
  formatBudgetBand,
  formatFlightBand,
  formatMonthList,
  formatPaceList,
  formatVibeList,
} from "@/lib/trip-compass/presentation";
import { getCompareColumnTestId, testIds } from "@/lib/test-ids";

type CompareBoardProps = {
  columns: ComparisonColumnView[];
};

type CompareRow = {
  label: string;
  value: (column: ComparisonColumnView) => string;
};

/**
 * 비교 보드의 기준 행 정의를 만든다.
 * @returns 비교 행 목록
 */
function buildCompareRows(): CompareRow[] {
  return [
    {
      label: "한 줄 판정",
      value: (column) => buildRecommendationVerdict(column.card).headline,
    },
    {
      label: "shortlist 이유",
      value: (column) => column.card.recommendation.whyThisFits,
    },
    {
      label: "핵심 이유",
      value: (column) => column.card.recommendation.reasons.slice(0, 2).join(" / "),
    },
    {
      label: "예산 감각",
      value: (column) => formatBudgetBand(column.card.destination.budgetBand),
    },
    {
      label: "비행 거리",
      value: (column) => formatFlightBand(column.card.destination.flightBand),
    },
    {
      label: "일정 리듬",
      value: (column) => formatPaceList(column.card.destination.paceTags),
    },
    {
      label: "추천 시기",
      value: (column) => formatMonthList(column.card.destination.bestMonths),
    },
    {
      label: "분위기",
      value: (column) => formatVibeList(column.card.destination.vibeTags),
    },
    {
      label: "체크할 점",
      value: (column) => column.card.recommendation.watchOuts.slice(0, 2).join(" / "),
    },
    {
      label: "분위기 참고",
      value: (column) => {
        const evidence = column.card.recommendation.trendEvidence[0];
        return `${describeSourceBadge(evidence)} · ${evidence.summary}`;
      },
    },
  ];
}

/**
 * 현재 컬럼 기준으로 동일한 행인지 판별한다.
 * @param row 비교 행 정의
 * @param visibleColumns 현재 노출 중인 컬럼 목록
 * @returns 동일 여부
 */
function isSameRow(row: CompareRow, visibleColumns: ComparisonColumnView[]): boolean {
  const values = visibleColumns.map((column) => row.value(column));
  return values.every((value) => value === values[0]);
}

/**
 * 저장된 후보를 같은 기준으로 비교하는 결정 보드를 렌더링한다.
 * @param props 저장된 후보 목록
 * @returns 비교 보드 UI
 */
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
  const comparedNames = columns.map((column) => column.card.destination.nameKo).join(" · ");

  return (
    <section className="space-y-5">
      <div className="compass-compare-toolbar compass-stage-reveal flex flex-col gap-3 rounded-[calc(var(--radius-card)-6px)] p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="compass-editorial-kicker">Decision board</p>
          <p className="mt-2 font-display text-[1.08rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.24rem]">
            {comparedNames}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
            모바일에서는 두 후보씩, 데스크톱에서는 전체 후보를 같은 질문의 행 위에 올려 다시 읽어요. 최종 결정을 앞둔 작업대처럼 같은 렌즈를 반복해 비교합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="compass-compare-pill-row">
            <span className="compass-metric-pill rounded-full px-3 py-2 text-xs font-semibold">
              후보 {columns.length}곳
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-2 text-xs font-semibold">
              핵심 차이 {differenceCount}개
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-2 text-xs font-semibold">
              저장된 카드만 비교
            </span>
          </div>
          <button
            type="button"
            data-testid={testIds.compare.differencesToggle}
            onClick={() => setShowDifferencesOnly((currentState) => !currentState)}
            className={`${showDifferencesOnly ? "compass-selected" : "compass-action-secondary"} compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]`}
          >
            {showDifferencesOnly ? "차이만 보기 해제" : "차이만 보기"}
          </button>
          <div className="flex items-center gap-2 md:hidden">
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
      </div>

      <div className="compass-compare-wrap compass-stage-reveal rounded-[var(--radius-card)] md:hidden">
        <div
          className="compass-compare-grid grid w-full gap-px rounded-[var(--radius-card)]"
          style={{
            gridTemplateColumns: `minmax(6.25rem, 7rem) repeat(${mobileColumns.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="compass-compare-label px-3 py-4 text-xs font-semibold sm:px-4 sm:text-sm">비교 질문</div>
          {mobileColumns.map((column) => (
            <div
              key={`mobile-header-${column.snapshotId}`}
              className="compass-compare-column px-3 py-4 sm:px-4"
            >
              <div className="compass-compare-header-block">
                <p className="compass-editorial-kicker">보드 후보</p>
                <p className="font-display text-[1.06rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                  {column.card.destination.nameKo}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">{column.card.destination.nameEn}</p>
                <div className="compass-compare-pill-row">
                  {column.card.recommendation.reasons.slice(0, 2).map((reason) => (
                    <span
                      key={`mobile-reason-${column.snapshotId}-${reason}`}
                      className="compass-metric-pill rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
                <div className="compass-compare-stat text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">결정 요약</p>
                  <p className="mt-2 font-semibold text-[var(--color-ink)]">
                    {column.card.recommendation.scoreBreakdown.total}점 · {column.card.recommendation.confidence}% 일치
                  </p>
                </div>
                <p className="text-xs leading-5 text-[var(--color-ink-soft)]">
                  {buildRecommendationVerdict(column.card).headline}
                </p>
                <Link
                  href={column.sharePath}
                  className="compass-compare-link inline-flex text-xs font-semibold"
                >
                  공유 페이지 보기
                </Link>
              </div>
            </div>
          ))}

          {mobileRows.map((row) => (
            <Fragment key={`mobile-${row.label}`}>
              <div
                data-testid={row.label === "한 줄 판정" ? testIds.compare.verdictRow : undefined}
                className={`${row.label === "한 줄 판정" ? "compass-decision-card" : "compass-compare-label"} px-3 py-4 text-xs font-semibold sm:px-4 sm:text-sm`}
              >
                {row.label}
              </div>
              {mobileColumns.map((column) => (
                <div
                  key={`mobile-${row.label}-${column.snapshotId}`}
                  className={`${row.label === "체크할 점" ? "compass-compare-cell compass-compare-cell-warning" : "compass-compare-cell"} px-3 py-4 text-xs leading-5 sm:px-4 sm:text-sm sm:leading-6`}
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
          className="compass-compare-grid grid min-w-[52rem] gap-px rounded-[var(--radius-card)]"
          style={{
            gridTemplateColumns: `minmax(10rem, 12rem) repeat(${columns.length}, minmax(14rem, 1fr))`,
          }}
        >
          <div className="compass-compare-label px-4 py-4 text-sm font-semibold">비교 질문</div>
          {columns.map((column, index) => (
            <div
              key={`desktop-header-${column.snapshotId}`}
              data-testid={getCompareColumnTestId(index)}
              className="compass-compare-column px-4 py-4"
            >
              <div className="compass-compare-header-block">
                <p className="compass-editorial-kicker">보드 후보</p>
                <p className="font-display text-[1.16rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)]">
                  {column.card.destination.nameKo}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">{column.card.destination.nameEn}</p>
                <div className="compass-compare-pill-row">
                  {column.card.recommendation.reasons.slice(0, 2).map((reason) => (
                    <span
                      key={`desktop-reason-${column.snapshotId}-${reason}`}
                      className="compass-metric-pill rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
                <div className="compass-compare-stat text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">결정 요약</p>
                  <p className="mt-2 font-semibold text-[var(--color-ink)]">
                    {column.card.recommendation.scoreBreakdown.total}점 · {column.card.recommendation.confidence}% 일치
                  </p>
                </div>
                <p className="text-xs leading-5 text-[var(--color-ink-soft)]">
                  {buildRecommendationVerdict(column.card).headline}
                </p>
                <Link
                  href={column.sharePath}
                  className="compass-compare-link inline-flex text-xs font-semibold"
                >
                  공유 페이지 보기
                </Link>
              </div>
            </div>
          ))}

          {desktopRows.map((row) => (
            <Fragment key={`desktop-${row.label}`}>
              <div
                data-testid={row.label === "한 줄 판정" ? testIds.compare.verdictRow : undefined}
                className={`${row.label === "한 줄 판정" ? "compass-decision-card" : "compass-compare-label"} px-4 py-4 text-sm font-semibold`}
              >
                {row.label}
              </div>
              {columns.map((column) => (
                <div
                  key={`desktop-${row.label}-${column.snapshotId}`}
                  className={`${row.label === "체크할 점" ? "compass-compare-cell compass-compare-cell-warning" : "compass-compare-cell"} px-4 py-4 text-sm leading-6`}
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
