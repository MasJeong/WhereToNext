import { NextResponse } from "next/server";

const DEFAULT_SHELL_ORIGIN = "capacitor://localhost";
const EXPOSED_RATE_LIMIT_HEADERS = "x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset";

function getAllowedShellOrigins(): string[] {
  const configuredOrigins = process.env.IOS_SHELL_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins && configuredOrigins.length > 0 ? configuredOrigins : [DEFAULT_SHELL_ORIGIN];
}

function resolveAllowedOrigin(request: Request): string | null {
  const requestOrigin = request.headers.get("origin");

  if (!requestOrigin) {
    return null;
  }

  return getAllowedShellOrigins().includes(requestOrigin) ? requestOrigin : null;
}

function appendVaryOrigin(response: NextResponse) {
  const currentVary = response.headers.get("Vary");

  if (!currentVary) {
    response.headers.set("Vary", "Origin");
    return;
  }

  if (!currentVary.split(",").map((value) => value.trim()).includes("Origin")) {
    response.headers.set("Vary", `${currentVary}, Origin`);
  }
}

/**
 * Applies approved shell-origin CORS headers to an acquisition API response.
 * @param request Incoming request
 * @param response Outgoing response
 * @returns Same response with CORS headers when the origin is approved
 */
export function applyAcquisitionCorsHeaders(request: Request, response: NextResponse): NextResponse {
  const allowedOrigin = resolveAllowedOrigin(request);

  if (!allowedOrigin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Expose-Headers", EXPOSED_RATE_LIMIT_HEADERS);
  appendVaryOrigin(response);

  return response;
}

/**
 * Builds a shell-origin preflight response for approved acquisition routes.
 * @param request Incoming request
 * @returns Preflight response or null when the origin is not approved
 */
export function createAcquisitionPreflightResponse(request: Request): NextResponse | null {
  const allowedOrigin = resolveAllowedOrigin(request);

  if (!allowedOrigin) {
    return null;
  }

  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  appendVaryOrigin(response);

  return response;
}
