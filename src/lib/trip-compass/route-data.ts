import { notFound } from "next/navigation";

import { activeScoringVersion } from "@/lib/catalog/scoring-version";
import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { getDestinationEvidence, buildEvidenceMap } from "@/lib/evidence/service";
import type {
  DestinationTravelSupplement,
  RecommendationQuery,
  TrendEvidenceSnapshot,
} from "@/lib/domain/contracts";
import { rankDestinations } from "@/lib/recommendation/engine";
import { parseRecommendationQuery } from "@/lib/security/validation";
import { readSnapshot } from "@/lib/snapshots/service";
import { getDestinationTravelSupplement } from "@/lib/travel-support/service";

import {
  buildQueryNarrative,
  buildStructuredTripBrief,
  createRecommendationCards,
  type RecommendationCardView,
  type WorkspaceBriefItemView,
} from "./presentation";
import {
  hydrateComparisonSnapshot,
  hydrateRecommendationSnapshot,
  type ComparisonColumnView,
} from "./restore";

export type SnapshotRestorePageData =
  | {
      kind: "error";
      message: string;
    }
  | {
      kind: "ready";
      snapshotId: string;
      briefItems: WorkspaceBriefItemView[];
      restoredNarrative: string;
      cardsCount: number;
      scoringVersionId: string;
      card: RecommendationCardView;
      query: RecommendationQuery;
      evidence: TrendEvidenceSnapshot[];
      supplement: DestinationTravelSupplement | null;
    };

export type CompareRestorePageData =
  | {
      kind: "error";
      message: string;
    }
  | {
      kind: "ready";
      columns: ComparisonColumnView[];
    };

export type DestinationDetailPageData = {
  destination: (typeof launchCatalog)[number];
  card: RecommendationCardView | null;
  query: RecommendationQuery | null;
  evidence: TrendEvidenceSnapshot[];
  supplement: DestinationTravelSupplement | null;
  scoringVersionId: string | null;
  snapshotId: string | null;
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

/**
 * Restores a saved recommendation route into serializable page data.
 * @param snapshotId Dynamic snapshot id
 * @returns Error or ready view data for the restore page
 */
export async function resolveSnapshotRestorePageData(
  snapshotId: string,
): Promise<SnapshotRestorePageData> {
  const snapshot = await readSnapshot(snapshotId);

  if (!snapshot || snapshot.kind !== "recommendation") {
    return {
      kind: "error",
      message: "저장한 여행 링크를 다시 확인하거나 홈에서 새 추천을 내 일정에 담아 보세요.",
    };
  }

  try {
    const restored = await hydrateRecommendationSnapshot(snapshot.payload);

    if (!restored.primaryCard) {
      return {
        kind: "error",
        message: "저장해 둔 여행 정보를 다시 불러오지 못했어요. 홈에서 새 추천을 내 일정에 담아 다시 공유해 주세요.",
      };
    }

    return {
      kind: "ready",
      snapshotId,
      briefItems: buildStructuredTripBrief(restored.query),
      restoredNarrative: buildQueryNarrative(restored.query),
      cardsCount: restored.cards.length,
      scoringVersionId: restored.scoringVersionId,
      card: restored.primaryCard,
      query: restored.query,
      evidence: restored.primaryCard.recommendation.trendEvidence,
      supplement: await getDestinationTravelSupplement(restored.primaryCard.destination),
    };
  } catch {
    return {
      kind: "error",
      message: "저장해 둔 여행 정보를 다시 불러오지 못했어요. 홈에서 새 추천을 내 일정에 담아 다시 공유해 주세요.",
    };
  }
}

/**
 * Restores a saved comparison route into serializable page data.
 * @param snapshotId Dynamic snapshot id
 * @returns Error or ready view data for the compare page
 */
export async function resolveCompareRestorePageData(
  snapshotId: string,
): Promise<CompareRestorePageData> {
  const snapshot = await readSnapshot(snapshotId);

  if (!snapshot || snapshot.kind !== "comparison") {
    return {
      kind: "error",
      message: "홈으로 돌아가 목적지 카드를 다시 저장한 뒤 비교 보드를 만들어 주세요.",
    };
  }

  try {
    return {
      kind: "ready",
      columns: await hydrateComparisonSnapshot(snapshot.payload),
    };
  } catch {
    return {
      kind: "error",
      message: "홈으로 돌아가 목적지 카드를 다시 저장한 뒤 비교 보드를 새로 만들어 주세요.",
    };
  }
}

/**
 * Resolves the destination detail route into serializable data for a reusable view.
 * @param slug Destination slug from the route
 * @param rawSearchParams Current route search params
 * @returns Detail page data for web SSR and later shell-safe loaders
 */
export async function resolveDestinationDetailPageData(
  slug: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<DestinationDetailPageData> {
  const destination = launchCatalog.find((item) => item.slug === slug);

  if (!destination) {
    notFound();
  }

  async function resolveRecommendationContext() {
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

  const [evidenceResult, recommendationContext, supplement] = await Promise.all([
    getDestinationEvidence(destination),
    resolveRecommendationContext(),
    getDestinationTravelSupplement(destination),
  ]);

  return {
    destination,
    card: recommendationContext.card,
    query: recommendationContext.query,
    evidence: evidenceResult.snapshots,
    supplement,
    scoringVersionId: recommendationContext.scoringVersionId,
    snapshotId: recommendationContext.snapshotId,
  };
}
