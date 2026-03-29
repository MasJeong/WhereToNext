import { NextResponse } from "next/server";

import { getSessionOrNull } from "@/lib/auth-session";
import { readSnapshot } from "@/lib/snapshots/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ snapshotId: string }> },
) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  const { snapshotId } = await context.params;
  const snapshot = await readSnapshot(snapshotId, session.user.id);

  if (!snapshot || snapshot.kind !== "recommendation" || snapshot.visibility !== "private") {
    return NextResponse.json(
      { code: "SNAPSHOT_NOT_FOUND", error: "저장한 추천을 찾지 못했습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ snapshot });
}
