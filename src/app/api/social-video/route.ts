import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { socialVideoResponseSchema } from "@/lib/domain/contracts";
import { applyAcquisitionCorsHeaders } from "@/lib/security/cors";
import { parseSocialVideoQuery } from "@/lib/security/validation";
import {
  buildSocialVideoFallbackSearches,
  getLeadSocialVideoResult,
  type SocialVideoLeadEvidence,
} from "@/lib/social-video/service";

const SOCIAL_VIDEO_CACHE_TTL_SECONDS = 10_800;

function buildGenericFallbackSearches() {
  return ["여행 브이로그", "travel vlog", "여행 가이드"].map((query) => ({
    label: query,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  }));
}

const socialVideoCache = new Map<
  string,
  {
    expiresAt: number;
    payload: ReturnType<typeof socialVideoResponseSchema.parse>;
  }
>();

function buildSocialVideoCacheKey(request: ReturnType<typeof parseSocialVideoQuery>) {
  return [
    request.destinationId,
    request.query.partyType,
    request.query.partySize,
    request.query.budgetBand,
    request.query.tripLengthDays,
    request.query.departureAirport,
    request.query.travelMonth,
    request.query.pace,
    request.query.flightTolerance,
    request.query.vibes.join(","),
    request.leadEvidence?.label ?? "",
    request.leadEvidence?.detail ?? "",
    request.leadEvidence?.sourceLabel ?? "",
  ].join("|");
}

/**
 * 대표 추천 카드용 소셜 비디오를 조회한다.
 * @param request HTTP 요청 객체
 * @returns YouTube 기반 소셜 비디오 응답
 */
export async function GET(request: Request) {
  let destination = null as (typeof launchCatalog)[number] | null;
  let fallbackQuery: ReturnType<typeof parseSocialVideoQuery> | null = null;
  let fallbackLeadEvidence: SocialVideoLeadEvidence[] | undefined;

  try {
    const parsedQuery = parseSocialVideoQuery(new URL(request.url).searchParams);
    fallbackQuery = parsedQuery;
    const cacheKey = buildSocialVideoCacheKey(parsedQuery);
    const cached = socialVideoCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return applyAcquisitionCorsHeaders(
        request,
        NextResponse.json(cached.payload, {
          headers: {
            "cache-control": `public, max-age=0, s-maxage=${SOCIAL_VIDEO_CACHE_TTL_SECONDS}, stale-while-revalidate=86400`,
          },
        }),
      );
    }

    destination = launchCatalog.find((item) => item.id === parsedQuery.destinationId) ?? null;

    if (!destination) {
      return applyAcquisitionCorsHeaders(
        request,
        NextResponse.json(
          { code: "INVALID_QUERY", error: "소셜 비디오 요청 형식이 올바르지 않습니다." },
          { status: 400 },
        ),
      );
    }

    let leadEvidence: SocialVideoLeadEvidence[] | undefined;

    if (parsedQuery.leadEvidence) {
      const leadEvidenceItem: SocialVideoLeadEvidence = {
        label: parsedQuery.leadEvidence.label,
        detail: parsedQuery.leadEvidence.detail,
        sourceLabel: parsedQuery.leadEvidence.sourceLabel,
        sourceUrl: parsedQuery.leadEvidence.sourceUrl ?? null,
      };

      leadEvidence = [leadEvidenceItem];
    }
    fallbackLeadEvidence = leadEvidence;

    const payload = socialVideoResponseSchema.parse(await getLeadSocialVideoResult({
      destination,
      query: parsedQuery.query,
      leadEvidence,
    }));

    socialVideoCache.set(cacheKey, {
      expiresAt: Date.now() + (SOCIAL_VIDEO_CACHE_TTL_SECONDS * 1000),
      payload,
    });

    return applyAcquisitionCorsHeaders(
      request,
      NextResponse.json(payload, {
        headers: {
          "cache-control": `public, max-age=0, s-maxage=${SOCIAL_VIDEO_CACHE_TTL_SECONDS}, stale-while-revalidate=86400`,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return applyAcquisitionCorsHeaders(
        request,
        NextResponse.json(
          { code: "INVALID_QUERY", error: "소셜 비디오 요청 형식이 올바르지 않습니다." },
          { status: 400 },
        ),
      );
    }

    return applyAcquisitionCorsHeaders(
      request,
      NextResponse.json(
        {
          status: "fallback",
          item: null,
          items: [],
          fallback: {
            reason: "request-failed",
            headline: "지금은 영상을 바로 불러오지 못했어요",
            description: "잠시 후 다시 시도하거나 아래 검색 링크로 바로 찾아볼 수 있어요.",
            searches: destination && fallbackQuery
              ? buildSocialVideoFallbackSearches({ destination, query: fallbackQuery.query, leadEvidence: fallbackLeadEvidence })
              : buildGenericFallbackSearches(),
          },
        },
        {
          headers: {
            "cache-control": `public, max-age=0, s-maxage=${SOCIAL_VIDEO_CACHE_TTL_SECONDS}, stale-while-revalidate=86400`,
          },
        },
      ),
    );
  }
}
