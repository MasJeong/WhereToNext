import { NextResponse } from "next/server";
import { z } from "zod";

import { clearSessionCookie, setSessionCookie, signUpWithEmailPassword } from "@/lib/auth";
import { isTrustedIosShellRequest } from "@/lib/runtime/shell";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const signUpBodySchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.email(),
  password: z.string().min(8).max(128),
});

/**
 * 이메일/비밀번호 회원가입을 처리한다.
 * @param request HTTP 요청 객체
 * @returns 세션 생성 결과
 */
export async function POST(request: Request) {
  const clientIp = getClientIp(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
  const rateLimit = checkRateLimit(`auth:sign-up:${clientIp}`, { limit: 10, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { message: "잠시 후 다시 시도해 주세요." } },
      { status: 429 },
    );
  }

  try {
    const body = signUpBodySchema.parse((await request.json()) as unknown);
    const allowIosShell = isTrustedIosShellRequest(request);
    const result = await signUpWithEmailPassword({
      ...body,
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
      clientType: allowIosShell ? "ios-shell" : undefined,
      allowIosShell,
    });

    if (result.error || !result.data || !result.token) {
      const response = NextResponse.json(result, { status: 400 });
      clearSessionCookie(response, request);
      return response;
    }

    const response = NextResponse.json({ data: result.data }, { status: 201 });
    setSessionCookie(response, result.token, request, {
      clientType: allowIosShell ? "ios-shell" : "web",
      allowIosShell,
      expiresAt: result.data.session.expiresAt,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { message: "회원가입 요청 형식이 올바르지 않습니다." } },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: { message: "회원가입을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." } },
      { status: 500 },
    );
  }
}
