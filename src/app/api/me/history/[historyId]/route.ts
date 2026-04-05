import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionOrNull } from "@/lib/auth-session";
import {
  deleteUserDestinationHistory,
  updateUserDestinationHistory,
} from "@/lib/profile/service";
import { assertKnownDestinationId } from "@/lib/security/destination-validation";
import { parseUserDestinationHistoryInput } from "@/lib/security/validation";

/**
 * 현재 로그인 사용자의 특정 여행 이력을 수정한다.
 * @param request HTTP 요청 객체
 * @param context 라우트 파라미터
 * @returns 수정된 여행 이력 응답
 */
export async function PATCH(
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
  const { historyId } = await context.params;

  try {
    const body = parseUserDestinationHistoryInput((await request.json()) as unknown);
    await assertKnownDestinationId(body.destinationId);
    const historyEntry = await updateUserDestinationHistory(session.user.id, historyId, body);

    if (!historyEntry) {
      return NextResponse.json(
        { code: "HISTORY_NOT_FOUND", error: "수정할 여행 이력을 찾지 못했습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ historyEntry });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "INVALID_HISTORY", error: "여행 이력 형식이 올바르지 않습니다.", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "HISTORY_UPDATE_FAILED", error: "여행 이력을 수정하지 못했습니다." },
      { status: 500 },
    );
  }
}

/**
 * 현재 로그인 사용자의 특정 여행 이력을 삭제한다.
 * @param _request HTTP 요청 객체
 * @param context 라우트 파라미터
 * @returns 삭제 성공 응답
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ historyId: string }> },
) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }
  const { historyId } = await context.params;
  const deleted = await deleteUserDestinationHistory(session.user.id, historyId);

  if (!deleted) {
    return NextResponse.json(
      { code: "HISTORY_NOT_FOUND", error: "삭제할 여행 이력을 찾지 못했습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
