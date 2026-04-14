import type { RecommendationQuery } from "@/lib/domain/contracts";
import {
  defaultRecommendationQuery,
  departureAirportOptions,
  getPartySizeForType,
  partyOptions,
  primaryVibeOptions,
  travelMonthOptions,
} from "@/lib/trip-compass/presentation";

type HomeStepOptionValue = string | number | null;

export type HomeStepOption<TValue extends HomeStepOptionValue> = {
  value: TValue;
  label: string;
  description: string;
  testId?: string;
};

export const homeStepTripRhythmValues = [
  "quick-reset",
  "steady-highlights",
  "slow-reset",
  "far-and-full",
] as const;

export type HomeStepTripRhythm = (typeof homeStepTripRhythmValues)[number];

export type HomeStepAnswers = {
  whoWith: RecommendationQuery["partyType"];
  travelWindow: RecommendationQuery["travelMonth"];
  tripRhythm: HomeStepTripRhythm;
  mainVibe: RecommendationQuery["vibes"][number];
  departureChoice: RecommendationQuery["departureAirport"];
};

type HomeStepAnswerDefaults = HomeStepAnswers & {
  budgetFeel: RecommendationQuery["budgetBand"];
};

type TripRhythmQueryPatch = Pick<
  RecommendationQuery,
  "tripLengthDays" | "pace" | "flightTolerance"
>;

const tripRhythmQueryPatchMap: Record<HomeStepTripRhythm, TripRhythmQueryPatch> = {
  "quick-reset": {
    tripLengthDays: 3,
    pace: "balanced",
    flightTolerance: "short",
  },
  "steady-highlights": {
    tripLengthDays: 5,
    pace: "balanced",
    flightTolerance: "medium",
  },
  "slow-reset": {
    tripLengthDays: 5,
    pace: "slow",
    flightTolerance: "medium",
  },
  "far-and-full": {
    tripLengthDays: 8,
    pace: "packed",
    flightTolerance: "long",
  },
};

const defaultHomeStepTripRhythm = homeStepTripRhythmValues.find((value) => {
  const patch = tripRhythmQueryPatchMap[value];

  return (
    patch.tripLengthDays === defaultRecommendationQuery.tripLengthDays &&
    patch.pace === defaultRecommendationQuery.pace &&
    patch.flightTolerance === defaultRecommendationQuery.flightTolerance
  );
});

const defaultQuestionFlowAnswers: HomeStepAnswers = {
  whoWith: defaultRecommendationQuery.partyType,
  travelWindow: defaultRecommendationQuery.travelMonth,
  tripRhythm: defaultHomeStepTripRhythm ?? "steady-highlights",
  mainVibe: defaultRecommendationQuery.vibes[0],
  departureChoice: defaultRecommendationQuery.departureAirport,
};

export const defaultHomeStepAnswers: HomeStepAnswerDefaults = {
  ...defaultQuestionFlowAnswers,
  budgetFeel: defaultRecommendationQuery.budgetBand,
};

export const homeStepCompanionOptions: HomeStepOption<HomeStepAnswers["whoWith"]>[] = partyOptions;

export const homeStepTravelWindowOptions: HomeStepOption<HomeStepAnswers["travelWindow"]>[] =
  travelMonthOptions;

export const homeStepMainVibeOptions: HomeStepOption<HomeStepAnswers["mainVibe"]>[] =
  primaryVibeOptions;

export const homeStepDepartureOptions: HomeStepOption<HomeStepAnswers["departureChoice"]>[] =
  departureAirportOptions;

export const homeStepTripRhythmOptions: HomeStepOption<HomeStepTripRhythm>[] = [
  {
    value: "quick-reset",
    label: "짧고 가볍게",
    description: "연차를 길게 쓰지 않고 가까운 곳부터 가볍게 다녀와요.",
  },
  {
    value: "steady-highlights",
    label: "핵심만 균형 있게",
    description: "대표 일정은 챙기되 무리하지 않는 기본 리듬이에요.",
  },
  {
    value: "slow-reset",
    label: "쉬는 시간 넉넉하게",
    description: "이동 부담을 줄이고 쉬는 시간까지 여유 있게 챙겨요.",
  },
  {
    value: "far-and-full",
    label: "멀어도 제대로",
    description: "비행이 길어도 괜찮고 여러 장면을 진하게 담고 싶어요.",
  },
];

export function deriveRecommendationQueryFromHomeStepAnswers(
  answers: Partial<HomeStepAnswers> = {},
): RecommendationQuery {
  const mergedAnswers: HomeStepAnswers = {
    ...defaultQuestionFlowAnswers,
    ...answers,
  };
  const tripRhythmQueryPatch = tripRhythmQueryPatchMap[mergedAnswers.tripRhythm];

  return {
    partyType: mergedAnswers.whoWith,
    partySize: getPartySizeForType(mergedAnswers.whoWith),
    budgetBand: defaultRecommendationQuery.budgetBand,
    tripLengthDays: tripRhythmQueryPatch.tripLengthDays,
    departureAirport: mergedAnswers.departureChoice,
    travelMonth: mergedAnswers.travelWindow,
    pace: tripRhythmQueryPatch.pace,
    flightTolerance: tripRhythmQueryPatch.flightTolerance,
    vibes: buildHomeStepVibes(mergedAnswers.mainVibe),
  };
}

function buildHomeStepVibes(
  mainVibe: HomeStepAnswers["mainVibe"],
): RecommendationQuery["vibes"] {
  return [mainVibe];
}
