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
        eyebrow="비교 보드"
        title="저장한 비교 보드를 찾지 못했어요."
        intro="저장한 비교 보드를 복원할 수 없어서, 이 페이지는 임의 재계산 없이 안전한 오류 상태로 멈춰 있어요."
        capsule="비교 링크는 익명으로 열리고 저장 ID 기준으로 고정돼요."
      >
        <section
          data-testid={testIds.compare.restoreError}
          className="compass-panel rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7"
        >
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              홈으로 돌아가 목적지 카드 2개에서 4개를 다시 저장한 뒤 새 비교 보드를 만들어 주세요.
            </p>
            <Link
              href="/"
              className="inline-flex rounded-full border border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)]"
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
        eyebrow="비교 보드"
        title="저장한 비교 보드 정보가 완전하지 않아요."
        intro="이 비교 링크에 연결된 추천 카드 중 하나 이상을 더는 복원할 수 없어요. 칼럼을 몰래 빼지 않고 비교 화면 전체를 안전하게 멈춰요."
        capsule="비교 링크는 익명으로 열리고 저장 ID 기준으로 고정돼요."
      >
        <section
          data-testid={testIds.compare.restoreError}
          className="compass-panel rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7"
        >
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              홈으로 돌아가 목적지 카드를 다시 저장한 뒤 비교 보드를 새로 만들어 주세요.
            </p>
            <Link
              href="/"
              className="inline-flex rounded-full border border-[color:var(--color-frame-strong)] bg-[color:var(--color-paper-soft)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)]"
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
      eyebrow="비교 보드"
      title="저장해 둔 후보를 한 화면에서 차분히 비교해 보세요."
      intro="각 칼럼은 실제로 저장한 목적지 카드에서 가져와요. 그래서 비교 화면도 공유된 기준 그대로 유지돼요."
      capsule={`저장 ID ${snapshot.id.slice(0, 8)} · ${columns.length}곳 비교`}
    >
      <section className="compass-panel rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-4 border-b border-[color:var(--color-frame)] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
              비교 보드
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-paper)]">
              예산 감각, 비행 거리, 추천 이유, 체크할 점, 분위기 근거를 한 번에 볼 수 있어요.
            </h2>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[color:var(--color-frame)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-paper)] transition hover:border-[color:var(--color-frame-strong)]"
          >
            새 비교 보드 만들기
          </Link>
        </div>

        <div className="mt-5">
          <CompareBoard columns={columns} />
        </div>
      </section>
    </ExperienceShell>
  );
}
