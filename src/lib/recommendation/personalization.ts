import type {
  DestinationProfile,
  RecommendationPersonalizationContext,
} from "@/lib/domain/contracts";

type PersonalizationEffect = {
  delta: number;
  reason: string | null;
};

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
  const visitedEntry = context.history.find((entry) => entry.destinationId === destination.id);

  if (context.explorationPreference === "repeat") {
    if (visitedEntry?.wouldRevisit) {
      return {
        delta: tieBreakerCap,
        reason: "예전에 좋게 기억한 여행지라 다시 가고 싶은 후보로 올렸어요.",
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
  }

  if (visitedEntry?.wouldRevisit) {
    return {
      delta: 1,
      reason: "예전에 다시 가고 싶다고 남긴 여행지라 후보에 조금 더 반영했어요.",
    };
  }

  return {
    delta: 0,
    reason: null,
  };
}
