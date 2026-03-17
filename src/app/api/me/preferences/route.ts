import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionOrNull } from "@/lib/auth-session";
import {
  getOrCreateUserPreferenceProfile,
  upsertUserPreferenceProfile,
} from "@/lib/profile/service";
import { parseUserPreferenceProfileUpdate } from "@/lib/security/validation";

/**
 * 현재 로그인 사용자의 추천 선호를 조회한다.
 * @returns 사용자 추천 선호 응답
 */
export async function GET() {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }
  const profile = await getOrCreateUserPreferenceProfile(session.user.id);

  return NextResponse.json({ profile });
}

/**
 * 현재 로그인 사용자의 추천 선호를 수정한다.
 * @param request HTTP 요청 객체
 * @returns 갱신된 추천 선호 응답
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
    const body = parseUserPreferenceProfileUpdate((await request.json()) as unknown);
    const profile = await upsertUserPreferenceProfile(session.user.id, body.explorationPreference);

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "INVALID_PREFERENCE", error: "추천 선호 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "PREFERENCE_UPDATE_FAILED", error: "추천 선호를 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
