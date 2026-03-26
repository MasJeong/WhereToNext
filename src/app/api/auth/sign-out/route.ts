import { NextResponse } from "next/server";

import { clearSessionCookie, deleteCurrentSession } from "@/lib/auth";

/**
 * 현재 로그인 세션을 종료한다.
 * @returns 로그아웃 결과
 */
export async function POST(request: Request) {
  await deleteCurrentSession();

  const response = NextResponse.json({ data: { ok: true } });
  clearSessionCookie(response, request);
  return response;
}
