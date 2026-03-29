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
    label: "체험·액티비티",
    description: "몸을 움직이거나 직접 해보는 일정이 여행의 기억으로 남는 편이에요.",
  },
  {
    value: "sns-hotplace",
    label: "SNS 핫플레이스",
    description: "사진으로 남기고 싶은 공간과 요즘 많이 가는 스폿을 먼저 보고 싶어요.",
  },
  {
    value: "nature",
    label: "자연과 함께",
    description: "풍경이 좋고 바깥 공기를 오래 느낄 수 있는 곳이 더 끌려요.",
  },
  {
    value: "must-see",
    label: "유명 관광지는 필수",
    description: "처음 가는 곳이라면 대표 명소는 놓치고 싶지 않아요.",
  },
  {
    value: "healing",
    label: "여유롭게 힐링",
    description: "빡빡한 동선보다 쉬는 시간이 분명한 여행이 더 좋아요.",
  },
  {
    value: "culture-history",
    label: "문화·예술·역사",
    description: "전시, 유적, 공연처럼 그 지역의 결이 느껴지는 곳이 좋아요.",
  },
  {
    value: "local-atmosphere",
    label: "여행지 느낌 물씬",
    description: "그 도시만의 골목, 시장, 거리 분위기를 느낄 수 있어야 해요.",
  },
  {
    value: "shopping",
    label: "쇼핑은 열정적으로",
    description: "시장, 편집숍, 쇼핑 동선이 여행 만족도에 큰 영향을 줘요.",
  },
  {
    value: "foodie",
    label: "관광보다 먹방",
    description: "유명 관광지보다 맛집과 카페, 현지 음식이 더 중요해요.",
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
