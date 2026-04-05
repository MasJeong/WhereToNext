import { sql } from "drizzle-orm";

import { getRuntimeDatabase } from "@/lib/db/runtime";
import { destinationProfiles } from "@/lib/db/schema";

const DEFAULT_WINDOW_DAYS = 7;
const TOP_N = 3;
const WEIGHT_RECOMMENDATION = 0.5;
const WEIGHT_CLICK = 0.5;

const FALLBACK_DESTINATIONS = ["다낭", "오사카", "방콕"];

export type TrendingDestination = {
  destinationId: string;
  nameKo: string;
  score: number;
};

/**
 * 최근 N일간 추천 포함 빈도 + 제휴 클릭을 가중 집계하여 인기 목적지를 반환한다.
 * 데이터가 부족하면 fallback 목록으로 보충한다.
 */
export async function getTrendingDestinations(
  windowDays: number = DEFAULT_WINDOW_DAYS,
): Promise<TrendingDestination[]> {
  const { db } = await getRuntimeDatabase();

  type Row = { destination_id: string; name_ko: string; rec_cnt: number; click_cnt: number };

  const result = await db.execute<Row>(sql`
    WITH rec_counts AS (
      SELECT dest_id AS destination_id, COUNT(*)::int AS cnt
      FROM recommendation_snapshots,
           jsonb_array_elements_text(destination_ids) AS dest_id
      WHERE created_at >= NOW() - make_interval(days => ${windowDays})
        AND kind = 'recommendation'
      GROUP BY dest_id
    ),
    click_counts AS (
      SELECT destination_id, COUNT(*)::int AS cnt
      FROM destination_affiliate_clicks
      WHERE clicked_at >= NOW() - make_interval(days => ${windowDays})
      GROUP BY destination_id
    ),
    combined AS (
      SELECT
        COALESCE(r.destination_id, c.destination_id) AS destination_id,
        COALESCE(r.cnt, 0) AS rec_cnt,
        COALESCE(c.cnt, 0) AS click_cnt
      FROM rec_counts r
      FULL OUTER JOIN click_counts c ON r.destination_id = c.destination_id
    )
    SELECT
      combined.destination_id,
      dp.name_ko,
      combined.rec_cnt,
      combined.click_cnt
    FROM combined
    INNER JOIN ${destinationProfiles} dp ON dp.id = combined.destination_id
    WHERE dp.active = true
    ORDER BY (combined.rec_cnt + combined.click_cnt) DESC
    LIMIT ${TOP_N}
  `);

  const rows = Array.from(result as Iterable<Row>);
  const results: TrendingDestination[] = rows.map((row) => ({
    destinationId: row.destination_id,
    nameKo: row.name_ko,
    score: row.rec_cnt * WEIGHT_RECOMMENDATION + row.click_cnt * WEIGHT_CLICK,
  }));

  if (results.length >= TOP_N) {
    return results;
  }

  const existingNames = new Set(results.map((r) => r.nameKo));
  for (const name of FALLBACK_DESTINATIONS) {
    if (results.length >= TOP_N) break;
    if (existingNames.has(name)) continue;
    results.push({ destinationId: "", nameKo: name, score: 0 });
    existingNames.add(name);
  }

  return results;
}

/**
 * 오늘 생성된 추천 스냅샷 수를 반환한다.
 */
export async function getTodayRecommendationCount(): Promise<number> {
  const { db } = await getRuntimeDatabase();

  type CountRow = { cnt: number };
  const result = await db.execute<CountRow>(sql`
    SELECT COUNT(*)::int AS cnt
    FROM recommendation_snapshots
    WHERE kind = 'recommendation'
      AND created_at >= date_trunc('day', NOW())
  `);

  const rows = Array.from(result as Iterable<CountRow>);
  return rows[0]?.cnt ?? 0;
}
