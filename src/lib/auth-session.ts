import { redirect } from "next/navigation";

export { getSessionOrNull, requireSession } from "@/lib/auth";

/**
 * 비로그인 사용자를 현재 경로를 보존한 인증 화면으로 보낸다.
 * @param next 인증 후 돌아올 상대 경로
 * @param intent 인증 화면 의도
 */
export function redirectToAuth(next: string, intent: "account" | "save" | "share" | "link" = "account"): never {
  const params = new URLSearchParams({ next, intent });
  redirect(`/auth?${params.toString()}`);
}
