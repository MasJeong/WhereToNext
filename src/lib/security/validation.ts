import { z } from "zod";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import {
  comparisonSnapshotSchema,
  recommendationQuerySchema,
  recommendationSnapshotSchema,
  userDestinationHistoryInputSchema,
  userPreferenceProfileUpdateSchema,
} from "@/lib/domain/contracts";

const destinationIdSet = new Set(launchCatalog.map((destination) => destination.id));

export const createRecommendationSnapshotBodySchema = z.object({
  kind: z.literal("recommendation"),
  payload: recommendationSnapshotSchema,
});

export const createComparisonSnapshotBodySchema = z.object({
  kind: z.literal("comparison"),
  payload: comparisonSnapshotSchema,
});

export const createSnapshotBodySchema = z.discriminatedUnion("kind", [
  createRecommendationSnapshotBodySchema,
  createComparisonSnapshotBodySchema,
]);

export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
export type CreateSnapshotBody = z.infer<typeof createSnapshotBodySchema>;
export type UserDestinationHistoryInput = z.infer<typeof userDestinationHistoryInputSchema>;
export type UserPreferenceProfileUpdate = z.infer<typeof userPreferenceProfileUpdateSchema>;

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
 * 사용자 추천 선호 업데이트 요청 바디를 검증한다.
 * @param body 요청 바디 원문
 * @returns 검증된 선호 업데이트 입력
 */
export function parseUserPreferenceProfileUpdate(body: unknown): UserPreferenceProfileUpdate {
  return userPreferenceProfileUpdateSchema.parse(body);
}
