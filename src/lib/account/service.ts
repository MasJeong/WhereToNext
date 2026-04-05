import { eq } from "drizzle-orm";

import { getRuntimeDatabase } from "@/lib/db/runtime";
import { recommendationSnapshots, user } from "@/lib/db/schema";
import { readLocalStore, writeLocalStore } from "@/lib/persistence/local-store";
import { memoryStore } from "@/lib/persistence/memory-store";

const usePersistentDatabase = Boolean(process.env.DATABASE_URL);
const useLocalFileStore = !usePersistentDatabase && process.env.NODE_ENV !== "test";

/**
 * 사용자 계정과 소유 개인 데이터를 삭제한다.
 * @param userId 인증 사용자 ID
 * @returns 삭제 여부
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();

      if (!store.users[userId]) {
        return false;
      }

      for (const [accountId, accountRecord] of Object.entries(store.accounts)) {
        if (accountRecord.userId === userId) {
          delete store.accounts[accountId];
        }
      }

      for (const [sessionId, sessionRecord] of Object.entries(store.sessions)) {
        if (sessionRecord.userId === userId) {
          delete store.sessions[sessionId];
        }
      }

      delete store.preferences[userId];
      delete store.users[userId];

      for (const [historyId, historyEntry] of Object.entries(store.history)) {
        if (historyEntry.userId === userId) {
          delete store.history[historyId];
        }
      }

      for (const [futureTripId, futureTrip] of Object.entries(store.futureTrips)) {
        if (futureTrip.userId === userId) {
          delete store.futureTrips[futureTripId];
        }
      }

      for (const [snapshotId, snapshot] of Object.entries(store.snapshots)) {
        if (snapshot.ownerUserId === userId) {
          delete store.snapshots[snapshotId];
        }
      }

      await writeLocalStore(store);
      return true;
    }

    if (!memoryStore.users.has(userId)) {
      return false;
    }

    for (const [accountId, accountRecord] of memoryStore.accounts.entries()) {
      if (accountRecord.userId === userId) {
        memoryStore.accounts.delete(accountId);
      }
    }

    for (const [sessionId, sessionRecord] of memoryStore.sessions.entries()) {
      if (sessionRecord.userId === userId) {
        memoryStore.sessions.delete(sessionId);
      }
    }

    memoryStore.preferences.delete(userId);
    memoryStore.users.delete(userId);

    for (const [historyId, historyEntry] of memoryStore.history.entries()) {
      if (historyEntry.userId === userId) {
        memoryStore.history.delete(historyId);
      }
    }

    for (const [futureTripId, futureTrip] of memoryStore.futureTrips.entries()) {
      if (futureTrip.userId === userId) {
        memoryStore.futureTrips.delete(futureTripId);
      }
    }

    for (const [snapshotId, snapshot] of memoryStore.snapshots.entries()) {
      if (snapshot.ownerUserId === userId) {
        memoryStore.snapshots.delete(snapshotId);
      }
    }

    return true;
  }

  const { db } = await getRuntimeDatabase();
  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true },
  });

  if (!existingUser) {
    return false;
  }

  await db.delete(recommendationSnapshots).where(eq(recommendationSnapshots.ownerUserId, userId));
  await db.delete(user).where(eq(user.id, userId));

  return true;
}
