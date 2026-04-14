import { NextResponse } from "next/server";

import { getSessionOrNull } from "@/lib/auth-session";
import { deleteComment } from "@/lib/community/service";

/**
 * 자신이 작성한 댓글을 삭제한다.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ historyId: string; commentId: string }> },
) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  try {
    const { commentId } = await context.params;
    const deleted = await deleteComment(commentId, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { code: "COMMENT_NOT_FOUND", error: "삭제할 댓글을 찾지 못했습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { code: "COMMENT_DELETE_FAILED", error: "댓글을 삭제하지 못했습니다." },
      { status: 500 },
    );
  }
}
