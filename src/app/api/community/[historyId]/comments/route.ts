import { NextResponse } from "next/server";

import { createComment, isPublicPostVisible, listComments } from "@/lib/community/service";
import { getSessionOrNull } from "@/lib/auth-session";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const COMMUNITY_COMMENTS_READ_LIMIT = 30;
const COMMUNITY_COMMENTS_WRITE_LIMIT = 10;
const COMMUNITY_COMMENTS_WINDOW_MS = 60_000;

/**
 * 특정 여행 이야기의 댓글 목록을 조회한다.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ historyId: string }> },
) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  const clientIp = getClientIp(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
  const rateLimit = checkRateLimit(`community-comments:read:${clientIp}`, {
    limit: COMMUNITY_COMMENTS_READ_LIMIT,
    windowMs: COMMUNITY_COMMENTS_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED", error: "잠시 후 다시 시도해 주세요." },
      {
        status: 429,
        headers: {
          "x-ratelimit-limit": String(COMMUNITY_COMMENTS_READ_LIMIT),
          "x-ratelimit-remaining": String(rateLimit.remaining),
          "x-ratelimit-reset": String(rateLimit.resetAt),
        },
      },
    );
  }

  try {
    const { historyId } = await context.params;

    if (!(await isPublicPostVisible(historyId))) {
      return NextResponse.json(
        { code: "HISTORY_NOT_FOUND", error: "댓글을 볼 수 있는 이야기를 찾지 못했습니다." },
        { status: 404 },
      );
    }

    const comments = await listComments(historyId);

    return NextResponse.json(
      { comments },
      {
        headers: {
          "x-ratelimit-limit": String(COMMUNITY_COMMENTS_READ_LIMIT),
          "x-ratelimit-remaining": String(rateLimit.remaining),
          "x-ratelimit-reset": String(rateLimit.resetAt),
        },
      },
    );
  } catch {
    return NextResponse.json(
      { code: "COMMENTS_FETCH_FAILED", error: "댓글을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

/**
 * 특정 여행 이야기에 댓글을 추가한다.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ historyId: string }> },
) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  const clientIp = getClientIp(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
  const rateLimit = checkRateLimit(`community-comments:write:${clientIp}`, {
    limit: COMMUNITY_COMMENTS_WRITE_LIMIT,
    windowMs: COMMUNITY_COMMENTS_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED", error: "잠시 후 다시 시도해 주세요." },
      {
        status: 429,
        headers: {
          "x-ratelimit-limit": String(COMMUNITY_COMMENTS_WRITE_LIMIT),
          "x-ratelimit-remaining": String(rateLimit.remaining),
          "x-ratelimit-reset": String(rateLimit.resetAt),
        },
      },
    );
  }

  try {
    const { historyId } = await context.params;
    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim();

    if (!content || content.length === 0 || content.length > 500) {
      return NextResponse.json(
        { code: "INVALID_COMMENT", error: "댓글은 1자 이상 500자 이하로 입력해 주세요." },
        { status: 400 },
      );
    }

    const comment = await createComment(historyId, session.user.id, content);

    if (!comment) {
      return NextResponse.json(
        { code: "HISTORY_NOT_FOUND", error: "댓글을 달 수 있는 이야기를 찾지 못했습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { comment },
      {
        status: 201,
        headers: {
          "x-ratelimit-limit": String(COMMUNITY_COMMENTS_WRITE_LIMIT),
          "x-ratelimit-remaining": String(rateLimit.remaining),
          "x-ratelimit-reset": String(rateLimit.resetAt),
        },
      },
    );
  } catch {
    return NextResponse.json(
      { code: "COMMENT_CREATE_FAILED", error: "댓글을 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
