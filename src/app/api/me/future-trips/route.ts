import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionOrNull } from "@/lib/auth-session";
import { listUserFutureTrips, upsertUserFutureTrip } from "@/lib/profile/service";
import { parseUserFutureTripInput } from "@/lib/security/validation";

export async function GET() {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  const futureTrips = await listUserFutureTrips(session.user.id);
  return NextResponse.json({ futureTrips });
}

export async function POST(request: Request) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  try {
    const body = parseUserFutureTripInput((await request.json()) as unknown);
    const futureTrip = await upsertUserFutureTrip(session.user.id, body);

    return NextResponse.json({ futureTrip }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "INVALID_FUTURE_TRIP", error: "앞으로 갈 곳 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "FUTURE_TRIP_CREATE_FAILED", error: "앞으로 갈 곳을 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
