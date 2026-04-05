import "dotenv/config";

import { activeScoringVersion } from "../src/lib/catalog/scoring-version";
import { launchCatalog } from "../src/lib/catalog/launch-catalog";
import { createDatabaseClient } from "../src/lib/db/config";
import { destinationProfiles, scoringVersions } from "../src/lib/db/schema";

/**
 * MVP 카탈로그와 활성 스코어 버전을 데이터베이스에 적재한다.
 * @returns Promise<void>
 */
async function seedDatabase() {
  const { db, sql } = createDatabaseClient();

  try {
    await db
      .insert(scoringVersions)
      .values(activeScoringVersion)
      .onConflictDoUpdate({
        target: scoringVersions.id,
        set: {
          label: activeScoringVersion.label,
          active: activeScoringVersion.active,
          weights: activeScoringVersion.weights,
          tieBreakerCap: activeScoringVersion.tieBreakerCap,
          shoulderWindowMonths: activeScoringVersion.shoulderWindowMonths,
        },
      });

    await db.insert(destinationProfiles).values(launchCatalog).onConflictDoNothing();
  } finally {
    await sql.end();
  }
}

await seedDatabase();
