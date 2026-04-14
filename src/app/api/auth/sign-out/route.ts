import { NextResponse } from "next/server";

import { clearSessionCookie, deleteCurrentSession } from "@/lib/auth";

/**
 * 현재 로그인 세션을 종료한다.
 * @returns 로그아웃 결과
 */
export async function POST(request: Request) {
  try {
    await deleteCurrentSession();
  } catch {
    const response = NextResponse.json(
      {
        data: { ok: true },
        error: { message: "서버 세션 정리에 실패했지만 현재 기기에서는 로그아웃했어요." },
      },
      { status: 200 },
    );
    clearSessionCookie(response, request);
    return response;
  }

  const response = NextResponse.json({ data: { ok: true } });
  clearSessionCookie(response, request);
  return response;
}
