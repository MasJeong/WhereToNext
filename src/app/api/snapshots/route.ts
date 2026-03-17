import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createSnapshot } from "@/lib/snapshots/service";
import { parseCreateSnapshotBody } from "@/lib/security/validation";

/**
 * 공유 및 비교용 스냅샷을 생성한다.
 * @param request HTTP 요청 객체
 * @returns 생성된 스냅샷 메타데이터
 */
export async function POST(request: Request) {
  try {
    const snapshot = await createSnapshot(parseCreateSnapshotBody((await request.json()) as unknown));

    return NextResponse.json({
      snapshotId: snapshot.id,
      kind: snapshot.kind,
      createdAt: snapshot.createdAt,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "INVALID_SNAPSHOT", error: "공유 스냅샷 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "SNAPSHOT_CREATE_FAILED", error: "스냅샷 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
