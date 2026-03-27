import { NextResponse } from "next/server";

import { applyAcquisitionCorsHeaders } from "@/lib/security/cors";
import { readSnapshot } from "@/lib/snapshots/service";

/**
 * 저장된 스냅샷을 ID 기준으로 복원한다.
 * @param _request HTTP 요청 객체
 * @param context 라우트 파라미터
 * @returns 스냅샷 payload 또는 404 응답
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ snapshotId: string }> },
) {
  const { snapshotId } = await context.params;
  const snapshot = await readSnapshot(snapshotId);

  if (!snapshot) {
    return applyAcquisitionCorsHeaders(
      request,
      NextResponse.json(
        { code: "SNAPSHOT_NOT_FOUND", error: "저장된 결과를 찾을 수 없습니다." },
        { status: 404 },
      ),
    );
  }

  return applyAcquisitionCorsHeaders(request, NextResponse.json(snapshot));
}
