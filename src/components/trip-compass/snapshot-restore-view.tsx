"use client";

import Link from "next/link";

import type { SnapshotRestorePageData } from "@/lib/trip-compass/route-data";
import { testIds } from "@/lib/test-ids";

import { DestinationDetailExperience } from "./destination-detail-experience";
import { ExperienceShell } from "./experience-shell";

type SnapshotRestoreViewProps = {
  data: SnapshotRestorePageData;
};

function RestoreTrustPanel({
  destinationName,
  cardsCount,
  scoringVersionId,
}: {
  destinationName: string;
  cardsCount: number;
  scoringVersionId: string;
}) {
  return (
    <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5">
      <p className="compass-editorial-kicker">이 페이지가 하는 일</p>
      <h2 className="mt-2 text-[1.02rem] font-semibold leading-snug tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.12rem]">
        {destinationName} 저장 결과를 다시 확인해요.
      </h2>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <article className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
          <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">복원 방식</p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">저장된 결과 그대로</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">익명 링크로 다시 읽는 페이지예요.</p>
        </article>
        <article className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
          <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">저장 당시 범위</p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">후보 {cardsCount}곳 중 1곳</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">추천 버전 {scoringVersionId}</p>
        </article>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <a
          href="#restore-detail"
          className="compass-action-primary compass-soft-press inline-flex rounded-full px-5 py-2.5 text-sm font-semibold tracking-[0.04em]"
        >
          저장한 여행 다시 보기
        </a>
        <p className="text-xs leading-5 text-[var(--color-ink-soft)]">비교가 필요하면 홈에서 여러 후보를 다시 담아 비교 보드로 이어갈 수 있어요.</p>
      </div>
    </div>
  );
}

function RestoreErrorState({ message }: { message: string }) {
  return (
    <section
      data-testid={testIds.compare.restoreError}
      className="compass-open-info rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5"
    >
      <p className="text-sm leading-6 text-[var(--color-muted)]">{message}</p>
      <Link
        href="/"
        className="compass-action-primary compass-soft-press mt-4 inline-flex rounded-full px-5 py-2 text-sm font-semibold tracking-[0.04em]"
      >
        홈으로 돌아가기
      </Link>
    </section>
  );
}

export function SnapshotRestoreView({ data }: SnapshotRestoreViewProps) {
  if (data.kind === "error") {
    return (
      <ExperienceShell eyebrow="내 일정" title="" intro="" capsule="" hideHeader bareBody>
        <RestoreErrorState message={data.message} />
      </ExperienceShell>
    );
  }

  return (
    <ExperienceShell
      eyebrow="내 일정"
      title={`${data.card.destination.nameKo} 저장 결과를 다시 보고 있어요.`}
      intro="저장 당시 기준과 결과를 그대로 확인하는 페이지예요. 아래에서 담아 둔 이유를 먼저 보고 상세 정보를 이어서 읽어 보세요."
      capsule="익명 공유 링크 · 재계산 없음 · 저장한 판단 그대로 복원"
      headerAside={
        <RestoreTrustPanel
          destinationName={data.card.destination.nameKo}
          cardsCount={data.cardsCount}
          scoringVersionId={data.scoringVersionId}
        />
      }
    >
      <div className="space-y-4">
        <section className="compass-desk rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-3 border-b border-[color:var(--color-frame-soft)] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="compass-editorial-kicker">저장 당시 조건</p>
              <h2 className="mt-2 text-[1rem] font-semibold leading-snug tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.14rem]">
                왜 이 여행이 일정 후보로 올라왔는지 먼저 다시 볼 수 있어요.
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                {data.restoredNarrative}
              </p>
            </div>
            <div className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3 sm:max-w-[13rem]">
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">읽는 순서</p>
              <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">조건 확인 → 상세 읽기 → 필요하면 새 추천</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4" data-testid={testIds.snapshot.restoreBrief}>
            {data.briefItems.map((item) => (
              <article key={item.id} className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4">
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">{item.label}</p>
                <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.02em] text-[var(--color-ink)]">{item.value}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <div id="restore-detail">
          <DestinationDetailExperience
            destination={data.card.destination}
            card={data.card}
            query={data.query}
            evidence={data.evidence}
            supplement={data.supplement}
            scoringVersionId={data.scoringVersionId}
            snapshotId={data.snapshotId}
            allowSave={false}
            rootTestId={testIds.result.card0}
            evidenceTestId={testIds.result.instagramVibe0}
          />
        </div>

        <section className="compass-note rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
          <p className="compass-editorial-kicker">다음 단계</p>
          <h2 className="mt-2 text-[1rem] font-semibold leading-snug tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.12rem]">
            비교가 필요하면 새로 담아서 보드를 다시 만들면 돼요.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            이 링크는 저장해 둔 여행 한 곳을 다시 읽는 용도예요. 여러 후보를 함께 보려면 홈에서 2개 이상 담은 뒤 비교 보드로 이어 보세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-sm font-semibold tracking-[0.04em]"
            >
              새 추천 다시 받기
            </Link>
          </div>
        </section>
      </div>
    </ExperienceShell>
  );
}
