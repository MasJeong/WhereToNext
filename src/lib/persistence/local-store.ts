import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  ComparisonSnapshot,
  RecommendationSnapshot,
  TrendEvidenceSnapshot,
  UserDestinationHistory,
  UserPreferenceProfile,
} from "@/lib/domain/contracts";

export type LocalSnapshotRecord = {
  id: string;
  kind: "recommendation" | "comparison";
  createdAt: string;
  payload: RecommendationSnapshot | ComparisonSnapshot;
  scoringVersionId: string | null;
  destinationIds: string[];
};

type LocalStoreData = {
  users: Record<string, { id: string; name: string; email: string; emailVerified: boolean; image: string | null }>;
  accounts: Record<string, { id: string; userId: string; providerId: string; accountId: string; password: string | null }>;
  sessions: Record<string, { id: string; userId: string; token: string; expiresAt: string; ipAddress: string | null; userAgent: string | null }>;
  preferences: Record<string, UserPreferenceProfile>;
  history: Record<string, UserDestinationHistory>;
  trendSnapshots: Record<string, TrendEvidenceSnapshot>;
  snapshots: Record<string, LocalSnapshotRecord>;
};

const localStoreFilePath = resolve(process.cwd(), ".data", "trip-compass-local-store.json");

/**
 * JSON 파일 기반 로컬 스토어 기본 구조를 반환한다.
 * @returns 비어 있는 로컬 스토어 객체
 */
function createDefaultStore(): LocalStoreData {
  return {
    users: {},
    accounts: {},
    sessions: {},
    preferences: {},
    history: {},
    trendSnapshots: {},
    snapshots: {},
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

  const content = await readFile(localStoreFilePath, "utf8");
  return JSON.parse(content) as LocalStoreData;
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

  await writeFile(localStoreFilePath, JSON.stringify(store, null, 2), "utf8");
}
