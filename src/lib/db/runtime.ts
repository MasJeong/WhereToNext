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
const PGLITE_MIGRATIONS_TABLE = "__trip_compass_migrations";

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
 * `drizzle/` 폴더의 SQL 마이그레이션 파일명을 정렬된 순서로 반환한다.
 * @returns migration SQL 파일명 목록
 */
async function listMigrationFiles(): Promise<string[]> {
  const migrationsFolder = getMigrationsFolder();

  return (await readdir(migrationsFolder))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
}

/**
 * 기존 PGlite 파일 DB에 스키마가 이미 있는데 추적 테이블만 없는 경우,
 * 이전 런타임이 적용한 마이그레이션을 모두 적용 완료 상태로 백필한다.
 * @param db Drizzle 데이터베이스 인스턴스
 * @param migrationFiles 로컬 migration 파일명 목록
 * @returns 이미 적용된 migration 파일명 집합
 */
async function ensurePGliteMigrationState(
  db: RuntimeDatabase["db"],
  migrationFiles: string[],
): Promise<Set<string>> {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "${PGLITE_MIGRATIONS_TABLE}" (
      "id" text PRIMARY KEY NOT NULL,
      "applied_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `));

  type AppliedMigrationRow = {
    id: string;
  };

  const appliedResult = await db.execute<AppliedMigrationRow>(
    sql.raw(`SELECT "id" FROM "${PGLITE_MIGRATIONS_TABLE}" ORDER BY "id"`),
  );
  const appliedIds = new Set(Array.from(appliedResult as Iterable<AppliedMigrationRow>).map((row) => row.id));

  if (appliedIds.size > 0) {
    return appliedIds;
  }

  type ExistingSchemaRow = {
    destination_profiles: string | null;
  };

  const existingSchemaResult = await db.execute<ExistingSchemaRow>(
    sql.raw(`SELECT to_regclass('public.destination_profiles')::text AS "destination_profiles"`),
  );
  const existingSchema = Array.from(existingSchemaResult as Iterable<ExistingSchemaRow>)[0];

  if (!existingSchema?.destination_profiles) {
    return appliedIds;
  }

  for (const fileName of migrationFiles) {
    await db.execute(sql.raw(`
      INSERT INTO "${PGLITE_MIGRATIONS_TABLE}" ("id")
      VALUES ('${fileName.replaceAll("'", "''")}')
      ON CONFLICT ("id") DO NOTHING
    `));
    appliedIds.add(fileName);
  }

  return appliedIds;
}

/**
 * `drizzle/` 폴더의 SQL 마이그레이션 파일을 직접 순서대로 실행한다.
 * @param db Drizzle 데이터베이스 인스턴스
 * @returns Promise<void>
 */
async function applySqlMigrations(db: RuntimeDatabase["db"]): Promise<void> {
  const migrationsFolder = getMigrationsFolder();
  const migrationFiles = await listMigrationFiles();
  const appliedIds = await ensurePGliteMigrationState(db, migrationFiles);

  for (const fileName of migrationFiles) {
    if (appliedIds.has(fileName)) {
      continue;
    }

    const content = await readFile(resolve(migrationsFolder, fileName), "utf8");
    const statements = content
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }

    await db.execute(sql.raw(`
      INSERT INTO "${PGLITE_MIGRATIONS_TABLE}" ("id")
      VALUES ('${fileName.replaceAll("'", "''")}')
      ON CONFLICT ("id") DO NOTHING
    `));
  }
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

    await migratePostgresJs(db, { migrationsFolder: getMigrationsFolder() });
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
    globalThis.__tripCompassDb = createRuntimeDatabase();
  }

  return globalThis.__tripCompassDb;
}
