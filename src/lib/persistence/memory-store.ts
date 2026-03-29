import type {
  ComparisonSnapshot,
  RecommendationSnapshot,
  TrendEvidenceSnapshot,
  UserDestinationHistory,
  UserFutureTrip,
  UserPreferenceProfile,
} from "@/lib/domain/contracts";

type MemorySnapshotRecord = {
  id: string;
  kind: "recommendation" | "comparison";
  visibility: "public" | "private";
  ownerUserId: string | null;
  createdAt: string;
  payload: RecommendationSnapshot | ComparisonSnapshot;
  scoringVersionId: string | null;
  destinationIds: string[];
};

declare global {
  var __tripCompassMemoryStore:
    | {
        users: Map<string, { id: string; name: string; email: string | null; emailVerified: boolean; image: string | null }>;
        accounts: Map<string, {
          id: string;
          userId: string;
          providerId: string;
          accountId: string;
          password: string | null;
          providerEmail: string | null;
          providerEmailVerified: boolean;
          lastLoginAt: string | null;
        }>;
        sessions: Map<string, { id: string; userId: string; token: string; expiresAt: string; ipAddress: string | null; userAgent: string | null }>;
        oauthTransactions: Map<string, { state: string; codeVerifier: string; nonce: string; provider: string; next: string; intent: string; expiresAt: string }>;
        preferences: Map<string, UserPreferenceProfile>;
        history: Map<string, UserDestinationHistory>;
        futureTrips: Map<string, UserFutureTrip>;
        trendSnapshots: Map<string, TrendEvidenceSnapshot>;
        snapshots: Map<string, MemorySnapshotRecord>;
      }
    | undefined;
}

if (!globalThis.__tripCompassMemoryStore) {
  globalThis.__tripCompassMemoryStore = {
    users: new Map(),
    accounts: new Map(),
    sessions: new Map(),
    oauthTransactions: new Map(),
    preferences: new Map(),
    history: new Map(),
    futureTrips: new Map(),
    trendSnapshots: new Map(),
    snapshots: new Map(),
  };
}

export const memoryStore = globalThis.__tripCompassMemoryStore;
