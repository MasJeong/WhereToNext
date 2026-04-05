import type {
  DestinationProfile,
  RecommendationPersonalizationContext,
} from "@/lib/domain/contracts";

type PersonalizationEffect = {
  delta: number;
  reason: string | null;
};

/**
 * 목적지와 사용자 이력 간 태그 겹침 개수를 계산한다.
 * @param destination 목적지 프로필
 * @param context 개인화 컨텍스트
 * @returns 겹치는 태그 수
 */
function getTagOverlapCount(
  destination: DestinationProfile,
  context: RecommendationPersonalizationContext,
): number {
  const likedTags = new Set(
    context.history.filter((entry) => entry.rating >= 4).flatMap((entry) => entry.tags),
  );

  return destination.vibeTags.filter((tag) => likedTags.has(tag)).length;
}

/**
 * 방문 이력과 repeat/discover 선호를 기반으로 개인화 보정값을 만든다.
 * @param destination 목적지 프로필
 * @param context 개인화 컨텍스트
 * @param tieBreakerCap 엔진 허용 최대 보정값
 * @returns 보정 점수와 사용자 설명 문구
 */
export function buildPersonalizationEffect(
  destination: DestinationProfile,
  context: RecommendationPersonalizationContext,
  tieBreakerCap: number,
): PersonalizationEffect {
  const overlapCount = getTagOverlapCount(destination, context);
  const visitedEntry = context.history.find((entry) => entry.destinationId === destination.id);

  if (context.explorationPreference === "repeat") {
    if (visitedEntry?.wouldRevisit) {
      return {
        delta: tieBreakerCap,
        reason: "예전에 좋게 기억한 여행지라 다시 가고 싶은 후보로 올렸어요.",
      };
    }

    if (overlapCount > 0) {
      return {
        delta: Math.min(tieBreakerCap, overlapCount),
        reason: "예전에 높게 평가한 여행 분위기와 닮아서 더 눈여겨봤어요.",
      };
    }
  }

  if (context.explorationPreference === "discover") {
    if (visitedEntry) {
      return {
        delta: -Math.min(tieBreakerCap, 2),
        reason: "이미 다녀온 곳보다는 새로운 후보를 더 우선해서 보여드려요.",
      };
    }

    if (overlapCount > 0) {
      return {
        delta: Math.min(tieBreakerCap, overlapCount),
        reason: "좋아했던 분위기는 유지하면서도 새로운 여행지 쪽으로 더 기울였어요.",
      };
    }
  }

  if (visitedEntry?.wouldRevisit) {
    return {
      delta: 1,
      reason: "예전에 다시 가고 싶다고 남긴 여행지라 후보에 조금 더 반영했어요.",
    };
  }

  if (overlapCount > 0) {
    return {
      delta: Math.min(tieBreakerCap, Math.max(1, overlapCount - 1)),
      reason: "예전에 높게 평가한 여행 태그와 맞는 편이라 추천 이유에 반영했어요.",
    };
  }

  return {
    delta: 0,
    reason: null,
  };
}
