import { AccountExperience } from "@/components/trip-compass/account-experience";
import { requireSession } from "@/lib/auth-session";
import {
  getOrCreateUserPreferenceProfile,
  listUserDestinationHistory,
} from "@/lib/profile/service";
import { listOwnedRecommendationSnapshots } from "@/lib/snapshots/service";

export const dynamic = "force-dynamic";

/**
 * 로그인 사용자의 여행 프로필 관리 화면을 렌더링한다.
 * @returns 계정 페이지
 */
export default async function AccountPage() {
  const session = await requireSession();
  const [profile, history, savedSnapshots] = await Promise.all([
    getOrCreateUserPreferenceProfile(session.user.id),
    listUserDestinationHistory(session.user.id),
    listOwnedRecommendationSnapshots(session.user.id),
  ]);

  return (
    <AccountExperience
      userName={session.user.name}
      initialProfile={profile}
      initialHistory={history}
      initialSavedSnapshots={savedSnapshots}
    />
  );
}
