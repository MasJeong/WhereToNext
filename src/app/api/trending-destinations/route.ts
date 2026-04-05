import { NextResponse } from "next/server";

import { applyAcquisitionCorsHeaders, createAcquisitionPreflightResponse } from "@/lib/security/cors";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { getTodayRecommendationCount, getTrendingDestinations } from "@/lib/trending/service";

const RATE_LIMIT_PER_WINDOW = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MIN_WINDOW_DAYS = 1;
const MAX_WINDOW_DAYS = 30;
const DEFAULT_WINDOW_DAYS = 7;

/**
 * 쉘 프리플라이트 요청을 처리한다.
 */
export function OPTIONS(request: Request) {
  return createAcquisitionPreflightResponse(request) ?? new NextResponse(null, { status: 204 });
}

/**
 * 최근 인기 여행지를 반환한다.
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
        { status: 429 },
      ),
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawWindowDays = searchParams.get("windowDays");
    let windowDays = DEFAULT_WINDOW_DAYS;

    if (rawWindowDays !== null) {
      const parsed = Number(rawWindowDays);
      if (!Number.isFinite(parsed) || parsed < MIN_WINDOW_DAYS || parsed > MAX_WINDOW_DAYS) {
        return applyAcquisitionCorsHeaders(
          request,
          NextResponse.json(
            { code: "INVALID_WINDOW", error: "조회 기간은 1~30일 사이여야 합니다." },
            { status: 400 },
          ),
        );
      }
      windowDays = Math.floor(parsed);
    }

    const [destinations, todayCount] = await Promise.all([
      getTrendingDestinations(windowDays),
      getTodayRecommendationCount(),
    ]);

    return applyAcquisitionCorsHeaders(
      request,
      NextResponse.json({ destinations, todayCount }),
    );
  } catch (error) {
    console.error("[trending-destinations]", error);
    return applyAcquisitionCorsHeaders(
      request,
      NextResponse.json(
        { code: "TRENDING_FAILED", error: "인기 여행지를 불러오지 못했습니다." },
        { status: 500 },
      ),
    );
  }
}
