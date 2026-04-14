import { CommunityExperience } from "@/components/trip-compass/community-experience";
import { ExperienceShell } from "@/components/trip-compass/experience-shell";

export default function CommunityPage() {
  return (
    <ExperienceShell
      eyebrow="여행 이야기"
      title="다른 여행자들의 이야기"
      intro=""
      capsule=""
    >
      <CommunityExperience />
    </ExperienceShell>
  );
}
