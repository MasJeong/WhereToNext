import { NextResponse } from "next/server";

import { listPublicPosts } from "@/lib/community/service";

/**
 * 공개된 여행 이야기 피드를 커서 기반 페이지네이션으로 조회한다.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;

    const page = await listPublicPosts(cursor);

    return NextResponse.json(page);
  } catch {
    return NextResponse.json(
      { code: "COMMUNITY_FEED_FAILED", error: "여행 이야기를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
