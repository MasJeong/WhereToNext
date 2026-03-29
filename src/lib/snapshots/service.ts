import { randomUUID } from "node:crypto";

import { and, desc, eq, inArray } from "drizzle-orm";

import { getRuntimeDatabase } from "@/lib/db/runtime";
import { recommendationSnapshots, trendSnapshots } from "@/lib/db/schema";
import {
  comparisonSnapshotSchema,
  recommendationSnapshotSchema,
  type ComparisonSnapshot,
  type RecommendationSnapshot,
  type SnapshotStatus,
  type SnapshotVisibility,
  type TrendEvidenceSnapshot,
} from "@/lib/domain/contracts";
import {
  readLocalStore,
  type LocalSnapshotRecord,
  writeLocalStore,
} from "@/lib/persistence/local-store";
import { memoryStore } from "@/lib/persistence/memory-store";
import type { CreateSnapshotBody } from "@/lib/security/validation";

const usePersistentDatabase = Boolean(process.env.DATABASE_URL);
const useLocalFileStore = !usePersistentDatabase && process.env.NODE_ENV !== "test";

type RecommendationStoredSnapshot = {
  id: string;
  kind: "recommendation";
  visibility: SnapshotVisibility;
  ownerUserId: string | null;
  createdAt: string;
  payload: RecommendationSnapshot;
  scoringVersionId: string | null;
  destinationIds: string[];
};

type ComparisonStoredSnapshot = {
  id: string;
  kind: "comparison";
  visibility: SnapshotVisibility;
  ownerUserId: string | null;
  createdAt: string;
  payload: ComparisonSnapshot;
  scoringVersionId: string | null;
  destinationIds: string[];
};

type StoredSnapshot = RecommendationStoredSnapshot | ComparisonStoredSnapshot;

function canReadSnapshot(snapshot: StoredSnapshot, viewerUserId?: string | null): boolean {
  if (snapshot.visibility === "public") {
    return true;
  }

  return Boolean(viewerUserId && snapshot.ownerUserId === viewerUserId);
}

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
 * 추천 스냅샷 payload에 상태 메타를 반영한다.
 * @param payload 기존 추천 스냅샷 payload
 * @param status 새 저장 상태
 * @returns 상태가 반영된 payload
 */
function withRecommendationSnapshotStatus(
  payload: RecommendationSnapshot,
  status: SnapshotStatus,
): RecommendationSnapshot {
  return recommendationSnapshotSchema.parse({
    ...payload,
    meta: {
      ...payload.meta,
      status,
    },
  });
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
export async function createSnapshot(
  body: CreateSnapshotBody,
  options?: { visibility?: SnapshotVisibility; ownerUserId?: string | null },
): Promise<StoredSnapshot> {
  const input = normalizeSnapshotInput(body);
  const visibility = options?.visibility ?? "public";
  const ownerUserId = options?.ownerUserId ?? null;

  if (visibility === "private" && !ownerUserId) {
    throw new Error("PRIVATE_SNAPSHOT_OWNER_REQUIRED");
  }

  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();

      for (const trendSnapshot of input.trendSnapshots) {
        store.trendSnapshots[trendSnapshot.id] = trendSnapshot;
      }

      const createdAt = new Date().toISOString();
      const snapshotRecord: StoredSnapshot =
        input.kind === "recommendation"
          ? {
              id: randomUUID(),
              kind: "recommendation",
              visibility,
              ownerUserId,
              createdAt,
              payload: input.payload,
              scoringVersionId: input.scoringVersionId,
              destinationIds: input.destinationIds,
            }
          : {
              id: randomUUID(),
              kind: "comparison",
              visibility,
              ownerUserId,
              createdAt,
              payload: input.payload,
              scoringVersionId: input.scoringVersionId,
              destinationIds: input.destinationIds,
            };

      store.snapshots[snapshotRecord.id] = snapshotRecord satisfies LocalSnapshotRecord;
      await writeLocalStore(store);

      return snapshotRecord;
    }

    for (const trendSnapshot of input.trendSnapshots) {
      memoryStore.trendSnapshots.set(trendSnapshot.id, trendSnapshot);
    }

    const createdAt = new Date().toISOString();
    const snapshotRecord: StoredSnapshot = {
      id: randomUUID(),
      kind: input.kind,
      visibility,
      ownerUserId,
      createdAt,
      payload: input.payload,
      scoringVersionId: input.scoringVersionId,
      destinationIds: input.destinationIds,
    } as StoredSnapshot;

    memoryStore.snapshots.set(snapshotRecord.id, snapshotRecord);
    return snapshotRecord;
  }

  const { db } = await getRuntimeDatabase();

  if (input.trendSnapshots.length > 0) {
    await db.insert(trendSnapshots).values(toTrendSnapshotRows(input.trendSnapshots)).onConflictDoNothing();
  }

  const [created] = await db
    .insert(recommendationSnapshots)
    .values({
      kind: input.kind,
      visibility,
      ownerUserId,
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
      visibility: created.visibility,
      ownerUserId: created.ownerUserId,
      createdAt: created.createdAt.toISOString(),
      payload: recommendationSnapshotSchema.parse(created.payload),
      scoringVersionId: created.scoringVersionId,
      destinationIds: created.destinationIds,
    };
  }

  return {
    id: created.id,
    kind: "comparison",
    visibility: created.visibility,
    ownerUserId: created.ownerUserId,
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
export async function readSnapshot(snapshotId: string, viewerUserId?: string | null): Promise<StoredSnapshot | null> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const snapshot = store.snapshots[snapshotId];
      if (!snapshot) {
        return null;
      }

      return canReadSnapshot(snapshot as StoredSnapshot, viewerUserId)
        ? (snapshot as StoredSnapshot)
        : null;
    }

    const snapshot = memoryStore.snapshots.get(snapshotId);
    if (!snapshot) {
      return null;
    }

    return canReadSnapshot(snapshot as StoredSnapshot, viewerUserId)
      ? (snapshot as StoredSnapshot)
      : null;
  }

  const { db } = await getRuntimeDatabase();
  const hit = await db.query.recommendationSnapshots.findFirst({
    where: eq(recommendationSnapshots.id, snapshotId),
  });

  if (!hit) {
    return null;
  }

  if (hit.kind === "recommendation") {
    const snapshot = {
      id: hit.id,
      kind: "recommendation",
      visibility: hit.visibility,
      ownerUserId: hit.ownerUserId,
      createdAt: hit.createdAt.toISOString(),
      payload: recommendationSnapshotSchema.parse(hit.payload),
      scoringVersionId: hit.scoringVersionId,
      destinationIds: hit.destinationIds,
    } satisfies RecommendationStoredSnapshot;

    return canReadSnapshot(snapshot, viewerUserId) ? snapshot : null;
  }

  const snapshot = {
    id: hit.id,
    kind: "comparison",
    visibility: hit.visibility,
    ownerUserId: hit.ownerUserId,
    createdAt: hit.createdAt.toISOString(),
    payload: comparisonSnapshotSchema.parse(hit.payload),
    scoringVersionId: hit.scoringVersionId,
    destinationIds: hit.destinationIds,
  } satisfies ComparisonStoredSnapshot;

  return canReadSnapshot(snapshot, viewerUserId) ? snapshot : null;
}

/**
 * 여러 추천 스냅샷을 한 번에 읽어 온다.
 * @param snapshotIds 조회할 스냅샷 ID 목록
 * @returns 생성일 내림차순 추천 스냅샷 목록
 */
export async function readRecommendationSnapshots(snapshotIds: string[], viewerUserId?: string | null) {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();

      return snapshotIds
        .map((snapshotId) => store.snapshots[snapshotId])
        .filter(
          (snapshot): snapshot is RecommendationStoredSnapshot =>
            Boolean(
              snapshot &&
                snapshot.kind === "recommendation" &&
                canReadSnapshot(snapshot as RecommendationStoredSnapshot, viewerUserId),
            ),
        );
    }

    return snapshotIds
      .map((snapshotId) => memoryStore.snapshots.get(snapshotId))
      .filter(
        (snapshot): snapshot is RecommendationStoredSnapshot =>
          Boolean(
            snapshot &&
              snapshot.kind === "recommendation" &&
              canReadSnapshot(snapshot as RecommendationStoredSnapshot, viewerUserId),
          ),
      );
  }

  const { db } = await getRuntimeDatabase();

  const hits = await db.query.recommendationSnapshots.findMany({
    where: inArray(recommendationSnapshots.id, snapshotIds),
    orderBy: desc(recommendationSnapshots.createdAt),
  });

  return hits
    .filter((snapshot) => snapshot.kind === "recommendation")
    .map(
      (snapshot) =>
        ({
          id: snapshot.id,
          kind: "recommendation",
          visibility: snapshot.visibility,
          ownerUserId: snapshot.ownerUserId,
          createdAt: snapshot.createdAt.toISOString(),
          payload: recommendationSnapshotSchema.parse(snapshot.payload),
          scoringVersionId: snapshot.scoringVersionId,
          destinationIds: snapshot.destinationIds,
        }) satisfies RecommendationStoredSnapshot,
    )
    .filter((snapshot) => canReadSnapshot(snapshot, viewerUserId));
}

export async function listOwnedRecommendationSnapshots(userId: string) {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      return Object.values(store.snapshots)
        .filter(
          (snapshot): snapshot is RecommendationStoredSnapshot =>
            snapshot.kind === "recommendation" &&
            snapshot.visibility === "private" &&
            snapshot.ownerUserId === userId,
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    }

    return [...memoryStore.snapshots.values()]
      .filter(
        (snapshot): snapshot is RecommendationStoredSnapshot =>
          snapshot.kind === "recommendation" &&
          snapshot.visibility === "private" &&
          snapshot.ownerUserId === userId,
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  const { db } = await getRuntimeDatabase();
  const hits = await db.query.recommendationSnapshots.findMany({
    where: and(
      eq(recommendationSnapshots.kind, "recommendation"),
      eq(recommendationSnapshots.visibility, "private"),
      eq(recommendationSnapshots.ownerUserId, userId),
    ),
    orderBy: desc(recommendationSnapshots.createdAt),
  });

  return hits.map(
    (snapshot) =>
      ({
        id: snapshot.id,
        kind: "recommendation",
        visibility: snapshot.visibility,
        ownerUserId: snapshot.ownerUserId,
        createdAt: snapshot.createdAt.toISOString(),
        payload: recommendationSnapshotSchema.parse(snapshot.payload),
        scoringVersionId: snapshot.scoringVersionId,
        destinationIds: snapshot.destinationIds,
      }) satisfies RecommendationStoredSnapshot,
  );
}

/**
 * 로그인 사용자가 소유한 추천 스냅샷의 저장 상태를 갱신한다.
 * @param userId 사용자 ID
 * @param snapshotId 추천 스냅샷 ID
 * @param status 새 저장 상태
 * @returns 갱신된 추천 스냅샷 또는 null
 */
export async function updateOwnedRecommendationSnapshotStatus(
  userId: string,
  snapshotId: string,
  status: SnapshotStatus,
): Promise<RecommendationStoredSnapshot | null> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const snapshot = store.snapshots[snapshotId];

      if (
        !snapshot ||
        snapshot.kind !== "recommendation" ||
        snapshot.visibility !== "private" ||
        snapshot.ownerUserId !== userId
      ) {
        return null;
      }

      const updatedSnapshot = {
        id: snapshot.id,
        kind: "recommendation",
        visibility: snapshot.visibility,
        ownerUserId: snapshot.ownerUserId,
        createdAt: snapshot.createdAt,
        payload: withRecommendationSnapshotStatus(
          recommendationSnapshotSchema.parse(snapshot.payload),
          status,
        ),
        scoringVersionId: snapshot.scoringVersionId,
        destinationIds: snapshot.destinationIds,
      } satisfies RecommendationStoredSnapshot;

      store.snapshots[snapshotId] = updatedSnapshot;
      await writeLocalStore(store);

      return updatedSnapshot;
    }

    const snapshot = memoryStore.snapshots.get(snapshotId);
    if (
      !snapshot ||
      snapshot.kind !== "recommendation" ||
      snapshot.visibility !== "private" ||
      snapshot.ownerUserId !== userId
    ) {
      return null;
    }

    const updatedSnapshot = {
      id: snapshot.id,
      kind: "recommendation",
      visibility: snapshot.visibility,
      ownerUserId: snapshot.ownerUserId,
      createdAt: snapshot.createdAt,
      payload: withRecommendationSnapshotStatus(
        recommendationSnapshotSchema.parse(snapshot.payload),
        status,
      ),
      scoringVersionId: snapshot.scoringVersionId,
      destinationIds: snapshot.destinationIds,
    } satisfies RecommendationStoredSnapshot;

    memoryStore.snapshots.set(snapshotId, updatedSnapshot);
    return updatedSnapshot;
  }

  const { db } = await getRuntimeDatabase();
  const hit = await db.query.recommendationSnapshots.findFirst({
    where: and(
      eq(recommendationSnapshots.id, snapshotId),
      eq(recommendationSnapshots.kind, "recommendation"),
      eq(recommendationSnapshots.visibility, "private"),
      eq(recommendationSnapshots.ownerUserId, userId),
    ),
  });

  if (!hit) {
    return null;
  }

  const updatedPayload = withRecommendationSnapshotStatus(
    recommendationSnapshotSchema.parse(hit.payload),
    status,
  );

  const [updated] = await db
    .update(recommendationSnapshots)
    .set({
      payload: updatedPayload,
    })
    .where(eq(recommendationSnapshots.id, snapshotId))
    .returning();

  return {
    id: updated.id,
    kind: "recommendation",
    visibility: updated.visibility,
    ownerUserId: updated.ownerUserId,
    createdAt: updated.createdAt.toISOString(),
    payload: recommendationSnapshotSchema.parse(updated.payload),
    scoringVersionId: updated.scoringVersionId,
    destinationIds: updated.destinationIds,
  };
}
