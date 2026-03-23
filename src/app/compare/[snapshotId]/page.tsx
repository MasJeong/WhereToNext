import Link from "next/link";

import { CompareBoard } from "@/components/trip-compass/compare-board";
import { ExperienceShell } from "@/components/trip-compass/experience-shell";
import { readSnapshot } from "@/lib/snapshots/service";
import { hydrateComparisonSnapshot } from "@/lib/trip-compass/restore";
import { testIds } from "@/lib/test-ids";

type ComparePageProps = {
  params: Promise<{
    snapshotId: string;
  }>;
};

/**
 * Restores and renders a saved comparison snapshot without login.
 * @param props Dynamic route params
 * @returns Compare snapshot page
 */
export default async function CompareSnapshotPage({ params }: ComparePageProps) {
  const { snapshotId } = await params;
  const snapshot = await readSnapshot(snapshotId);

  if (!snapshot || snapshot.kind !== "comparison") {
    return (
      <ExperienceShell
        eyebrow=""
        title=""
        intro=""
        capsule=""
        hideHeader
        bareBody
      >
        <section
          data-testid={testIds.compare.restoreError}
          className="compass-open-info compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-4 py-3 sm:px-5 sm:py-3.5"
        >
          <div className="space-y-2.5">
            <p className="text-sm leading-5 text-[var(--color-muted)]">
              홈으로 돌아가 목적지 카드를 다시 저장한 뒤 비교 보드를 만들어 주세요.
            </p>
            <Link
              href="/"
              className="compass-action-primary compass-soft-press inline-flex rounded-full px-5 py-2 text-sm font-semibold tracking-[0.18em]"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </section>
      </ExperienceShell>
    );
  }

  let columns = null;
  try {
    columns = await hydrateComparisonSnapshot(snapshot.payload);
  } catch {
    columns = null;
  }

  if (!columns) {
    return (
      <ExperienceShell
        eyebrow=""
        title=""
        intro=""
        capsule=""
        hideHeader
        bareBody
      >
        <section
          data-testid={testIds.compare.restoreError}
          className="compass-open-info compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-4 py-3 sm:px-5 sm:py-3.5"
        >
          <div className="space-y-2.5">
            <p className="text-sm leading-5 text-[var(--color-muted)]">
              홈으로 돌아가 목적지 카드를 다시 저장한 뒤 비교 보드를 새로 만들어 주세요.
            </p>
            <Link
              href="/"
              className="compass-action-primary compass-soft-press inline-flex rounded-full px-5 py-2 text-sm font-semibold tracking-[0.18em]"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </section>
      </ExperienceShell>
    );
  }

  return (
      <ExperienceShell
        eyebrow="결정 보드"
        title={`${columns.length}개 저장 후보를 모바일에서도 빠르게 좁힐 수 있게 다시 정리한 비교 화면이에요.`}
        intro="비교 링크는 저장된 결과만 그대로 불러와요. 최종 결정을 앞둔 순간에 차이만 빠르게 읽히도록 행과 카드 구조를 단순하게 정리했어요."
        capsule="저장한 카드 2~4개 비교 · 저장 결과 그대로 복원 · 익명 공유 가능"
        headerAside={
        <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-[var(--color-ink)] sm:px-5 sm:py-5">
          <p className="compass-editorial-kicker">현재 보드</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            {columns.map((column) => column.card.destination.nameKo).join(" · ")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="compass-metric-pill rounded-full px-3 py-1.5 text-xs font-semibold">
              후보 {columns.length}곳
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1.5 text-xs font-semibold">
              저장된 비교 링크
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1.5 text-xs font-semibold">
              변형 없이 비교
            </span>
          </div>
        </div>
      }
    >
      <section
        data-testid={testIds.compare.summary}
        className="compass-open-info compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="compass-editorial-kicker">비교 보드 요약</p>
            <h2 className="mt-2 font-display text-[1.02rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.18rem]">
              같은 질문을 반복해서 보지 않도록, 핵심 차이만 남겨 최종 결정을 빠르게 도와줘요.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              각 열은 저장한 여행지 하나이고, 각 행은 마지막에 다시 확인하게 되는 질문이에요. 차이만 보기로 중요한 판단 포인트만 남길 수도 있어요.
            </p>
          </div>
          <Link
            href="/"
            className="compass-action-secondary compass-soft-press rounded-full px-4 py-1.5 text-sm font-semibold"
          >
            새 비교 보드 만들기
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
            저장한 카드만 비교
          </span>
          <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
            추천 재계산 없음
          </span>
        </div>

        <div className="mt-2 compass-stage-reveal compass-stage-reveal-later">
          <CompareBoard columns={columns} />
        </div>
      </section>
    </ExperienceShell>
  );
}
