import { AccountSettingsExperience } from "@/components/trip-compass/account-settings-experience";
import { getSessionOrNull, redirectToAuth } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const session = await getSessionOrNull();

  if (!session) {
    redirectToAuth("/account/settings", "account");
  }

  return <AccountSettingsExperience userName={session.user.name} />;
}
