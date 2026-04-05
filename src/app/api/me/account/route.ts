import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth";
import { getSessionOrNull } from "@/lib/auth-session";
import { deleteUserAccount } from "@/lib/account/service";

/**
 * 현재 로그인 사용자의 계정과 개인 데이터를 삭제한다.
 * @param request HTTP 요청 객체
 * @returns 계정 삭제 결과
 */
export async function DELETE(request: Request) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  try {
    const deleted = await deleteUserAccount(session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { code: "ACCOUNT_NOT_FOUND", error: "이미 삭제된 계정이거나 찾지 못했습니다." },
        { status: 404 },
      );
    }

    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response, request);
    return response;
  } catch {
    return NextResponse.json(
      { code: "ACCOUNT_DELETE_FAILED", error: "계정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
