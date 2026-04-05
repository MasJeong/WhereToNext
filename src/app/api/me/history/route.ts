import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionOrNull } from "@/lib/auth-session";
import {
  createUserDestinationHistory,
  listUserDestinationHistory,
} from "@/lib/profile/service";
import { assertKnownDestinationId } from "@/lib/security/destination-validation";
import { parseUserDestinationHistoryInput } from "@/lib/security/validation";

/**
 * 현재 로그인 사용자의 여행 이력 목록을 조회한다.
 * @returns 여행 이력 응답
 */
export async function GET() {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }
  const history = await listUserDestinationHistory(session.user.id);

  return NextResponse.json({ history });
}

/**
 * 현재 로그인 사용자의 여행 이력을 새로 만든다.
 * @param request HTTP 요청 객체
 * @returns 저장된 여행 이력 응답
 */
export async function POST(request: Request) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  try {
    const body = parseUserDestinationHistoryInput((await request.json()) as unknown);
    await assertKnownDestinationId(body.destinationId);
    const historyEntry = await createUserDestinationHistory(session.user.id, body);

    return NextResponse.json({ historyEntry }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "INVALID_HISTORY", error: "여행 이력 형식이 올바르지 않습니다.", issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "HISTORY_CREATE_FAILED", error: "여행 이력을 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
