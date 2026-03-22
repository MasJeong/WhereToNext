import Link from "next/link";

import { ExperienceShell } from "@/components/trip-compass/experience-shell";
import { RecommendationCard } from "@/components/trip-compass/recommendation-card";
import { readSnapshot } from "@/lib/snapshots/service";
import { buildQueryNarrative, buildStructuredTripBrief } from "@/lib/trip-compass/presentation";
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

  const briefItems = buildStructuredTripBrief(restored.query);
  const restoredNarrative = buildQueryNarrative(restored.query);

  return (
    <ExperienceShell
      eyebrow="저장 워크스페이스"
      title={`${restored.primaryCard?.destination.nameKo ?? "저장한 추천"}를 중심으로 저장 당시의 판단 흐름을 다시 여는 공유 워크스페이스예요.`}
      intro="이 링크는 저장 당시의 추천 결과를 다시 계산하지 않고 그대로 복원해요. brief, 왜 맞는지, 체크 포인트, 분위기 근거를 저장 시점의 문맥으로 다시 읽을 수 있어요."
      capsule="익명 공유 링크 · 저장 시점 결과 복원 · recommendation snapshot 계약 그대로 유지"
      headerAside={
        <div className="compass-panel rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-[var(--color-paper)] sm:px-5 sm:py-5">
          <p className="compass-editorial-kicker text-[var(--color-sand)]">Restored dossier</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-paper-soft)]">{restoredNarrative}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[color:var(--color-frame)] bg-[rgb(255_255_255_/_0.08)] px-3 py-1.5 text-xs font-semibold text-[var(--color-paper)]">
              추천 버전 {restored.scoringVersionId}
            </span>
            <span className="rounded-full border border-[color:var(--color-frame)] bg-[rgb(255_255_255_/_0.08)] px-3 py-1.5 text-xs font-semibold text-[var(--color-paper)]">
              저장 카드 {restored.cards.length}곳
            </span>
            <span className="rounded-full border border-[color:var(--color-frame)] bg-[rgb(255_255_255_/_0.08)] px-3 py-1.5 text-xs font-semibold text-[var(--color-paper)]">
              변형 없이 복원
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="compass-open-info rounded-[calc(var(--radius-card)-10px)] px-4 py-4 text-[var(--color-ink)]">
          <div className="flex flex-col gap-3 border-b border-[color:var(--color-frame-soft)] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="compass-editorial-kicker">저장된 trip brief</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                공유받은 사람도 저장 당시의 조건을 먼저 읽고, 같은 기준으로 이 카드를 해석할 수 있어요. 링크를 다시 열어도 추천 결과는 새로 계산되지 않아요.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="compass-action-primary compass-soft-press rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
              >
                내 조건으로 새 brief 만들기
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              공유 링크 그대로 복원
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              결과 재계산 없음
            </span>
          </div>

          <div className="compass-brief-grid mt-4" data-testid={testIds.snapshot.restoreBrief}>
            {briefItems.map((item) => (
              <article
                key={item.id}
                className="compass-brief-card rounded-[calc(var(--radius-card)-10px)] px-4 py-3.5"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                  {item.label}
                </p>
                <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                  {item.value}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">
                  {item.detail}
                </p>
              </article>
            ))}
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

        <section className="compass-note rounded-[calc(var(--radius-card)-10px)] px-5 py-5 text-[var(--color-ink)]">
          <p className="compass-editorial-kicker">다음 단계</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
            이 링크는 카드 하나의 판단 근거를 복원하는 용도예요. 여러 후보를 같은 질문으로 다시 줄이고 싶다면 홈에서 카드를 2개 이상 저장해 compare 링크를 만들어 보세요.
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
