import type { RecommendationQuery } from "@/lib/domain/contracts";
import {
  defaultRecommendationQuery,
  flightToleranceOptions,
  getPartySizeForType,
  partyOptions,
  tripLengthOptions,
  travelMonthOptions,
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

export type HomeStepAnswers = {
  whoWith: RecommendationQuery["partyType"];
  travelWindow: RecommendationQuery["travelMonth"];
  tripLength: RecommendationQuery["tripLengthDays"];
  travelStyle: HomeStepTravelStyle[];
  flightPreference: RecommendationQuery["flightTolerance"];
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
  travelWindow: defaultRecommendationQuery.travelMonth,
  tripLength: defaultRecommendationQuery.tripLengthDays,
  travelStyle: [],
  flightPreference: defaultRecommendationQuery.flightTolerance,
};

const fallbackTravelStyles: HomeStepTravelStyle[] = ["foodie"];

export const defaultHomeStepAnswers: HomeStepAnswerDefaults = {
  ...defaultQuestionFlowAnswers,
  budgetFeel: defaultRecommendationQuery.budgetBand,
};

export const homeStepCompanionOptions: HomeStepOption<HomeStepAnswers["whoWith"]>[] = partyOptions;

export const homeStepTravelWindowOptions: HomeStepOption<HomeStepAnswers["travelWindow"]>[] =
  travelMonthOptions;

export const homeStepTripLengthOptions: HomeStepOption<HomeStepAnswers["tripLength"]>[] =
  tripLengthOptions;

export const homeStepFlightPreferenceOptions: HomeStepOption<HomeStepAnswers["flightPreference"]>[] =
  flightToleranceOptions.map((option) => ({
    ...option,
    label:
      option.value === "short"
        ? "가까운 곳 위주"
        : option.value === "medium"
          ? "중거리까지 괜찮아요"
          : "멀어도 괜찮아요",
    description:
      option.value === "short"
        ? "비행 피로가 적고 바로 움직일 수 있는 곳부터 볼게요."
        : option.value === "medium"
          ? "선택지는 넓히되 너무 긴 비행은 피하고 싶어요."
          : "비행 시간이 길어도 여행 만족도가 높다면 괜찮아요.",
  }));

export const homeStepTravelStyleOptions: HomeStepOption<HomeStepTravelStyle>[] = [
  {
    value: "activity",
    label: "가만히 있긴 아쉬워",
    description: "몸을 움직이거나 현지에서만 할 수 있는 체험이 있어야 여행 온 느낌이 살아요.",
  },
  {
    value: "sns-hotplace",
    label: "사진부터 남기고 싶어",
    description: "사진 남기기 좋고 요즘 많이 가는 곳은 한 번쯤 찍고 가야 덜 아쉬워요.",
  },
  {
    value: "nature",
    label: "풍경 좋은 데로",
    description: "바다, 산, 공원처럼 풍경 좋고 공기 좋은 곳이면 오래 머물고 싶어요.",
  },
  {
    value: "must-see",
    label: "유명한 곳은 찍고 와야지",
    description: "처음 가는 곳이라면 많이 가는 명소는 놓치지 않고 보고 오는 편이에요.",
  },
  {
    value: "healing",
    label: "쉬는 게 제일 중요해",
    description: "빡빡하게 돌기보다 여유 있게 쉬는 시간이 분명한 여행이 더 좋아요.",
  },
  {
    value: "culture-history",
    label: "전시나 유적은 보고 싶어",
    description: "전시, 박물관, 유적처럼 그 지역의 이야기와 결이 느껴지는 일정이 좋아요.",
  },
  {
    value: "local-atmosphere",
    label: "그 동네 느낌이 좋아",
    description: "유명 명소보다 골목, 시장, 거리에서 현지 분위기를 느끼고 싶어요.",
  },
  {
    value: "shopping",
    label: "수하물 1개 더할걸",
    description: "시장, 편집숍, 쇼핑몰처럼 사는 재미가 있는 동선이면 만족도가 확 올라가요.",
  },
  {
    value: "foodie",
    label: "이번엔 먹는 게 메인",
    description: "관광보다 현지 음식, 맛집, 카페 찾아다니는 시간이 더 중요해요.",
  },
];

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
    travelMonth: mergedAnswers.travelWindow,
    pace: derivePaceFromTravelStyles(travelStyles),
    flightTolerance: mergedAnswers.flightPreference,
    vibes: deriveVibesFromTravelStyles(travelStyles),
  };
}
