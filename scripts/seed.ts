import { config as loadEnv } from "dotenv";

import { getRuntimeDatabase } from "../src/lib/db/runtime";

loadEnv({ path: ".env.local" });
loadEnv();

/**
 * 런타임 DB 초기화 경로를 재사용해 migration과 seed를 함께 보장한다.
 * @returns Promise<void>
 */
async function seedDatabase() {
  const runtime = await getRuntimeDatabase();
  await runtime.close();
}

void seedDatabase().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
