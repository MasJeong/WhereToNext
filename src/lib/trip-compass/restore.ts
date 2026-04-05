import type {
  ComparisonSnapshot,
  RecommendationSnapshot,
} from "@/lib/domain/contracts";
import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { readRecommendationSnapshots } from "@/lib/snapshots/service";

import {
  buildSnapshotPath,
  createRecommendationCards,
  type RecommendationCardView,
} from "./presentation";

export type RestoredRecommendationView = {
  cards: RecommendationCardView[];
  query: RecommendationSnapshot["query"];
  scoringVersionId: string;
  primaryCard: RecommendationCardView | null;
};

export type ComparisonColumnView = {
  snapshotId: string;
  sharePath: string;
  card: RecommendationCardView;
};

function buildSavedRecommendationPath(snapshotId: string): string {
  return buildSnapshotPath(snapshotId, "recommendation");
}

/**
 * 저장된 추천 결과를 카드 뷰로 변환하고 누락 여부를 검사한다.
 * @param snapshot 저장된 추천 스냅샷 payload
 * @returns destinationIds 순서를 보존한 카드 목록
 */
function restoreCardsFromSnapshot(snapshot: RecommendationSnapshot): RecommendationCardView[] {
  const cards = createRecommendationCards(snapshot.results);
  const cardIndex = new Map(cards.map((card) => [card.destination.id, card]));

  return snapshot.destinationIds.map((destinationId) => {
    const card = cardIndex.get(destinationId);

    if (!card) {
      throw new Error("RECOMMENDATION_CARD_NOT_FOUND");
    }

    const destination = launchCatalog.find((item) => item.id === destinationId);
    if (!destination) {
      throw new Error("RECOMMENDATION_DESTINATION_NOT_FOUND");
    }

    return card;
  });
}

/**
 * 저장된 추천 스냅샷을 재계산 없이 그대로 복원한다.
 * @param snapshot 추천 스냅샷 payload
 * @returns 저장 당시 카드 목록과 질의 메타데이터
 */
export async function hydrateRecommendationSnapshot(
  snapshot: RecommendationSnapshot,
): Promise<RestoredRecommendationView> {
  const cards = restoreCardsFromSnapshot(snapshot);

  return {
    cards,
    query: snapshot.query,
    scoringVersionId: snapshot.scoringVersionId,
    primaryCard: cards[0] ?? null,
  };
}

/**
 * 저장된 비교 스냅샷을 복원하고 누락이 있으면 즉시 실패시킨다.
 * @param snapshot 비교 스냅샷 payload
 * @returns 비교용 카드 컬럼 목록
 */
export async function hydrateComparisonSnapshot(
  snapshot: ComparisonSnapshot,
  viewerUserId?: string | null,
): Promise<ComparisonColumnView[]> {
  const recommendationSnapshots = await readRecommendationSnapshots(snapshot.snapshotIds, viewerUserId);
  const snapshotIndex = new Map(recommendationSnapshots.map((item) => [item.id, item]));

  return snapshot.snapshotIds.map((snapshotId) => {
    const storedSnapshot = snapshotIndex.get(snapshotId);

    if (!storedSnapshot) {
      throw new Error("COMPARE_RECOMMENDATION_SNAPSHOT_NOT_FOUND");
    }

    const primaryCard = restoreCardsFromSnapshot(storedSnapshot.payload)[0];
    if (!primaryCard) {
      throw new Error("COMPARE_PRIMARY_CARD_NOT_FOUND");
    }

    return {
      snapshotId,
      sharePath: buildSavedRecommendationPath(snapshotId),
      card: primaryCard,
    } satisfies ComparisonColumnView;
  });
}
