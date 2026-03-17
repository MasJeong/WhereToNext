import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { getRuntimeDatabase } from "@/lib/db/runtime";
import { userDestinationHistory, userPreferenceProfiles } from "@/lib/db/schema";
import {
  type ExplorationPreference,
  type UserDestinationHistory,
  type UserDestinationHistoryInput,
  type UserPreferenceProfile,
} from "@/lib/domain/contracts";
import { readLocalStore, writeLocalStore } from "@/lib/persistence/local-store";
import { memoryStore } from "@/lib/persistence/memory-store";

const usePersistentDatabase = Boolean(process.env.DATABASE_URL);
const useLocalFileStore = !usePersistentDatabase && process.env.NODE_ENV !== "test";

/**
 * 사용자 추천 선호를 조회하거나 기본값으로 생성한다.
 * @param userId 인증 사용자 ID
 * @returns 사용자 선호 프로필
 */
export async function getOrCreateUserPreferenceProfile(
  userId: string,
): Promise<UserPreferenceProfile> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const existing = store.preferences[userId];

      if (existing) {
        return existing;
      }

      const created = {
        userId,
        explorationPreference: "balanced" as const,
      };
      store.preferences[userId] = created;
      await writeLocalStore(store);
      return created;
    }

    const existing = memoryStore.preferences.get(userId);
    if (existing) {
      return existing;
    }

    const created = {
      userId,
      explorationPreference: "balanced" as const,
    };
    memoryStore.preferences.set(userId, created);
    return created;
  }

  const { db } = await getRuntimeDatabase();
  const existing = await db.query.userPreferenceProfiles.findFirst({
    where: eq(userPreferenceProfiles.userId, userId),
  });

  if (existing) {
    return {
      userId: existing.userId,
      explorationPreference: existing.explorationPreference,
    };
  }

  const [created] = await db
    .insert(userPreferenceProfiles)
    .values({
      userId,
      explorationPreference: "balanced",
    })
    .returning();

  return {
    userId: created.userId,
    explorationPreference: created.explorationPreference,
  };
}

/**
 * 사용자 추천 선호를 갱신한다.
 * @param userId 인증 사용자 ID
 * @param explorationPreference 반복/균형/새로운 여행 선호
 * @returns 갱신된 사용자 선호
 */
export async function upsertUserPreferenceProfile(
  userId: string,
  explorationPreference: ExplorationPreference,
): Promise<UserPreferenceProfile> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const saved = {
        userId,
        explorationPreference,
      };
      store.preferences[userId] = saved;
      await writeLocalStore(store);
      return saved;
    }

    const saved = {
      userId,
      explorationPreference,
    };
    memoryStore.preferences.set(userId, saved);
    return saved;
  }

  const { db } = await getRuntimeDatabase();
  const [saved] = await db
    .insert(userPreferenceProfiles)
    .values({
      userId,
      explorationPreference,
    })
    .onConflictDoUpdate({
      target: userPreferenceProfiles.userId,
      set: {
        explorationPreference,
        updatedAt: new Date(),
      },
    })
    .returning();

  return {
    userId: saved.userId,
    explorationPreference: saved.explorationPreference,
  };
}

/**
 * 사용자의 여행 이력 목록을 최신순으로 조회한다.
 * @param userId 인증 사용자 ID
 * @returns 여행 이력 목록
 */
export async function listUserDestinationHistory(userId: string): Promise<UserDestinationHistory[]> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      return Object.values(store.history)
        .filter((entry) => entry.userId === userId)
        .sort((left, right) => right.visitedAt.localeCompare(left.visitedAt));
    }

    return [...memoryStore.history.values()]
      .filter((entry) => entry.userId === userId)
      .sort((left, right) => right.visitedAt.localeCompare(left.visitedAt));
  }

  const { db } = await getRuntimeDatabase();
  const rows = await db.query.userDestinationHistory.findMany({
    where: eq(userDestinationHistory.userId, userId),
    orderBy: desc(userDestinationHistory.visitedAt),
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    destinationId: row.destinationId,
    rating: row.rating,
    tags: row.tags,
    wouldRevisit: row.wouldRevisit,
    visitedAt: row.visitedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/**
 * 사용자의 여행 이력을 새로 추가한다.
 * @param userId 인증 사용자 ID
 * @param input 여행 이력 입력
 * @returns 저장된 여행 이력
 */
export async function createUserDestinationHistory(
  userId: string,
  input: UserDestinationHistoryInput,
): Promise<UserDestinationHistory> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const nowIso = new Date().toISOString();
      const created = {
        id: randomUUID(),
        userId,
        destinationId: input.destinationId,
        rating: input.rating,
        tags: input.tags,
        wouldRevisit: input.wouldRevisit,
        visitedAt: input.visitedAt,
        createdAt: nowIso,
        updatedAt: nowIso,
      } satisfies UserDestinationHistory;

      store.history[created.id] = created;
      await writeLocalStore(store);
      return created;
    }

    const nowIso = new Date().toISOString();
    const created = {
      id: randomUUID(),
      userId,
      destinationId: input.destinationId,
      rating: input.rating,
      tags: input.tags,
      wouldRevisit: input.wouldRevisit,
      visitedAt: input.visitedAt,
      createdAt: nowIso,
      updatedAt: nowIso,
    } satisfies UserDestinationHistory;

    memoryStore.history.set(created.id, created);
    return created;
  }

  const { db } = await getRuntimeDatabase();
  const [created] = await db
    .insert(userDestinationHistory)
    .values({
      userId,
      destinationId: input.destinationId,
      rating: input.rating,
      tags: input.tags,
      wouldRevisit: input.wouldRevisit,
      visitedAt: new Date(input.visitedAt),
    })
    .returning();

  return {
    id: created.id,
    userId: created.userId,
    destinationId: created.destinationId,
    rating: created.rating,
    tags: created.tags,
    wouldRevisit: created.wouldRevisit,
    visitedAt: created.visitedAt.toISOString(),
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

/**
 * 사용자의 여행 이력을 수정한다.
 * @param userId 인증 사용자 ID
 * @param historyId 수정할 여행 이력 ID
 * @param input 여행 이력 입력
 * @returns 수정된 여행 이력 또는 null
 */
export async function updateUserDestinationHistory(
  userId: string,
  historyId: string,
  input: UserDestinationHistoryInput,
): Promise<UserDestinationHistory | null> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const existing = store.history[historyId];
      if (!existing || existing.userId !== userId) {
        return null;
      }

      const updated = {
        ...existing,
        destinationId: input.destinationId,
        rating: input.rating,
        tags: input.tags,
        wouldRevisit: input.wouldRevisit,
        visitedAt: input.visitedAt,
        updatedAt: new Date().toISOString(),
      } satisfies UserDestinationHistory;

      store.history[historyId] = updated;
      await writeLocalStore(store);
      return updated;
    }

    const existing = memoryStore.history.get(historyId);
    if (!existing || existing.userId !== userId) {
      return null;
    }

    const updated = {
      ...existing,
      destinationId: input.destinationId,
      rating: input.rating,
      tags: input.tags,
      wouldRevisit: input.wouldRevisit,
      visitedAt: input.visitedAt,
      updatedAt: new Date().toISOString(),
    } satisfies UserDestinationHistory;

    memoryStore.history.set(historyId, updated);
    return updated;
  }

  const { db } = await getRuntimeDatabase();
  const [updated] = await db
    .update(userDestinationHistory)
    .set({
      destinationId: input.destinationId,
      rating: input.rating,
      tags: input.tags,
      wouldRevisit: input.wouldRevisit,
      visitedAt: new Date(input.visitedAt),
      updatedAt: new Date(),
    })
    .where(and(eq(userDestinationHistory.id, historyId), eq(userDestinationHistory.userId, userId)))
    .returning();

  if (!updated) {
    return null;
  }

  return {
    id: updated.id,
    userId: updated.userId,
    destinationId: updated.destinationId,
    rating: updated.rating,
    tags: updated.tags,
    wouldRevisit: updated.wouldRevisit,
    visitedAt: updated.visitedAt.toISOString(),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

/**
 * 사용자의 여행 이력을 삭제한다.
 * @param userId 인증 사용자 ID
 * @param historyId 삭제할 여행 이력 ID
 * @returns 삭제 성공 여부
 */
export async function deleteUserDestinationHistory(
  userId: string,
  historyId: string,
): Promise<boolean> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const existing = store.history[historyId];
      if (!existing || existing.userId !== userId) {
        return false;
      }

      delete store.history[historyId];
      await writeLocalStore(store);
      return true;
    }

    const existing = memoryStore.history.get(historyId);
    if (!existing || existing.userId !== userId) {
      return false;
    }

    memoryStore.history.delete(historyId);
    return true;
  }

  const { db } = await getRuntimeDatabase();
  const deleted = await db
    .delete(userDestinationHistory)
    .where(and(eq(userDestinationHistory.id, historyId), eq(userDestinationHistory.userId, userId)))
    .returning();

  return deleted.length > 0;
}
