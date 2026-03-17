import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { inArray } from "drizzle-orm";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePostgresJs } from "drizzle-orm/postgres-js";
import { migrate as migratePostgresJs } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { activeScoringVersion } from "@/lib/catalog/scoring-version";
import { destinationProfiles, scoringVersions } from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";

type RuntimeDatabase = Awaited<ReturnType<typeof createRuntimeDatabase>>;

declare global {
  var __tripCompassDb: Promise<RuntimeDatabase> | undefined;
}

/**
 * 런타임에서 사용할 로컬 PGlite 데이터 디렉터리를 계산한다.
 * @returns 파일 기반 PGlite 저장 경로
 */
function getLocalDataDir(): string {
  return resolve(process.cwd(), ".data", "trip-compass");
}

/**
 * Drizzle 마이그레이션 폴더 절대 경로를 반환한다.
 * @returns migration 폴더 절대 경로
 */
function getMigrationsFolder(): string {
  return resolve(process.cwd(), "drizzle");
}

/**
 * 최소 시드 데이터가 비어 있으면 목적지 카탈로그와 활성 스코어 버전을 적재한다.
 * @param db Drizzle 데이터베이스 인스턴스
 * @returns Promise<void>
 */
async function ensureSeedData(db: RuntimeDatabase["db"]): Promise<void> {
  await db.insert(scoringVersions).values(activeScoringVersion).onConflictDoUpdate({
    target: scoringVersions.id,
    set: {
      label: activeScoringVersion.label,
      active: activeScoringVersion.active,
      weights: activeScoringVersion.weights,
      tieBreakerCap: activeScoringVersion.tieBreakerCap,
      shoulderWindowMonths: activeScoringVersion.shoulderWindowMonths,
    },
  });

  const existingDestinationIds = new Set(
    (
      await db
        .select({ id: destinationProfiles.id })
        .from(destinationProfiles)
        .where(inArray(destinationProfiles.id, launchCatalog.map((destination) => destination.id)))
    ).map((row) => row.id),
  );

  const missingDestinations = launchCatalog.filter(
    (destination) => !existingDestinationIds.has(destination.id),
  );

  if (missingDestinations.length > 0) {
    await db.insert(destinationProfiles).values(missingDestinations).onConflictDoNothing();
  }
}

/**
 * 서버 Postgres 또는 로컬 PGlite 기반 런타임 데이터베이스를 생성한다.
 * @returns 데이터베이스 인스턴스와 모드 정보
 */
async function createRuntimeDatabase() {
  const migrationsFolder = getMigrationsFolder();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    const client = postgres(databaseUrl, { prepare: false });
    const db = drizzlePostgresJs({ client, schema });

    await migratePostgresJs(db, { migrationsFolder });
    await ensureSeedData(db);

    return {
      db,
      mode: "postgres" as const,
      close: async () => {
        await client.end();
      },
    };
  }

  const dataDir = getLocalDataDir();
  await mkdir(dataDir, { recursive: true });

  const client = new PGlite(dataDir);
  const db = drizzlePglite({ client, schema });

  await migratePglite(db, { migrationsFolder });
  await ensureSeedData(db);

  return {
    db,
    mode: "pglite" as const,
    close: async () => {
      await client.close();
    },
  };
}

/**
 * 애플리케이션 전역에서 공유할 런타임 데이터베이스를 반환한다.
 * @returns 마이그레이션/시드까지 보장된 데이터베이스 인스턴스
 */
export async function getRuntimeDatabase(): Promise<RuntimeDatabase> {
  if (!globalThis.__tripCompassDb) {
    globalThis.__tripCompassDb = createRuntimeDatabase();
  }

  return globalThis.__tripCompassDb;
}
