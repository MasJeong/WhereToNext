import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { recommendationActionsResponseSchema } from "@/lib/domain/contracts";
import { getRecommendationActionsResult } from "@/lib/ai/recommendation-actions";
import { parseRecommendationActionRequest } from "@/lib/security/validation";

const RECOMMENDATION_ACTIONS_CACHE_TTL_SECONDS = 10_800;

const recommendationActionsCache = new Map<
  string,
  {
    expiresAt: number;
    payload: ReturnType<typeof recommendationActionsResponseSchema.parse>;
  }
>();

function buildRecommendationActionsCacheKey(request: ReturnType<typeof parseRecommendationActionRequest>) {
  return JSON.stringify({
    destinationId: request.destinationId,
    destinationSummary: request.destinationSummary,
    leadReason: request.leadReason,
    whyThisFits: request.whyThisFits,
    watchOuts: request.watchOuts,
    query: request.query,
    nearbyPlaces: request.nearbyPlaces?.map((place) => place.id) ?? [],
    evidence: request.evidence?.map((item) => item.summary) ?? [],
  });
}

/**
 * 추천 결과를 실행 가능한 행동 제안으로 바꿔 반환한다.
 * @param request HTTP 요청
 * @returns 행동 제안 응답
 */
export async function POST(request: Request) {
  try {
    const parsedBody = parseRecommendationActionRequest((await request.json()) as unknown);
    const cacheKey = buildRecommendationActionsCacheKey(parsedBody);
    const cached = recommendationActionsCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.payload, {
        headers: {
          "cache-control": `public, max-age=0, s-maxage=${RECOMMENDATION_ACTIONS_CACHE_TTL_SECONDS}, stale-while-revalidate=86400`,
        },
      });
    }

    const payload = recommendationActionsResponseSchema.parse(
      await getRecommendationActionsResult(parsedBody),
    );

    recommendationActionsCache.set(cacheKey, {
      expiresAt: Date.now() + (RECOMMENDATION_ACTIONS_CACHE_TTL_SECONDS * 1000),
      payload,
    });

    return NextResponse.json(payload, {
      headers: {
        "cache-control": `public, max-age=0, s-maxage=${RECOMMENDATION_ACTIONS_CACHE_TTL_SECONDS}, stale-while-revalidate=86400`,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "INVALID_BODY", error: "행동 제안 요청 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "ACTION_GENERATION_FAILED", error: "행동 제안을 불러오지 못했어요." },
      { status: 500 },
    );
  }
}
