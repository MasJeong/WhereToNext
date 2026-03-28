import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { socialVideoResponseSchema } from "@/lib/domain/contracts";
import { applyAcquisitionCorsHeaders } from "@/lib/security/cors";
import { parseSocialVideoQuery } from "@/lib/security/validation";
import { getLeadSocialVideo, type SocialVideoLeadEvidence } from "@/lib/social-video/service";

const SOCIAL_VIDEO_CACHE_TTL_SECONDS = 10_800;

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
  try {
    const parsedQuery = parseSocialVideoQuery(new URL(request.url).searchParams);
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

    const destination = launchCatalog.find((item) => item.id === parsedQuery.destinationId);

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

    const item = await getLeadSocialVideo({
      destination,
      query: parsedQuery.query,
      leadEvidence,
    });
    const payload = socialVideoResponseSchema.parse(
      item
        ? {
            status: "ok",
            item,
          }
        : {
            status: "empty",
            item: null,
          },
    );

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
          status: "empty",
          item: null,
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
