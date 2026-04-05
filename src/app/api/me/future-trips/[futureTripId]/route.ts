import { NextResponse } from "next/server";

import { getSessionOrNull } from "@/lib/auth-session";
import { deleteUserFutureTrip } from "@/lib/profile/service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ futureTripId: string }> },
) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  const { futureTripId } = await context.params;
  const deleted = await deleteUserFutureTrip(session.user.id, futureTripId);

  if (!deleted) {
    return NextResponse.json(
      { code: "FUTURE_TRIP_NOT_FOUND", error: "삭제할 앞으로 갈 곳을 찾지 못했습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
