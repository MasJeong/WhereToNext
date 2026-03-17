import crypto from "node:crypto";

import { destinationEvidenceCatalog } from "@/lib/evidence/catalog";
import type { DestinationProfile, TrendEvidenceSnapshot } from "@/lib/domain/contracts";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type EvidenceResult = {
  mode: "live" | "fallback";
  snapshots: TrendEvidenceSnapshot[];
};

const cache = new Map<string, { expiresAt: number; value: EvidenceResult }>();

/**
 * 증거 항목의 freshness 상태를 계산한다.
 * @param observedAt ISO 시각 문자열
 * @returns freshness 라벨
 */
function getFreshnessState(observedAt: string): TrendEvidenceSnapshot["freshnessState"] {
  const diffMs = Date.now() - new Date(observedAt).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 72) {
    return "fresh";
  }

  if (diffHours < 168) {
    return "aging";
  }

  return "stale";
}

/**
 * 목적지별 기본 편집형 fallback 증거를 만든다.
 * @param destination 목적지 프로필
 * @returns fallback 증거 스냅샷
 */
function buildEditorialFallback(destination: DestinationProfile): TrendEvidenceSnapshot {
  return {
    id: `editorial-${destination.id}`,
    destinationId: destination.id,
    tier: "fallback",
    sourceType: "editorial",
    sourceLabel: `${destination.nameKo} 큐레이션`,
    sourceUrl: `https://example.com/destinations/${destination.slug}`,
    observedAt: new Date().toISOString(),
    freshnessState: "fresh",
    confidence: 64,
    summary: `${destination.summary} 현재는 공식 계정/해시태그 대신 큐레이션된 여행 포인트를 우선 보여줍니다.`,
  };
}

/**
 * 카탈로그 항목을 정규화된 증거 스냅샷으로 변환한다.
 * @param destination 목적지 프로필
 * @returns 라이브 또는 fallback 증거 결과
 */
function buildEvidenceResult(destination: DestinationProfile): EvidenceResult {
  const catalogEntries = destinationEvidenceCatalog[destination.id] ?? [];

  if (catalogEntries.length === 0) {
    return {
      mode: "fallback",
      snapshots: [buildEditorialFallback(destination)],
    };
  }

  return {
    mode: "live",
    snapshots: catalogEntries.map((entry, index) => ({
      id: crypto.createHash("sha1").update(`${destination.id}-${entry.sourceUrl}-${index}`).digest("hex"),
      destinationId: destination.id,
      tier: entry.tier,
      sourceType: entry.sourceType,
      sourceLabel: entry.sourceLabel,
      sourceUrl: entry.sourceUrl,
      observedAt: entry.observedAt,
      freshnessState: getFreshnessState(entry.observedAt),
      confidence: entry.confidence,
      summary: entry.summary,
    })),
  };
}

/**
 * 목적지 하나에 대한 인스타그램/큐레이션 증거를 조회한다.
 * @param destination 목적지 프로필
 * @returns 정규화된 증거 결과
 */
export async function getDestinationEvidence(destination: DestinationProfile): Promise<EvidenceResult> {
  const cached = cache.get(destination.id);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const result = buildEvidenceResult(destination);
  cache.set(destination.id, { expiresAt: Date.now() + CACHE_TTL_MS, value: result });

  return result;
}

/**
 * 여러 목적지에 대한 증거 맵을 한 번에 구성한다.
 * @param destinations 목적지 목록
 * @returns 목적지 ID 기준 증거 맵
 */
export async function buildEvidenceMap(
  destinations: DestinationProfile[],
): Promise<Map<string, TrendEvidenceSnapshot[]>> {
  const entries = await Promise.all(
    destinations.map(async (destination) => {
      const result = await getDestinationEvidence(destination);
      return [destination.id, result.snapshots] as const;
    }),
  );

  return new Map(entries);
}
