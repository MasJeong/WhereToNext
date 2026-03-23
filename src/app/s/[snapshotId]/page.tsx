import Link from "next/link";

import { DestinationDetailExperience } from "@/components/trip-compass/destination-detail-experience";
import { ExperienceShell } from "@/components/trip-compass/experience-shell";
import { readSnapshot } from "@/lib/snapshots/service";
import { buildQueryNarrative, buildStructuredTripBrief } from "@/lib/trip-compass/presentation";
import { hydrateRecommendationSnapshot } from "@/lib/trip-compass/restore";
import { testIds } from "@/lib/test-ids";

type SnapshotPageProps = {
  params: Promise<{
    snapshotId: string;
  }>;
};

export default async function SnapshotRestorePage({ params }: SnapshotPageProps) {
  const { snapshotId } = await params;
  const snapshot = await readSnapshot(snapshotId);

  if (!snapshot || snapshot.kind !== "recommendation") {
    return (
      <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
        <section
          data-testid={testIds.compare.restoreError}
          className="compass-open-info rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5"
        >
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            공유받은 저장 링크를 다시 확인하거나 홈에서 새 추천을 저장해 주세요.
          </p>
          <Link
            href="/"
            className="compass-action-primary compass-soft-press mt-4 inline-flex rounded-full px-5 py-2 text-sm font-semibold tracking-[0.04em]"
          >
            홈으로 돌아가기
          </Link>
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

  if (!restored || !restored.primaryCard) {
    return (
      <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
        <section
          data-testid={testIds.compare.restoreError}
          className="compass-open-info rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5"
        >
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            저장 당시 카드 정보를 복원하지 못했어요. 홈에서 새 추천을 저장해 다시 공유해 주세요.
          </p>
          <Link
            href="/"
            className="compass-action-primary compass-soft-press mt-4 inline-flex rounded-full px-5 py-2 text-sm font-semibold tracking-[0.04em]"
          >
            홈으로 돌아가기
          </Link>
        </section>
      </ExperienceShell>
    );
  }

  const briefItems = buildStructuredTripBrief(restored.query);
  const restoredNarrative = buildQueryNarrative(restored.query);

  return (
    <ExperienceShell
      eyebrow="저장한 여행지"
      title={`${restored.primaryCard.destination.nameKo}을(를) 저장했을 때의 추천 맥락 그대로 다시 볼 수 있어요.`}
      intro="이 링크는 추천 결과를 새로 계산하지 않고 저장 당시 조건과 점수, 근거를 그대로 불러와요. 목적지 정보를 다시 읽고, 저장 이유를 확인하고, 필요하면 비교로 이어갈 수 있어요."
      capsule="익명 공유 링크 · 저장 당시 내용 그대로 복원 · 재계산 없음"
      headerAside={
        <div className="compass-sheet rounded-[calc(var(--radius-card)-10px)] px-4 py-4 sm:px-5 sm:py-5">
          <p className="compass-editorial-kicker">저장 당시 설명</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">{restoredNarrative}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              추천 버전 {restored.scoringVersionId}
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              저장 카드 {restored.cards.length}곳
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="compass-desk rounded-[var(--radius-card)] px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-3 border-b border-[color:var(--color-frame-soft)] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="compass-editorial-kicker">저장된 추천 조건</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                공유받은 사람도 저장 당시 어떤 조건으로 이 카드가 올라왔는지 먼저 확인할 수 있어요.
              </p>
            </div>
            <Link
              href="/"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
            >
              새 추천 다시 만들기
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid={testIds.snapshot.restoreBrief}>
            {briefItems.map((item) => (
              <article
                key={item.id}
                className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4"
              >
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                  {item.label}
                </p>
                <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                  {item.value}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <DestinationDetailExperience
          destination={restored.primaryCard.destination}
          card={restored.primaryCard}
          query={restored.query}
          evidence={restored.primaryCard.recommendation.trendEvidence}
          scoringVersionId={restored.scoringVersionId}
          snapshotId={snapshotId}
          allowSave={false}
          rootTestId={testIds.result.card0}
          evidenceTestId={testIds.result.instagramVibe0}
        />

        <section className="compass-note rounded-[var(--radius-card)] px-5 py-5 sm:px-6 sm:py-6">
          <p className="compass-editorial-kicker">다음 단계</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            이 링크는 저장한 여행지 하나를 다시 읽는 용도예요. 여러 후보를 함께 보려면 홈에서 2개 이상 저장한 뒤 비교 화면을 만들어 보세요.
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
