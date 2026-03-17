import { desc, eq, inArray } from "drizzle-orm";

import { getRuntimeDatabase } from "@/lib/db/runtime";
import { recommendationSnapshots, trendSnapshots } from "@/lib/db/schema";
import {
  comparisonSnapshotSchema,
  recommendationSnapshotSchema,
  type ComparisonSnapshot,
  type RecommendationSnapshot,
  type TrendEvidenceSnapshot,
} from "@/lib/domain/contracts";
import type { CreateSnapshotBody } from "@/lib/security/validation";

type RecommendationStoredSnapshot = {
  id: string;
  kind: "recommendation";
  createdAt: string;
  payload: RecommendationSnapshot;
  scoringVersionId: string | null;
  destinationIds: string[];
};

type ComparisonStoredSnapshot = {
  id: string;
  kind: "comparison";
  createdAt: string;
  payload: ComparisonSnapshot;
  scoringVersionId: string | null;
  destinationIds: string[];
};

type StoredSnapshot = RecommendationStoredSnapshot | ComparisonStoredSnapshot;

/**
 * 추천 스냅샷에 포함된 증거 스냅샷을 평탄화한다.
 * @param payload 추천 스냅샷 payload
 * @returns 중복 제거된 증거 스냅샷 목록
 */
function collectTrendSnapshots(payload: RecommendationSnapshot): TrendEvidenceSnapshot[] {
  const evidenceMap = new Map<string, TrendEvidenceSnapshot>();

  for (const result of payload.results) {
    for (const evidence of result.trendEvidence) {
      evidenceMap.set(evidence.id, evidence);
    }
  }

  return [...evidenceMap.values()];
}

/**
 * 증거 스냅샷을 DB insert row 형태로 변환한다.
 * @param snapshots 정규화된 증거 스냅샷 목록
 * @returns trend_snapshots insert row 목록
 */
function toTrendSnapshotRows(snapshots: TrendEvidenceSnapshot[]) {
  return snapshots.map((snapshot) => ({
    id: snapshot.id,
    destinationId: snapshot.destinationId,
    tier: snapshot.tier,
    sourceType: snapshot.sourceType,
    sourceLabel: snapshot.sourceLabel,
    sourceUrl: snapshot.sourceUrl,
    observedAt: new Date(snapshot.observedAt),
    freshnessState: snapshot.freshnessState,
    confidence: snapshot.confidence,
    summary: snapshot.summary,
    payload: snapshot,
  }));
}

/**
 * 입력 바디를 DB 저장 형태로 정규화한다.
 * @param body 검증된 스냅샷 생성 바디
 * @returns 저장 가능한 payload와 부가 메타데이터
 */
function normalizeSnapshotInput(body: CreateSnapshotBody) {
  if (body.kind === "recommendation") {
    const normalizedPayload = recommendationSnapshotSchema.parse(body.payload);

    return {
      kind: body.kind,
      query: normalizedPayload.query,
      payload: normalizedPayload,
      scoringVersionId: normalizedPayload.scoringVersionId,
      destinationIds: normalizedPayload.destinationIds,
      trendSnapshotIds: normalizedPayload.trendSnapshotIds,
      trendSnapshots: collectTrendSnapshots(normalizedPayload),
    };
  }

  return {
    kind: body.kind,
    query: null,
    payload: comparisonSnapshotSchema.parse(body.payload),
    scoringVersionId: null,
    destinationIds: body.payload.destinationIds,
    trendSnapshotIds: [],
    trendSnapshots: [],
  };
}

/**
 * 새 스냅샷을 저장한다.
 * @param body 검증된 스냅샷 입력
 * @returns 저장된 스냅샷 메타데이터
 */
export async function createSnapshot(body: CreateSnapshotBody): Promise<StoredSnapshot> {
  const input = normalizeSnapshotInput(body);
  const { db } = await getRuntimeDatabase();

  if (input.trendSnapshots.length > 0) {
    await db.insert(trendSnapshots).values(toTrendSnapshotRows(input.trendSnapshots)).onConflictDoNothing();
  }

  const [created] = await db
    .insert(recommendationSnapshots)
    .values({
      kind: input.kind,
      query: input.query,
      payload: input.payload,
      scoringVersionId: input.scoringVersionId,
      trendSnapshotIds: input.trendSnapshotIds,
      destinationIds: input.destinationIds,
    })
    .returning();

  if (created.kind === "recommendation") {
    return {
      id: created.id,
      kind: "recommendation",
      createdAt: created.createdAt.toISOString(),
      payload: recommendationSnapshotSchema.parse(created.payload),
      scoringVersionId: created.scoringVersionId,
      destinationIds: created.destinationIds,
    };
  }

  return {
    id: created.id,
    kind: "comparison",
    createdAt: created.createdAt.toISOString(),
    payload: comparisonSnapshotSchema.parse(created.payload),
    scoringVersionId: created.scoringVersionId,
    destinationIds: created.destinationIds,
  };
}

/**
 * 스냅샷 하나를 읽어 복원 가능한 구조로 반환한다.
 * @param snapshotId 스냅샷 식별자
 * @returns 저장된 스냅샷 또는 null
 */
export async function readSnapshot(snapshotId: string): Promise<StoredSnapshot | null> {
  const { db } = await getRuntimeDatabase();
  const hit = await db.query.recommendationSnapshots.findFirst({
    where: eq(recommendationSnapshots.id, snapshotId),
  });

  if (!hit) {
    return null;
  }

  if (hit.kind === "recommendation") {
    return {
      id: hit.id,
      kind: "recommendation",
      createdAt: hit.createdAt.toISOString(),
      payload: recommendationSnapshotSchema.parse(hit.payload),
      scoringVersionId: hit.scoringVersionId,
      destinationIds: hit.destinationIds,
    };
  }

  return {
    id: hit.id,
    kind: "comparison",
    createdAt: hit.createdAt.toISOString(),
    payload: comparisonSnapshotSchema.parse(hit.payload),
    scoringVersionId: hit.scoringVersionId,
    destinationIds: hit.destinationIds,
  };
}

/**
 * 여러 추천 스냅샷을 한 번에 읽어 온다.
 * @param snapshotIds 조회할 스냅샷 ID 목록
 * @returns 생성일 내림차순 추천 스냅샷 목록
 */
export async function readRecommendationSnapshots(snapshotIds: string[]) {
  const { db } = await getRuntimeDatabase();

  const hits = await db.query.recommendationSnapshots.findMany({
    where: inArray(recommendationSnapshots.id, snapshotIds),
    orderBy: desc(recommendationSnapshots.createdAt),
  });

  return hits
    .filter((snapshot) => snapshot.kind === "recommendation")
    .map((snapshot) => ({
      id: snapshot.id,
      kind: snapshot.kind,
      createdAt: snapshot.createdAt.toISOString(),
      payload: recommendationSnapshotSchema.parse(snapshot.payload),
      scoringVersionId: snapshot.scoringVersionId,
      destinationIds: snapshot.destinationIds,
    }));
}
