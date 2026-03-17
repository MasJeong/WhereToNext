import postgres from "postgres";

import * as schema from "@/lib/db/schema";

import { drizzle } from "drizzle-orm/postgres-js";

/**
 * 데이터베이스 연결 문자열을 조회한다.
 * @returns Postgres 연결 문자열
 */
export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to use the database layer.");
  }

  return databaseUrl;
}

/**
 * Drizzle과 postgres-js 기반의 데이터베이스 클라이언트를 생성한다.
 * @returns Drizzle DB 인스턴스와 종료 가능한 SQL 클라이언트
 */
export function createDatabaseClient() {
  const sql = postgres(getDatabaseUrl(), { prepare: false });

  return {
    db: drizzle({ client: sql, schema }),
    sql,
  };
}
