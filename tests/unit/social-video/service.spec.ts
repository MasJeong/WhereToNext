import { describe, expect, it } from "vitest";

import { launchCatalog } from "@/lib/catalog/launch-catalog";
import { defaultRecommendationQuery } from "@/lib/trip-compass/presentation";

import {
  buildSocialVideoFallbackSearches,
  buildSocialVideoSearchQueries,
  scoreSocialVideoCandidate,
  selectSocialVideoCandidate,
  selectSocialVideoCandidates,
  type SocialVideoCandidate,
} from "@/lib/social-video/service";

function buildTestContext() {
  const destination = launchCatalog.find((item) => item.id === "tokyo");

  if (!destination) {
    throw new Error("Expected tokyo destination to exist in launch catalog.");
  }

  return {
    destination,
    query: defaultRecommendationQuery,
    leadEvidence: [
      {
        label: "도쿄 야경",
        detail: "한국인 브이로그에서 많이 보이는 포인트",
        sourceLabel: "Trend",
        sourceUrl: null,
      },
    ],
  } as const;
}

function buildCandidate(overrides: Partial<SocialVideoCandidate>): SocialVideoCandidate {
  return {
    id: "candidate",
    title: "도쿄 여행 브이로그",
    channelTitle: "지훈의 여행일기",
    url: "https://www.youtube.com/watch?v=test",
    thumbnailUrl: "https://img.youtube.com/vi/test/hqdefault.jpg",
    durationSeconds: 60,
    description: "도쿄에서 꼭 봐야 할 장면들",
    publishedAt: "2026-01-01T00:00:00.000Z",
    languageHint: "ko",
    creatorCountryCode: "KR",
    ...overrides,
  };
}

describe("social-video service", () => {
  it("builds Korean-first YouTube search queries in a stable order", () => {
    const queries = buildSocialVideoSearchQueries(buildTestContext());

    expect(queries[0]).toBe("도쿄 여행 브이로그");
    expect(queries).toContain("도쿄 한국인 여행");
    expect(queries).toContain("도쿄 여행 가이드");
    expect(queries.some((query) => query.includes("Tokyo") || query.includes("일본"))).toBe(true);
    expect(queries.some((query) => query.includes("쇼츠") || query.toLowerCase().includes("shorts"))).toBe(true);
    expect(new Set(queries).size).toBe(queries.length);
  });

  it("builds direct YouTube fallback searches for the destination", () => {
    const searches = buildSocialVideoFallbackSearches(buildTestContext());

    expect(searches).toHaveLength(4);
    expect(searches[0]?.label).toBe("도쿄 여행 브이로그");
    expect(searches[0]?.url).toContain("youtube.com/results?search_query=");
  });

  it("scores Korean short-form candidates above generic long-form candidates", () => {
    const context = buildTestContext();
    const shortKoreanCandidate = buildCandidate({
      id: "short-korean",
      title: "도쿄 여행 브이로그 59초",
      channelTitle: "지훈의 여행일기",
      durationSeconds: 59,
      description: "도쿄 여행 코스와 야경을 짧게 정리",
      languageHint: "ko",
      creatorCountryCode: "KR",
    });
    const longGenericCandidate = buildCandidate({
      id: "long-generic",
      title: "Tokyo travel guide",
      channelTitle: "Global Trips",
      durationSeconds: 420,
      description: "A useful guide to Tokyo",
      languageHint: "en",
      creatorCountryCode: "US",
    });

    const shortScore = scoreSocialVideoCandidate(shortKoreanCandidate, context);
    const longScore = scoreSocialVideoCandidate(longGenericCandidate, context);

    expect(shortScore.total).toBeGreaterThan(longScore.total);
    expect(shortScore.koreanSignals).toBeGreaterThan(longScore.koreanSignals);
    expect(shortScore.durationPreference).toBeGreaterThan(longScore.durationPreference);
  });

  it("keeps the main candidate highly relevant even when a newer short clip exists", () => {
    const context = buildTestContext();
    const mainCandidate = buildCandidate({
      id: "main-candidate",
      title: "도쿄 여행 가이드",
      channelTitle: "지훈의 여행일기",
      durationSeconds: 150,
      description: "도쿄 맛집과 야경, 동선을 자세히 정리",
      publishedAt: "2026-03-01T00:00:00.000Z",
      languageHint: "ko",
      creatorCountryCode: "KR",
      viewCount: 220000,
      likeCount: 5400,
      commentCount: 310,
    });
    const recentShortCandidate = buildCandidate({
      id: "recent-short",
      title: "도쿄 여행 쇼츠",
      channelTitle: "빠른 여행 컷",
      durationSeconds: 27,
      description: "도쿄 골목 하이라이트",
      publishedAt: "2026-03-28T00:00:00.000Z",
      languageHint: "ko",
      creatorCountryCode: "KR",
      viewCount: 32000,
      likeCount: 510,
      commentCount: 40,
    });

    const selected = selectSocialVideoCandidates([recentShortCandidate, mainCandidate], context);

    expect(selected[0]?.candidate.id).toBe("main-candidate");
    expect(selected).toHaveLength(2);
  });

  it("falls back to a relevant standard video when short-form quality is low", () => {
    const context = buildTestContext();
    const weakShortCandidate = buildCandidate({
      id: "weak-short",
      title: "Short vlog",
      channelTitle: "Quick Clips",
      durationSeconds: 25,
      description: "A generic short clip",
      languageHint: "en",
      creatorCountryCode: "US",
    });
    const strongLongCandidate = buildCandidate({
      id: "strong-long",
      title: "도쿄 여행 가이드",
      channelTitle: "지훈의 여행일기",
      durationSeconds: 480,
      description: "도쿄 맛집과 코스를 자세히 정리",
      languageHint: "ko",
      creatorCountryCode: "KR",
    });

    const selected = selectSocialVideoCandidate([weakShortCandidate, strongLongCandidate], context);

    expect(selected?.candidate.id).toBe("strong-long");
    expect(selected?.score.total).toBeGreaterThan(weakShortCandidate.durationSeconds ?? 0);
  });

  it("returns null when no candidate clears the confidence threshold", () => {
    const context = buildTestContext();
    const unrelatedCandidates = [
      buildCandidate({
        id: "unrelated-1",
        title: "Bali surf day",
        channelTitle: "Ocean Clips",
        durationSeconds: 75,
        description: "Beach clip with no Tokyo context",
        languageHint: "en",
        creatorCountryCode: "US",
      }),
      buildCandidate({
        id: "unrelated-2",
        title: "Osaka night walk",
        channelTitle: "City Walks",
        durationSeconds: 210,
        description: "Another unrelated travel clip",
        languageHint: "en",
        creatorCountryCode: "US",
      }),
    ];

    expect(selectSocialVideoCandidate(unrelatedCandidates, context)).toBeNull();
  });

  it("rejects foreign-language creator videos from auto-selection even when destination relevance is high", () => {
    const context = buildTestContext();
    const foreignAirportSecurityCandidate = buildCandidate({
      id: "foreign-airport-security",
      title: "Nairobi airport security guide",
      channelTitle: "Africa Travel Stories",
      description: "What to expect at Nairobi airport and security lines",
      languageHint: "en",
      creatorCountryCode: "KE",
      durationSeconds: 84,
      viewCount: 210000,
      likeCount: 3100,
      commentCount: 220,
    });
    const koreanCandidate = buildCandidate({
      id: "korean-nairobi",
      title: "나이로비 여행 브이로그",
      channelTitle: "지훈의 여행일기",
      description: "나이로비 일정과 이동 팁을 한국어로 정리",
      languageHint: "ko",
      creatorCountryCode: "KR",
      durationSeconds: 140,
      viewCount: 54000,
      likeCount: 880,
      commentCount: 64,
    });

    const selected = selectSocialVideoCandidate([foreignAirportSecurityCandidate, koreanCandidate], context);

    expect(selected?.candidate.id).toBe("korean-nairobi");
  });
});
