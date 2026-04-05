"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { RecommendationQuery, SocialVideoItem, SocialVideoResponse } from "@/lib/domain/contracts";
import { buildApiUrl } from "@/lib/runtime/url";
import { testIds } from "@/lib/test-ids";

type LeadSocialVideoPanelProps = {
  destinationId: string;
  destinationName: string;
  leadReason: string;
  query: RecommendationQuery;
};

type SocialVideoPanelState = {
  requestKey: string;
  items: SocialVideoItem[];
  resolved: boolean;
  fallback: {
    reason: string;
    headline: string;
    description: string;
    searches: Array<{ label: string; url: string }>;
  } | null;
  status: SocialVideoResponse["status"] | null;
};

type SocialVideoSlotProps = {
  item: SocialVideoItem | null;
  title: string;
  isMain?: boolean;
  isResolved: boolean;
  leadReason: string;
  destinationName: string;
  fallbackNote: string;
};

function isSocialVideoItem(value: unknown): value is SocialVideoItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.provider === "string" &&
    candidate.provider === "youtube" &&
    typeof candidate.videoId === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.channelTitle === "string" &&
    typeof candidate.channelUrl === "string" &&
    typeof candidate.videoUrl === "string" &&
    typeof candidate.thumbnailUrl === "string" &&
    typeof candidate.publishedAt === "string" &&
    typeof candidate.durationSeconds === "number" &&
    (candidate.viewCount === undefined || typeof candidate.viewCount === "number")
  );
}

function extractSocialVideoItems(payload: unknown): SocialVideoItem[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (record.status === "ok") {
    if (Array.isArray(record.items)) {
      return record.items.filter(isSocialVideoItem).slice(0, 3);
    }

    if (isSocialVideoItem(record.item)) {
      return [record.item];
    }

    return [];
  }

  if (Array.isArray(record.items)) {
    return record.items.filter(isSocialVideoItem).slice(0, 3);
  }

  if (isSocialVideoItem(record.item)) {
    return [record.item];
  }

  return [];
}

function extractSocialVideoFallback(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const fallback = record.fallback;

  if (!fallback || typeof fallback !== "object") {
    return null;
  }

  const candidate = fallback as Record<string, unknown>;

  if (
    typeof candidate.headline !== "string" ||
    typeof candidate.description !== "string" ||
    !Array.isArray(candidate.searches)
  ) {
    return null;
  }

  return {
    reason: typeof candidate.reason === "string" ? candidate.reason : "no-candidates",
    headline: candidate.headline,
    description: candidate.description,
    searches: candidate.searches.filter(
      (item): item is { label: string; url: string } =>
        Boolean(
          item &&
            typeof item === "object" &&
            typeof (item as { label?: unknown }).label === "string" &&
            typeof (item as { url?: unknown }).url === "string",
        ),
    ),
  };
}

function buildClientSideFallback(destinationName: string) {
  return {
    reason: "request-failed",
    headline: "지금은 영상을 바로 불러오지 못했어요",
    description: "잠시 후 다시 시도하거나 아래 YouTube 검색 링크로 바로 확인해 보세요.",
    searches: [
      `${destinationName} 여행 브이로그`,
      `${destinationName} 여행 가이드`,
      `${destinationName} 여행 쇼츠`,
    ].map((query) => ({
      label: query,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    })),
  };
}

function buildSocialVideoFallbackItems(items: SocialVideoItem[]) {
  return [items[0] ?? null, items[1] ?? null, items[2] ?? null];
}

function formatPublishedLabel(isoString: string | undefined) {
  if (!isoString) {
    return "최근 업로드";
  }

  const publishedAt = new Date(isoString);

  if (Number.isNaN(publishedAt.getTime())) {
    return "최근 업로드";
  }

  const elapsedMs = Date.now() - publishedAt.getTime();
  const elapsedDays = Math.max(0, Math.round(elapsedMs / 86_400_000));

  if (elapsedDays === 0) {
    return "오늘";
  }

  if (elapsedDays < 7) {
    return `${elapsedDays}일 전`;
  }

  const elapsedWeeks = Math.max(1, Math.round(elapsedDays / 7));

  if (elapsedWeeks < 5) {
    return `${elapsedWeeks}주 전`;
  }

  const elapsedMonths = Math.max(1, Math.round(elapsedDays / 30));
  return `${elapsedMonths}달 전`;
}

function formatDurationLabel(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (minutes === 0) {
    return `${seconds}초`;
  }

  return `${minutes}분 ${seconds.toString().padStart(2, "0")}초`;
}

function formatViewCountLabel(viewCount: number | undefined) {
  if (typeof viewCount !== "number" || !Number.isFinite(viewCount)) {
    return null;
  }

  if (viewCount >= 10_000) {
    return `조회수 ${(viewCount / 10_000).toFixed(viewCount >= 100_000 ? 0 : 1).replace(/\.0$/, "")}만`;
  }

  if (viewCount >= 1_000) {
    return `조회수 ${(viewCount / 1_000).toFixed(viewCount >= 10_000 ? 0 : 1).replace(/\.0$/, "")}천`;
  }

  return `조회수 ${viewCount}`;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * 하나의 영상 슬롯을 메인 또는 서브 카드로 렌더한다.
 * @param props 영상 슬롯 정보
 * @returns 영상 슬롯 카드
 */
function SocialVideoSlot({
  item,
  title,
  isMain = false,
  isResolved,
  leadReason,
  destinationName,
  fallbackNote,
}: SocialVideoSlotProps) {
  const mainViewCountLabel = isMain ? formatViewCountLabel(item?.viewCount) : null;
  const resolvedTitle = item ? decodeHtmlEntities(item.title) : "";
  const resolvedChannelTitle = item ? decodeHtmlEntities(item.channelTitle) : "";

  if (!item) {
    return (
      <article
        className={[
          "overflow-hidden rounded-[1.25rem] border border-[color:var(--color-funnel-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]",
          isMain ? "min-h-[18rem] sm:min-h-[24rem]" : "min-h-[12.5rem]",
        ].join(" ")}
      >
        <div
          className={[
            "flex h-full flex-col justify-between gap-4 p-4 sm:p-5",
            isMain ? "sm:flex-row sm:items-end" : "",
          ].join(" ")}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-funnel-muted)] px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              YouTube
            </span>
            <span className="text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]">
              {isResolved ? "영상 없음" : "불러오는 중"}
            </span>
          </div>

          <div className={isMain ? "max-w-xl space-y-2" : "space-y-2"}>
            <p
              className={[
                "font-semibold tracking-[-0.05em] text-[var(--color-funnel-text)]",
                isMain ? "text-[1.8rem] leading-[1] sm:text-[2.35rem]" : "text-[1.05rem] leading-6",
              ].join(" ")}
            >
              {isMain ? destinationName : destinationName}
            </p>
            <p className={isMain ? "text-[0.98rem] font-semibold leading-7 text-[var(--color-funnel-text)]" : "text-sm font-semibold leading-6 text-[var(--color-funnel-text)]"}>
              {isMain ? leadReason : fallbackNote}
            </p>
            <p className="max-w-xl text-sm leading-6 text-[var(--color-funnel-text-soft)] sm:text-[0.96rem]">
              {isMain
                ? isResolved
                  ? "지금은 메인으로 보여줄 영상이 아직 없어요. 아래 서브 슬롯은 준비되는 대로 채워집니다."
                  : "가장 먼저 보면 좋은 영상을 하나만 앞에 두었어요."
                : fallbackNote}
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <article className="rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-3">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                선택 기준
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[var(--color-funnel-text)]">
                {isMain ? "관련성·설명력 우선" : "최근성·보완 관점 우선"}
              </p>
            </article>
            <article className="rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-3">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                노출 방식
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[var(--color-funnel-text)]">
                {isMain ? "큰 카드 1개" : "작은 보조 카드"}
              </p>
            </article>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-[1.25rem] border border-[color:var(--color-funnel-border)] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
      <a
        data-testid={isMain ? testIds.socialVideo.link : undefined}
        href={item.videoUrl}
        target="_blank"
        rel="noreferrer"
        className="group block"
        aria-label={`${resolvedTitle} YouTube에서 열기`}
      >
        <div
          className={[
            "relative overflow-hidden bg-[var(--color-funnel-muted)]",
            isMain ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-[16/9]",
          ].join(" ")}
        >
          <Image
            data-testid={isMain ? testIds.socialVideo.thumbnail : undefined}
            src={item.thumbnailUrl}
            alt={`${resolvedTitle} 썸네일`}
            fill
            unoptimized
            sizes={isMain ? "(max-width: 1280px) 100vw, 46rem" : "(max-width: 640px) 100vw, 22rem"}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.18)_42%,rgba(15,23,42,0.82)_100%)]" />
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text)] shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
              YouTube
            </span>
            <span className="rounded-full border border-white/30 bg-white/12 px-3 py-1 text-[0.62rem] font-semibold text-white backdrop-blur-sm">
              {isMain ? "대표 영상" : "보조 영상"}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <div className="rounded-[1rem] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.08)_100%)] px-3 py-3 backdrop-blur-md sm:px-4">
              {title ? (
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/78">
                  {title}
                </p>
              ) : null}
              <h3
                data-testid={isMain ? testIds.socialVideo.title : undefined}
                className={[
                  `${title ? "mt-1.5" : ""} font-semibold leading-6 text-white`,
                  isMain ? "line-clamp-2 text-[1rem] sm:text-[1.12rem]" : "line-clamp-2 text-[0.94rem]",
                ].join(" ")}
              >
                {resolvedTitle}
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-white/78">
                {resolvedChannelTitle}
                {" · "}
                {formatPublishedLabel(item.publishedAt)}
                {item.durationSeconds ? ` · ${formatDurationLabel(item.durationSeconds)}` : ""}
                {mainViewCountLabel ? ` · ${mainViewCountLabel}` : ""}
              </p>
            </div>
          </div>
        </div>
      </a>

      <div
        className={[
          "flex flex-col gap-3 px-4 py-3.5",
          isMain ? "sm:flex-row sm:items-center sm:justify-between sm:px-5" : "sm:px-4",
        ].join(" ")}
      >
        <p className="text-xs leading-5 text-[var(--color-funnel-text-soft)]">
          {isMain
            ? "메인은 추천 결과를 가장 잘 설명하는 영상을 먼저 보여줘요."
            : "서브는 최근성이나 보완 관점이 좋은 영상을 작게 붙여요."}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={item.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[2.5rem] shrink-0 items-center justify-center rounded-full bg-[var(--color-action-primary)] px-4 py-2 text-[0.72rem] font-semibold tracking-[0.04em] text-white transition-colors duration-200 hover:bg-[var(--color-action-primary-strong)]"
          >
            바로 보기
          </a>
          <a
            href={item.channelUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[2.5rem] shrink-0 items-center justify-center rounded-full border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-4 py-2 text-[0.72rem] font-semibold tracking-[0.04em] text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-white"
          >
            채널 보기
          </a>
        </div>
      </div>
    </article>
  );
}

function buildSocialVideoSearchParams({
  destinationId,
  leadReason,
  query,
}: Pick<LeadSocialVideoPanelProps, "destinationId" | "leadReason" | "query">) {
  const searchParams = new URLSearchParams();

  searchParams.set("destinationId", destinationId);
  searchParams.set("leadEvidenceLabel", "추천 메모");
  searchParams.set("leadEvidenceDetail", leadReason);
  searchParams.set("leadEvidenceSourceLabel", "Recommendation");
  searchParams.set("partyType", query.partyType);
  searchParams.set("partySize", String(query.partySize));
  searchParams.set("budgetBand", query.budgetBand);
  searchParams.set("tripLengthDays", String(query.tripLengthDays));
  searchParams.set("departureAirport", query.departureAirport);
  searchParams.set("travelMonth", String(query.travelMonth));
  searchParams.set("pace", query.pace);
  searchParams.set("flightTolerance", query.flightTolerance);
  searchParams.set("vibes", query.vibes.join(","));

  return searchParams;
}

/**
 * 대표 추천 1위 카드에만 붙는 실시간 소셜 비디오 참고 블록을 렌더한다.
 * @param props lead 카드와 추천 질의
 * @returns social video block or null
 */
export function LeadSocialVideoPanel({ destinationId, destinationName, leadReason, query }: LeadSocialVideoPanelProps) {
  const requestIdRef = useRef(0);
  const requestKey = buildSocialVideoSearchParams({ destinationId, leadReason, query }).toString();
  const [state, setState] = useState<SocialVideoPanelState>({
    requestKey: "",
    items: [],
    resolved: false,
    fallback: null,
    status: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    async function loadSocialVideo() {
      try {
        const response = await fetch(buildApiUrl(`/api/social-video?${requestKey}`), {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (!controller.signal.aborted && requestIdRef.current === requestId) {
            setState({
              requestKey,
              items: [],
              resolved: true,
              fallback: buildClientSideFallback(destinationName),
              status: "fallback",
            });
          }
          return;
        }

        const payload = (await response.json()) as SocialVideoResponse;

        if (requestIdRef.current !== requestId) {
          return;
        }

        setState({
          requestKey,
          items: extractSocialVideoItems(payload),
          resolved: true,
          fallback: extractSocialVideoFallback(payload),
          status: payload.status,
        });
      } catch {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setState({
            requestKey,
            items: [],
            resolved: true,
            fallback: buildClientSideFallback(destinationName),
            status: "fallback",
          });
        }
      }
    }

    void loadSocialVideo();

    return () => {
      controller.abort();
    };
  }, [destinationName, requestKey]);

  const isCurrentRequest = state.requestKey === requestKey;
  const items = isCurrentRequest ? state.items : [];
  const isResolved = isCurrentRequest && state.resolved;
  const fallback = isCurrentRequest ? state.fallback : null;
  const [mainItem, subOne, subTwo] = buildSocialVideoFallbackItems(items);

  if (isResolved && fallback && items.length === 0) {
    return (
      <section data-testid={testIds.socialVideo.block} className="space-y-4">
        <section
          data-testid={testIds.socialVideo.fallbackBlock}
          className="rounded-[1.2rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-4 py-4 sm:px-5"
        >
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
            YouTube 대안 경로
          </p>
          <h3 className="mt-2 text-[1rem] font-semibold tracking-[-0.03em] text-[var(--color-funnel-text)]">
            {fallback.headline}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-funnel-text-soft)]">{fallback.description}</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {fallback.searches.map((search, index) => (
              <a
                key={search.url}
                data-testid={index === 0 ? testIds.socialVideo.fallbackLink0 : undefined}
                href={search.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[2.5rem] items-center rounded-full border border-[color:var(--color-funnel-border)] bg-white px-4 py-2 text-[0.72rem] font-semibold tracking-[0.04em] text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-[var(--color-funnel-muted)]"
              >
                {search.label}
              </a>
            ))}
          </div>
        </section>
      </section>
    );
  }

  return (
    <section data-testid={testIds.socialVideo.block} className="space-y-4">
      {isResolved && fallback ? (
        <section
          data-testid={testIds.socialVideo.fallbackBlock}
          className="rounded-[1.2rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-4 py-4 sm:px-5"
        >
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
            YouTube 대안 경로
          </p>
          <h3 className="mt-2 text-[1rem] font-semibold tracking-[-0.03em] text-[var(--color-funnel-text)]">
            {fallback.headline}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-funnel-text-soft)]">{fallback.description}</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {fallback.searches.map((search, index) => (
              <a
                key={search.url}
                data-testid={index === 0 ? testIds.socialVideo.fallbackLink0 : undefined}
                href={search.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[2.5rem] items-center rounded-full border border-[color:var(--color-funnel-border)] bg-white px-4 py-2 text-[0.72rem] font-semibold tracking-[0.04em] text-[var(--color-funnel-text)] transition-colors duration-200 hover:bg-[var(--color-funnel-muted)]"
              >
                {search.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <SocialVideoSlot
        item={mainItem}
        title="가장 먼저 볼 영상"
        isMain
        isResolved={isResolved}
        leadReason={leadReason}
        destinationName={destinationName}
        fallbackNote="메인은 추천 결과를 가장 잘 설명하는 영상을 먼저 보여줘요."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <SocialVideoSlot
          item={subOne}
          title=""
          isResolved={isResolved}
          leadReason={leadReason}
          destinationName={destinationName}
          fallbackNote="최근성이나 다른 관점에서 함께 보면 좋은 영상이에요."
        />
        <SocialVideoSlot
          item={subTwo}
          title=""
          isResolved={isResolved}
          leadReason={leadReason}
          destinationName={destinationName}
          fallbackNote="메인과 결이 다른 보조 영상을 함께 붙여요."
        />
      </div>
    </section>
  );
}
