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
      eyebrow={pageData.destination.nameKo}
      title={`${pageData.destination.nameKo}, 어떤 곳인지 알아보세요.`}
      intro=""
      capsule=""
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
