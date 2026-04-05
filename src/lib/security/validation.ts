import { z } from "zod";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import {
  comparisonSnapshotSchema,
  destinationAffiliateClickInputSchema,
  recommendationQuerySchema,
  recommendationSnapshotSchema,
  snapshotStatusSchema,
  snapshotVisibilitySchema,
  socialVideoRequestSchema,
  userDestinationHistoryInputSchema,
  userFutureTripInputSchema,
  userPreferenceProfileUpdateSchema,
} from "@/lib/domain/contracts";

const destinationIdSet = new Set(launchCatalog.map((destination) => destination.id));

export const createRecommendationSnapshotBodySchema = z.object({
  kind: z.literal("recommendation"),
  visibility: snapshotVisibilitySchema.optional(),
  payload: recommendationSnapshotSchema,
});

export const createComparisonSnapshotBodySchema = z.object({
  kind: z.literal("comparison"),
  visibility: snapshotVisibilitySchema.optional(),
  payload: comparisonSnapshotSchema,
});

export const createSnapshotBodySchema = z.discriminatedUnion("kind", [
  createRecommendationSnapshotBodySchema,
  createComparisonSnapshotBodySchema,
]);

export const updateRecommendationSnapshotBodySchema = z.object({
  status: snapshotStatusSchema,
});

export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
export type CreateSnapshotBody = z.infer<typeof createSnapshotBodySchema>;
export type DestinationAffiliateClickInput = z.infer<typeof destinationAffiliateClickInputSchema>;
export type UserDestinationHistoryInput = z.infer<typeof userDestinationHistoryInputSchema>;
export type UserFutureTripInput = z.infer<typeof userFutureTripInputSchema>;
export type UserPreferenceProfileUpdate = z.infer<typeof userPreferenceProfileUpdateSchema>;
export type SocialVideoRequest = z.infer<typeof socialVideoRequestSchema>;
export type SocialVideoQuery = z.infer<typeof socialVideoRequestSchema>;
export type UpdateRecommendationSnapshotBody = z.infer<typeof updateRecommendationSnapshotBodySchema>;

const defaultSocialVideoQuery: RecommendationQuery = {
  partyType: "couple",
  partySize: 2,
  budgetBand: "mid",
  tripLengthDays: 5,
  departureAirport: "ICN",
  travelMonth: 10,
  pace: "balanced",
  flightTolerance: "medium",
  vibes: ["romance"],
  excludedCountryCodes: [],
};

/**
 * 추천 API 쿼리 문자열을 스키마로 검증한다.
 * @param params URL 검색 파라미터
 * @returns 검증된 추천 질의
 */
export function parseRecommendationQuery(params: URLSearchParams): RecommendationQuery {
  const vibes = params
    .get("vibes")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const excludedCountryCodes = params
    .get("excludedCountryCodes")
    ?.split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  return recommendationQuerySchema.parse({
    partyType: params.get("partyType"),
    partySize: Number(params.get("partySize")),
    budgetBand: params.get("budgetBand"),
    tripLengthDays: Number(params.get("tripLengthDays")),
    departureAirport: params.get("departureAirport"),
    travelMonth: Number(params.get("travelMonth")),
    pace: params.get("pace"),
    flightTolerance: params.get("flightTolerance"),
    vibes,
    excludedCountryCodes,
  });
}

/**
 * 스냅샷 생성 요청 바디를 검증한다.
 * @param body 요청 바디 원문
 * @returns 검증된 스냅샷 생성 입력
 */
export function parseCreateSnapshotBody(body: unknown): CreateSnapshotBody {
  return createSnapshotBodySchema.parse(body);
}

/**
 * 저장한 추천 상태 변경 요청 바디를 검증한다.
 * @param body 요청 바디 원문
 * @returns 검증된 상태 변경 입력
 */
export function parseUpdateRecommendationSnapshotBody(body: unknown): UpdateRecommendationSnapshotBody {
  return updateRecommendationSnapshotBodySchema.parse(body);
}

/**
 * 소셜 비디오 API 쿼리 문자열을 스키마로 검증한다.
 * @param params URL 검색 파라미터
 * @returns 검증된 소셜 비디오 질의
 */
export function parseSocialVideoQuery(params: URLSearchParams): SocialVideoRequest {
  const destinationId = params.get("destinationId")?.trim() ?? "";
  const leadText = params.get("leadText")?.trim();
  const leadEvidenceLabel = params.get("leadEvidenceLabel")?.trim();
  const leadEvidenceDetail = params.get("leadEvidenceDetail")?.trim();
  const leadEvidenceSourceLabel = params.get("leadEvidenceSourceLabel")?.trim();
  const leadEvidenceSourceUrl = params.get("leadEvidenceSourceUrl")?.trim();
  const vibes = params
    .get("vibes")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const excludedCountryCodes = params
    .get("excludedCountryCodes")
    ?.split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  return socialVideoRequestSchema
    .refine((value) => destinationIdSet.has(value.destinationId), {
      message: "UNKNOWN_DESTINATION",
      path: ["destinationId"],
    })
    .parse({
      destinationId,
      query: recommendationQuerySchema.parse({
        partyType: (params.get("partyType") ?? defaultSocialVideoQuery.partyType) as RecommendationQuery["partyType"],
        partySize: Number(params.get("partySize") ?? defaultSocialVideoQuery.partySize),
        budgetBand: (params.get("budgetBand") ?? defaultSocialVideoQuery.budgetBand) as RecommendationQuery["budgetBand"],
        tripLengthDays: Number(params.get("tripLengthDays") ?? defaultSocialVideoQuery.tripLengthDays),
        departureAirport: (params.get("departureAirport") ?? defaultSocialVideoQuery.departureAirport) as RecommendationQuery["departureAirport"],
        travelMonth: Number(params.get("travelMonth") ?? defaultSocialVideoQuery.travelMonth),
        pace: (params.get("pace") ?? defaultSocialVideoQuery.pace) as RecommendationQuery["pace"],
        flightTolerance: (params.get("flightTolerance") ?? defaultSocialVideoQuery.flightTolerance) as RecommendationQuery["flightTolerance"],
        vibes:
          vibes && vibes.length > 0
            ? vibes
            : defaultSocialVideoQuery.vibes,
        excludedCountryCodes:
          excludedCountryCodes && excludedCountryCodes.length > 0
            ? excludedCountryCodes
            : defaultSocialVideoQuery.excludedCountryCodes,
      }),
      leadEvidence:
        leadEvidenceLabel && leadEvidenceDetail && leadEvidenceSourceLabel
          ? {
              label: leadEvidenceLabel,
              detail: leadEvidenceDetail,
              sourceLabel: leadEvidenceSourceLabel,
              sourceUrl: leadEvidenceSourceUrl || null,
            }
          : leadText
            ? {
                label: leadText,
                detail: leadText,
                sourceLabel: "추천 메모",
                sourceUrl: null,
              }
          : undefined,
    });
}

/**
 * 여행 이력 생성/수정 요청 바디를 검증한다.
 * @param body 요청 바디 원문
 * @returns 검증된 여행 이력 입력
 */
export function parseUserDestinationHistoryInput(body: unknown): UserDestinationHistoryInput {
  return userDestinationHistoryInputSchema
    .refine((value) => destinationIdSet.has(value.destinationId), {
      message: "UNKNOWN_DESTINATION",
      path: ["destinationId"],
    })
    .parse(body);
}

/**
 * 앞으로 갈 곳 등록 요청 바디를 검증한다.
 * @param body 요청 바디 원문
 * @returns 검증된 앞으로 갈 곳 입력
 */
export function parseUserFutureTripInput(body: unknown): UserFutureTripInput {
  return userFutureTripInputSchema
    .refine((value) => destinationIdSet.has(value.destinationId), {
      message: "UNKNOWN_DESTINATION",
      path: ["destinationId"],
    })
    .parse(body);
}

/**
 * 사용자 추천 선호 업데이트 요청 바디를 검증한다.
 * @param body 요청 바디 원문
 * @returns 검증된 선호 업데이트 입력
 */
export function parseUserPreferenceProfileUpdate(body: unknown): UserPreferenceProfileUpdate {
  return userPreferenceProfileUpdateSchema.parse(body);
}

/**
 * 제휴 클릭 로그 요청 바디를 검증한다.
 * @param body 요청 바디 원문
 * @returns 검증된 제휴 클릭 입력
 */
export function parseDestinationAffiliateClickInput(body: unknown): DestinationAffiliateClickInput {
  return destinationAffiliateClickInputSchema
    .refine((value) => destinationIdSet.has(value.destinationId), {
      message: "UNKNOWN_DESTINATION",
      path: ["destinationId"],
    })
    .parse(body);
}
