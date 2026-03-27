import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionFromHeaders } from "@/lib/auth";
import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { activeScoringVersion } from "@/lib/catalog/scoring-version";
import { buildEvidenceMap } from "@/lib/evidence/service";
import {
  getOrCreateUserPreferenceProfile,
  listUserDestinationHistory,
} from "@/lib/profile/service";
import { rankDestinations } from "@/lib/recommendation/engine";
import { applyAcquisitionCorsHeaders } from "@/lib/security/cors";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { parseRecommendationQuery } from "@/lib/security/validation";
import { getDestinationTravelSupplement } from "@/lib/travel-support/service";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = 30;

/**
 * 추천 결과 전체에 대한 데이터 소스 요약을 계산한다.
 * @param recommendations 추천 결과 목록
 * @returns source summary 메타데이터
 */
function buildSourceSummary(recommendations: ReturnType<typeof rankDestinations>) {
  const allEvidence = recommendations.flatMap((item) => item.trendEvidence);
  const tiers = new Set(allEvidence.map((item) => item.tier));

  return {
    mode: allEvidence.some((item) => item.tier !== "fallback") ? "live" : "fallback",
    evidenceCount: allEvidence.length,
    tiers: Array.from(tiers),
  };
}

/**
 * 목적지 추천 API를 처리한다.
 * @param request HTTP 요청 객체
 * @returns 추천 결과와 메타데이터 응답
 */
export async function GET(request: Request) {
  const clientIp = getClientIp(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
  const rateLimit = checkRateLimit(clientIp, {
    limit: RATE_LIMIT_PER_WINDOW,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return applyAcquisitionCorsHeaders(
      request,
      NextResponse.json(
        { code: "RATE_LIMITED", error: "잠시 후 다시 시도해 주세요." },
        {
          status: 429,
          headers: {
            "x-ratelimit-limit": String(RATE_LIMIT_PER_WINDOW),
            "x-ratelimit-remaining": String(rateLimit.remaining),
            "x-ratelimit-reset": String(rateLimit.resetAt),
          },
        },
      ),
    );
  }

  try {
    const query = parseRecommendationQuery(new URL(request.url).searchParams);
    const evidenceMap = await buildEvidenceMap(launchCatalog);
    const session = await getSessionFromHeaders(request.headers);
    const personalization = session?.user
      ? {
          explorationPreference: (await getOrCreateUserPreferenceProfile(session.user.id))
            .explorationPreference,
          history: await listUserDestinationHistory(session.user.id),
        }
      : undefined;
    const recommendations = rankDestinations(query, launchCatalog, evidenceMap, personalization);
    const leadRecommendation = recommendations[0] ?? null;
    const leadDestination =
      leadRecommendation
        ? launchCatalog.find((destination) => destination.id === leadRecommendation.destinationId) ?? null
        : null;
    const leadSupplement = leadDestination
      ? await getDestinationTravelSupplement(leadDestination)
      : null;

    return applyAcquisitionCorsHeaders(
      request,
      NextResponse.json(
        {
          query,
          recommendations,
          meta: {
            scoringVersion: activeScoringVersion.id,
            resultCount: recommendations.length,
            personalized: Boolean(personalization),
          },
          sourceSummary: buildSourceSummary(recommendations),
          leadSupplement,
        },
        {
          headers: {
            "x-ratelimit-limit": String(RATE_LIMIT_PER_WINDOW),
            "x-ratelimit-remaining": String(rateLimit.remaining),
            "x-ratelimit-reset": String(rateLimit.resetAt),
          },
        },
      ),
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return applyAcquisitionCorsHeaders(
        request,
        NextResponse.json(
          { code: "INVALID_QUERY", error: "추천 조건 형식이 올바르지 않습니다." },
          { status: 400 },
        ),
      );
    }

    return applyAcquisitionCorsHeaders(
      request,
      NextResponse.json(
        { code: "RECOMMENDATION_FAILED", error: "추천 결과를 불러오지 못했습니다." },
        { status: 500 },
      ),
    );
  }
}
