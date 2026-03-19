import Link from "next/link";

import { ExperienceShell } from "@/components/trip-compass/experience-shell";
import { RecommendationCard } from "@/components/trip-compass/recommendation-card";
import { readSnapshot } from "@/lib/snapshots/service";
import { buildQueryNarrative } from "@/lib/trip-compass/presentation";
import { hydrateRecommendationSnapshot } from "@/lib/trip-compass/restore";
import { testIds } from "@/lib/test-ids";

type SnapshotPageProps = {
  params: Promise<{
    snapshotId: string;
  }>;
};

/**
 * Restores and renders a saved recommendation snapshot without login.
 * @param props Dynamic route params
 * @returns Snapshot restore page
 */
export default async function SnapshotRestorePage({ params }: SnapshotPageProps) {
  const { snapshotId } = await params;
  const snapshot = await readSnapshot(snapshotId);

  if (!snapshot || snapshot.kind !== "recommendation") {
    return (
      <ExperienceShell
          eyebrow="Trip Compass"
          title="저장한 추천 결과를 찾지 못했어요."
          intro="링크가 잘못되었거나 다른 저장 결과를 가리키고 있을 수 있어요. 이 페이지에서는 오래된 결과를 임의로 다시 계산해 보여주지 않아요."
          capsule="복원은 익명으로 동작하고, 저장 ID가 어긋나면 안전하게 멈춰요."
        >
        <section
          data-testid={testIds.compare.restoreError}
          className="compass-panel compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7"
        >
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              공유받은 주소를 다시 확인하거나 홈으로 돌아가 새 추천 카드를 저장해 주세요.
            </p>
            <Link
              href="/"
              className="compass-action-primary compass-soft-press inline-flex rounded-full px-5 py-3 text-sm font-semibold tracking-[0.18em]"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </section>
      </ExperienceShell>
    );
  }

  let restored = null;
  try {
    restored = await hydrateRecommendationSnapshot(snapshot.payload);
  } catch {
    restored = null;
  }

  if (!restored) {
    return (
      <ExperienceShell
        eyebrow="Trip Compass"
        title="저장한 추천 카드 복원이 완전하지 않아요."
        intro="저장 ID는 확인됐지만, 목적지 카드 정보를 안전하게 되살릴 수 없었어요. 부분 데이터나 재계산 결과는 보여주지 않고 여기서 멈춰요."
        capsule="저장된 원본 정보가 없으면 복원은 닫힌 상태로 실패해요."
      >
        <section
          data-testid={testIds.compare.restoreError}
          className="compass-panel compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7"
        >
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              홈으로 돌아가 새 추천 카드를 다시 저장해 주세요.
            </p>
            <Link
              href="/"
              className="compass-action-primary compass-soft-press inline-flex rounded-full px-5 py-3 text-sm font-semibold tracking-[0.18em]"
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
      eyebrow="저장한 카드"
      title="저장해 둔 목적지를 그대로 다시 확인해 보세요."
      intro="공유 페이지는 저장된 목적지 선택을 먼저 복원한 뒤 카드 화면을 다시 구성해요. 왜 추천됐는지, 무엇을 체크해야 하는지, 분위기 근거까지 한 번에 살펴볼 수 있어요."
      capsule={`저장 ID ${snapshot.id.slice(0, 8)} · ${snapshot.createdAt.slice(0, 10)}`}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
        <section className="space-y-6">
          <article className="compass-panel compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-5 py-6 sm:px-6 sm:py-7">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
              복원된 여행 조건
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              {buildQueryNarrative(restored.query)}
            </p>
            <div className="mt-5 grid gap-3">
              <div className="compass-card-settle rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4 text-sm text-[var(--color-paper)]">
                추천 버전 · {restored.scoringVersionId}
              </div>
              <div className="compass-card-settle rounded-[calc(var(--radius-card)-10px)] border border-[color:var(--color-frame)] bg-[color:var(--color-wash)] p-4 text-sm text-[var(--color-paper)]">
                저장된 목적지 수 · {restored.cards.length}곳
              </div>
            </div>
          </article>
        </section>

        <section className="space-y-4">
          {restored.cards.map((card, index) => (
            <RecommendationCard
              key={`${snapshot.id}-${card.destination.id}`}
              card={card}
              index={index}
              query={restored.query}
              actionSlot={
                <>
                  <Link
                    href="/"
                    className="compass-action-primary compass-soft-press rounded-full px-4 py-3 text-xs font-semibold tracking-[0.18em]"
                  >
                    새 여행 추천 다시 만들기
                  </Link>
                  <Link
                    href={card.recommendation.trendEvidence[0]?.sourceUrl ?? "/"}
                    className="compass-action-secondary compass-soft-press rounded-full px-4 py-3 text-xs font-semibold tracking-[0.18em]"
                  >
                    분위기 근거 보기
                  </Link>
                </>
              }
            />
          ))}
        </section>
      </div>
    </ExperienceShell>
  );
}
