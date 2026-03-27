import { NextResponse } from "next/server";

import { getSessionOrNull } from "@/lib/auth";
import { applyAcquisitionCorsHeaders } from "@/lib/security/cors";

/**
 * 현재 인증 세션을 조회한다.
 * @returns 세션 또는 null 응답
 */
export async function GET(request: Request) {
  const session = await getSessionOrNull();

  return applyAcquisitionCorsHeaders(request, NextResponse.json({ data: session }));
}
