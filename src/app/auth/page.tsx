import { redirect } from "next/navigation";

import { AuthExperience } from "@/components/trip-compass/auth-experience";
import { getSessionOrNull } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

/**
 * 선택형 로그인/회원가입 화면을 렌더링한다.
 * @returns 인증 페이지
 */
export default async function AuthPage() {
  const session = await getSessionOrNull();

  if (session) {
    redirect("/account");
  }

  return <AuthExperience />;
}
