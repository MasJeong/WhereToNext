import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEFAULT_SHELL_ORIGIN = "capacitor://localhost";
const EXPOSED_RATE_LIMIT_HEADERS = "x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset";

function isAcquisitionApiPath(pathname: string): boolean {
  return (
    pathname === "/api/recommendations" ||
    pathname === "/api/snapshots" ||
    pathname.startsWith("/api/snapshots/") ||
    pathname === "/api/auth/session"
  );
}

function getAllowedShellOrigins(): string[] {
  const configuredOrigins = process.env.IOS_SHELL_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins && configuredOrigins.length > 0 ? configuredOrigins : [DEFAULT_SHELL_ORIGIN];
}

function resolveApprovedShellOrigin(request: NextRequest): string | null {
  const requestOrigin = request.headers.get("origin");

  if (!requestOrigin || !isAcquisitionApiPath(request.nextUrl.pathname)) {
    return null;
  }

  return getAllowedShellOrigins().includes(requestOrigin) ? requestOrigin : null;
}

function applyShellCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Expose-Headers", EXPOSED_RATE_LIMIT_HEADERS);
  response.headers.append("Vary", "Origin");
}

/**
 * 공통 보안 헤더와 API noindex 정책을 적용한다.
 * @param request 들어오는 요청 객체
 * @returns 보안 헤더가 적용된 응답
 */
export function middleware(request: NextRequest) {
  const approvedShellOrigin = resolveApprovedShellOrigin(request);

  if (request.method === "OPTIONS" && approvedShellOrigin) {
    const preflightResponse = new NextResponse(null, { status: 204 });
    applyShellCorsHeaders(preflightResponse, approvedShellOrigin);
    return preflightResponse;
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()"
  );

  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  if (approvedShellOrigin) {
    applyShellCorsHeaders(response, approvedShellOrigin);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
