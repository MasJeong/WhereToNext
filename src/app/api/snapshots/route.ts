import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  applyAcquisitionCorsHeaders,
  createAcquisitionPreflightResponse,
} from "@/lib/security/cors";
import { getSessionFromHeaders } from "@/lib/auth";
import { createSnapshot } from "@/lib/snapshots/service";
import { parseCreateSnapshotBody } from "@/lib/security/validation";

export async function OPTIONS(request: Request) {
  return createAcquisitionPreflightResponse(request) ?? new NextResponse(null, { status: 204 });
}

/**
 * 공유 및 비교용 스냅샷을 생성한다.
 * @param request HTTP 요청 객체
 * @returns 생성된 스냅샷 메타데이터
 */
export async function POST(request: Request) {
  try {
    const body = parseCreateSnapshotBody((await request.json()) as unknown);
    const session = await getSessionFromHeaders(request.headers);
    const visibility = body.visibility ?? "public";

    if (visibility === "private" && !session?.user.id) {
      return applyAcquisitionCorsHeaders(
        request,
        NextResponse.json(
          { code: "AUTH_REQUIRED", error: "저장하려면 로그인이 필요해요." },
          { status: 401 },
        ),
      );
    }

    const snapshot = await createSnapshot(body, {
      visibility,
      ownerUserId: visibility === "private" ? session?.user.id ?? null : null,
    });

    return applyAcquisitionCorsHeaders(
      request,
      NextResponse.json({
        snapshotId: snapshot.id,
        kind: snapshot.kind,
        visibility: snapshot.visibility,
        createdAt: snapshot.createdAt,
      }),
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return applyAcquisitionCorsHeaders(
        request,
        NextResponse.json(
          { code: "INVALID_SNAPSHOT", error: "공유 스냅샷 형식이 올바르지 않습니다." },
          { status: 400 },
        ),
      );
    }

    return applyAcquisitionCorsHeaders(
      request,
      NextResponse.json(
        { code: "SNAPSHOT_CREATE_FAILED", error: "스냅샷 생성 중 오류가 발생했습니다." },
        { status: 500 },
      ),
    );
  }
}
