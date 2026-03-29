import { redirect } from "next/navigation";

import { AccountHistoryCreateExperience } from "@/components/trip-compass/account-history-create-experience";
import { getSessionOrNull } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

/**
 * 로그인 사용자의 새 여행 기록 step 화면을 렌더링한다.
 * @returns 여행 기록 추가 페이지
 */
export default async function AccountHistoryNewPage() {
  const session = await getSessionOrNull();

  if (!session) {
    redirect("/auth?next=%2Faccount%2Fhistory%2Fnew&intent=account");
  }

  return <AccountHistoryCreateExperience />;
}
