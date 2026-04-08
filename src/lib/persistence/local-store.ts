import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  CommunityComment,
  DestinationAffiliateClick,
  ComparisonSnapshot,
  RecommendationSnapshot,
  TrendEvidenceSnapshot,
  UserDestinationHistory,
  UserFutureTrip,
  UserPreferenceProfile,
} from "@/lib/domain/contracts";

export type LocalSnapshotRecord = {
  id: string;
  kind: "recommendation" | "comparison";
  visibility: "public" | "private";
  ownerUserId: string | null;
  createdAt: string;
  payload: RecommendationSnapshot | ComparisonSnapshot;
  scoringVersionId: string | null;
  destinationIds: string[];
};

export type LocalSessionRecord = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  clientType?: "web" | "ios-shell";
  lastSeenAt?: string;
  absoluteExpiresAt?: string;
  ipAddress: string | null;
  userAgent: string | null;
};

type SessionLifetimeMetadata = Pick<
  LocalSessionRecord,
  "clientType" | "lastSeenAt" | "absoluteExpiresAt"
>;

export function isLegacyLocalSessionRecord(record: SessionLifetimeMetadata): boolean {
  return !record.clientType || !record.lastSeenAt || !record.absoluteExpiresAt;
}

type LocalStoreData = {
  users: Record<string, { id: string; name: string; email: string | null; emailVerified: boolean; image: string | null }>;
  accounts: Record<string, {
    id: string;
    userId: string;
    providerId: string;
    accountId: string;
    password: string | null;
    providerEmail: string | null;
    providerEmailVerified: boolean;
    lastLoginAt: string | null;
  }>;
  sessions: Record<string, LocalSessionRecord>;
  oauthTransactions: Record<string, { state: string; codeVerifier: string; nonce: string; provider: string; next: string; intent: string; expiresAt: string }>;
  preferences: Record<string, UserPreferenceProfile>;
  history: Record<string, UserDestinationHistory>;
  futureTrips: Record<string, UserFutureTrip>;
  communityComments: Record<string, CommunityComment>;
  affiliateClicks: Record<string, DestinationAffiliateClick>;
  trendSnapshots: Record<string, TrendEvidenceSnapshot>;
  snapshots: Record<string, LocalSnapshotRecord>;
};

const localStoreFilePath = resolve(process.cwd(), ".data", "trip-compass-local-store.json");

/**
 * 짧은 대기 후 다시 시도하기 위한 sleep helper.
 * @param ms 대기 밀리초
 * @returns Promise<void>
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

/**
 * JSON 파일 기반 로컬 스토어 기본 구조를 반환한다.
 * @returns 비어 있는 로컬 스토어 객체
 */
function createDefaultStore(): LocalStoreData {
  return {
    users: {},
    accounts: {},
    sessions: {},
    oauthTransactions: {},
    preferences: {},
    history: {},
    futureTrips: {},
    communityComments: {},
    affiliateClicks: {},
    trendSnapshots: {},
    snapshots: {},
  };
}

function normalizeLocalStore(store: Partial<LocalStoreData>): LocalStoreData {
  const defaults = createDefaultStore();

  return {
    users: store.users ?? defaults.users,
    accounts: store.accounts ?? defaults.accounts,
    sessions: Object.fromEntries(
      Object.entries(store.sessions ?? defaults.sessions).map(([sessionId, session]) => [
        sessionId,
        {
          ...session,
          ipAddress: session.ipAddress ?? null,
          userAgent: session.userAgent ?? null,
        },
      ]),
    ) as LocalStoreData["sessions"],
    oauthTransactions: store.oauthTransactions ?? defaults.oauthTransactions,
    preferences: store.preferences ?? defaults.preferences,
    history: store.history ?? defaults.history,
    futureTrips: store.futureTrips ?? defaults.futureTrips,
    communityComments: store.communityComments ?? defaults.communityComments,
    affiliateClicks: store.affiliateClicks ?? defaults.affiliateClicks,
    trendSnapshots: store.trendSnapshots ?? defaults.trendSnapshots,
    snapshots: Object.fromEntries(
      Object.entries(store.snapshots ?? defaults.snapshots).map(([snapshotId, snapshot]) => [
        snapshotId,
        {
          ...snapshot,
          visibility: snapshot.visibility ?? "public",
          ownerUserId: snapshot.ownerUserId ?? null,
        },
      ]),
    ) as LocalStoreData["snapshots"],
  };
}

/**
 * 로컬 스토어 파일을 읽는다.
 * @returns 현재 저장된 로컬 스토어
 */
export async function readLocalStore(): Promise<LocalStoreData> {
  const directory = resolve(localStoreFilePath, "..");
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  if (!existsSync(localStoreFilePath)) {
    const initialStore = createDefaultStore();
    await writeFile(localStoreFilePath, JSON.stringify(initialStore, null, 2), "utf8");
    return initialStore;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const content = await readFile(localStoreFilePath, "utf8");

    if (!content.trim()) {
      await sleep(20);
      continue;
    }

    try {
      return normalizeLocalStore(JSON.parse(content) as Partial<LocalStoreData>);
    } catch {
      await sleep(20);
    }
  }

  throw new Error("LOCAL_STORE_PARSE_FAILED");
}

/**
 * 로컬 스토어 파일을 덮어쓴다.
 * @param store 저장할 스토어 객체
 */
export async function writeLocalStore(store: LocalStoreData): Promise<void> {
  const directory = resolve(localStoreFilePath, "..");
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  const tempPath = `${localStoreFilePath}.${randomUUID()}.tmp`;

  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rm(localStoreFilePath, { force: true });
  await rename(tempPath, localStoreFilePath);
}
