import { notFound } from "next/navigation";

import { CommunityDetailExperience } from "@/components/trip-compass/community-detail-experience";
import { ExperienceShell } from "@/components/trip-compass/experience-shell";
import { getSessionOrNull, redirectToAuth } from "@/lib/auth-session";
import { readPublicPost } from "@/lib/community/service";

export const dynamic = "force-dynamic";

/**
 * 공개 여행 이야기 상세 화면을 렌더링한다.
 * 상세 읽기는 로그인 사용자에게만 허용한다.
 * @param props 동적 라우트 params
 * @returns 상세 페이지
 */
export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ historyId: string }>;
}) {
  const { historyId } = await params;
  const session = await getSessionOrNull();

  if (!session) {
    redirectToAuth(`/community/${historyId}`, "link");
  }

  const post = await readPublicPost(historyId);

  if (!post) {
    notFound();
  }

  return (
    <ExperienceShell
      eyebrow="여행 이야기"
      title={post.destinationName}
      intro="로그인한 여행자만 자세히 읽을 수 있어요."
      capsule=""
    >
      <CommunityDetailExperience post={post} />
    </ExperienceShell>
  );
}
