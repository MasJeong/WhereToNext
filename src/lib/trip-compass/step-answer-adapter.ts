import type { RecommendationQuery } from "@/lib/domain/contracts";
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

export type HomeStepAnswers = {
  whoWith: RecommendationQuery["partyType"];
  travelWindow: HomeStepTravelWindow;
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
  travelWindow: "q4",
  tripLength: defaultRecommendationQuery.tripLengthDays,
  travelStyle: [],
  flightPreference: defaultRecommendationQuery.flightTolerance,
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
    label: "가만히 있으면 아까워",
    description: "직접 해봐야 여행이지, 눈으로만 보는 건 좀 아쉬워요.",
  },
  {
    value: "sns-hotplace",
    label: "일단 찍고 봐야 직성이 풀려",
    description: "피드에 올릴 사진 하나쯤은 건져야 여행 보람이 차요.",
  },
  {
    value: "nature",
    label: "눈이 쉬어야 나도 쉬지",
    description: "탁 트인 데서 멍 때리는 시간, 그게 진짜 충전이에요.",
  },
  {
    value: "must-see",
    label: "안 가면 후회할 것 같아",
    description: "여기까지 왔는데 그건 가봐야지, 하는 곳은 꼭 들르는 편이에요.",
  },
  {
    value: "healing",
    label: "아무것도 안 해도 되는 날",
    description: "알람 없이 일어나서 느긋하게, 그게 제일 럭셔리해요.",
  },
  {
    value: "culture-history",
    label: "그 도시의 이야기가 궁금해",
    description: "전시, 박물관, 유적지 같은 데서 그 도시가 좀 다르게 보여요.",
  },
  {
    value: "local-atmosphere",
    label: "골목 한 바퀴가 더 좋아",
    description: "관광지보다 동네 골목에서 찐 현지 감성 느끼는 게 더 좋아요.",
  },
  {
    value: "shopping",
    label: "수하물 1개 더할걸",
    description: "시장, 편집숍, 쇼핑몰 돌다 보면 가방이 항상 모자라요.",
  },
  {
    value: "foodie",
    label: "이번엔 먹는 게 메인",
    description: "맛집 리스트 다 돌고 나면 관광은 솔직히 부록이에요.",
  },
];

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
    flightTolerance: mergedAnswers.flightPreference,
    vibes: deriveVibesFromTravelStyles(travelStyles),
  };
}
