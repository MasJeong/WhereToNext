import { CommunityExperience } from "@/components/trip-compass/community-experience";
import { ExperienceShell } from "@/components/trip-compass/experience-shell";

export default function CommunityPage() {
  return (
    <ExperienceShell
      eyebrow="여행 이야기"
      title="다녀온 사람들의 솔직한 이야기"
      intro="이 여행지, 진짜 괜찮을까? 직접 다녀온 후기로 확인해 보세요."
      capsule=""
    >
      <CommunityExperience />
    </ExperienceShell>
  );
}
