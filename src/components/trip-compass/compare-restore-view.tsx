"use client";

import Link from "next/link";

import type { CompareRestorePageData } from "@/lib/trip-compass/route-data";
import type { ComparisonColumnView } from "@/lib/trip-compass/restore";
import { testIds } from "@/lib/test-ids";

import { CompareBoard } from "./compare-board";
import { ExperienceShell } from "./experience-shell";

type CompareRestoreViewProps = {
  data: CompareRestorePageData;
};

function CompareRestoreTrustPanel({ columns }: { columns: ComparisonColumnView[] }) {
  return (
    <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-[var(--color-ink)] sm:px-5 sm:py-5">
      <p className="compass-editorial-kicker">이 페이지가 하는 일</p>
      <h2 className="mt-2 text-[1rem] font-semibold leading-snug tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.12rem]">
        저장한 후보만 빠르게 다시 좁혀 보세요.
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
        질문을 다시 입력하지 않아도, 저장해 둔 차이만 이어서 볼 수 있어요.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <article className="compass-desk rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
          <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">현재 후보</p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">{columns.length}곳 비교 중</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">{columns.map((column) => column.card.destination.nameKo).join(" · ")}</p>
        </article>
        <article className="compass-desk rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
          <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">복원 방식</p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">저장된 비교 링크 그대로</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">후보 순서와 비교 기준이 바뀌지 않아요.</p>
        </article>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <a
          href="#compare-board"
          className="compass-action-primary compass-soft-press inline-flex rounded-full px-5 py-2.5 text-sm font-semibold tracking-[0.04em]"
        >
          비교 보드 바로 보기
        </a>
        <p className="text-xs leading-5 text-[var(--color-ink-soft)]">한 줄 판정과 체크할 점부터 보면 마지막 결정이 빨라져요.</p>
      </div>
    </div>
  );
}

function CompareRestoreErrorState({ message }: { message: string }) {
  return (
    <section
      data-testid={testIds.compare.restoreError}
      className="compass-open-info compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-4 py-3 sm:px-5 sm:py-3.5"
    >
      <div className="space-y-2.5">
        <p className="text-sm leading-5 text-[var(--color-muted)]">{message}</p>
        <Link
          href="/"
          className="compass-action-primary compass-soft-press inline-flex rounded-full px-5 py-2 text-sm font-semibold tracking-[0.18em]"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </section>
  );
}

export function CompareRestoreView({ data }: CompareRestoreViewProps) {
  if (data.kind === "error") {
    return (
      <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
        <CompareRestoreErrorState message={data.message} />
      </ExperienceShell>
    );
  }

  return (
    <ExperienceShell
      eyebrow="비교 보드"
      title="저장한 후보를 한 화면에서 다시 좁혀 보세요."
      intro="후보별 차이만 남겨서, 마지막 판단을 빠르게 이어갈 수 있게 정리했어요."
      capsule="저장된 비교 링크 · 후보 2~4곳 · 재계산 없음"
      headerAside={
        <CompareRestoreTrustPanel columns={data.columns} />
      }
    >
      <section
        id="compare-board"
        data-testid={testIds.compare.summary}
        className="compass-open-info compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="compass-editorial-kicker">비교 보드 요약</p>
            <h2 className="mt-2 text-[1rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.14rem]">
              같은 질문을 반복하지 않도록, 결정에 필요한 차이만 남겼어요.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              각 열은 저장한 여행지 하나이고, 각 행은 마지막에 다시 확인하게 되는 질문이에요.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <article className="compass-hero-meta rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
            <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">이 페이지</p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">저장한 후보만 그대로 비교</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">새 점수 계산 없이 담아 둔 판단을 이어서 읽어요.</p>
          </article>
          <article className="compass-hero-meta rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
            <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">읽는 법</p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">열은 후보, 행은 비교 질문</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">한 줄 판정과 체크할 점부터 보면 빠르게 좁힐 수 있어요.</p>
          </article>
          <article className="compass-hero-meta rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
            <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">다음 행동</p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">마음이 가는 후보 상세로 이동</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">비교는 줄이고, 최종 확인은 상세 화면에서 마무리해요.</p>
          </article>
        </div>

        <div className="mt-2 compass-stage-reveal compass-stage-reveal-later">
          <CompareBoard columns={data.columns} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/" className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-sm font-semibold tracking-[0.04em]">
            새 비교 보드 만들기
          </Link>
        </div>
      </section>
    </ExperienceShell>
  );
}
