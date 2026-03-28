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
  item: SocialVideoItem | null;
  resolved: boolean;
};

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
  const [state, setState] = useState<SocialVideoPanelState>({ requestKey: "", item: null, resolved: false });

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
              item: null,
              resolved: true,
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
          item: payload.status === "ok" ? payload.item : null,
          resolved: true,
        });
      } catch {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setState({
            requestKey,
            item: null,
            resolved: true,
          });
        }
      }
    }

    void loadSocialVideo();

    return () => {
      controller.abort();
    };
  }, [requestKey]);

  const isCurrentRequest = state.requestKey === requestKey;
  const item = isCurrentRequest ? state.item : null;
  const isResolved = isCurrentRequest && state.resolved;

  if (!item) {
    return (
      <section className="overflow-hidden rounded-[1.45rem] border border-[color:var(--color-funnel-border)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex min-h-[21rem] flex-col justify-between bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-funnel-muted)] px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
              YouTube
            </span>
            <span className="text-[0.72rem] font-semibold text-[var(--color-funnel-text-soft)]">
              {isResolved ? "영상 없음" : "불러오는 중"}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-[2rem] font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--color-funnel-text)] sm:text-[2.6rem]">
              {destinationName}
            </p>
            <p className="text-[1rem] font-semibold leading-7 text-[var(--color-funnel-text)]">{leadReason}</p>
            <p className="max-w-xl text-sm leading-6 text-[var(--color-funnel-text-soft)] sm:text-[0.96rem]">
              {isResolved
                ? "지금은 바로 붙일 만한 영상을 찾지 못했어요. 오른쪽 핵심 정보와 아래 후보 비교만으로도 빠르게 판단할 수 있게 정리해뒀어요."
                : "한국어 여행 브이로그와 짧은 영상을 우선 찾고 있어요. 준비되면 이 자리에 대표 영상을 가장 먼저 보여드려요."}
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <article className="rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-3">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                선택 기준
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[var(--color-funnel-text)]">한국어·한국인 업로드 우선</p>
            </article>
            <article className="rounded-[1.1rem] border border-[color:var(--color-funnel-border)] bg-white px-4 py-3">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
                노출 방식
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[var(--color-funnel-text)]">짧은 영상 우선, 없으면 일반 영상</p>
            </article>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid={testIds.socialVideo.block}
      className="overflow-hidden rounded-[1.45rem] border border-[color:var(--color-funnel-border)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
    >
      <a
        data-testid={testIds.socialVideo.link}
        href={item.videoUrl}
        target="_blank"
        rel="noreferrer"
        className="group block"
        aria-label={`${item.title} YouTube에서 열기`}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-funnel-muted)]">
          <Image
            data-testid={testIds.socialVideo.thumbnail}
            src={item.thumbnailUrl}
            alt={`${item.title} 썸네일`}
            fill
            unoptimized
            sizes="(max-width: 1280px) 100vw, 40rem"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.14)_38%,rgba(15,23,42,0.78)_100%)]" />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text)] shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
              YouTube
            </span>
            <span className="rounded-full border border-white/30 bg-white/12 px-3 py-1 text-[0.66rem] font-semibold text-white backdrop-blur-sm">
              영상으로 먼저 보기
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="rounded-[1.15rem] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.08)_100%)] px-4 py-4 backdrop-blur-md">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-white/78">
                대표 참고 영상
              </p>
              <h3
                data-testid={testIds.socialVideo.title}
                className="mt-2 line-clamp-2 text-[1.05rem] font-semibold leading-6 text-white sm:text-[1.15rem]"
              >
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-white/78">
                {item.channelTitle}
                {" · "}
                {formatPublishedLabel(item.publishedAt)}
                {item.durationSeconds ? ` · ${formatDurationLabel(item.durationSeconds)}` : ""}
              </p>
            </div>
          </div>
        </div>
      </a>

      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs leading-5 text-[var(--color-funnel-text-soft)]">
          한국어/한국인 업로드를 우선 보고, short-form을 선호하되 맞는 영상이 없으면 일반 여행 영상까지 함께 비교했어요.
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
    </section>
  );
}
