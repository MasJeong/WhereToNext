import { launchCatalog } from "@/lib/catalog/launch-catalog";
import type {
  DestinationProfile,
  DestinationTravelSupplement,
  RecommendationQuery,
  RecommendationResult,
  TrendEvidenceSnapshot,
} from "@/lib/domain/contracts";
import { getCountryMetadata } from "@/lib/travel-support/country-metadata";

type QueryOptionValue = string | number;

export type QueryOption<TValue extends QueryOptionValue> = {
  value: TValue;
  label: string;
  description: string;
  testId?: string;
};

export type RecommendationApiResponse = {
  query: RecommendationQuery;
  recommendations: RecommendationResult[];
  meta: {
    scoringVersion: string;
    resultCount: number;
    personalized: boolean;
  };
  sourceSummary: {
    mode: "live" | "fallback";
    evidenceCount: number;
    tiers: string[];
  };
  leadSupplement?: DestinationTravelSupplement | null;
};

export type RecommendationCardView = {
  destination: DestinationProfile;
  recommendation: RecommendationResult;
};

export type RecommendationVerdictView = {
  label: string;
  headline: string;
  support: string;
};

export type WorkspaceBriefItemView = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

export type RecommendationWorkspaceFactView = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

export type RecommendationEvidenceLeadView = {
  label: string;
  detail: string;
  sourceLabel: string;
  sourceUrl: string | null;
};

export type RecommendationDayFlowStepView = {
  id: "day-1" | "day-2" | "day-3";
  label: "Day 1" | "Day 2" | "Day 3";
  title: string;
  detail: string;
};

export type RecommendationSceneView = {
  eyebrow: string;
  headline: string;
  atmosphere: string;
  supportingLabel: string;
};

export type RecommendationDecisionFactView = {
  id: "best-months" | "budget" | "flight";
  label: string;
  value: string;
  detail: string;
};

const destinationIndex = new Map(launchCatalog.map((destination) => [destination.id, destination]));

const monthLabels = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
] as const;

export const defaultRecommendationQuery: RecommendationQuery = {
  partyType: "couple",
  partySize: 2,
  budgetBand: "mid",
  tripLengthDays: 5,
  departureAirport: "ICN",
  travelMonth: 10,
  pace: "balanced",
  flightTolerance: "medium",
  vibes: ["food"],
  excludedCountryCodes: [],
  excludedDestinationIds: [],
};

export const partyOptions: QueryOption<RecommendationQuery["partyType"]>[] = [
  {
    value: "couple",
    label: "커플",
    description: "둘만의 분위기와 속도를 맞춰 떠나는 여행이에요.",
  },
  {
    value: "friends",
    label: "친구",
    description: "맛집, 수다, 늦은 밤 동선까지 재미가 중요한 조합이에요.",
  },
  {
    value: "family",
    label: "가족",
    description: "이동 부담을 줄이고 모두가 편한 리듬을 우선해요.",
  },
  {
    value: "solo",
    label: "혼자",
    description: "내 리듬대로 움직이되 동선이 복잡하지 않은 여행이에요.",
  },
];

export const budgetOptions: QueryOption<RecommendationQuery["budgetBand"]>[] = [
  {
    value: "budget",
    label: "가성비 중심",
    description: "총여행비를 아끼면서도 만족도는 챙기고 싶어요.",
  },
  {
    value: "mid",
    label: "균형 예산",
    description: "숙소와 동선의 편안함을 챙기되 과하게 쓰진 않아요.",
  },
  {
    value: "premium",
    label: "제대로 누리기",
    description: "분위기와 편의를 위해 예산을 넉넉하게 쓰는 편이에요.",
  },
];

export const tripLengthOptions: QueryOption<RecommendationQuery["tripLengthDays"]>[] = [
  {
    value: 3,
    label: "2~3일",
    description: "주말이나 짧은 연차로 가볍게 다녀오기 좋은 일정이에요.",
  },
  {
    value: 5,
    label: "4~6일",
    description: "가장 일반적인 짧은 해외 휴가에 잘 맞는 기간이에요.",
  },
  {
    value: 8,
    label: "7~10일",
    description: "장거리나 여러 동선을 비교적 여유 있게 담기 좋은 일정이에요.",
  },
  {
    value: 15,
    label: "11일 이상",
    description: "장기 휴가나 한달살기처럼 충분한 시간을 쓰는 여행에 가까워요.",
  },
];

export function formatTripLengthBand(tripLengthDays: RecommendationQuery["tripLengthDays"]): string {
  if (tripLengthDays <= 3) {
    return "2~3일";
  }

  if (tripLengthDays <= 6) {
    return "4~6일";
  }

  if (tripLengthDays <= 10) {
    return "7~10일";
  }

  return "11일 이상";
}

export const travelMonthOptions: QueryOption<RecommendationQuery["travelMonth"]>[] = [
  {
    value: 1,
    label: "1월",
    description: "새해 무드와 겨울 시즌 분위기를 기대하기 좋은 시기예요.",
  },
  {
    value: 2,
    label: "2월",
    description: "짧은 겨울 여행이나 설 연휴 주변 일정을 떠올리기 쉬운 시기예요.",
  },
  {
    value: 3,
    label: "3월",
    description: "초봄 공기와 가벼운 일정 감각을 떠올리기 좋은 시기예요.",
  },
  {
    value: 4,
    label: "4월",
    description: "봄꽃과 산책 중심 여행을 생각하기 좋은 대표 봄 시즌이에요.",
  },
  {
    value: 5,
    label: "5월",
    description: "야외 일정이 많아지는 황금연휴 감각의 대표 시즌이에요.",
  },
  {
    value: 6,
    label: "6월",
    description: "초여름 분위기에서 한적하게 다녀오고 싶을 때 떠올리기 쉬워요.",
  },
  {
    value: 7,
    label: "7월",
    description: "여름 휴가철 분위기와 활기가 살아나는 시기예요.",
  },
  {
    value: 8,
    label: "8월",
    description: "성수기 한가운데에서 확실한 휴가 일정을 잡기 쉬운 달이에요.",
  },
  {
    value: 9,
    label: "9월",
    description: "늦여름에서 초가을로 넘어가며 이동하기 편해지는 시기예요.",
  },
  {
    value: 10,
    label: "10월",
    description: "날씨와 이동감이 안정적인 대표 성수기예요.",
  },
  {
    value: 11,
    label: "11월",
    description: "붐비는 시기를 조금 피해 차분하게 다녀오기 좋은 달이에요.",
  },
  {
    value: 12,
    label: "12월",
    description: "연말 무드와 겨울 풍경을 기대하기 좋은 시즌이에요.",
  },
];

export const primaryVibeOptions: QueryOption<RecommendationQuery["vibes"][number]>[] = [
  {
    value: "romance",
    label: "분위기",
    description: "야경, 산책, 분위기 좋은 식사가 중요한 여행이에요.",
  },
  {
    value: "food",
    label: "미식",
    description: "현지 식당, 디저트, 야식 동선이 여행의 중심이에요.",
  },
  {
    value: "nature",
    label: "자연",
    description: "탁 트인 풍경과 바깥 시간을 충분히 느끼고 싶어요.",
  },
  {
    value: "city",
    label: "도시",
    description: "전시, 쇼핑, 골목 산책처럼 밀도 있는 일정을 원해요.",
  },
  {
    value: "beach",
    label: "휴양",
    description: "바다 앞에서 쉬는 시간과 리조트 무드가 중요해요.",
  },
];

export const optionalVibeOptions: QueryOption<RecommendationQuery["vibes"][number]>[] = [
  { value: "food", label: "미식", description: "맛집 동선을 한 겹 더 얹어요." },
  { value: "culture", label: "문화", description: "전시, 유적, 오래된 거리의 결을 더해요." },
  { value: "shopping", label: "쇼핑", description: "시장과 편집숍, 쇼핑 동선을 챙겨요." },
  { value: "nature", label: "자연", description: "공원, 해안, 바깥 시간을 더해요." },
  { value: "beach", label: "휴양", description: "바다 전망과 느린 리듬을 보강해요." },
];

export const departureAirportOptions: QueryOption<RecommendationQuery["departureAirport"]>[] = [
  {
    value: "ICN",
    label: "인천 ICN",
    description: "노선 선택지가 가장 넓은 편이에요.",
  },
  { value: "GMP", label: "김포 GMP", description: "서울 접근성이 좋은 출발지예요." },
  { value: "PUS", label: "부산 PUS", description: "남부권 출발에 편한 선택지예요." },
  { value: "CJU", label: "제주 CJU", description: "제주 출발 일정에 맞춰 볼 수 있어요." },
];

export const paceOptions: QueryOption<RecommendationQuery["pace"]>[] = [
  { value: "slow", label: "여유롭게", description: "이동 사이사이에 쉬는 시간이 필요해요." },
  {
    value: "balanced",
    label: "균형 있게",
    description: "핵심 일정과 여유 시간이 함께 있는 흐름이에요.",
  },
  { value: "packed", label: "꽉 차게", description: "하루를 촘촘하게 쓰는 일정이 좋아요." },
];

export const flightToleranceOptions: QueryOption<RecommendationQuery["flightTolerance"]>[] = [
  {
    value: "short",
    label: "단거리 위주",
    description: "비행 피로를 최대한 줄이고 싶어요.",
  },
  {
    value: "medium",
    label: "중거리까지",
    description: "선택지는 넓히되 장거리는 아직 부담돼요.",
  },
  { value: "long", label: "장거리도 가능", description: "비행시간이 길어도 목적지가 좋으면 괜찮아요." },
];

/**
 * Returns the implied party size for the selected party type.
 * @param partyType Party type value
 * @returns Default party size used in the typed query
 */
export function getPartySizeForType(partyType: RecommendationQuery["partyType"]): number {
  if (partyType === "solo") {
    return 1;
  }

  if (partyType === "couple") {
    return 2;
  }

  return 4;
}

/**
 * Builds the recommendation API query string.
 * @param query Typed recommendation query
 * @returns URL search params for the API route
 */
export function buildRecommendationSearchParams(query: RecommendationQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.set("partyType", query.partyType);
  params.set("partySize", String(query.partySize));
  params.set("budgetBand", query.budgetBand);
  params.set("tripLengthDays", String(query.tripLengthDays));
  params.set("departureAirport", query.departureAirport);
  params.set("travelMonth", String(query.travelMonth));
  params.set("pace", query.pace);
  params.set("flightTolerance", query.flightTolerance);
  params.set("vibes", query.vibes.join(","));
  if (query.excludedCountryCodes && query.excludedCountryCodes.length > 0) {
    params.set("excludedCountryCodes", query.excludedCountryCodes.join(","));
  }
  if (query.excludedDestinationIds && query.excludedDestinationIds.length > 0) {
    params.set("excludedDestinationIds", query.excludedDestinationIds.join(","));
  }
  return params;
}

function formatExcludedCountryList(countryCodes: string[] | undefined): string {
  if (!countryCodes || countryCodes.length === 0) {
    return "";
  }

  return countryCodes
    .map((countryCode) => getCountryMetadata(countryCode)?.countryNameKo ?? countryCode)
    .join(", ");
}

/**
 * Turns recommendation results into view models with destination profiles.
 * @param recommendations Ranked recommendation results
 * @returns Result card view models
 */
export function createRecommendationCards(
  recommendations: RecommendationResult[],
): RecommendationCardView[] {
  const seen = new Set<string>();

  return recommendations.flatMap((recommendation) => {
    if (seen.has(recommendation.destinationId)) {
      return [];
    }

    seen.add(recommendation.destinationId);

    const destination = destinationIndex.get(recommendation.destinationId);

    if (!destination) {
      return [];
    }

    return [{ destination, recommendation }];
  });
}

/**
 * 결과 카드와 상세 헤더에서 읽기 쉬운 목적지 + 국가 표기를 만든다.
 * @param destination 목적지 프로필
 * @returns 예: "도쿄 · 일본"
 */
export function formatDestinationWithCountry(destination: DestinationProfile): string {
  const countryNameKo = getCountryMetadata(destination.countryCode)?.countryNameKo;

  if (!countryNameKo || countryNameKo === destination.nameKo) {
    return destination.nameKo;
  }

  return `${destination.nameKo} · ${countryNameKo}`;
}

/**
 * 추천 점수를 카드에서 바로 읽기 쉬운 적합도 문구로 바꾼다.
 * @param score 실제 획득 점수
 * @param maxScore 해당 항목의 최대 점수
 * @returns 한국어 적합도 문구
 */
export function formatFitStrengthLabel(score: number, maxScore: number): string {
  const ratio = maxScore === 0 ? 0 : score / maxScore;

  if (ratio >= 0.85) {
    return "강하게 맞아요";
  }

  if (ratio >= 0.6) {
    return "대체로 잘 맞아요";
  }

  return "한 번 더 체크해 보세요";
}

/**
 * 추천 카드의 첫 판단에 쓰는 한 줄 verdict를 만든다.
 * @param card 추천 카드 뷰 모델
 * @param query 추천을 만든 현재 질의
 * @returns 카드 상단에 노출할 판단 문구 세트
 */
export function buildRecommendationVerdict(
  card: RecommendationCardView,
  query?: RecommendationQuery,
): RecommendationVerdictView {
  const strengthAreas = [
    {
      label: "여행 분위기",
      ratio: card.recommendation.scoreBreakdown.vibeMatch / 25,
    },
    {
      label: "예산 감각",
      ratio: card.recommendation.scoreBreakdown.budgetFit / 18,
    },
    {
      label: "일정 소화",
      ratio: card.recommendation.scoreBreakdown.tripLengthFit / 15,
    },
    {
      label: "시즌 흐름",
      ratio: card.recommendation.scoreBreakdown.seasonFit / 14,
    },
    {
      label: "비행 부담",
      ratio: card.recommendation.scoreBreakdown.flightToleranceFit / 12,
    },
    {
      label: "동행 궁합",
      ratio: card.recommendation.scoreBreakdown.partyFit / 8,
    },
    {
      label: "일정 리듬",
      ratio: card.recommendation.scoreBreakdown.paceFit / 5,
    },
  ]
    .sort((left, right) => right.ratio - left.ratio)
    .slice(0, 2)
    .map((item) => item.label);

  const context = query
    ? `${formatTravelMonth(query.travelMonth)} ${formatTripLengthBand(query.tripLengthDays)} 일정 기준`
    : `${formatMonthList(card.destination.bestMonths)} 여행 기준`;
  const support = `${context} ${strengthAreas.join(" · ")} 쪽이 특히 안정적이에요.`;

  if (card.recommendation.confidence >= 88) {
    return {
      label: "지금 가장 안정적",
      headline: "가장 먼저 저장 후보로 남겨둘 만해요.",
      support,
    };
  }

  if (card.recommendation.confidence >= 74) {
    return {
      label: "우선 검토",
      headline: "짧게 좁힐 때 우선순위에 두기 좋아요.",
      support,
    };
  }

  return {
    label: "체크 후 검토",
    headline: "장점은 분명하지만 체크할 점까지 보고 남길지 결정해 보세요.",
    support,
  };
}

/**
 * 현재 query를 워크스페이스용 trip brief 카드 묶음으로 정리한다.
 * @param query 활성 추천 질의
 * @returns 홈/복원 화면에서 재사용할 brief 항목 목록
 */
export function buildStructuredTripBrief(
  query: RecommendationQuery,
): WorkspaceBriefItemView[] {
  return [
    {
      id: "travel-window",
      label: "출발 시기",
      value: `${formatTravelMonth(query.travelMonth)} · ${formatTripLengthBand(query.tripLengthDays)}`,
      detail: `${formatPartyType(query.partyType)} 일정 기준으로 현실적인 여행 길이를 먼저 맞추고 있어요.`,
    },
    {
      id: "budget-pace",
      label: "예산·밀도",
      value: `${formatBudgetBand(query.budgetBand)} · ${formatPaceLabel(query.pace)}`,
      detail: "예산 감각과 일정 밀도가 shortlist를 가장 빠르게 좁히는 축이에요.",
    },
    {
      id: "flight-window",
      label: "비행 범위",
      value: formatFlightTolerance(query.flightTolerance),
      detail: "비행 부담을 얼마나 허용하는지가 후보 풀의 넓이를 바꿔요.",
    },
    {
      id: "vibes",
      label: "여행 스타일",
      value: formatResultVibeList(query.vibes),
      detail: query.vibes[1]
        ? "핵심 여행 스타일과 보조 성향을 함께 맞춰 설명 가능한 후보만 남겨요."
        : "실제 여행 스타일 하나를 먼저 잡고, 저장 후 비교 단계에서 더 좁혀요.",
    },
  ];
}

/**
 * 추천 카드에서 바로 읽을 shortlist 신뢰 신호를 구성한다.
 * @param card 추천 카드 뷰 모델
 * @param query 현재 추천 질의
 * @returns 카드 상단 판단용 신뢰 신호 목록
 */
export function buildRecommendationTrustSignals(
  card: RecommendationCardView,
  query?: RecommendationQuery,
): RecommendationWorkspaceFactView[] {
  const primaryEvidence = card.recommendation.trendEvidence[0];
  const scoreBreakdown = card.recommendation.scoreBreakdown;

  return [
    {
      id: "season-fit",
      label: "시즌",
      value: formatFitStrengthLabel(scoreBreakdown.seasonFit, 14),
      detail: query
        ? `${formatTravelMonth(query.travelMonth)} 기준 · ${scoreBreakdown.seasonFit}/14점`
        : `${scoreBreakdown.seasonFit}/14점`,
    },
    {
      id: "flight-fit",
      label: "비행",
      value: formatFitStrengthLabel(scoreBreakdown.flightToleranceFit, 12),
      detail: query
        ? `${formatDepartureAirport(query.departureAirport)} 출발 · ${formatFlightTolerance(query.flightTolerance)}`
        : formatFlightBand(card.destination.flightBand),
    },
    {
      id: "evidence-trust",
      label: "참고 정보",
      value: primaryEvidence ? describeSourceBadge(primaryEvidence) : "참고 정보 준비 중",
      detail: primaryEvidence
        ? `${primaryEvidence.sourceLabel} · ${formatFreshnessState(primaryEvidence.freshnessState)}`
        : "아직 대표 참고 정보가 많지 않아 핵심 정보와 체크할 점을 먼저 보세요.",
    },
  ];
}

export function buildRecommendationEvidenceLead(
  card: RecommendationCardView,
): RecommendationEvidenceLeadView {
  const primaryEvidence = card.recommendation.trendEvidence[0];

  if (!primaryEvidence) {
    return {
      label: "메모 준비 중",
      detail: "아직 대표 메모가 충분하지 않아 핵심 정보와 체크할 점을 먼저 보여줘요.",
      sourceLabel: "추가 참고 정리 중",
      sourceUrl: null,
    };
  }

  return {
    label: describeSourceBadge(primaryEvidence),
    detail: primaryEvidence.summary,
    sourceLabel: primaryEvidence.sourceLabel,
    sourceUrl: primaryEvidence.sourceUrl,
  };
}

/**
 * 추천 카드를 3일 기준의 compact day-flow 블록으로 변환한다.
 * @param card 추천 카드 뷰 모델
 * @param query 현재 추천 질의
 * @returns Day 1/2/3 순서의 카드용 day-flow 뷰
 */
export function buildRecommendationDayFlow(
  card: RecommendationCardView,
  query?: RecommendationQuery,
): RecommendationDayFlowStepView[] {
  const leadVibe = query?.vibes[0] ?? card.destination.vibeTags[0] ?? "city";
  const leadPace = query?.pace ?? card.destination.paceTags[0] ?? "balanced";
  const leadReason = card.recommendation.reasons[0] ?? card.recommendation.whyThisFits;
  const secondReason = card.recommendation.reasons[1] ?? card.destination.summary;
  const watchOut =
    card.recommendation.watchOuts[0] ??
    card.destination.watchOuts[0] ??
    "상세 정보에서 체크할 점을 먼저 확인해 보세요.";
  const arrivalLine = query
    ? `${formatDepartureAirport(query.departureAirport)} · ${formatFlightTolerance(query.flightTolerance)} 기준으로 시작이 가벼워요.`
    : `${formatFlightBand(card.destination.flightBand)} 비행 거리라 첫날 부담이 적어요.`;

  let dayTwoTitle = "핵심 동선을 균형 있게 묶기";
  let dayTwoDetail = "대표 스폿과 식사 흐름을 반반 섞기 좋아요.";

  if (leadPace === "slow") {
    dayTwoTitle = "한 구역에 오래 머무르기";
    dayTwoDetail = "카페와 산책 포인트를 길게 잇는 편이 잘 맞아요.";
  }

  if (leadPace === "packed") {
    dayTwoTitle = "낮과 밤 포인트를 촘촘히 담기";
    dayTwoDetail = "짧은 시간에 밀도 있게 채우는 흐름이 자연스러워요.";
  }

  const dayThreeTitle =
    query && query.tripLengthDays > 3 ? "남은 일정까지 무드 유지하기" : "저장 전 마지막 체크하기";
  const dayThreeDetail =
    query && query.tripLengthDays > 3
      ? `${watchOut} 괜찮다면 남은 일정도 ${formatVibeLabel(leadVibe)} 흐름으로 이어 가기 좋아요.`
      : `${watchOut} 괜찮다면 저장하거나 상세로 넘겨 보세요.`;

  return [
    {
      id: "day-1",
      label: "Day 1",
      title: `${formatVibeLabel(leadVibe)} 첫인상부터 맞춰 보기`,
      detail: `${arrivalLine} ${leadReason}`,
    },
    {
      id: "day-2",
      label: "Day 2",
      title: dayTwoTitle,
      detail: `${secondReason} ${dayTwoDetail}`,
    },
    {
      id: "day-3",
      label: "Day 3",
      title: dayThreeTitle,
      detail: dayThreeDetail,
    },
  ];
}

/**
 * 추천 카드를 감성적인 한 줄 장면과 결정용 보조 문구로 정리한다.
 * @param card 추천 카드 뷰 모델
 * @param query 현재 추천 질의
 * @returns 카드 상단 비주얼 카피 세트
 */
export function buildRecommendationSceneCopy(
  card: RecommendationCardView,
  query?: RecommendationQuery,
): RecommendationSceneView {
  const leadVibe = query?.vibes[0] ?? card.destination.vibeTags[0] ?? "city";
  const leadMonth = query?.travelMonth ?? card.destination.bestMonths[0] ?? 10;
  const supportingLabel = query
    ? `${formatPartyType(query.partyType)} · ${formatPaceLabel(query.pace)}`
    : `${formatMonthList(card.destination.bestMonths)} 추천`;

  if (leadVibe === "romance") {
    return {
      eyebrow: "감정이 먼저 오는 목적지",
      headline: `${card.destination.nameKo}에서 둘만의 장면을 천천히 만들기 좋아요.`,
      atmosphere: `${formatTravelMonth(leadMonth)} 기준, ${formatFlightBand(card.destination.flightBand)} 비행으로 ${formatBudgetBand(card.destination.budgetBand)} 감각을 맞추기 쉬워요.`,
      supportingLabel,
    };
  }

  if (leadVibe === "food") {
    return {
      eyebrow: "동선보다 식사가 기억에 남는 쪽",
      headline: `${card.destination.nameKo}는 하루를 미식 동선으로 채우기 좋은 목적지예요.`,
      atmosphere: `${formatTravelMonth(leadMonth)}에 가면 먹고 쉬는 리듬이 자연스럽고, ${formatBudgetBand(card.destination.budgetBand)} 예산 감각으로도 계획하기 좋아요.`,
      supportingLabel,
    };
  }

  if (leadVibe === "nature" || leadVibe === "beach") {
    return {
      eyebrow: "쉬는 시간이 바로 그려지는 목적지",
      headline: `${card.destination.nameKo}는 바깥 풍경과 느린 시간으로 설득되는 후보예요.`,
      atmosphere: `${formatTravelMonth(leadMonth)} 기준으로는 ${formatFlightBand(card.destination.flightBand)} 비행 이후에도 무드 전환이 빠른 편이에요.`,
      supportingLabel,
    };
  }

  return {
    eyebrow: "바로 움직이고 싶은 도시 리듬",
    headline: `${card.destination.nameKo}는 골목, 쇼핑, 야간 동선을 촘촘하게 즐기기 좋아요.`,
    atmosphere: `${formatTravelMonth(leadMonth)}에 맞춰 보면 ${formatBudgetBand(card.destination.budgetBand)} 예산과 ${formatFlightBand(card.destination.flightBand)} 비행 부담의 균형이 좋아요.`,
    supportingLabel,
  };
}

/**
 * 카드와 상세 첫 fold에서 바로 읽는 결정용 핵심 팩트를 만든다.
 * @param destination 목적지 프로필
 * @returns 추천 시기, 예산 감각, 비행 거리 팩트
 */
export function buildRecommendationDecisionFacts(
  destination: DestinationProfile,
): RecommendationDecisionFactView[] {
  return [
    {
      id: "best-months",
      label: "추천 시기",
      value: formatMonthList(destination.bestMonths),
      detail: "날씨와 현지 흐름이 가장 안정적인 시즌이에요.",
    },
    {
      id: "budget",
      label: "예산 감각",
      value: formatBudgetBand(destination.budgetBand),
      detail: "숙소와 이동 체감이 이 예산대에서 가장 자연스러워요.",
    },
    {
      id: "flight",
      label: "비행 거리",
      value: formatFlightBand(destination.flightBand),
      detail: "출발 피로와 첫날 리듬을 가늠할 때 먼저 보는 축이에요.",
    },
  ];
}

/**
 * 카드 하나를 실제 일정 판단용 fact 블록으로 바꾼다.
 * @param card 추천 카드 뷰 모델
 * @returns 여행 설계에 바로 쓸 fact 목록
 */
export function buildRecommendationPlanningFacts(
  card: RecommendationCardView,
): RecommendationWorkspaceFactView[] {
  return [
    {
      id: "best-months",
      label: "추천 시기",
      value: formatMonthList(card.destination.bestMonths),
      detail: "저장 후 다시 볼 때도 같은 시즌 감각을 유지하는 기준이에요.",
    },
    {
      id: "budget-band",
      label: "예산 감각",
      value: formatBudgetBand(card.destination.budgetBand),
      detail: "숙소와 이동 체감이 이 예산대에 가장 자연스럽게 맞아요.",
    },
    {
      id: "pace-tags",
      label: "일정 리듬",
      value: formatPaceList(card.destination.paceTags),
      detail: card.destination.summary,
    },
    {
      id: "flight-band",
      label: "비행 거리",
      value: formatFlightBand(card.destination.flightBand),
      detail: "출발 피로와 첫날 컨디션을 감안해 비교 보드에서 다시 보는 축이에요.",
    },
  ];
}

/**
 * 총점 기준으로 shortlist 우선순위 배지를 만든다.
 * @param totalScore 카드 총점
 * @returns 카드 상단 우선순위 문구
 */
export function buildRecommendationPriorityBadge(totalScore: number): string {
  if (totalScore >= 80) {
    return "가장 먼저 볼 후보";
  }

  if (totalScore >= 70) {
    return "우선 비교할 후보";
  }

  return "체크 후 남길 후보";
}

/**
 * Builds a concise narrative for the active query state.
 * @param query Typed recommendation query
 * @returns Human-readable query summary
 */
export function buildQueryNarrative(query: RecommendationQuery): string {
  const exclusionSentence = query.excludedCountryCodes && query.excludedCountryCodes.length > 0
    ? ` ${formatExcludedCountryList(query.excludedCountryCodes)}은 이번 추천에서 뺐어요.`
    : "";

  return `${formatTravelMonth(query.travelMonth)}에 떠나는 ${formatTripLengthBand(query.tripLengthDays)} ${formatPartyType(query.partyType)} 일정이에요. 예산은 ${formatBudgetBand(query.budgetBand)}, 이동 부담은 ${formatFlightTolerance(query.flightTolerance)} 기준으로 맞췄고 여행 스타일은 ${formatResultVibeList(query.vibes)} 쪽에 가깝게 잡았어요.${exclusionSentence}`;
}

/**
 * Formats destination kind for display.
 * @param kind Destination kind
 * @returns Human-readable kind label
 */
export function formatDestinationKind(kind: DestinationProfile["kind"]): string {
  if (kind === "country") {
    return "국가";
  }

  if (kind === "region") {
    return "지역";
  }

  return "도시";
}

/**
 * Formats a budget band label.
 * @param budgetBand Budget band value
 * @returns Display label
 */
export function formatBudgetBand(budgetBand: DestinationProfile["budgetBand"]): string {
  if (budgetBand === "budget") {
    return "가성비 중심";
  }

  if (budgetBand === "mid") {
    return "균형 예산";
  }

  return "프리미엄";
}

/**
 * Formats a flight band label.
 * @param flightBand Flight band value
 * @returns Display label
 */
export function formatFlightBand(flightBand: DestinationProfile["flightBand"]): string {
  if (flightBand === "short") {
    return "단거리";
  }

  if (flightBand === "medium") {
    return "중거리";
  }

  return "장거리";
}

/**
 * Formats a flight tolerance label.
 * @param flightTolerance Flight tolerance value
 * @returns Display label
 */
export function formatFlightTolerance(
  flightTolerance: RecommendationQuery["flightTolerance"],
): string {
  if (flightTolerance === "short") {
    return "단거리 위주";
  }

  if (flightTolerance === "medium") {
    return "중거리까지";
  }

  return "장거리도 가능";
}

/**
 * Formats a party type label.
 * @param partyType Party type value
 * @returns Display label
 */
export function formatPartyType(partyType: RecommendationQuery["partyType"]): string {
  if (partyType === "couple") {
    return "커플 여행";
  }

  if (partyType === "friends") {
    return "친구 여행";
  }

  if (partyType === "family") {
    return "가족 여행";
  }

  return "혼자 여행";
}

/**
 * Formats a travel month label.
 * @param month Travel month value
 * @returns Short month label
 */
export function formatTravelMonth(month: number): string {
  return monthLabels[month - 1] ?? `${month}월`;
}

/**
 * Formats a list of best travel months.
 * @param months Destination best months
 * @returns Joined month label string
 */
export function formatMonthList(months: number[]): string {
  return months.map((month) => formatTravelMonth(month)).join(" / ");
}

/**
 * Formats a single vibe label.
 * @param vibe Destination or query vibe
 * @returns Localized vibe label
 */
export function formatVibeLabel(vibe: string): string {
  if (vibe === "romance") {
    return "분위기";
  }

  if (vibe === "food") {
    return "미식";
  }

  if (vibe === "nature") {
    return "자연";
  }

  if (vibe === "city") {
    return "도시";
  }

  if (vibe === "beach") {
    return "휴양";
  }

  if (vibe === "culture") {
    return "문화";
  }

  if (vibe === "shopping") {
    return "쇼핑";
  }

  if (vibe === "nightlife") {
    return "야간 활기";
  }

  if (vibe === "family") {
    return "가족형";
  }

  if (vibe === "luxury") {
    return "럭셔리";
  }

  if (vibe === "desert") {
    return "사막 풍경";
  }

  return vibe;
}

/**
 * 결과 페이지에서 쓰는 vibe 라벨을 더 구매/행동 친화적인 표현으로 변환한다.
 * @param vibe Destination or query vibe
 * @returns Result-page friendly vibe label
 */
export function formatResultVibeLabel(vibe: string): string {
  if (vibe === "nature") {
    return "아웃도어";
  }

  return formatVibeLabel(vibe);
}

/**
 * 일정 밀도 값을 한국어 라벨로 변환한다.
 * @param pace 일정 밀도 값
 * @returns 한국어 라벨
 */
export function formatPaceLabel(pace: RecommendationQuery["pace"]): string {
  if (pace === "slow") {
    return "여유롭게";
  }

  if (pace === "balanced") {
    return "균형 있게";
  }

  return "꽉 차게";
}

/**
 * 일정 밀도 목록을 카드/비교 보드용 문자열로 합친다.
 * @param paces 목적지의 pace 태그 목록
 * @returns joined pace label string
 */
export function formatPaceList(paces: RecommendationQuery["pace"][]): string {
  return paces.map((pace) => formatPaceLabel(pace)).join(" / ");
}

/**
 * Formats a vibe list.
 * @param vibes Destination or query vibes
 * @returns Joined vibe label string
 */
export function formatVibeList(vibes: string[]): string {
  return vibes.map((vibe) => formatVibeLabel(vibe)).join(" + ");
}

/**
 * 결과 페이지용 vibe 목록을 합친다.
 * @param vibes Destination or query vibes
 * @returns Joined result-page vibe label string
 */
export function formatResultVibeList(vibes: string[]): string {
  return vibes.map((vibe) => formatResultVibeLabel(vibe)).join(" + ");
}

/**
 * Formats the evidence freshness state.
 * @param freshnessState Evidence freshness state
 * @returns Display label
 */
export function formatFreshnessState(
  freshnessState: TrendEvidenceSnapshot["freshnessState"],
): string {
  if (freshnessState === "fresh") {
    return "최근 반응";
  }

  if (freshnessState === "aging") {
    return "조금 지난 반응";
  }

  return "꾸준한 반응";
}

/**
 * 출발 공항 코드를 한국어 기준 라벨로 변환한다.
 * @param departureAirport 출발 공항 코드
 * @returns 한국어 공항 라벨
 */
export function formatDepartureAirport(
  departureAirport: RecommendationQuery["departureAirport"],
): string {
  if (departureAirport === "ICN") {
    return "인천(ICN)";
  }

  if (departureAirport === "GMP") {
    return "김포(GMP)";
  }

  if (departureAirport === "PUS") {
    return "부산(PUS)";
  }

  return "제주(CJU)";
}

/**
 * 근거 수집 모드를 한국어 라벨로 변환한다.
 * @param mode 추천 응답의 근거 모드
 * @returns 한국어 모드 라벨
 */
export function formatEvidenceMode(mode: RecommendationApiResponse["sourceSummary"]["mode"]): string {
  if (mode === "live") {
    return "실시간";
  }

  return "대체";
}

/**
 * Maps evidence metadata to a visible Korean source badge.
 * @param evidence Evidence snapshot
 * @returns Source badge label
 */
export function describeSourceBadge(evidence: TrendEvidenceSnapshot): string {
  if (evidence.sourceType === "partner_account") {
    return "공식 계정";
  }

  if (evidence.sourceType === "hashtag_capsule") {
    return "해시태그 기준";
  }

  if (evidence.tier === "fallback") {
    return "대체 소스";
  }

  return "큐레이션";
}

/**
 * Returns a stable share path for a snapshot kind.
 * @param snapshotId Stored snapshot id
 * @param kind Snapshot kind
 * @returns Relative application path
 */
export function buildSnapshotPath(
  snapshotId: string,
  kind: "recommendation" | "comparison",
): string {
  return kind === "recommendation" ? `/s/${snapshotId}` : `/compare/${snapshotId}`;
}

/**
 * 목적지 상세 페이지 경로를 현재 추천 문맥과 함께 만든다.
 * @param destination 상세를 열 목적지
 * @param query 현재 추천 질의
 * @param snapshotId 저장된 추천 스냅샷 ID
 * @returns 상세 페이지 상대 경로
 */
export function buildDestinationDetailPath(
  destination: Pick<DestinationProfile, "slug">,
  query?: RecommendationQuery,
  snapshotId?: string,
): string {
  const searchParams = query ? buildRecommendationSearchParams(query) : new URLSearchParams();

  if (snapshotId) {
    searchParams.set("snapshotId", snapshotId);
  }

  const queryString = searchParams.toString();
  const pathname = `/destinations/${destination.slug}`;

  return queryString ? `${pathname}?${queryString}` : pathname;
}
