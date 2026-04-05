import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionFromHeaders } from "@/lib/auth";
import { createDestinationAffiliateClick } from "@/lib/affiliate/service";
import { parseDestinationAffiliateClickInput } from "@/lib/security/validation";

/**
 * 제휴 링크 클릭 로그를 저장한다.
 * @param request HTTP 요청 객체
 * @returns 빈 응답
 */
export async function POST(request: Request) {
  try {
    const body = parseDestinationAffiliateClickInput((await request.json()) as unknown);
    const session = await getSessionFromHeaders(request.headers).catch(() => null);

    await createDestinationAffiliateClick(body, {
      userId: session?.user.id ?? null,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "INVALID_AFFILIATE_CLICK", error: "제휴 클릭 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "AFFILIATE_CLICK_FAILED", error: "제휴 클릭 로그를 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
