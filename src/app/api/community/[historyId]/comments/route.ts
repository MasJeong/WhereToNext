import { NextResponse } from "next/server";

import { createComment, listComments } from "@/lib/community/service";
import { getSessionOrNull } from "@/lib/auth-session";

/**
 * 특정 여행 이야기의 댓글 목록을 조회한다.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ historyId: string }> },
) {
  try {
    const { historyId } = await context.params;
    const comments = await listComments(historyId);

    return NextResponse.json({ comments });
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

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { code: "COMMENT_CREATE_FAILED", error: "댓글을 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
