import { launchCatalog } from "@/lib/catalog/launch-catalog";
import type { RecommendationQuery } from "@/lib/domain/contracts";
import { getCountryMetadata } from "@/lib/travel-support/country-metadata";
import {
  defaultRecommendationQuery,
  flightToleranceOptions,
  getPartySizeForType,
  partyOptions,
  tripLengthOptions,
} from "@/lib/trip-compass/presentation";

type HomeStepOptionValue = string | number | null;

export type HomeStepOption<TValue extends HomeStepOptionValue> = {
  value: TValue;
  label: string;
  description: string;
  testId?: string;
};

export const homeStepTravelStyleValues = [
  "activity",
  "sns-hotplace",
  "nature",
  "must-see",
  "healing",
  "culture-history",
  "local-atmosphere",
  "shopping",
  "foodie",
] as const;

export type HomeStepTravelStyle = (typeof homeStepTravelStyleValues)[number];

export const homeStepTravelWindowValues = ["soon", "q1", "q2", "q3", "q4"] as const;

export type HomeStepTravelWindow = (typeof homeStepTravelWindowValues)[number];
export const homeStepFlightPreferenceValues = ["short", "medium", "long", "anywhere"] as const;
export type HomeStepFlightPreference = (typeof homeStepFlightPreferenceValues)[number];

export type HomeStepAnswers = {
  whoWith: RecommendationQuery["partyType"];
  travelWindow: HomeStepTravelWindow;
  tripLength: RecommendationQuery["tripLengthDays"];
  travelStyle: HomeStepTravelStyle[];
  flightPreference: HomeStepFlightPreference;
  excludedCountryCodes: string[];
};

type HomeStepAnswerDefaults = HomeStepAnswers & {
  budgetFeel: RecommendationQuery["budgetBand"];
};

const travelStyleToVibeMap: Record<HomeStepTravelStyle, RecommendationQuery["vibes"][number]> = {
  activity: "nature",
  "sns-hotplace": "city",
  nature: "nature",
  "must-see": "culture",
  healing: "beach",
  "culture-history": "culture",
  "local-atmosphere": "city",
  shopping: "shopping",
  foodie: "food",
};

const slowTravelStyles = new Set<HomeStepTravelStyle>(["nature", "healing"]);
const packedTravelStyles = new Set<HomeStepTravelStyle>([
  "activity",
  "sns-hotplace",
  "must-see",
  "shopping",
]);

function derivePaceFromTravelStyles(styles: HomeStepTravelStyle[]): RecommendationQuery["pace"] {
  if (styles.some((style) => packedTravelStyles.has(style))) {
    return "packed";
  }

  if (styles.length > 0 && styles.every((style) => slowTravelStyles.has(style))) {
    return "slow";
  }

  return "balanced";
}

function deriveVibesFromTravelStyles(styles: HomeStepTravelStyle[]): RecommendationQuery["vibes"] {
  const uniqueVibes = styles
    .map((style) => travelStyleToVibeMap[style])
    .filter((vibe, index, source) => source.indexOf(vibe) === index)
    .slice(0, 3);

  return uniqueVibes.length > 0 ? uniqueVibes : [defaultRecommendationQuery.vibes[0]];
}

const defaultQuestionFlowAnswers: HomeStepAnswers = {
  whoWith: defaultRecommendationQuery.partyType,
  travelWindow: "q4",
  tripLength: defaultRecommendationQuery.tripLengthDays,
  travelStyle: [],
  flightPreference: defaultRecommendationQuery.flightTolerance,
  excludedCountryCodes: defaultRecommendationQuery.excludedCountryCodes ?? [],
};

const fallbackTravelStyles: HomeStepTravelStyle[] = ["foodie"];

function resolveRelativeTravelMonth(): RecommendationQuery["travelMonth"] {
  const currentMonth = new Date().getMonth() + 1;
  return Math.min(Math.max(currentMonth, 1), 12) as RecommendationQuery["travelMonth"];
}

const travelWindowToRepresentativeMonthMap: Record<Exclude<HomeStepTravelWindow, "soon">, RecommendationQuery["travelMonth"]> = {
  q1: 1,
  q2: 4,
  q3: 7,
  q4: 10,
};

export const defaultHomeStepAnswers: HomeStepAnswerDefaults = {
  ...defaultQuestionFlowAnswers,
  budgetFeel: defaultRecommendationQuery.budgetBand,
};

export const homeStepCompanionOptions: HomeStepOption<HomeStepAnswers["whoWith"]>[] = partyOptions;

export const homeStepTravelWindowOptions: HomeStepOption<HomeStepAnswers["travelWindow"]>[] = [
  {
    value: "soon",
    label: "곧 떠나고 싶어요",
    description: "1~2개월 안에 가볍게 다녀오고 싶어요.",
  },
  {
    value: "q1",
    label: "1~3월",
    description: "연초 일정 안에서 시기를 맞춰 보고 있어요.",
  },
  {
    value: "q2",
    label: "4~6월",
    description: "상반기 안에서 여행 시기를 고르고 싶어요.",
  },
  {
    value: "q3",
    label: "7~9월",
    description: "여름 휴가철 전후로 일정을 생각하고 있어요.",
  },
  {
    value: "q4",
    label: "10~12월",
    description: "하반기나 연말 안에서 시기를 보고 있어요.",
  },
];

export function formatHomeStepTravelWindowLabel(window: HomeStepTravelWindow): string {
  return homeStepTravelWindowOptions.find((option) => option.value === window)?.label ?? "언제든";
}

export const homeStepTripLengthOptions: HomeStepOption<HomeStepAnswers["tripLength"]>[] =
  tripLengthOptions;

export const homeStepFlightPreferenceOptions: HomeStepOption<HomeStepAnswers["flightPreference"]>[] =
  [
    ...flightToleranceOptions.map((option) => ({
      ...option,
      label:
        option.value === "short"
          ? "가까운 곳 위주"
          : option.value === "medium"
            ? "중거리까지 괜찮아요"
            : "장거리도 괜찮아요",
      description:
        option.value === "short"
          ? "비행 피로가 적고 바로 움직일 수 있는 곳부터 볼게요."
          : option.value === "medium"
            ? "선택지는 넓히되 너무 긴 비행은 피하고 싶어요."
            : "비행 시간이 길어도 여행 만족도가 높다면 괜찮아요.",
    })),
    {
      value: "anywhere",
      label: "어디든 괜찮아요",
      description: "이동 거리는 크게 신경 쓰지 않고 맞는 여행지부터 보고 싶어요.",
    },
  ];

export const homeStepTravelStyleOptions: HomeStepOption<HomeStepTravelStyle>[] = [
  {
    value: "activity",
    label: "체험 없는 여행은 좀 심심해",
    description: "타고, 뛰고, 만들어봐야 여행 온 보람이 있어요.",
  },
  {
    value: "sns-hotplace",
    label: "사진 한 장은 건져야지",
    description: "좋은 배경 보면 일단 카메라부터 켜요.",
  },
  {
    value: "nature",
    label: "바다 앞에 앉아만 있어도 좋아",
    description: "탁 트인 데서 멍 때리면 그게 충전이에요.",
  },
  {
    value: "must-see",
    label: "랜드마크는 직접 봐야 해",
    description: "그 도시 대표 스팟은 빠지면 아쉬워요.",
  },
  {
    value: "healing",
    label: "아무것도 안 해도 되는 날",
    description: "알람 없이 일어나서 느긋하게, 그게 제일 럭셔리해요.",
  },
  {
    value: "culture-history",
    label: "그 도시의 이야기가 궁금해",
    description: "전시, 박물관, 유적지 들르면 그 도시가 다르게 보여요.",
  },
  {
    value: "local-atmosphere",
    label: "동네 산책이 제일 재밌어",
    description: "골목, 시장, 거리에서 현지 분위기 느끼는 게 좋아요.",
  },
  {
    value: "shopping",
    label: "수하물 1개 더할걸",
    description: "시장, 편집숍, 쇼핑몰 돌다 보면 캐리어 터져요.",
  },
  {
    value: "foodie",
    label: "이번엔 먹는 게 메인",
    description: "여행 계획의 반은 맛집 검색이에요.",
  },
];

const homeStepExcludedCountryCodes = Array.from(
  new Set(
    launchCatalog
      .filter((destination) => destination.active)
      .map((destination) => destination.countryCode),
  ),
).sort((left, right) => {
  const leftLabel = getCountryMetadata(left)?.countryNameKo ?? left;
  const rightLabel = getCountryMetadata(right)?.countryNameKo ?? right;
  return leftLabel.localeCompare(rightLabel, "ko");
});

export const homeStepExcludedCountryOptions: HomeStepOption<string>[] = homeStepExcludedCountryCodes.map(
  (countryCode) => {
    const metadata = getCountryMetadata(countryCode);
    const countryNameKo = metadata?.countryNameKo ?? countryCode;

    return {
      value: countryCode,
      label: countryNameKo,
      description: `${countryNameKo} 목적지는 이번 추천에서 빼고 볼게요.`,
    };
  },
);

function normalizeHomeCountrySearchValue(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function matchesExcludedCountrySearch(countryCode: string, normalizedQuery: string): boolean {
  const metadata = getCountryMetadata(countryCode);
  const searchTargets = [
    normalizeHomeCountrySearchValue(countryCode),
    normalizeHomeCountrySearchValue(metadata?.countryNameKo ?? ""),
    normalizeHomeCountrySearchValue(metadata?.countryName ?? ""),
  ];

  if (normalizedQuery.length === 1) {
    return searchTargets.some((value) => value.startsWith(normalizedQuery));
  }

  return searchTargets.some((value) => value.includes(normalizedQuery));
}

function rankExcludedCountrySearch(countryCode: string, normalizedQuery: string): number {
  const metadata = getCountryMetadata(countryCode);
  const searchTargets = [
    normalizeHomeCountrySearchValue(countryCode),
    normalizeHomeCountrySearchValue(metadata?.countryNameKo ?? ""),
    normalizeHomeCountrySearchValue(metadata?.countryName ?? ""),
  ];

  if (searchTargets.some((value) => value === normalizedQuery)) {
    return 0;
  }

  if (searchTargets.some((value) => value.startsWith(normalizedQuery))) {
    return 1;
  }

  return 2;
}

/**
 * 국가 배제 단계에서 검색어와 일치하는 국가 옵션만 반환한다.
 * @param searchQuery 사용자 입력 검색어
 * @returns 검색 결과에 맞는 국가 옵션 목록
 */
export function filterHomeExcludedCountryOptions(searchQuery: string): HomeStepOption<string>[] {
  const normalizedQuery = normalizeHomeCountrySearchValue(searchQuery);

  if (!normalizedQuery) {
    return homeStepExcludedCountryOptions;
  }

  return homeStepExcludedCountryOptions
    .filter((option) => matchesExcludedCountrySearch(option.value, normalizedQuery))
    .sort((left, right) => {
      const leftRank = rankExcludedCountrySearch(left.value, normalizedQuery);
      const rightRank = rankExcludedCountrySearch(right.value, normalizedQuery);

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.label.localeCompare(right.label, "ko");
    });
}

export function resolveTravelMonthFromHomeWindow(window: HomeStepTravelWindow): RecommendationQuery["travelMonth"] {
  if (window === "soon") {
    return resolveRelativeTravelMonth();
  }

  return travelWindowToRepresentativeMonthMap[window];
}

export function deriveRecommendationQueryFromHomeStepAnswers(
  answers: Partial<HomeStepAnswers> = {},
): RecommendationQuery {
  const mergedAnswers: HomeStepAnswers = {
    ...defaultQuestionFlowAnswers,
    ...answers,
  };
  const travelStyles = mergedAnswers.travelStyle.length > 0
    ? mergedAnswers.travelStyle.slice(0, 3)
    : fallbackTravelStyles;

  return {
    partyType: mergedAnswers.whoWith,
    partySize: getPartySizeForType(mergedAnswers.whoWith),
    budgetBand: defaultRecommendationQuery.budgetBand,
    tripLengthDays: mergedAnswers.tripLength,
    departureAirport: defaultRecommendationQuery.departureAirport,
    travelMonth: resolveTravelMonthFromHomeWindow(mergedAnswers.travelWindow),
    pace: derivePaceFromTravelStyles(travelStyles),
    flightTolerance: mergedAnswers.flightPreference === "anywhere" ? "long" : mergedAnswers.flightPreference,
    vibes: deriveVibesFromTravelStyles(travelStyles),
    excludedCountryCodes: mergedAnswers.excludedCountryCodes.slice(0, 3),
    excludedDestinationIds: defaultRecommendationQuery.excludedDestinationIds ?? [],
  };
}
