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
      title="저장한 후보를 행 기준으로 맞춰 보고, 더 빨리 결정해 보세요."
      intro="비교 보드는 저장한 추천 카드 그대로 복원돼요. 그래서 후보를 다시 읽는 대신, 예산·비행·시즌·체크 포인트 차이만 같은 줄에서 바로 스캔할 수 있어요."
      capsule={`저장 ID ${snapshot.id.slice(0, 8)} · ${columns.length}곳 비교 보드`}
    >
      <section className="compass-desk rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-4 border-b border-[color:var(--color-frame-soft)] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-sand-deep)]">
              비교 보드
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
              카드형 스토리 대신, 같은 기준의 줄을 내려가며 후보를 빠르게 걸러보세요.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-ink-soft)]">
              위에서 후보를 확인하고, 아래에서는 판단 한 줄 → 왜 맞는지 → 예산/비행/시즌 → 체크할 점 순서로 읽으면 결정이 더 빨라져요.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[color:var(--color-frame-soft)] bg-[color:var(--color-paper-elevated)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[color:var(--color-sand)]"
          >
            새 비교 보드 만들기
          </Link>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="compass-note rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-[var(--color-ink)]">
            <p className="text-sm font-semibold">판단 한 줄부터</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              먼저 저장 후보로 둘 곳인지 가장 위 행에서 바로 확인해 보세요.
            </p>
          </div>
          <div className="compass-note rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-[var(--color-ink)]">
            <p className="text-sm font-semibold">차이는 같은 줄에서</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              예산, 비행, 시즌 차이를 좌우로 맞춰 보면 읽는 양이 크게 줄어요.
            </p>
          </div>
          <div className="compass-note rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-[var(--color-ink)]">
            <p className="text-sm font-semibold">분위기는 마지막에</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              감도는 마지막 행에서 확인하고, 앞쪽 줄은 결정 근거에 집중해 두었어요.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <CompareBoard columns={columns} />
        </div>
      </section>
    </ExperienceShell>
  );
}
