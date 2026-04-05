import { afterEach, describe, expect, it, vi } from "vitest";

type TrendingRow = { destination_id: string; name_ko: string; rec_cnt: number; click_cnt: number };

function mockRuntimeDatabase(rows: TrendingRow[]) {
  vi.resetModules();
  vi.doMock("@/lib/db/runtime", () => ({
    getRuntimeDatabase: async () => ({
      db: {
        execute: vi.fn(async () => rows),
      },
      mode: "pglite",
      close: async () => undefined,
    }),
  }));
}

describe("trending service", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns top destinations from DB aggregation", async () => {
    mockRuntimeDatabase([
      { destination_id: "tokyo", name_ko: "도쿄", rec_cnt: 20, click_cnt: 4 },
      { destination_id: "osaka", name_ko: "오사카", rec_cnt: 14, click_cnt: 2 },
      { destination_id: "danang", name_ko: "다낭", rec_cnt: 8, click_cnt: 2 },
    ]);

    const { getTrendingDestinations } = await import("@/lib/trending/service");
    const results = await getTrendingDestinations(7);

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ destinationId: "tokyo", nameKo: "도쿄", score: 12 });
    expect(results[1]).toEqual({ destinationId: "osaka", nameKo: "오사카", score: 8 });
    expect(results[2]).toEqual({ destinationId: "danang", nameKo: "다낭", score: 5 });
  });

  it("pads results with fallback when DB returns fewer than 3", async () => {
    mockRuntimeDatabase([
      { destination_id: "bangkok", name_ko: "방콕", rec_cnt: 4, click_cnt: 2 },
    ]);

    const { getTrendingDestinations } = await import("@/lib/trending/service");
    const results = await getTrendingDestinations(7);

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ destinationId: "bangkok", nameKo: "방콕", score: 3 });
    expect(results[1].nameKo).toBe("다낭");
    expect(results[1].score).toBe(0);
    expect(results[2].nameKo).toBe("오사카");
  });

  it("does not duplicate fallback names already in DB results", async () => {
    mockRuntimeDatabase([
      { destination_id: "danang", name_ko: "다낭", rec_cnt: 16, click_cnt: 4 },
    ]);

    const { getTrendingDestinations } = await import("@/lib/trending/service");
    const results = await getTrendingDestinations(7);

    expect(results).toHaveLength(3);
    const names = results.map((r) => r.nameKo);
    expect(names).toEqual(["다낭", "오사카", "방콕"]);
  });

  it("returns full fallback list when DB returns no data", async () => {
    mockRuntimeDatabase([]);

    const { getTrendingDestinations } = await import("@/lib/trending/service");
    const results = await getTrendingDestinations(7);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.nameKo)).toEqual(["다낭", "오사카", "방콕"]);
    expect(results.every((r) => r.score === 0)).toBe(true);
  });
});
