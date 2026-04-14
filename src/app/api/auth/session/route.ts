import { NextResponse } from "next/server";

import { clearSessionCookie, getSessionFromHeaders } from "@/lib/auth";
import { applyAcquisitionCorsHeaders } from "@/lib/security/cors";

/**
 * 현재 인증 세션을 조회한다.
 * @returns 세션 또는 null 응답
 */
export async function GET(request: Request) {
  const cookieCarrier = NextResponse.next();
  const session = await getSessionFromHeaders(request.headers, {
    refresh: {
      request,
      response: cookieCarrier,
    },
  });

  if (!session && request.headers.get("cookie")?.includes("trip_compass_session=")) {
    clearSessionCookie(cookieCarrier, request);
  }

  const finalResponse = NextResponse.json({ data: session });
  for (const cookie of cookieCarrier.cookies.getAll()) {
    finalResponse.cookies.set(cookie);
  }

  return applyAcquisitionCorsHeaders(request, finalResponse);
}
