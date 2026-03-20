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
      eyebrow=""
      title=""
      intro=""
      capsule=""
      hideHeader
      bareBody
    >
      <section className="compass-open-info compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[0.98rem] font-semibold leading-tight text-[var(--color-ink)] sm:text-[1.08rem]">
              같은 기준의 줄로 후보를 빠르게 걸러보세요.
            </h2>
          </div>
          <Link
            href="/"
            className="compass-action-secondary compass-soft-press rounded-full px-4 py-1.5 text-sm font-semibold"
          >
            새 비교 보드 만들기
          </Link>
        </div>

        <div className="mt-2 compass-stage-reveal compass-stage-reveal-later">
          <CompareBoard columns={columns} />
        </div>
      </section>
    </ExperienceShell>
  );
}
