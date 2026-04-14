import { NextResponse } from "next/server";

import { listPublicPosts } from "@/lib/community/service";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const COMMUNITY_FEED_RATE_LIMIT = 60;
const COMMUNITY_FEED_WINDOW_MS = 60_000;

/**
 * 공개된 여행 이야기 피드를 커서 기반 페이지네이션으로 조회한다.
 */
export async function GET(request: Request) {
  const clientIp = getClientIp(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
  const rateLimit = checkRateLimit(`community-feed:${clientIp}`, {
    limit: COMMUNITY_FEED_RATE_LIMIT,
    windowMs: COMMUNITY_FEED_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED", error: "잠시 후 다시 시도해 주세요." },
      {
        status: 429,
        headers: {
          "x-ratelimit-limit": String(COMMUNITY_FEED_RATE_LIMIT),
          "x-ratelimit-remaining": String(rateLimit.remaining),
          "x-ratelimit-reset": String(rateLimit.resetAt),
        },
      },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const photosOnly = searchParams.get("photosOnly") === "true";

    const page = await listPublicPosts({
      cursor,
      sort: sort as "recommended" | "latest" | "ratingHigh" | "ratingLow" | undefined,
      search,
      photosOnly,
    });

    return NextResponse.json(page, {
      headers: {
        "x-ratelimit-limit": String(COMMUNITY_FEED_RATE_LIMIT),
        "x-ratelimit-remaining": String(rateLimit.remaining),
        "x-ratelimit-reset": String(rateLimit.resetAt),
      },
    });
  } catch {
    return NextResponse.json(
      { code: "COMMUNITY_FEED_FAILED", error: "여행 이야기를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
