import { existsSync, mkdirSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgresJs } from "drizzle-orm/postgres-js";
import { migrate as migratePostgresJs } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { activeScoringVersion } from "@/lib/catalog/scoring-version";
import { destinationProfiles, scoringVersions } from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";

type RuntimeDatabase = Awaited<ReturnType<typeof createRuntimeDatabase>>;
type MigrationDatabase = { execute: (query: ReturnType<typeof sql.raw>) => Promise<unknown> };
type PostgresErrorLike = { code?: string; message?: string; cause?: unknown };

declare global {
  var __tripCompassDb: Promise<RuntimeDatabase> | undefined;
}

/**
 * Drizzle 마이그레이션 폴더 절대 경로를 반환한다.
 * @returns migration 폴더 절대 경로
 */
function getMigrationsFolder(): string {
  return resolve(process.cwd(), "drizzle");
}

const DEFAULT_PGLITE_DATA_DIR = ".data/trip-compass";

/**
 * 서버 런타임에서 사용할 PGlite 데이터 디렉터리를 문자열 경로로 정규화한다.
 * CI/production에서 기본 생성자 경로 추론에 의존하지 않도록 항상 명시 경로를 반환한다.
 * @returns 테스트 외 런타임용 PGlite 디렉터리 또는 null
 */
export function resolvePGliteDataDir(): string | null {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  const rawDataDir = process.env.PGLITE_DATA_DIR?.trim() || DEFAULT_PGLITE_DATA_DIR;
  if (!rawDataDir) {
    return null;
  }

  if (rawDataDir.startsWith("file:")) {
    return fileURLToPath(new URL(rawDataDir));
  }

  return resolve(process.cwd(), rawDataDir);
}

/**
 * `drizzle/` 폴더의 SQL 마이그레이션 파일을 직접 순서대로 실행한다.
 * @param db Drizzle 데이터베이스 인스턴스
 * @returns Promise<void>
 */
async function applySqlMigrations(db: RuntimeDatabase["db"]): Promise<void> {
  await applySqlMigrationsFromFolder(db);
}

/**
 * SQL migration 파일을 순서대로 적용한다.
 * @param db Drizzle 데이터베이스 인스턴스
 * @param options 기존 객체 충돌을 건너뛸지 여부
 * @returns Promise<void>
 */
async function applySqlMigrationsFromFolder(
  db: MigrationDatabase,
  options?: { tolerateExisting?: boolean },
): Promise<void> {
  const migrationsFolder = getMigrationsFolder();
  const migrationFiles = (await readdir(migrationsFolder))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const fileName of migrationFiles) {
    const content = await readFile(resolve(migrationsFolder, fileName), "utf8");
    const statements = content
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await db.execute(sql.raw(statement));
      } catch (error) {
        if (options?.tolerateExisting && isIgnorablePostgresMigrationError(error)) {
          continue;
        }

        throw error;
      }
    }
  }
}

/**
 * Postgres 런타임에서 이미 있는 스키마 객체를 다시 만드는 충돌인지 판별한다.
 * migration journal이 비어 있어도 조회 경로를 막지 않기 위한 fallback 판단에 사용한다.
 * @param error 드라이버 에러
 * @returns 건너뛰어도 되는 기존 객체 충돌 여부
 */
export function isIgnorablePostgresMigrationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { code, message, cause } = error as PostgresErrorLike;

  if (code && ["42710", "42P07", "42701", "42P06", "42723"].includes(code)) {
    return true;
  }

  if (typeof message === "string" && message.toLowerCase().includes("already exists")) {
    return true;
  }

  return cause ? isIgnorablePostgresMigrationError(cause) : false;
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
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    const client = postgres(databaseUrl, { prepare: false });
    const db = drizzlePostgresJs(client, { schema });

    try {
      await migratePostgresJs(db, { migrationsFolder: getMigrationsFolder() });
    } catch (error) {
      if (!isIgnorablePostgresMigrationError(error)) {
        throw error;
      }

      console.warn("[db/runtime] migration journal mismatch detected, applying best-effort SQL migrations.");
      await applySqlMigrationsFromFolder(db, { tolerateExisting: true });
    }

    await ensureSeedData(db);

    return {
      db,
      mode: "postgres" as const,
      close: async () => {
        await client.end();
      },
    };
  }

  const localDataDir = resolvePGliteDataDir();

  if (localDataDir && !existsSync(localDataDir)) {
    mkdirSync(localDataDir, { recursive: true });
  }

  const client = localDataDir ? new PGlite(localDataDir) : new PGlite();
  const db = drizzlePglite({ client, schema });

  await applySqlMigrations(db);
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
    globalThis.__tripCompassDb = createRuntimeDatabase().catch((error) => {
      globalThis.__tripCompassDb = undefined;
      throw error;
    });
  }

  return globalThis.__tripCompassDb;
}
