import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parse as parseDotenv } from "dotenv";

import type {
  DestinationProfile,
  RecommendationQuery,
  SocialVideoItem,
  SocialVideoResponse,
} from "@/lib/domain/contracts";

import { getCountryMetadata } from "@/lib/travel-support/country-metadata";

const SOCIAL_VIDEO_MAX_QUERIES = 8;
const SOCIAL_VIDEO_MIN_SCORE = 40;
const SOCIAL_VIDEO_FALLBACK_MIN_SCORE = 24;
const SOCIAL_VIDEO_MIN_KOREAN_SIGNAL_SCORE = 8;

const vibeSearchLabels: Record<RecommendationQuery["vibes"][number], string> = {
  romance: "야경",
  food: "맛집",
  nature: "자연",
  city: "도시",
  shopping: "쇼핑",
  beach: "해변",
  nightlife: "야경",
  culture: "문화",
  family: "가족",
  luxury: "럭셔리",
  desert: "사막",
};

const evidenceStopwords = new Set([
  "추천",
  "메모",
  "영상",
  "브이로그",
  "여행",
  "여행지",
  "후기",
  "정리",
  "정보",
  "포인트",
  "장면",
  "클립",
  "리뷰",
  "한국인",
  "korean",
  "travel",
  "video",
  "youtube",
]);

const socialVideoHintTerms = ["한국인", "한국어", "korean"];
const negativeTravelIntentTerms = [
  "안전",
  "위험",
  "경보",
  "주의",
  "치안",
  "뉴스",
  "속보",
  "사기",
  "범죄",
  "고어",
  "news",
  "scam",
  "fraud",
  "crime",
  "gore",
  "crime",
  "danger",
  "safe",
  "safety",
  "warning",
];
const positiveTravelIntentTerms = ["여행", "브이로그", "vlog", "휴가", "trip"];
const YOUTUBE_SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";
const SOCIAL_VIDEO_CACHE_TTL_SECONDS = 10_800;

let cachedYouTubeApiKeyFromDotenv: string | null | undefined;

type SocialVideoNameSource = {
  nameKo: string;
  nameEn: string;
  countryName: string;
  countryCode: string;
};

export type SocialVideoLeadEvidence = {
  label: string;
  detail: string;
  sourceLabel: string;
  sourceUrl?: string | null;
};

type YouTubeSearchResponse = {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      channelId?: string;
      publishedAt?: string;
      defaultAudioLanguage?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
};

type YouTubeVideosResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: {
      duration?: string;
      licensedContent?: boolean;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
    status?: {
      embeddable?: boolean;
      privacyStatus?: string;
    };
    snippet?: {
      defaultAudioLanguage?: string;
      defaultLanguage?: string;
    };
  }>;
};

export type SocialVideoSearchContext = {
  destination: DestinationProfile;
  query: RecommendationQuery;
  leadEvidence?: ReadonlyArray<SocialVideoLeadEvidence>;
};

type SocialVideoFallbackReason = "api-disabled" | "quota-exceeded" | "request-failed" | "low-confidence" | "no-candidates";

export type SocialVideoCandidate = {
  id: string;
  title: string;
  channelTitle: string;
  channelId?: string | null;
  url: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
  description?: string | null;
  publishedAt?: string | null;
  languageHint?: string | null;
  creatorCountryCode?: string | null;
  viewCount?: number | null;
  likeCount?: number | null;
  commentCount?: number | null;
};

export type SocialVideoScoreBreakdown = {
  destinationRelevance: number;
  koreanSignals: number;
  freshness: number;
  engagementQuality: number;
  durationPreference: number;
  total: number;
};

export type SocialVideoScoredCandidate = {
  candidate: SocialVideoCandidate;
  score: SocialVideoScoreBreakdown;
};

function parseIsoDurationToSeconds(duration: string | undefined) {
  if (!duration) {
    return null;
  }

  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/u.exec(duration);

  if (!match) {
    return null;
  }

  const [, hours, minutes, seconds] = match;
  return (Number(hours ?? 0) * 3600) + (Number(minutes ?? 0) * 60) + Number(seconds ?? 0);
}

function parseYouTubeCount(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getYouTubeApiKey() {
  const directApiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (directApiKey) {
    return directApiKey;
  }

  if (cachedYouTubeApiKeyFromDotenv !== undefined) {
    return cachedYouTubeApiKeyFromDotenv ?? "";
  }

  try {
    const dotenvPath = resolve(process.cwd(), ".env.local");

    if (!existsSync(dotenvPath)) {
      cachedYouTubeApiKeyFromDotenv = null;
      return "";
    }

    const parsed = parseDotenv(readFileSync(dotenvPath, "utf8"));
    const fallbackApiKey = parsed.YOUTUBE_API_KEY?.trim();

    cachedYouTubeApiKeyFromDotenv = fallbackApiKey || null;
    return cachedYouTubeApiKeyFromDotenv ?? "";
  } catch {
    cachedYouTubeApiKeyFromDotenv = null;
    return "";
  }
}

function formatChannelUrl(channelId: string | undefined) {
  return channelId ? `https://www.youtube.com/channel/${channelId}` : "https://www.youtube.com";
}

/**
 * 주어진 값을 검색 친화적으로 정규화한다.
 * @param value 원문 문자열
 * @returns 비교용 정규화 문자열
 */
function normalizeForSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 문자열에 한글이 포함되어 있는지 확인한다.
 * @param value 검사할 문자열
 * @returns 한글 포함 여부
 */
function hasHangul(value: string) {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/u.test(value);
}

/**
 * 중복과 공백을 제거해 검색 쿼리 목록을 정리한다.
 * @param queries 원시 쿼리 목록
 * @returns 중복 제거된 검색 쿼리 목록
 */
function dedupeQueries(queries: string[]) {
  const seen = new Set<string>();
  const uniqueQueries: string[] = [];

  for (const query of queries) {
    const normalized = normalizeForSearch(query);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    uniqueQueries.push(query.replace(/\s+/g, " ").trim());
  }

  return uniqueQueries;
}

/**
 * 목적지와 국가 메타데이터를 검색 쿼리 용도로 정리한다.
 * @param destination 목적지 프로필
 * @returns 검색용 이름 묶음
 */
function buildSocialVideoNameSource(destination: DestinationProfile): SocialVideoNameSource {
  const countryMetadata = getCountryMetadata(destination.countryCode);

  return {
    nameKo: destination.nameKo,
    nameEn: destination.nameEn,
    countryName: countryMetadata?.countryName ?? destination.nameEn,
    countryCode: destination.countryCode,
  };
}

/**
 * 여행 분위기를 검색 언어로 바꾼다.
 * @param vibe 추천 분위기
 * @returns 검색용 분위기 키워드
 */
function mapVibeToSearchLabel(vibe: RecommendationQuery["vibes"][number]) {
  return vibeSearchLabels[vibe];
}

/**
 * 리드 증거에서 검색에 쓸 수 있는 키워드를 뽑는다.
 * @param leadEvidence 추천 리드 증거
 * @returns 짧은 검색 키워드
 */
function collectEvidenceKeywords(leadEvidence?: ReadonlyArray<SocialVideoLeadEvidence>) {
  const keywords: string[] = [];

  for (const evidence of leadEvidence ?? []) {
    for (const rawValue of [evidence.label, evidence.detail, evidence.sourceLabel]) {
      const normalized = normalizeForSearch(rawValue);

      if (!normalized) {
        continue;
      }

      for (const token of normalized.split(" ")) {
        if (token.length < 2 || evidenceStopwords.has(token)) {
          continue;
        }

        if (!hasHangul(token) && !/[a-z]/.test(token)) {
          continue;
        }

        keywords.push(token);
      }
    }
  }

  return Array.from(new Set(keywords)).slice(0, 2);
}

/**
 * 추천 조건에 맞는 YouTube 검색어 후보를 만든다.
 * @param context 리드 목적지와 추천 질의
 * @returns YouTube 검색어 후보 목록
 */
export function buildSocialVideoSearchQueries(context: SocialVideoSearchContext) {
  const { destination } = context;
  const names = buildSocialVideoNameSource(destination);
  return dedupeQueries([
    `${names.nameKo} 여행`,
    `${names.nameKo} 브이로그`,
  ]).slice(0, SOCIAL_VIDEO_MAX_QUERIES);
}

export function buildSocialVideoFallbackSearches(context: SocialVideoSearchContext) {
  const names = buildSocialVideoNameSource(context.destination);

  return [
    `${names.nameKo} 여행`,
    `${names.nameKo} 브이로그`,
  ].map((query) => ({
    label: query,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  }));
}

function buildFallbackMeta(context: SocialVideoSearchContext, reason: SocialVideoFallbackReason) {
  return {
    reason,
    headline:
      reason === "api-disabled"
        ? "지금은 YouTube 연결이 꺼져 있어요"
        : reason === "quota-exceeded"
          ? "지금은 YouTube 할당량이 잠시 다 찼어요"
        : reason === "request-failed"
          ? "지금은 영상을 바로 불러오지 못했어요"
          : reason === "low-confidence"
            ? "대표 영상 대신 더 넓게 찾은 후보를 보여드려요"
            : "자동 추천 대신 바로 찾을 수 있는 링크를 준비했어요",
    description:
      reason === "api-disabled"
        ? "연결이 복구되면 자동으로 대표 영상을 다시 붙여드릴게요."
        : reason === "quota-exceeded"
          ? "오늘 할당량이 다시 열리면 대표 영상을 자동으로 붙여드릴게요. 아래 검색 링크로 바로 이어 볼 수 있어요."
        : reason === "request-failed"
          ? "잠시 후 다시 시도하거나 아래 검색 링크로 바로 찾아볼 수 있어요."
          : reason === "low-confidence"
            ? "목적지와 관련은 있지만 정확도가 조금 낮아, 직접 더 확인할 수 있는 검색 링크도 함께 보여드려요."
            : "자동으로 붙일 만큼 확신 높은 영상을 찾지 못해 목적지 기준 YouTube 검색 링크를 대신 보여드려요.",
    searches: buildSocialVideoFallbackSearches(context),
  };
}

/**
 * 캐시 키 생성을 위해 검색 기준을 안정적인 문자열로 묶는다.
 * @param context 리드 목적지와 추천 질의
 * @returns 캐시 키 문자열
 */
export function buildSocialVideoCacheKey(context: SocialVideoSearchContext) {
  return [
    context.destination.id,
    context.query.partyType,
    context.query.partySize,
    context.query.budgetBand,
    context.query.tripLengthDays,
    context.query.departureAirport,
    context.query.travelMonth,
    context.query.pace,
    context.query.flightTolerance,
    context.query.vibes.join(","),
    ...collectEvidenceKeywords(context.leadEvidence),
  ]
    .map((value) => normalizeForSearch(String(value)))
    .filter(Boolean)
    .join("|");
}

/**
 * 목적지명, 국가명, 분위기와의 접점을 계산한다.
 * @param candidate 검토할 후보
 * @param context 추천 컨텍스트
 * @returns 목적지 적합 점수
 */
function scoreDestinationRelevance(candidate: SocialVideoCandidate, context: SocialVideoSearchContext) {
  const names = buildSocialVideoNameSource(context.destination);
  const title = normalizeForSearch(candidate.title);
  const description = normalizeForSearch(candidate.description ?? "");
  const channelTitle = normalizeForSearch(candidate.channelTitle);
  const evidenceKeywords = collectEvidenceKeywords(context.leadEvidence);
  const vibeKeywords = context.query.vibes
    .map((vibe) => mapVibeToSearchLabel(vibe))
    .filter(Boolean)
    .map((value) => normalizeForSearch(value));
  const destinationTerms = [
    normalizeForSearch(names.nameKo),
    normalizeForSearch(names.nameEn),
    normalizeForSearch(names.countryName),
    normalizeForSearch(names.countryCode),
  ];

  let score = 0;

  if (destinationTerms.some((term) => term && title.includes(term))) {
    score += 22;
  }

  if (destinationTerms.some((term) => term && description.includes(term))) {
    score += 8;
  }

  if (destinationTerms.some((term) => term && channelTitle.includes(term))) {
    score += 4;
  }

  if (positiveTravelIntentTerms.some((term) => title.includes(normalizeForSearch(term)))) {
    score += 8;
  }

  if (positiveTravelIntentTerms.some((term) => description.includes(normalizeForSearch(term)))) {
    score += 3;
  }

  if (vibeKeywords.some((term) => term && title.includes(term))) {
    score += 4;
  }

  if (vibeKeywords.some((term) => term && description.includes(term))) {
    score += 2;
  }

  if (evidenceKeywords.some((term) => term && (title.includes(term) || description.includes(term)))) {
    score += 3;
  }

  if (negativeTravelIntentTerms.some((term) => title.includes(normalizeForSearch(term)))) {
    score -= 28;
  }

  if (negativeTravelIntentTerms.some((term) => description.includes(normalizeForSearch(term)))) {
    score -= 16;
  }

  return Math.max(0, Math.min(score, 35));
}

/**
 * 후보의 한국어/한국인 제작 신호를 계산한다.
 * @param candidate 검토할 후보
 * @returns 한국어 선호 점수
 */
function scoreKoreanSignals(candidate: SocialVideoCandidate) {
  const title = candidate.title;
  const description = candidate.description ?? "";
  const channelTitle = candidate.channelTitle;
  const normalizedHaystack = normalizeForSearch([title, description, channelTitle].join(" "));

  let score = 0;

  if (hasHangul(title) || hasHangul(description)) {
    score += 8;
  }

  if (hasHangul(channelTitle)) {
    score += 8;
  }

  if (candidate.languageHint === "ko") {
    score += 6;
  }

  if (candidate.creatorCountryCode === "KR") {
    score += 6;
  }

  if (socialVideoHintTerms.some((term) => normalizedHaystack.includes(normalizeForSearch(term)))) {
    score += 4;
  }

  return Math.min(score, 20);
}

/**
 * 자동 추천에 쓸 만큼 한국어 제작 신호가 충분한지 확인한다.
 * @param candidate 검토할 후보
 * @returns 자동 추천 허용 여부
 */
function hasStrongKoreanPublishingSignals(candidate: SocialVideoCandidate) {
  const title = candidate.title;
  const description = candidate.description ?? "";
  const channelTitle = candidate.channelTitle;
  const languageHint = candidate.languageHint?.toLowerCase() ?? "";
  const koreanSignals = scoreKoreanSignals(candidate);

  if (koreanSignals >= SOCIAL_VIDEO_MIN_KOREAN_SIGNAL_SCORE) {
    return true;
  }

  if (hasHangul(title) || hasHangul(description) || hasHangul(channelTitle)) {
    return true;
  }

  return languageHint === "ko" || languageHint.startsWith("ko-");
}

/**
 * 게시 시점을 바탕으로 최근성 점수를 계산한다.
 * @param candidate 검토할 후보
 * @returns 최근성 점수
 */
function scoreFreshness(candidate: SocialVideoCandidate) {
  if (!candidate.publishedAt) {
    return 0;
  }

  const publishedAt = new Date(candidate.publishedAt);

  if (Number.isNaN(publishedAt.getTime())) {
    return 0;
  }

  const elapsedDays = Math.max(0, (Date.now() - publishedAt.getTime()) / 86_400_000);

  return 0;
}

function isWithinFreshnessWindow(candidate: SocialVideoCandidate) {
  if (!candidate.publishedAt) {
    return false;
  }

  const publishedAt = new Date(candidate.publishedAt);

  if (Number.isNaN(publishedAt.getTime())) {
    return false;
  }

  const elapsedDays = Math.max(0, (Date.now() - publishedAt.getTime()) / 86_400_000);
  return elapsedDays <= 730;
}

/**
 * 조회수 원값 대신 게시 후 반응 밀도를 보정한 점수를 계산한다.
 * @param candidate 검토할 후보
 * @returns 참여 품질 점수
 */
function scoreEngagementQuality(candidate: SocialVideoCandidate) {
  const publishedAt = candidate.publishedAt ? new Date(candidate.publishedAt) : null;
  const elapsedDays =
    publishedAt && !Number.isNaN(publishedAt.getTime())
      ? Math.max(1, (Date.now() - publishedAt.getTime()) / 86_400_000)
      : 30;
  const views = candidate.viewCount ?? 0;
  const likes = candidate.likeCount ?? 0;
  const comments = candidate.commentCount ?? 0;

  if (views <= 0 && likes <= 0 && comments <= 0) {
    return 0;
  }

  const absoluteReach = Math.log10(Math.max(views, 1));
  const engagementPerDay = ((likes * 2.5) + (comments * 4)) / elapsedDays;
  const viewVelocity = Math.log10(Math.max(views / elapsedDays, 1));
  const reachBonus =
    views >= 500_000 ? 8
    : views >= 200_000 ? 6
    : views >= 100_000 ? 4
    : views >= 50_000 ? 2
    : 0;
  const rawScore =
    (absoluteReach * 3.6) +
    (viewVelocity * 1.3) +
    (Math.log10(Math.max(engagementPerDay, 1)) * 1.8) +
    reachBonus;

  return Math.max(0, Math.min(22, Math.round(rawScore)));
}

/**
 * 재생 길이와 숏폼 신호를 점수화한다.
 * @param candidate 검토할 후보
 * @returns 숏폼 선호 점수
 */
function scoreDurationPreference(candidate: SocialVideoCandidate) {
  const title = normalizeForSearch(candidate.title);
  const description = normalizeForSearch(candidate.description ?? "");
  const shortFormHint = ["shorts", "쇼츠", "릴스"].some((term) => title.includes(term) || description.includes(term));

  if (typeof candidate.durationSeconds !== "number") {
    return 0;
  }

  const duration = candidate.durationSeconds;

  if (duration <= 45) {
    return 2;
  }

  if (duration <= 90) {
    return 6;
  }

  if (duration <= 180) {
    return 12;
  }

  if (duration <= 360) {
    return 18;
  }

  if (duration <= 600) {
    return 16;
  }

  if (duration <= 900) {
    return 10;
  }

  if (duration <= 1500) {
    return 4;
  }

  return shortFormHint ? 0 : 1;
}

/**
 * 후보 하나의 최종 점수를 계산한다.
 * @param candidate 검토할 후보
 * @param context 추천 컨텍스트
 * @returns 세부 점수와 총점
 */
export function scoreSocialVideoCandidate(
  candidate: SocialVideoCandidate,
  context: SocialVideoSearchContext,
): SocialVideoScoreBreakdown {
  const destinationRelevance = scoreDestinationRelevance(candidate, context);
  const koreanSignals = scoreKoreanSignals(candidate);
  const freshness = scoreFreshness(candidate);
  const engagementQuality = scoreEngagementQuality(candidate);
  const durationPreference = scoreDurationPreference(candidate);

  return {
    destinationRelevance,
    koreanSignals,
    freshness,
    engagementQuality,
    durationPreference,
    total: destinationRelevance + koreanSignals + freshness + engagementQuality + durationPreference,
  };
}

/**
 * 후보 목록을 점수순으로 정렬한다.
 * @param candidates 후보 목록
 * @param context 추천 컨텍스트
 * @returns 점수 정보가 포함된 정렬 목록
 */
export function rankSocialVideoCandidates(
  candidates: SocialVideoCandidate[],
  context: SocialVideoSearchContext,
): SocialVideoScoredCandidate[] {
  return candidates
    .filter((candidate) => isWithinFreshnessWindow(candidate))
    .filter((candidate) => hasStrongKoreanPublishingSignals(candidate))
    .map((candidate) => ({
      candidate,
      score: scoreSocialVideoCandidate(candidate, context),
    }))
    .sort((left, right) => {
      if (right.score.total !== left.score.total) {
        return right.score.total - left.score.total;
      }

      if (right.score.destinationRelevance !== left.score.destinationRelevance) {
        return right.score.destinationRelevance - left.score.destinationRelevance;
      }

      if (right.score.koreanSignals !== left.score.koreanSignals) {
        return right.score.koreanSignals - left.score.koreanSignals;
      }

      if (right.score.engagementQuality !== left.score.engagementQuality) {
        return right.score.engagementQuality - left.score.engagementQuality;
      }

      const leftViewCount = left.candidate.viewCount ?? 0;
      const rightViewCount = right.candidate.viewCount ?? 0;

      if (rightViewCount !== leftViewCount) {
        return rightViewCount - leftViewCount;
      }

      if (right.score.freshness !== left.score.freshness) {
        return right.score.freshness - left.score.freshness;
      }

      if (right.score.durationPreference !== left.score.durationPreference) {
        return right.score.durationPreference - left.score.durationPreference;
      }

      const leftDuration = left.candidate.durationSeconds ?? Number.POSITIVE_INFINITY;
      const rightDuration = right.candidate.durationSeconds ?? Number.POSITIVE_INFINITY;

      if (leftDuration !== rightDuration) {
        return leftDuration - rightDuration;
      }

      const leftPublishedAt = left.candidate.publishedAt ?? "";
      const rightPublishedAt = right.candidate.publishedAt ?? "";

      if (leftPublishedAt !== rightPublishedAt) {
        return rightPublishedAt.localeCompare(leftPublishedAt);
      }

      const titleComparison = left.candidate.title.localeCompare(right.candidate.title);

      if (titleComparison !== 0) {
        return titleComparison;
      }

      return left.candidate.id.localeCompare(right.candidate.id);
    });
}

/**
 * 점수가 충분한 후보 하나만 고른다.
 * @param candidates 후보 목록
 * @param context 추천 컨텍스트
 * @returns 선택된 후보 또는 null
 */
export function selectSocialVideoCandidate(
  candidates: SocialVideoCandidate[],
  context: SocialVideoSearchContext,
): SocialVideoScoredCandidate | null {
  const [bestCandidate] = rankSocialVideoCandidates(candidates, context);

  if (!bestCandidate || bestCandidate.score.total < SOCIAL_VIDEO_MIN_SCORE) {
    return null;
  }

  return bestCandidate;
}

function pickDiverseCandidate(
  rankedCandidates: SocialVideoScoredCandidate[],
  selectedVideoIds: Set<string>,
  selectedChannelIds: Set<string>,
  minScore: number,
  predicate?: (candidate: SocialVideoScoredCandidate) => boolean,
) {
  for (const candidate of rankedCandidates) {
    if (selectedVideoIds.has(candidate.candidate.id) || candidate.score.total < minScore) {
      continue;
    }

    if (predicate && !predicate(candidate)) {
      continue;
    }

    if (candidate.candidate.channelId && selectedChannelIds.has(candidate.candidate.channelId)) {
      continue;
    }

    return candidate;
  }

  for (const candidate of rankedCandidates) {
    if (selectedVideoIds.has(candidate.candidate.id) || candidate.score.total < minScore) {
      continue;
    }

    if (predicate && !predicate(candidate)) {
      continue;
    }

    return candidate;
  }

  return null;
}

/**
 * 메인 1개와 보조 2개까지 포함한 소셜 비디오 슬롯을 고른다.
 * @param candidates 후보 목록
 * @param context 추천 컨텍스트
 * @returns 메인 우선 정렬된 선택 결과
 */
export function selectSocialVideoCandidates(
  candidates: SocialVideoCandidate[],
  context: SocialVideoSearchContext,
  minScore = SOCIAL_VIDEO_MIN_SCORE,
): SocialVideoScoredCandidate[] {
  const rankedCandidates = rankSocialVideoCandidates(candidates, context);
  const primaryCandidate = rankedCandidates[0];

  if (!primaryCandidate || primaryCandidate.score.total < minScore) {
    return [];
  }

  const selected: SocialVideoScoredCandidate[] = [primaryCandidate];
  const selectedVideoIds = new Set([primaryCandidate.candidate.id]);
  const selectedChannelIds = new Set(
    primaryCandidate.candidate.channelId ? [primaryCandidate.candidate.channelId] : [],
  );

  while (selected.length < 3) {
    const fallbackCandidate = pickDiverseCandidate(
      rankedCandidates,
      selectedVideoIds,
      selectedChannelIds,
      minScore,
    );

    if (!fallbackCandidate) {
      break;
    }

    selected.push(fallbackCandidate);
    selectedVideoIds.add(fallbackCandidate.candidate.id);
    if (fallbackCandidate.candidate.channelId) {
      selectedChannelIds.add(fallbackCandidate.candidate.channelId);
    }
  }

  return selected.slice(0, 3);
}

async function fetchYouTubeSearchResults(
  query: string,
  apiKey: string,
  options?: {
    order?: "relevance" | "date";
    publishedAfter?: string;
  },
) {
  const searchParams = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    type: "video",
    maxResults: "8",
    order: options?.order ?? "relevance",
    q: query,
    relevanceLanguage: "ko",
    safeSearch: "moderate",
  });

  if (options?.publishedAfter) {
    searchParams.set("publishedAfter", options.publishedAfter);
  }

  const response = await fetch(`${YOUTUBE_SEARCH_ENDPOINT}?${searchParams.toString()}`, {
    headers: {
      accept: "application/json",
    },
    next: {
      revalidate: SOCIAL_VIDEO_CACHE_TTL_SECONDS,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");

    if (response.status === 403 && errorText.includes("quotaExceeded")) {
      throw new Error("YOUTUBE_QUOTA_EXCEEDED");
    }

    return null;
  }

  return (await response.json()) as YouTubeSearchResponse;
}

async function fetchYouTubeVideoDetails(videoIds: string[], apiKey: string) {
  if (videoIds.length === 0) {
    return new Map<string, NonNullable<YouTubeVideosResponse["items"]>[number]>();
  }

  const searchParams = new URLSearchParams({
    key: apiKey,
    part: "contentDetails,status,snippet,statistics",
    id: videoIds.join(","),
    maxResults: String(videoIds.length),
  });
  const response = await fetch(`${YOUTUBE_VIDEOS_ENDPOINT}?${searchParams.toString()}`, {
    headers: {
      accept: "application/json",
    },
    next: {
      revalidate: SOCIAL_VIDEO_CACHE_TTL_SECONDS,
    },
  });

  if (!response.ok) {
    return new Map<string, NonNullable<YouTubeVideosResponse["items"]>[number]>();
  }

  const payload = (await response.json()) as YouTubeVideosResponse;
  return new Map(
    (payload.items ?? [])
      .filter((item): item is NonNullable<typeof item> & { id: string } => Boolean(item?.id))
      .map((item) => [item.id, item]),
  );
}

function hydrateCandidatesFromYouTube(
  searchPayload: YouTubeSearchResponse,
  detailsMap: Map<string, NonNullable<YouTubeVideosResponse["items"]>[number]>,
) {
  return (searchPayload.items ?? []).flatMap((item) => {
    const videoId = item.id?.videoId;
    const snippet = item.snippet;

    if (!videoId || !snippet?.title || !snippet.channelTitle) {
      return [];
    }

    const details = detailsMap.get(videoId);

    if (details?.status?.privacyStatus === "private") {
      return [];
    }

    const thumbnailUrl =
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url;

    if (!thumbnailUrl) {
      return [];
    }

    return [
      {
        id: videoId,
        title: snippet.title,
        channelTitle: snippet.channelTitle,
        channelId: snippet.channelId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl,
        durationSeconds: parseIsoDurationToSeconds(details?.contentDetails?.duration),
        description: snippet.description,
        publishedAt: snippet.publishedAt,
        languageHint: details?.snippet?.defaultAudioLanguage ?? details?.snippet?.defaultLanguage ?? snippet.defaultAudioLanguage,
        viewCount: parseYouTubeCount(details?.statistics?.viewCount),
        likeCount: parseYouTubeCount(details?.statistics?.likeCount),
        commentCount: parseYouTubeCount(details?.statistics?.commentCount),
      } satisfies SocialVideoCandidate,
    ];
  });
}

/**
 * YouTube에서 대표 추천용 소셜 비디오 최대 3개를 고른다.
 * @param context 리드 목적지와 추천 질의
 * @returns 메인 우선 정렬된 비디오 목록
 */
export async function getLeadSocialVideos(context: SocialVideoSearchContext): Promise<SocialVideoItem[]> {
  const apiKey = getYouTubeApiKey();

  if (!apiKey) {
    return [];
  }

  const candidatesById = new Map<string, SocialVideoCandidate>();

  for (const query of buildSocialVideoSearchQueries(context)) {
    const searchPayload = await fetchYouTubeSearchResults(query, apiKey, {
      order: "relevance",
    });

    if (!searchPayload?.items?.length) {
      continue;
    }

    const videoIds = searchPayload.items
      .map((item) => item.id?.videoId)
      .filter((value): value is string => Boolean(value));
    const detailsMap = await fetchYouTubeVideoDetails(videoIds, apiKey);

    for (const candidate of hydrateCandidatesFromYouTube(searchPayload, detailsMap)) {
      candidatesById.set(candidate.id, candidate);
    }

    if (candidatesById.size >= 12) {
      break;
    }
  }

  return selectSocialVideoCandidates(Array.from(candidatesById.values()), context).map((selected) => ({
    provider: "youtube",
    videoId: selected.candidate.id,
    title: selected.candidate.title,
    channelTitle: selected.candidate.channelTitle,
    channelUrl: formatChannelUrl(selected.candidate.channelId ?? undefined),
    videoUrl: selected.candidate.url,
    thumbnailUrl: selected.candidate.thumbnailUrl,
    publishedAt: selected.candidate.publishedAt ?? new Date(0).toISOString(),
    durationSeconds: selected.candidate.durationSeconds ?? 1,
    viewCount: selected.candidate.viewCount ?? undefined,
  }));
}

export async function getLeadSocialVideoResult(context: SocialVideoSearchContext): Promise<SocialVideoResponse> {
  const apiKey = getYouTubeApiKey();

  if (!apiKey) {
    return {
      status: "fallback",
      item: null,
      items: [],
      fallback: buildFallbackMeta(context, "api-disabled"),
    };
  }

  try {
    const strictItems = await getLeadSocialVideos(context);
    if (strictItems.length > 0) {
      return {
        status: "ok",
        item: strictItems[0]!,
        items: strictItems,
      };
    }

    const candidatesById = new Map<string, SocialVideoCandidate>();

    for (const query of buildSocialVideoSearchQueries(context)) {
      const searchPayload = await fetchYouTubeSearchResults(query, apiKey, { order: "relevance" });
      if (!searchPayload?.items?.length) {
        continue;
      }

      const videoIds = searchPayload.items
        .map((item) => item.id?.videoId)
        .filter((value): value is string => Boolean(value));
      const detailsMap = await fetchYouTubeVideoDetails(videoIds, apiKey);

      for (const candidate of hydrateCandidatesFromYouTube(searchPayload, detailsMap)) {
        candidatesById.set(candidate.id, candidate);
      }
    }

    const fallbackSelection = selectSocialVideoCandidates(
      Array.from(candidatesById.values()),
      context,
      SOCIAL_VIDEO_FALLBACK_MIN_SCORE,
    ).map((selected) => ({
      provider: "youtube" as const,
      videoId: selected.candidate.id,
      title: selected.candidate.title,
      channelTitle: selected.candidate.channelTitle,
      channelUrl: formatChannelUrl(selected.candidate.channelId ?? undefined),
      videoUrl: selected.candidate.url,
      thumbnailUrl: selected.candidate.thumbnailUrl,
      publishedAt: selected.candidate.publishedAt ?? new Date(0).toISOString(),
      durationSeconds: selected.candidate.durationSeconds ?? 1,
      viewCount: selected.candidate.viewCount ?? undefined,
    }));

    if (fallbackSelection.length > 0) {
      return {
        status: "fallback",
        item: fallbackSelection[0] ?? null,
        items: fallbackSelection,
        fallback: buildFallbackMeta(context, "low-confidence"),
      };
    }

    return {
      status: "fallback",
      item: null,
      items: [],
      fallback: buildFallbackMeta(context, "no-candidates"),
    };
  } catch (error) {
    if (error instanceof Error && error.message === "YOUTUBE_QUOTA_EXCEEDED") {
      return {
        status: "fallback",
        item: null,
        items: [],
        fallback: buildFallbackMeta(context, "quota-exceeded"),
      };
    }

    throw error;
  }
}
