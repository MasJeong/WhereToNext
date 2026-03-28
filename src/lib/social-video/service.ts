import type {
  DestinationProfile,
  RecommendationQuery,
  SocialVideoItem,
} from "@/lib/domain/contracts";

import { getCountryMetadata } from "@/lib/travel-support/country-metadata";

const SOCIAL_VIDEO_MAX_QUERIES = 8;
const SOCIAL_VIDEO_MIN_SCORE = 40;

const vibeSearchLabels: Record<RecommendationQuery["vibes"][number], string> = {
  romance: "로맨틱",
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
  "travel",
  "video",
  "youtube",
]);

const socialVideoHintTerms = ["한국인", "한국어", "korean", "shorts", "쇼츠"];
const YOUTUBE_SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";
const SOCIAL_VIDEO_CACHE_TTL_SECONDS = 10_800;

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
};

export type SocialVideoScoreBreakdown = {
  destinationRelevance: number;
  koreanSignals: number;
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

function getYouTubeApiKey() {
  return process.env.YOUTUBE_API_KEY?.trim() ?? "";
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
  const { destination, query, leadEvidence } = context;
  const names = buildSocialVideoNameSource(destination);
  const evidenceKeywords = collectEvidenceKeywords(leadEvidence);
  const primaryVibe = mapVibeToSearchLabel(query.vibes[0]);
  const secondaryVibe = query.vibes[1] ? mapVibeToSearchLabel(query.vibes[1]) : "";

  const queries = [
    `${names.nameKo} 여행 브이로그`,
    `${names.nameKo} 여행 쇼츠`,
    `${names.nameKo} 한국인 여행`,
    `${names.nameKo} ${primaryVibe} 여행`,
    `${names.nameEn} travel vlog`,
    `${names.nameEn} travel shorts`,
    `${names.nameEn} korean travel vlog`,
    `${names.countryName} travel guide`,
    `${names.nameKo} ${secondaryVibe} 여행`,
  ];

  if (evidenceKeywords[0]) {
    queries.splice(2, 0, `${names.nameKo} ${evidenceKeywords[0]} 여행`);
  }

  if (evidenceKeywords[1]) {
    queries.splice(5, 0, `${names.nameEn} ${evidenceKeywords[1]} travel`);
  }

  return dedupeQueries(queries).slice(0, SOCIAL_VIDEO_MAX_QUERIES);
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

  if (vibeKeywords.some((term) => term && title.includes(term))) {
    score += 4;
  }

  if (vibeKeywords.some((term) => term && description.includes(term))) {
    score += 2;
  }

  if (evidenceKeywords.some((term) => term && (title.includes(term) || description.includes(term)))) {
    score += 3;
  }

  return Math.min(score, 35);
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
    score += 6;
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
 * 재생 길이와 숏폼 신호를 점수화한다.
 * @param candidate 검토할 후보
 * @returns 숏폼 선호 점수
 */
function scoreDurationPreference(candidate: SocialVideoCandidate) {
  const title = normalizeForSearch(candidate.title);
  const description = normalizeForSearch(candidate.description ?? "");
  const shortsHint = ["shorts", "쇼츠", "릴스"].some((term) => title.includes(term) || description.includes(term));

  if (typeof candidate.durationSeconds !== "number") {
    return shortsHint ? 8 : 0;
  }

  const duration = candidate.durationSeconds;

  if (duration <= 30) {
    return 18;
  }

  if (duration <= 60) {
    return 16;
  }

  if (duration <= 90) {
    return 14;
  }

  if (duration <= 120) {
    return 12;
  }

  if (duration <= 180) {
    return 10;
  }

  if (duration <= 300) {
    return 6;
  }

  if (duration <= 600) {
    return 3;
  }

  return shortsHint ? 1 : 0;
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
  const durationPreference = scoreDurationPreference(candidate);

  return {
    destinationRelevance,
    koreanSignals,
    durationPreference,
    total: destinationRelevance + koreanSignals + durationPreference,
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

async function fetchYouTubeSearchResults(query: string, apiKey: string) {
  const searchParams = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    type: "video",
    maxResults: "8",
    order: "relevance",
    q: query,
    relevanceLanguage: "ko",
    safeSearch: "moderate",
  });
  const response = await fetch(`${YOUTUBE_SEARCH_ENDPOINT}?${searchParams.toString()}`, {
    headers: {
      accept: "application/json",
    },
    next: {
      revalidate: SOCIAL_VIDEO_CACHE_TTL_SECONDS,
    },
  });

  if (!response.ok) {
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
    part: "contentDetails,status,snippet",
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

    if (details?.status?.privacyStatus === "private" || details?.status?.embeddable === false) {
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
      } satisfies SocialVideoCandidate,
    ];
  });
}

/**
 * YouTube에서 대표 추천용 소셜 비디오 1개를 고른다.
 * @param context 리드 목적지와 추천 질의
 * @returns 선택된 비디오 또는 null
 */
export async function getLeadSocialVideo(context: SocialVideoSearchContext): Promise<SocialVideoItem | null> {
  const apiKey = getYouTubeApiKey();

  if (!apiKey) {
    return null;
  }

  const candidates: SocialVideoCandidate[] = [];

  for (const query of buildSocialVideoSearchQueries(context)) {
    const searchPayload = await fetchYouTubeSearchResults(query, apiKey);

    if (!searchPayload?.items?.length) {
      continue;
    }

    const videoIds = searchPayload.items
      .map((item) => item.id?.videoId)
      .filter((value): value is string => Boolean(value));
    const detailsMap = await fetchYouTubeVideoDetails(videoIds, apiKey);

    candidates.push(...hydrateCandidatesFromYouTube(searchPayload, detailsMap));

    const selected = selectSocialVideoCandidate(candidates, context);

    if (selected) {
      return {
        provider: "youtube",
        videoId: selected.candidate.id,
        title: selected.candidate.title,
        channelTitle: selected.candidate.channelTitle,
        channelUrl: formatChannelUrl(selected.candidate.channelId ?? undefined),
        videoUrl: selected.candidate.url,
        thumbnailUrl: selected.candidate.thumbnailUrl,
        publishedAt: selected.candidate.publishedAt ?? new Date(0).toISOString(),
        durationSeconds: selected.candidate.durationSeconds ?? 1,
      };
    }
  }

  return null;
}
