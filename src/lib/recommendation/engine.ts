import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { activeScoringVersion } from "@/lib/catalog/scoring-version";
import {
  type DestinationProfile,
  type RecommendationPersonalizationContext,
  type RecommendationQuery,
  type RecommendationResult,
  type TrendEvidenceSnapshot,
} from "@/lib/domain/contracts";
import { buildPersonalizationEffect } from "@/lib/recommendation/personalization";

type ScoreBreakdown = RecommendationResult["scoreBreakdown"];

const BAND_ORDER = {
  budget: 0,
  mid: 1,
  premium: 2,
} as const;

const FLIGHT_ORDER = {
  short: 0,
  medium: 1,
  long: 2,
} as const;

/**
 * 월 간의 원형 거리(12월-1월 포함)를 계산한다.
 * @param from 기준 월
 * @param to 비교 월
 * @returns 두 월 사이의 최소 거리
 */
function getMonthDistance(from: number, to: number): number {
  const rawDistance = Math.abs(from - to);

  return Math.min(rawDistance, 12 - rawDistance);
}

/**
 * 목적지가 추천 자격을 만족하는지 하드 필터를 적용한다.
 * @param destination 목적지 프로필
 * @param query 추천 질의
 * @returns 적격 여부와 탈락 사유
 */
function getEligibility(destination: DestinationProfile, query: RecommendationQuery) {
  if (query.excludedDestinationIds?.includes(destination.id)) {
    return { eligible: false, reason: "excluded-destination" } as const;
  }

  if (query.excludedCountryCodes?.includes(destination.countryCode)) {
    return { eligible: false, reason: "excluded-country" } as const;
  }

  if (query.flightTolerance === "short" && destination.flightBand === "long") {
    return { eligible: false, reason: "short-flight-cap" } as const;
  }

  if (query.tripLengthDays <= 4 && destination.flightBand === "long") {
    return { eligible: false, reason: "short-trip-long-haul" } as const;
  }

  if (query.budgetBand === "budget" && destination.budgetBand === "premium") {
    return { eligible: false, reason: "budget-mismatch" } as const;
  }

  const inBestMonth = destination.bestMonths.includes(query.travelMonth);
  const inShoulderWindow = destination.bestMonths.some(
    (month) => getMonthDistance(month, query.travelMonth) <= activeScoringVersion.shoulderWindowMonths,
  );

  if (!inBestMonth && !inShoulderWindow) {
    return { eligible: false, reason: "season-mismatch" } as const;
  }

  return { eligible: true, reason: null } as const;
}

/**
 * 예산 적합도를 계산한다.
 * @param destination 목적지 프로필
 * @param query 추천 질의
 * @returns 0-18 범위의 예산 점수
 */
function scoreBudgetFit(destination: DestinationProfile, query: RecommendationQuery): number {
  const distance = Math.abs(BAND_ORDER[destination.budgetBand] - BAND_ORDER[query.budgetBand]);

  if (distance === 0) {
    return activeScoringVersion.weights.budgetFit;
  }

  if (distance === 1) {
    return 11;
  }

  return 5;
}

/**
 * 여행 일정 대비 비행 부담 적합도를 계산한다.
 * @param destination 목적지 프로필
 * @param query 추천 질의
 * @returns 0-15 범위의 일정 적합 점수
 */
function scoreTripLengthFit(destination: DestinationProfile, query: RecommendationQuery): number {
  const preferredBand =
    query.tripLengthDays <= 4 ? "short" : query.tripLengthDays <= 7 ? "medium" : "long";
  const distance = Math.abs(FLIGHT_ORDER[destination.flightBand] - FLIGHT_ORDER[preferredBand]);

  if (distance === 0) {
    return activeScoringVersion.weights.tripLengthFit;
  }

  if (distance === 1) {
    return 9;
  }

  return 4;
}

/**
 * 계절 적합도를 계산한다.
 * @param destination 목적지 프로필
 * @param query 추천 질의
 * @returns 0-14 범위의 시즌 점수
 */
function scoreSeasonFit(destination: DestinationProfile, query: RecommendationQuery): number {
  if (destination.bestMonths.includes(query.travelMonth)) {
    return activeScoringVersion.weights.seasonFit;
  }

  return 7;
}

/**
 * 사용자의 비행 허용치와 목적지 비행 거리의 합을 계산한다.
 * @param destination 목적지 프로필
 * @param query 추천 질의
 * @returns 0-12 범위의 비행 허용 점수
 */
function scoreFlightToleranceFit(destination: DestinationProfile, query: RecommendationQuery): number {
  const distance = Math.abs(
    FLIGHT_ORDER[destination.flightBand] - FLIGHT_ORDER[query.flightTolerance],
  );

  if (distance === 0) {
    return activeScoringVersion.weights.flightToleranceFit;
  }

  if (distance === 1) {
    return 7;
  }

  return 0;
}

/**
 * 동행 구성과 목적지 분위기의 궁합을 계산한다.
 * @param destination 목적지 프로필
 * @param query 추천 질의
 * @returns 0-8 범위의 동행 점수
 */
function scorePartyFit(destination: DestinationProfile, query: RecommendationQuery): number {
  const partyAffinity: Record<RecommendationQuery["partyType"], string[]> = {
    solo: ["culture", "city", "nature"],
    couple: ["romance", "beach", "food", "culture"],
    friends: ["nightlife", "city", "shopping", "food"],
    family: ["family", "beach", "nature", "culture"],
  };
  const matches = partyAffinity[query.partyType].filter((vibe) => destination.vibeTags.includes(vibe as never)).length;

  if (matches >= 3) {
    return activeScoringVersion.weights.partyFit;
  }

  if (matches === 2) {
    return 6;
  }

  if (matches === 1) {
    return 3;
  }

  return 1;
}

/**
 * 여행 페이스와 목적지 특성의 궁합을 계산한다.
 * @param destination 목적지 프로필
 * @param query 추천 질의
 * @returns 0-5 범위의 페이스 점수
 */
function scorePaceFit(destination: DestinationProfile, query: RecommendationQuery): number {
  if (destination.paceTags.includes(query.pace)) {
    return activeScoringVersion.weights.paceFit;
  }

  if (query.pace === "balanced") {
    return 3;
  }

  return 1;
}

/**
 * 사용자가 원하는 분위기와 목적지 태그의 겹침을 계산한다.
 * @param destination 목적지 프로필
 * @param query 추천 질의
 * @returns 0-25 범위의 분위기 점수
 */
function scoreVibeMatch(destination: DestinationProfile, query: RecommendationQuery): number {
  const matches = query.vibes.filter((vibe) => destination.vibeTags.includes(vibe)).length;

  if (matches === query.vibes.length) {
    return activeScoringVersion.weights.vibeMatch;
  }

  if (matches === 1) {
    return Math.round(activeScoringVersion.weights.vibeMatch * 0.52);
  }

  return 0;
}

/**
 * 연결된 증거 블록에서 소스 신뢰 가산점을 계산한다.
 * @param evidence 목적지에 연결된 증거 목록
 * @returns 0-3 범위의 소스 신뢰 점수
 */
function scoreSourceConfidence(evidence: TrendEvidenceSnapshot[]): number {
  if (evidence.length === 0) {
    return 0;
  }

  const bestConfidence = Math.max(...evidence.map((item) => item.confidence));

  return Math.min(
    activeScoringVersion.weights.sourceConfidence,
    Math.round((bestConfidence / 100) * activeScoringVersion.weights.sourceConfidence),
  );
}

function buildVibeReason(vibes: RecommendationQuery["vibes"]): string {
  const [primary, secondary] = vibes;

  if (primary === "beach" && secondary === "culture") {
    return "쉬는 시간과 로컬 결을 한 번에 담기 좋습니다.";
  }

  if (primary === "beach") {
    return "쉬는 시간을 중심에 두고 하루를 느슨하게 쓰기 좋습니다.";
  }

  if (primary === "food") {
    return "하루 동선을 식사와 카페 중심으로 묶기 좋습니다.";
  }

  if (primary === "city") {
    return "도시 동선을 따라 보고 먹고 걷는 흐름이 자연스럽습니다.";
  }

  if (primary === "nature") {
    return "풍경을 오래 보고 바깥 시간을 크게 쓰기 좋습니다.";
  }

  if (primary === "romance") {
    return "둘만의 장면이 남는 저녁 동선을 만들기 좋습니다.";
  }

  if (primary === "culture") {
    return "전시, 골목, 오래된 공간을 천천히 이어 보기 좋습니다.";
  }

  if (primary === "shopping") {
    return "시장과 편집숍, 쇼핑 동선을 메인으로 짜기 좋습니다.";
  }

  return "이번 여행에서 먼저 챙기고 싶은 시간을 만들기 좋습니다.";
}

/**
 * 사용자에게 보여줄 핵심 이유 문장을 만든다.
 * @param destination 목적지 프로필
 * @param query 추천 질의
 * @param breakdown 세부 점수
 * @returns 사람이 읽기 쉬운 이유 목록
 */
function buildReasons(
  destination: DestinationProfile,
  query: RecommendationQuery,
  breakdown: ScoreBreakdown,
): string[] {
  const reasons: string[] = [];

  if (breakdown.vibeMatch >= 13) {
    reasons.push(buildVibeReason(query.vibes));
  }

  if (breakdown.seasonFit >= 10) {
    reasons.push(`${query.travelMonth}월 기준 여행 적기가 겹칩니다.`);
  }

  if (breakdown.flightToleranceFit >= 7) {
    reasons.push(`비행 부담이 ${query.flightTolerance} 선호에 무리 없는 편입니다.`);
  }

  if (breakdown.budgetFit >= 11) {
    reasons.push(`${query.budgetBand} 예산대에서 비교적 계획하기 좋습니다.`);
  }

  if (breakdown.partyFit >= 6) {
    reasons.push(`${query.partyType} 여행 분위기와 궁합이 좋습니다.`);
  }

  if (reasons.length === 0) {
    reasons.push(destination.summary);
  }

  return reasons.slice(0, 3);
}

/**
 * 하나의 목적지에 대한 설명 가능한 추천 결과를 만든다.
 * @param destination 목적지 프로필
 * @param query 추천 질의
 * @param evidence 목적지에 연결된 증거 목록
 * @returns 설명 가능한 추천 결과
 */
function buildRecommendationResult(
  destination: DestinationProfile,
  query: RecommendationQuery,
  evidence: TrendEvidenceSnapshot[],
  personalization?: RecommendationPersonalizationContext,
): RecommendationResult {
  const scoreBreakdown: ScoreBreakdown = {
    vibeMatch: scoreVibeMatch(destination, query),
    budgetFit: scoreBudgetFit(destination, query),
    tripLengthFit: scoreTripLengthFit(destination, query),
    seasonFit: scoreSeasonFit(destination, query),
    flightToleranceFit: scoreFlightToleranceFit(destination, query),
    partyFit: scorePartyFit(destination, query),
    paceFit: scorePaceFit(destination, query),
    sourceConfidence: scoreSourceConfidence(evidence),
    total: 0,
  };

  const baseTotal = Object.entries(scoreBreakdown)
    .filter(([key]) => key !== "total")
    .reduce((sum, [, value]) => sum + value, 0);

  const personalizationEffect = personalization
    ? buildPersonalizationEffect(destination, personalization, activeScoringVersion.tieBreakerCap)
    : { delta: 0, reason: null };

  scoreBreakdown.total = Math.max(0, Math.min(100, baseTotal + personalizationEffect.delta));

  const reasons = buildReasons(destination, query, scoreBreakdown);
  if (personalizationEffect.reason) {
    reasons.unshift(personalizationEffect.reason);
  }

  return {
    destinationId: destination.id,
    destinationKind: destination.kind,
    reasons,
    whyThisFits: destination.summary,
    watchOuts: destination.watchOuts,
    confidence: Math.min(98, Math.round(scoreBreakdown.total)),
    scoreBreakdown,
    trendEvidence: evidence,
  };
}

/**
 * 질의에 맞는 목적지 추천 결과를 계산한다.
 * @param query 추천 질의
 * @param destinations 후보 목적지 목록
 * @param evidenceByDestination 목적지별 증거 맵
 * @returns 점수순으로 정렬된 추천 결과 목록
 */
export function rankDestinations(
  query: RecommendationQuery,
  destinations: DestinationProfile[] = launchCatalog,
  evidenceByDestination: Map<string, TrendEvidenceSnapshot[]> = new Map(),
  personalization?: RecommendationPersonalizationContext,
): RecommendationResult[] {
  return destinations
    .filter((destination) => destination.active)
    .filter((destination) => getEligibility(destination, query).eligible)
    .map((destination) =>
      buildRecommendationResult(
        destination,
        query,
        evidenceByDestination.get(destination.id) ?? [],
        personalization,
      ),
    )
    .sort((left, right) => {
      if (right.scoreBreakdown.total !== left.scoreBreakdown.total) {
        return right.scoreBreakdown.total - left.scoreBreakdown.total;
      }

      return right.scoreBreakdown.sourceConfidence - left.scoreBreakdown.sourceConfidence;
    });
}
