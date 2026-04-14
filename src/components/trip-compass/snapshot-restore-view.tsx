"use client";

import Link from "next/link";

import type { SnapshotRestorePageData } from "@/lib/trip-compass/route-data";
import { testIds } from "@/lib/test-ids";

import { DestinationDetailExperience } from "./destination-detail-experience";
import { ExperienceShell } from "./experience-shell";

type SnapshotRestoreViewProps = {
  data: SnapshotRestorePageData;
};

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
      title={`${data.card.destination.nameKo} 여행을 저장해 둔 그대로 다시 보고 있어요.`}
      intro="이 페이지는 저장 당시의 추천 조건과 결과를 그대로 복원해 보여줘요. 새로 계산하지 않고, 담아 둔 여행 결정을 다시 확인하는 용도예요."
      capsule="익명 저장 링크 · 재계산 없음 · 비교 보드로 이어가기 가능"
      headerAside={
        <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5">
          <p className="compass-editorial-kicker">이 여행을 담아 둔 이유</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">{data.restoredNarrative}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              추천 버전 {data.scoringVersionId}
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              저장한 후보 {data.cardsCount}곳
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <section className="compass-desk rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-3 border-b border-[color:var(--color-frame-soft)] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="compass-editorial-kicker">저장 당시 조건</p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                이 여행이 왜 내 일정 후보로 올라왔는지, 담아 둔 기준부터 다시 확인할 수 있어요.
              </p>
            </div>
            <Link
              href="/"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
            >
              새 여행 다시 찾기
            </Link>
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

        <section className="compass-note rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
          <p className="compass-editorial-kicker">다음 단계</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            이 링크는 저장해 둔 여행 한 곳을 다시 읽는 용도예요. 여러 후보를 함께 보려면 홈에서 2개 이상 담은 뒤 비교 보드로 이어 보세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </section>
      </div>
    </ExperienceShell>
  );
}
