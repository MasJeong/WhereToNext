import { notFound } from "next/navigation";

import { DestinationDetailExperience } from "@/components/trip-compass/destination-detail-experience";
import { ExperienceShell } from "@/components/trip-compass/experience-shell";
import { activeScoringVersion } from "@/lib/catalog/scoring-version";
import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { getDestinationEvidence, buildEvidenceMap } from "@/lib/evidence/service";
import type { RecommendationQuery } from "@/lib/domain/contracts";
import { rankDestinations } from "@/lib/recommendation/engine";
import { parseRecommendationQuery } from "@/lib/security/validation";
import { readSnapshot } from "@/lib/snapshots/service";
import {
  createRecommendationCards,
} from "@/lib/trip-compass/presentation";
import { hydrateRecommendationSnapshot } from "@/lib/trip-compass/restore";

type DestinationDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toUrlSearchParams(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const urlSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      urlSearchParams.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        urlSearchParams.append(key, item);
      }
    }
  }

  return urlSearchParams;
}

function getFirstValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
}

async function resolveRecommendationContext(
  slug: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
) {
  const snapshotId = getFirstValue(rawSearchParams.snapshotId);

  if (snapshotId) {
    const snapshot = await readSnapshot(snapshotId);

    if (snapshot?.kind === "recommendation") {
      try {
        const restored = await hydrateRecommendationSnapshot(snapshot.payload);
        const restoredCard = restored.cards.find((item) => item.destination.slug === slug) ?? null;

        if (restoredCard) {
          return {
            card: restoredCard,
            query: restored.query,
            scoringVersionId: restored.scoringVersionId,
            snapshotId,
          };
        }
      } catch {
        return {
          card: null,
          query: null,
          scoringVersionId: null,
          snapshotId,
        };
      }
    }
  }

  try {
    const query = parseRecommendationQuery(toUrlSearchParams(rawSearchParams));
    const evidenceMap = await buildEvidenceMap(launchCatalog);
    const rankedCards = createRecommendationCards(rankDestinations(query, launchCatalog, evidenceMap));
    const rankedCard = rankedCards.find((item) => item.destination.slug === slug) ?? null;

    return {
      card: rankedCard,
      query: rankedCard ? query : (null as RecommendationQuery | null),
      scoringVersionId: rankedCard ? activeScoringVersion.id : null,
      snapshotId: null,
    };
  } catch {
    return {
      card: null,
      query: null,
      scoringVersionId: null,
      snapshotId: null,
    };
  }
}

export default async function DestinationDetailPage({
  params,
  searchParams,
}: DestinationDetailPageProps) {
  const { slug } = await params;
  const rawSearchParams = await searchParams;
  const destination = launchCatalog.find((item) => item.slug === slug);

  if (!destination) {
    notFound();
  }

  const [evidenceResult, recommendationContext] = await Promise.all([
    getDestinationEvidence(destination),
    resolveRecommendationContext(slug, rawSearchParams),
  ]);

  return (
    <ExperienceShell eyebrow="" title="" intro="" capsule="" hideHeader bareBody>
      <>
        <h1 className="sr-only">{destination.nameKo} 목적지 상세</h1>
        <DestinationDetailExperience
          destination={destination}
          card={recommendationContext.card}
          query={recommendationContext.query}
          evidence={evidenceResult.snapshots}
          scoringVersionId={recommendationContext.scoringVersionId}
          snapshotId={recommendationContext.snapshotId}
        />
      </>
    </ExperienceShell>
  );
}
