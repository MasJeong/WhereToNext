import { NextResponse } from "next/server";

import { getSessionOrNull } from "@/lib/auth-session";
import { listOwnedRecommendationSnapshots } from "@/lib/snapshots/service";

export async function GET() {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  const snapshots = await listOwnedRecommendationSnapshots(session.user.id);

  return NextResponse.json({ snapshots });
}
