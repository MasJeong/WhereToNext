import { launchCatalog } from "@/lib/catalog/launch-catalog";
import type {
  DestinationProfile,
  RecommendationQuery,
  RecommendationResult,
  TrendEvidenceSnapshot,
} from "@/lib/domain/contracts";
import { testIds } from "@/lib/test-ids";

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
  };
  sourceSummary: {
    mode: "live" | "fallback";
    evidenceCount: number;
    tiers: string[];
  };
};

export type RecommendationCardView = {
  destination: DestinationProfile;
  recommendation: RecommendationResult;
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
  vibes: ["romance"],
};

export const partyOptions: QueryOption<RecommendationQuery["partyType"]>[] = [
  {
    value: "couple",
    label: "커플",
    description: "둘만의 분위기와 속도를 맞춰 떠나는 여행이에요.",
    testId: testIds.query.partyTypeCouple,
  },
  {
    value: "friends",
    label: "친구",
    description: "맛집, 수다, 늦은 밤 동선까지 재미가 중요한 조합이에요.",
    testId: testIds.query.partyTypeFriends,
  },
  {
    value: "family",
    label: "가족",
    description: "이동 부담을 줄이고 모두가 편한 리듬을 우선해요.",
    testId: testIds.query.partyTypeFamily,
  },
  {
    value: "solo",
    label: "혼자",
    description: "내 취향대로 움직이되 동선이 복잡하지 않은 여행이에요.",
  },
];

export const budgetOptions: QueryOption<RecommendationQuery["budgetBand"]>[] = [
  {
    value: "budget",
    label: "가성비 중심",
    description: "총여행비를 아끼면서도 만족도는 챙기고 싶어요.",
    testId: testIds.query.budgetBudget,
  },
  {
    value: "mid",
    label: "균형 예산",
    description: "숙소와 동선의 편안함을 챙기되 과하게 쓰진 않아요.",
    testId: testIds.query.budgetMid,
  },
  {
    value: "premium",
    label: "제대로 누리기",
    description: "분위기와 편의를 위해 예산을 넉넉하게 쓰는 편이에요.",
    testId: testIds.query.budgetPremium,
  },
];

export const tripLengthOptions: QueryOption<RecommendationQuery["tripLengthDays"]>[] = [
  {
    value: 3,
    label: "3일",
    description: "짧지만 확실하게 쉬고 오는 일정이에요.",
    testId: testIds.query.tripLength3,
  },
  {
    value: 5,
    label: "5일",
    description: "연차 부담과 만족감의 균형이 좋은 길이예요.",
    testId: testIds.query.tripLength5,
  },
  {
    value: 8,
    label: "8일",
    description: "장거리나 여러 동선을 여유 있게 담기 좋은 일정이에요.",
    testId: testIds.query.tripLength8,
  },
];

export const travelMonthOptions: QueryOption<RecommendationQuery["travelMonth"]>[] = [
  {
    value: 7,
    label: "7월",
    description: "여름 휴가철 분위기와 활기가 살아나는 시기예요.",
    testId: testIds.query.travelMonth7,
  },
  {
    value: 10,
    label: "10월",
    description: "날씨와 이동감이 안정적인 대표 성수기예요.",
    testId: testIds.query.travelMonth10,
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
    label: "로맨틱",
    description: "야경, 산책, 분위기 좋은 식사가 중요한 여행이에요.",
    testId: testIds.query.vibeRomance,
  },
  {
    value: "food",
    label: "미식",
    description: "현지 식당, 디저트, 야식 동선이 여행의 중심이에요.",
    testId: testIds.query.vibeFood,
  },
  {
    value: "nature",
    label: "자연",
    description: "탁 트인 풍경과 바깥 시간을 충분히 느끼고 싶어요.",
    testId: testIds.query.vibeNature,
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
    testId: testIds.query.departureAirportICN,
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
    testId: testIds.query.paceBalanced,
  },
  { value: "packed", label: "꽉 차게", description: "하루를 촘촘하게 쓰는 일정이 좋아요." },
];

export const flightToleranceOptions: QueryOption<RecommendationQuery["flightTolerance"]>[] = [
  {
    value: "short",
    label: "단거리 위주",
    description: "비행 피로를 최대한 줄이고 싶어요.",
    testId: testIds.query.flightToleranceShort,
  },
  {
    value: "medium",
    label: "중거리까지",
    description: "선택지는 넓히되 장거리는 아직 부담돼요.",
    testId: testIds.query.flightToleranceMedium,
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
  return params;
}

/**
 * Turns recommendation results into view models with destination profiles.
 * @param recommendations Ranked recommendation results
 * @returns Result card view models
 */
export function createRecommendationCards(
  recommendations: RecommendationResult[],
): RecommendationCardView[] {
  return recommendations.flatMap((recommendation) => {
    const destination = destinationIndex.get(recommendation.destinationId);

    if (!destination) {
      return [];
    }

    return [{ destination, recommendation }];
  });
}

/**
 * Builds a concise narrative for the active query state.
 * @param query Typed recommendation query
 * @returns Human-readable query summary
 */
export function buildQueryNarrative(query: RecommendationQuery): string {
  return `${formatDepartureAirport(query.departureAirport)}에서 ${formatTravelMonth(query.travelMonth)}에 떠나는 ${query.tripLengthDays}일 ${formatPartyType(query.partyType)} 일정이에요. 예산은 ${formatBudgetBand(query.budgetBand)}, 분위기는 ${formatVibeList(query.vibes)} 중심으로 맞췄어요.`;
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
 * Formats a vibe list.
 * @param vibes Destination or query vibes
 * @returns Joined vibe label string
 */
export function formatVibeList(vibes: string[]): string {
  return vibes
    .map((vibe) => {
      if (vibe === "romance") {
        return "로맨틱";
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

      return vibe;
    })
    .join(" + ");
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

  return "아카이브 반응";
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
