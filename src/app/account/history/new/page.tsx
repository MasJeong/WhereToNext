import { AccountHistoryCreateExperience } from "@/components/trip-compass/account-history-create-experience";
import { getSessionOrNull, redirectToAuth } from "@/lib/auth-session";
import { listDestinationCatalog } from "@/lib/catalog/service";

export const dynamic = "force-dynamic";

/**
 * 로그인 사용자의 새 여행 기록 step 화면을 렌더링한다.
 * @returns 여행 기록 추가 페이지
 */
export default async function AccountHistoryNewPage() {
  const session = await getSessionOrNull();

  if (!session) {
    redirectToAuth("/account/history/new", "account");
  }

  const destinations = await listDestinationCatalog({ activeOnly: true });

  return <AccountHistoryCreateExperience destinations={destinations} />;
}
