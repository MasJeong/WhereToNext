import { randomUUID } from "node:crypto";

import { getRuntimeDatabase } from "@/lib/db/runtime";
import { destinationAffiliateClicks } from "@/lib/db/schema";
import type {
  RecommendationQuery,
  DestinationAffiliateClick,
  DestinationAffiliateClickInput,
} from "@/lib/domain/contracts";
import { readLocalStore, writeLocalStore } from "@/lib/persistence/local-store";
import { memoryStore } from "@/lib/persistence/memory-store";

const usePersistentDatabase = Boolean(process.env.DATABASE_URL);
const useLocalFileStore = !usePersistentDatabase && process.env.NODE_ENV !== "test";

/**
 * 목적지 상세의 제휴 클릭 로그를 저장한다.
 * @param input 검증된 클릭 입력
 * @param actor 선택적 사용자 식별 정보
 * @returns 저장된 클릭 로그
 */
export async function createDestinationAffiliateClick(
  input: DestinationAffiliateClickInput,
  actor?: { userId?: string | null },
): Promise<DestinationAffiliateClick> {
  const clickedAt = new Date().toISOString();
  const saved: DestinationAffiliateClick = {
    id: randomUUID(),
    destinationId: input.destinationId,
    partner: input.partner,
    category: input.category,
    pageType: input.pageType,
    departureAirport: input.departureAirport,
    travelMonth: input.travelMonth,
    tripLengthDays: input.tripLengthDays,
    flightTolerance: input.flightTolerance,
    userId: actor?.userId ?? null,
    sessionId: input.sessionId,
    clickedAt,
  };

  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      store.affiliateClicks[saved.id] = saved;
      await writeLocalStore(store);
      return saved;
    }

    memoryStore.affiliateClicks.set(saved.id, saved);
    return saved;
  }

  const { db } = await getRuntimeDatabase();
  const [row] = await db
    .insert(destinationAffiliateClicks)
    .values({
      destinationId: saved.destinationId,
      partner: saved.partner,
      category: saved.category,
      pageType: saved.pageType,
      departureAirport: saved.departureAirport,
      travelMonth: saved.travelMonth,
      tripLengthDays: saved.tripLengthDays,
      flightTolerance: saved.flightTolerance,
      userId: saved.userId,
      sessionId: saved.sessionId,
    })
    .returning();

  return {
    id: row.id,
    destinationId: row.destinationId,
    partner: row.partner,
    category: row.category,
    pageType: row.pageType,
    departureAirport: row.departureAirport as RecommendationQuery["departureAirport"] | null,
    travelMonth: row.travelMonth,
    tripLengthDays: row.tripLengthDays,
    flightTolerance: row.flightTolerance as RecommendationQuery["flightTolerance"] | null,
    userId: row.userId,
    sessionId: row.sessionId,
    clickedAt: row.clickedAt.toISOString(),
  };
}
