import { AccountExperience } from "@/components/trip-compass/account-experience";
import { requireSession } from "@/lib/auth-session";
import {
  getOrCreateUserPreferenceProfile,
  listUserFutureTrips,
  listUserDestinationHistory,
} from "@/lib/profile/service";
import { listOwnedRecommendationSnapshots } from "@/lib/snapshots/service";

export const dynamic = "force-dynamic";

/**
 * 로그인 사용자의 여행 프로필 관리 화면을 렌더링한다.
 * @returns 계정 페이지
 */
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const [profile, history, futureTrips, savedSnapshots] = await Promise.all([
    getOrCreateUserPreferenceProfile(session.user.id),
    listUserDestinationHistory(session.user.id),
    listUserFutureTrips(session.user.id),
    listOwnedRecommendationSnapshots(session.user.id),
  ]);

  const initialTab =
    params.tab === "saved" ||
    params.tab === "preferences" ||
    params.tab === "history" ||
    params.tab === "future-trips"
      ? params.tab
      : "history";

  return (
    <AccountExperience
      userName={session.user.name}
      initialTab={initialTab}
      initialProfile={profile}
      initialHistory={history}
      initialFutureTrips={futureTrips}
      initialSavedSnapshots={savedSnapshots}
    />
  );
}
