import type { RecommendationQuery } from "@/lib/domain/contracts";

import type { RecommendationCardView } from "./presentation";

export type SavedRecommendationSnapshotRequest = {
  kind: "recommendation";
  payload: {
    v: 1;
    kind: "recommendation";
    query: RecommendationQuery;
    destinationIds: [string];
    results: [RecommendationCardView["recommendation"]];
    scoringVersionId: string;
    trendSnapshotIds: string[];
  };
};

/**
 * 저장/복원 계약에 맞는 recommendation snapshot 요청 바디를 만든다.
 * @param query 현재 추천 질의
 * @param card 저장할 추천 카드
 * @param scoringVersionId 활성 점수 버전 ID
 * @returns 스냅샷 생성 요청 바디
 */
export function buildRecommendationSnapshotPayload(
  query: RecommendationQuery,
  card: RecommendationCardView,
  scoringVersionId: string,
): SavedRecommendationSnapshotRequest {
  return {
    kind: "recommendation" as const,
    payload: {
      v: 1 as const,
      kind: "recommendation" as const,
      query,
      destinationIds: [card.destination.id],
      results: [card.recommendation],
      scoringVersionId,
      trendSnapshotIds: card.recommendation.trendEvidence.map((item) => item.id),
    },
  };
}
