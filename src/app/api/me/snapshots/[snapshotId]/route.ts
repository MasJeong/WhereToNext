import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionOrNull } from "@/lib/auth-session";
import { parseUpdateRecommendationSnapshotBody } from "@/lib/security/validation";
import { readSnapshot, updateOwnedRecommendationSnapshotStatus } from "@/lib/snapshots/service";

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ snapshotId: string }> },
) {
  const session = await getSessionOrNull();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  try {
    const body = parseUpdateRecommendationSnapshotBody(await request.json());
    const { snapshotId } = await context.params;
    const snapshot = await updateOwnedRecommendationSnapshotStatus(session.user.id, snapshotId, body.status);

    if (!snapshot) {
      return NextResponse.json(
        { code: "SNAPSHOT_NOT_FOUND", error: "저장한 추천을 찾지 못했습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "INVALID_SNAPSHOT_STATUS", error: "저장 상태 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "SNAPSHOT_UPDATE_FAILED", error: "저장 상태를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
