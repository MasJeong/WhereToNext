import { notFound } from "next/navigation";

import { DestinationDetailExperience } from "@/components/trip-compass/destination-detail-experience";
import { ExperienceShell } from "@/components/trip-compass/experience-shell";
import { resolveDestinationDetailPageData } from "@/lib/trip-compass/route-data";

type DestinationDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DestinationDetailPage({
  params,
  searchParams,
}: DestinationDetailPageProps) {
  const { slug } = await params;
  const rawSearchParams = await searchParams;
  const pageData = await resolveDestinationDetailPageData(slug, rawSearchParams);

  if (!pageData.destination) {
    notFound();
  }

  return (
    <ExperienceShell
      eyebrow="목적지 결정"
      title={`${pageData.destination.nameKo}를 담을지 빠르게 판단하는 페이지예요.`}
      intro="가장 먼저 필요한 정보만 위에 모아 두고, 추천 이유와 분위기 근거는 바로 아래에서 짧게 확인할 수 있게 정리했어요."
      capsule="핵심 정보 우선 · 담기 · 취향 기록 연결"
    >
      <DestinationDetailExperience
        destination={pageData.destination}
        card={pageData.card}
        query={pageData.query}
        evidence={pageData.evidence}
        supplement={pageData.supplement}
        scoringVersionId={pageData.scoringVersionId}
        snapshotId={pageData.snapshotId}
      />
    </ExperienceShell>
  );
}
