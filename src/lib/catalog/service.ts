import { asc, eq } from "drizzle-orm";

import { destinationProfileSchema, type DestinationProfile } from "@/lib/domain/contracts";
import { getRuntimeDatabase } from "@/lib/db/runtime";
import { destinationProfiles } from "@/lib/db/schema";

const DESTINATION_CACHE_TTL_MS = 5 * 60 * 1000;

type DestinationCatalogRow = {
  id: string;
  slug: string;
  kind: DestinationProfile["kind"];
  countryCode: string;
  nameKo: string;
  nameEn: string;
  budgetBand: DestinationProfile["budgetBand"];
  flightBand: DestinationProfile["flightBand"];
  bestMonths: DestinationProfile["bestMonths"];
  paceTags: DestinationProfile["paceTags"];
  vibeTags: DestinationProfile["vibeTags"];
  summary: string;
  watchOuts: DestinationProfile["watchOuts"];
  active: boolean;
};

function toDestinationProfile(row: DestinationCatalogRow): DestinationProfile {
  return destinationProfileSchema.parse({
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    countryCode: row.countryCode,
    nameKo: row.nameKo,
    nameEn: row.nameEn,
    budgetBand: row.budgetBand,
    flightBand: row.flightBand,
    bestMonths: row.bestMonths,
    paceTags: row.paceTags,
    vibeTags: row.vibeTags,
    summary: row.summary,
    watchOuts: row.watchOuts,
    active: row.active,
  });
}

let allDestinationsCache:
  | {
      expiresAt: number;
      value: DestinationProfile[];
    }
  | null = null;

let activeDestinationsCache:
  | {
      expiresAt: number;
      value: DestinationProfile[];
    }
  | null = null;

async function readAllDestinations(): Promise<DestinationProfile[]> {
  const { db } = await getRuntimeDatabase();
  const rows = await db.query.destinationProfiles.findMany({
    orderBy: asc(destinationProfiles.nameKo),
  });

  return rows.map(toDestinationProfile);
}

async function readActiveDestinations(): Promise<DestinationProfile[]> {
  const { db } = await getRuntimeDatabase();
  const rows = await db.query.destinationProfiles.findMany({
    where: eq(destinationProfiles.active, true),
    orderBy: asc(destinationProfiles.nameKo),
  });

  return rows.map(toDestinationProfile);
}

/**
 * 목적지 카탈로그 전체 또는 active 목록을 읽는다.
 * @param options activeOnly 여부
 * @returns 목적지 프로필 목록
 */
export async function listDestinationCatalog(options?: {
  activeOnly?: boolean;
}): Promise<DestinationProfile[]> {
  if (options?.activeOnly) {
    if (activeDestinationsCache && activeDestinationsCache.expiresAt > Date.now()) {
      return activeDestinationsCache.value;
    }

    const value = await readActiveDestinations();
    activeDestinationsCache = {
      expiresAt: Date.now() + DESTINATION_CACHE_TTL_MS,
      value,
    };
    return value;
  }

  if (allDestinationsCache && allDestinationsCache.expiresAt > Date.now()) {
    return allDestinationsCache.value;
  }

  const value = await readAllDestinations();
  allDestinationsCache = {
    expiresAt: Date.now() + DESTINATION_CACHE_TTL_MS,
    value,
  };
  return value;
}

/**
 * 목적지 ID 기준 단건을 조회한다.
 * @param destinationId 목적지 ID
 * @param options activeOnly 여부
 * @returns 목적지 프로필 또는 null
 */
export async function getDestinationById(
  destinationId: string,
  options?: { activeOnly?: boolean },
): Promise<DestinationProfile | null> {
  const destinations = await listDestinationCatalog(options);
  return destinations.find((destination) => destination.id === destinationId) ?? null;
}

/**
 * 목적지 slug 기준 단건을 조회한다.
 * @param slug 목적지 slug
 * @param options activeOnly 여부
 * @returns 목적지 프로필 또는 null
 */
export async function getDestinationBySlug(
  slug: string,
  options?: { activeOnly?: boolean },
): Promise<DestinationProfile | null> {
  const destinations = await listDestinationCatalog(options);
  return destinations.find((destination) => destination.slug === slug) ?? null;
}

/**
 * 목적지 프로필을 ID 키 맵으로 만든다.
 * @param options activeOnly 여부
 * @returns ID 기준 목적지 맵
 */
export async function getDestinationCatalogMap(options?: {
  activeOnly?: boolean;
}): Promise<Map<string, DestinationProfile>> {
  const destinations = await listDestinationCatalog(options);
  return new Map(destinations.map((destination) => [destination.id, destination]));
}
