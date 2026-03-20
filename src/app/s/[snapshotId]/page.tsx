import Link from "next/link";

import { ExperienceShell } from "@/components/trip-compass/experience-shell";
import { RecommendationCard } from "@/components/trip-compass/recommendation-card";
import { readSnapshot } from "@/lib/snapshots/service";
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
      <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
        <section
          data-testid={testIds.compare.restoreError}
          className="compass-open-info compass-stage-reveal compass-stage-reveal-fast rounded-[var(--radius-card)] px-4 py-3 sm:px-5 sm:py-3.5"
        >
          <div className="space-y-2.5">
            <p className="text-sm leading-5 text-[var(--color-muted)]">
              공유받은 주소를 다시 확인하거나 홈으로 돌아가 새 추천 카드를 저장해 주세요.
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

  let restored = null;
  try {
    restored = await hydrateRecommendationSnapshot(snapshot.payload);
  } catch {
    restored = null;
  }

  if (!restored) {
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
              홈으로 돌아가 새 추천 카드를 다시 저장해 주세요.
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
      <div className="space-y-2.5">
        <section className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-1.5 text-[var(--color-ink)]">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
            <span className="compass-metric-pill rounded-full px-3 py-1 text-xs">추천 버전 · {restored.scoringVersionId}</span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-xs">저장된 목적지 수 · {restored.cards.length}곳</span>
          </div>
        </section>

        <section className="space-y-2.5">
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
                     className="compass-action-primary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em]"
                   >
                     새 여행 추천 다시 만들기
                   </Link>
                   <Link
                     href={card.recommendation.trendEvidence[0]?.sourceUrl ?? "/"}
                     className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em]"
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
