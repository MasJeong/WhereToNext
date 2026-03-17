import { z } from "zod";

import {
  comparisonSnapshotSchema,
  recommendationQuerySchema,
  recommendationSnapshotSchema,
} from "@/lib/domain/contracts";

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
