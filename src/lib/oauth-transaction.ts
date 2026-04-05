import { createHash, randomBytes, randomUUID } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";

import { getRuntimeDatabase } from "@/lib/db/runtime";
import { verification } from "@/lib/db/schema";
import { readLocalStore, writeLocalStore } from "@/lib/persistence/local-store";
import { memoryStore } from "@/lib/persistence/memory-store";

const OAUTH_TRANSACTION_TTL_MS = 1000 * 60 * 10;
const usePersistentDatabase = Boolean(process.env.DATABASE_URL);
const useLocalFileStore = !usePersistentDatabase && process.env.NODE_ENV !== "test";

export type OAuthProviderId = "google" | "kakao" | "apple";
export type OAuthIntent = "login" | "save" | "share" | "link";

export type OAuthTransactionRecord = {
  state: string;
  codeVerifier: string;
  nonce: string;
  provider: OAuthProviderId;
  next: string;
  intent: OAuthIntent;
  clientType?: "web" | "ios-shell";
  expiresAt: string;
};

function buildVerificationIdentifier(state: string) {
  return `oauth:${state}`;
}

export function createPkceCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function assertRelativeNext(next: string): string {
  const trimmed = next.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    throw new Error("OAUTH_NEXT_INVALID");
  }

  return trimmed;
}

async function persistOAuthTransaction(record: OAuthTransactionRecord): Promise<void> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      store.oauthTransactions[record.state] = record;
      await writeLocalStore(store);
      return;
    }

    memoryStore.oauthTransactions.set(record.state, record);
    return;
  }

  const { db } = await getRuntimeDatabase();
  const now = new Date();

  await db.insert(verification).values({
    id: randomUUID(),
    identifier: buildVerificationIdentifier(record.state),
    value: JSON.stringify(record),
    expiresAt: new Date(record.expiresAt),
    createdAt: now,
    updatedAt: now,
  });
}

async function takeOAuthTransaction(state: string): Promise<OAuthTransactionRecord | null> {
  if (!usePersistentDatabase) {
    if (useLocalFileStore) {
      const store = await readLocalStore();
      const hit = (store.oauthTransactions[state] as OAuthTransactionRecord | undefined) ?? null;
      if (hit) {
        delete store.oauthTransactions[state];
        await writeLocalStore(store);
      }
      return hit;
    }

    const hit = (memoryStore.oauthTransactions.get(state) as OAuthTransactionRecord | undefined) ?? null;
    if (hit) {
      memoryStore.oauthTransactions.delete(state);
    }
    return hit;
  }

  const { db } = await getRuntimeDatabase();
  const identifier = buildVerificationIdentifier(state);
  const hit = await db.query.verification.findFirst({
    where: and(eq(verification.identifier, identifier), gt(verification.expiresAt, new Date())),
  });

  await db.delete(verification).where(eq(verification.identifier, identifier));

  if (!hit) {
    return null;
  }

  return JSON.parse(hit.value) as OAuthTransactionRecord;
}

export async function createOAuthTransaction(input: {
  provider: OAuthProviderId;
  next: string;
  intent: OAuthIntent;
  clientType?: "web" | "ios-shell";
}): Promise<OAuthTransactionRecord & { codeChallenge: string }> {
  const codeVerifier = randomBytes(32).toString("base64url");
  const record: OAuthTransactionRecord = {
    state: randomBytes(32).toString("base64url"),
    codeVerifier,
    nonce: randomBytes(32).toString("base64url"),
    provider: input.provider,
    next: assertRelativeNext(input.next),
    intent: input.intent,
    clientType: input.clientType,
    expiresAt: new Date(Date.now() + OAUTH_TRANSACTION_TTL_MS).toISOString(),
  };

  await persistOAuthTransaction(record);

  return {
    ...record,
    codeChallenge: createPkceCodeChallenge(codeVerifier),
  };
}

export async function consumeOAuthTransaction(input: {
  state: string;
  provider: OAuthProviderId;
}): Promise<OAuthTransactionRecord> {
  const record = await takeOAuthTransaction(input.state);

  if (!record) {
    throw new Error("OAUTH_TRANSACTION_NOT_FOUND");
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    throw new Error("OAUTH_TRANSACTION_EXPIRED");
  }

  if (record.provider !== input.provider) {
    throw new Error("OAUTH_PROVIDER_MISMATCH");
  }

  return {
    ...record,
    next: assertRelativeNext(record.next),
  };
}
