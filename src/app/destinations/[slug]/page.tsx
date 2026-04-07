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
      title={`${pageData.destination.nameKo}를 지금 담을지 빠르게 정리해 보세요.`}
      intro="결정에 필요한 정보는 먼저 위에 모아 두고, 더 읽을 이유와 여행 판단 정보는 아래에서 이어서 확인할 수 있게 정리했어요."
      capsule="결정 우선 · 담기 · 근거 확인"
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
