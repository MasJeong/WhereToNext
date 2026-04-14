import { NextResponse } from "next/server";
import { z } from "zod";

import { clearSessionCookie } from "@/lib/auth";
import { getSessionOrNull } from "@/lib/auth-session";
import { deleteUserAccount, updateUserDisplayName } from "@/lib/account/service";

const updateAccountBodySchema = z.object({
  name: z.string().trim().min(1).max(60),
});

/**
 * 현재 로그인 사용자의 표시 이름을 수정한다.
 * @param request HTTP 요청 객체
 * @returns 수정 결과
 */
export async function PATCH(request: Request) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  try {
    const body = updateAccountBodySchema.parse((await request.json()) as unknown);
    const updatedUser = await updateUserDisplayName(session.user.id, body.name);

    if (!updatedUser) {
      return NextResponse.json(
        { code: "ACCOUNT_NOT_FOUND", error: "계정을 찾지 못했습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: { user: updatedUser } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { code: "INVALID_ACCOUNT_UPDATE", error: "닉네임은 1자 이상 60자 이하로 입력해 주세요." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "ACCOUNT_UPDATE_FAILED", error: "닉네임을 저장하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}

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
