import { notFound } from "next/navigation";

import { AccountHistoryCreateExperience } from "@/components/trip-compass/account-history-create-experience";
import { requireSession } from "@/lib/auth-session";
import { listDestinationCatalog } from "@/lib/catalog/service";
import { readUserDestinationHistory } from "@/lib/profile/service";

export const dynamic = "force-dynamic";

/**
 * 로그인 사용자의 기존 여행 기록 수정 화면을 렌더링한다.
 * @param params 동적 라우트 파라미터
 * @returns 여행 기록 수정 페이지
 */
export default async function AccountHistoryEditPage({
  params,
}: {
  params: Promise<{ historyId: string }>;
}) {
  const session = await requireSession();
  const { historyId } = await params;
  const [entry, destinations] = await Promise.all([
    readUserDestinationHistory(session.user.id, historyId),
    listDestinationCatalog({ activeOnly: true }),
  ]);

  if (!entry) {
    notFound();
  }

  return <AccountHistoryCreateExperience mode="edit" initialEntry={entry} destinations={destinations} />;
}
