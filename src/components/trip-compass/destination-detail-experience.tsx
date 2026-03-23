"use client";

import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import type {
  DestinationProfile,
  RecommendationQuery,
  TrendEvidenceSnapshot,
} from "@/lib/domain/contracts";
import {
  buildDestinationDetailPath,
  buildQueryNarrative,
  describeSourceBadge,
  formatBudgetBand,
  formatDestinationKind,
  formatFlightBand,
  formatFreshnessState,
  formatMonthList,
  formatPaceList,
  formatVibeList,
  type RecommendationCardView,
} from "@/lib/trip-compass/presentation";
import { buildRecommendationSnapshotPayload } from "@/lib/trip-compass/snapshot-payload";
import { getDestinationTasteTagTestId, testIds } from "@/lib/test-ids";

type DestinationDetailExperienceProps = {
  destination: DestinationProfile;
  card?: RecommendationCardView | null;
  query?: RecommendationQuery | null;
  evidence: TrendEvidenceSnapshot[];
  scoringVersionId?: string | null;
  snapshotId?: string | null;
  allowSave?: boolean;
  rootTestId?: string;
  evidenceTestId?: string;
};

type SaveState = {
  status: "idle" | "saving" | "saved" | "error";
  snapshotId?: string;
  sharePath?: string;
};

type TasteLogState = {
  rating: number;
  tags: DestinationProfile["vibeTags"];
  wouldRevisit: boolean;
  visitedAt: string;
};

type LinkCopyState = "idle" | "copied" | "error";

function buildFallbackFitLine(destination: DestinationProfile): string {
  const leadVibes = formatVibeList(destination.vibeTags.slice(0, 2));
  return `${leadVibes} 분위기를 찾고, ${formatFlightBand(destination.flightBand)} 비행과 ${formatBudgetBand(destination.budgetBand)} 감각을 원하는 여행에서 먼저 보기 좋아요.`;
}

function buildDefaultReasonList(destination: DestinationProfile): string[] {
  return [
    `${formatMonthList(destination.bestMonths)} 시즌 감각이 안정적이에요.`,
    `${formatPaceList(destination.paceTags)} 일정과 잘 어울려요.`,
    `${formatVibeList(destination.vibeTags.slice(0, 3))} 포인트를 같이 보기 좋아요.`,
  ];
}

function buildContextLine(
  destination: DestinationProfile,
  query?: RecommendationQuery | null,
): string {
  if (query) {
    return buildQueryNarrative(query);
  }

  return `${destination.summary} 흐름이 맞는지 핵심 정보부터 먼저 확인해 보세요.`;
}

function resolveSharePath(detailPath: string, saveState: SaveState, snapshotId?: string | null): string {
  return saveState.sharePath ?? (snapshotId ? `/s/${snapshotId}` : detailPath);
}

export function DestinationDetailExperience({
  destination,
  card,
  query,
  evidence,
  scoringVersionId,
  snapshotId,
  allowSave = true,
  rootTestId,
  evidenceTestId,
}: DestinationDetailExperienceProps) {
  const session = authClient.useSession();
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [tasteState, setTasteState] = useState<TasteLogState>({
    rating: 5,
    tags: destination.vibeTags.slice(0, Math.min(destination.vibeTags.length, 2)),
    wouldRevisit: true,
    visitedAt: new Date().toISOString().slice(0, 10),
  });
  const [tasteStatus, setTasteStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [linkCopyState, setLinkCopyState] = useState<LinkCopyState>("idle");
  const canSave = Boolean(allowSave && card && query && scoringVersionId);
  const reasons = card?.recommendation.reasons.slice(0, 3) ?? buildDefaultReasonList(destination);
  const fitLine = card?.recommendation.whyThisFits ?? buildFallbackFitLine(destination);
  const evidenceItems = (card?.recommendation.trendEvidence.length ? card.recommendation.trendEvidence : evidence)
    .slice(0, 2);
  const watchOuts = (card?.recommendation.watchOuts.length ? card.recommendation.watchOuts : destination.watchOuts)
    .slice(0, 3);
  const detailPath = buildDestinationDetailPath(destination, query ?? undefined, snapshotId ?? undefined);
  const sharePath = resolveSharePath(detailPath, saveState, snapshotId);
  const contextLine = buildContextLine(destination, query);
  const detailFacts = [
    {
      id: "best-months",
      label: "추천 시기",
      value: formatMonthList(destination.bestMonths),
      detail: "한국 출발 기준으로 보기 편한 시즌이에요.",
    },
    {
      id: "budget",
      label: "예산 감각",
      value: formatBudgetBand(destination.budgetBand),
      detail: "숙소와 이동 체감이 이 정도예요.",
    },
    {
      id: "flight",
      label: "비행 거리",
      value: formatFlightBand(destination.flightBand),
      detail: "연차 길이와 첫날 피로를 함께 봐요.",
    },
    {
      id: "pace",
      label: "일정 리듬",
      value: formatPaceList(destination.paceTags),
      detail: "현지에서 움직이는 속도를 가늠해요.",
    },
  ];

  async function copyAbsoluteUrl(path: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setLinkCopyState("copied");
      return true;
    } catch {
      setLinkCopyState("error");
      return false;
    }
  }

  async function handleSave() {
    if (!card || !query || !scoringVersionId) {
      return;
    }

    setSaveState({ status: "saving" });
    setLinkCopyState("idle");

    try {
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildRecommendationSnapshotPayload(query, card, scoringVersionId)),
      });

      if (!response.ok) {
        throw new Error("save-failed");
      }

      const payload = (await response.json()) as { snapshotId: string };
      const nextSharePath = `/s/${payload.snapshotId}`;

      setSaveState({
        status: "saved",
        snapshotId: payload.snapshotId,
        sharePath: nextSharePath,
      });
      await copyAbsoluteUrl(nextSharePath);
    } catch {
      setSaveState({ status: "error" });
    }
  }

  async function handleTasteSave() {
    if (!session.data?.user) {
      return;
    }

    setTasteStatus("saving");

    try {
      const response = await fetch("/api/me/history", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          destinationId: destination.id,
          rating: tasteState.rating,
          tags: tasteState.tags,
          wouldRevisit: tasteState.wouldRevisit,
          visitedAt: new Date(`${tasteState.visitedAt}T00:00:00.000Z`).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("taste-save-failed");
      }

      setTasteStatus("saved");
    } catch {
      setTasteStatus("error");
    }
  }

  function toggleTasteTag(tag: DestinationProfile["vibeTags"][number]) {
    setTasteState((currentState) => {
      if (currentState.tags.includes(tag)) {
        const nextTags = currentState.tags.filter((item) => item !== tag);
        return {
          ...currentState,
          tags: nextTags.length > 0 ? nextTags : currentState.tags,
        };
      }

      if (currentState.tags.length >= 4) {
        return currentState;
      }

      return {
        ...currentState,
        tags: [...currentState.tags, tag],
      };
    });
  }

  return (
    <div data-testid={rootTestId ?? testIds.detail.root} className="space-y-3.5 text-[var(--color-ink)]">
      <section className="compass-top-summary rounded-[var(--radius-card)] px-3.5 py-3.5 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-3 border-b border-[color:var(--color-frame-soft)] pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              목적지 상세
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              {destination.countryCode}
            </span>
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              {formatDestinationKind(destination.kind)}
            </span>
            {card ? (
              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                {card.recommendation.scoreBreakdown.total}점
              </span>
            ) : null}
            {snapshotId ? (
              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                저장된 추천
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="compass-editorial-kicker">{destination.nameEn}</p>
            <h2 className="font-display text-[1.36rem] leading-[0.96] tracking-[-0.04em] text-[var(--color-ink)] sm:text-[1.64rem]">
              {destination.nameKo}
            </h2>
            <p className="text-sm leading-6 text-[var(--color-ink)]">{fitLine}</p>
            <p className="text-sm leading-6 text-[var(--color-ink-soft)]">{destination.summary}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {destination.vibeTags.slice(0, 3).map((tag) => (
              <span key={tag} className="compass-selection-chip rounded-full px-3 py-1.5 text-xs font-semibold">
                {formatVibeList([tag])}
              </span>
            ))}
          </div>
        </div>

        <div data-testid={testIds.detail.coreFacts} className="compass-fact-grid-compact mt-3.5 sm:grid-cols-2">
          {detailFacts.map((fact) => (
            <article
              key={fact.id}
              className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5"
            >
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                {fact.label}
              </p>
              <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)] sm:text-[0.96rem]">
                {fact.value}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--color-ink-soft)]">{fact.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section data-testid={testIds.detail.fitReason} className="compass-desk rounded-[var(--radius-card)] px-3.5 py-3.5 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-2.5 border-b border-[color:var(--color-frame-soft)] pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="compass-editorial-kicker">추천 이유</span>
            {card ? (
              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                일치도 {card.recommendation.confidence}%
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-[var(--color-ink-soft)]">{contextLine}</p>
        </div>

        <div className="mt-3.5 grid gap-2.5">
          {reasons.map((reason) => (
            <article key={reason} className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-4 py-3.5">
              <p className="text-sm leading-6 text-[var(--color-ink)]">{reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1.08fr)_minmax(17rem,0.92fr)]">
        <article
          data-testid={evidenceTestId ?? testIds.detail.evidence}
          className="compass-sheet rounded-[var(--radius-card)] px-3.5 py-3.5 sm:px-4 sm:py-4"
        >
          <div className="border-b border-[color:var(--color-frame-soft)] pb-3.5">
            <p className="compass-editorial-kicker">분위기 근거</p>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
              추천 점수와 별개로, 현지 분위기를 짧게 확인하는 용도예요.
            </p>
          </div>

          {evidenceItems.length > 0 ? (
            <div className="mt-3.5 grid gap-2.5">
              {evidenceItems.map((item) => (
                <article
                  key={item.id}
                  className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                      {describeSourceBadge(item)}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
                      {formatFreshnessState(item.freshnessState)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
                    {item.sourceLabel}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">{item.summary}</p>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="compass-action-secondary mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
                  >
                    원문 보기
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className="compass-open-info mt-3.5 rounded-[calc(var(--radius-card)-12px)] px-4 py-4 text-sm leading-6 text-[var(--color-ink-soft)]">
              지금은 추가 분위기 근거가 많지 않아요. 핵심 정보와 체크할 점을 먼저 보고 판단해 보세요.
            </p>
          )}
        </article>

        <article data-testid={testIds.detail.watchOuts} className="compass-warning-card rounded-[var(--radius-card)] px-3.5 py-3.5 sm:px-4 sm:py-4">
          <p className="compass-editorial-kicker text-[var(--color-warning-text)]">체크할 점</p>
          <div className="mt-2.5 grid gap-2">
            {watchOuts.map((watchOut) => (
              <p key={watchOut} className="text-sm leading-6 text-[var(--color-warning-text)]">
                {watchOut}
              </p>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1.02fr)_minmax(18rem,0.98fr)]">
        <article data-testid={testIds.detail.tasteLogger} className="compass-desk rounded-[var(--radius-card)] px-3.5 py-3.5 sm:px-4 sm:py-4">
          <div className="border-b border-[color:var(--color-frame-soft)] pb-3.5">
            <p className="compass-editorial-kicker">취향 기록</p>
            <h3 className="mt-1.5 font-display text-[1.08rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.22rem]">
              다녀온 곳이면 짧게 남겨 두세요.
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
              별점, 태그, 재방문 의사만 남겨도 다음 추천이 더 또렷해져요.
            </p>
          </div>

          {session.isPending ? (
            <div className="compass-open-info mt-3.5 rounded-[calc(var(--radius-card)-12px)] px-4 py-4 text-sm leading-6 text-[var(--color-ink-soft)]">
              로그인 상태를 확인하는 중이에요.
            </div>
          ) : session.data?.user ? (
            <div className="mt-3.5 space-y-3.5">
              <div>
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">별점</p>
                <div data-testid={testIds.detail.tasteRating} className="mt-2 flex flex-wrap gap-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setTasteState((currentState) => ({ ...currentState, rating }))}
                      className={`rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em] ${tasteState.rating === rating ? "compass-selected" : "compass-selection-chip"}`}
                    >
                      {rating}점
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">해시태그</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {destination.vibeTags.slice(0, 4).map((tag, index) => {
                    const active = tasteState.tags.includes(tag);

                    return (
                      <button
                        key={tag}
                        type="button"
                        data-testid={getDestinationTasteTagTestId(index)}
                        onClick={() => toggleTasteTag(tag)}
                        className={`rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em] ${active ? "compass-selected" : "compass-selection-chip"}`}
                      >
                        #{formatVibeList([tag])}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                  <input
                    data-testid={testIds.detail.tasteRevisit}
                    type="checkbox"
                    checked={tasteState.wouldRevisit}
                    onChange={(event) =>
                      setTasteState((currentState) => ({
                        ...currentState,
                        wouldRevisit: event.target.checked,
                      }))
                    }
                    className="compass-checkbox"
                  />
                  다시 가고 싶어요
                </label>

                <label className="grid gap-2 text-sm text-[var(--color-ink)] sm:justify-self-end">
                  <span>다녀온 날짜</span>
                  <input
                    data-testid={testIds.detail.tasteDate}
                    type="date"
                    value={tasteState.visitedAt}
                    onChange={(event) =>
                      setTasteState((currentState) => ({
                        ...currentState,
                        visitedAt: event.target.value,
                      }))
                    }
                    className="compass-form-field-light rounded-full px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <button
                data-testid={testIds.detail.tasteSubmit}
                type="button"
                onClick={() => {
                  void handleTasteSave();
                }}
                disabled={tasteStatus === "saving"}
                className="compass-action-primary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tasteStatus === "saving"
                  ? "기록 저장 중..."
                  : tasteStatus === "saved"
                    ? "취향 기록 완료"
                    : "내 취향에 기록하기"}
              </button>

              {tasteStatus === "error" ? (
                <p className="compass-warning-card rounded-[calc(var(--radius-card)-12px)] px-4 py-3 text-sm leading-6">
                  취향 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="compass-open-info mt-3.5 rounded-[calc(var(--radius-card)-12px)] px-4 py-4 text-sm leading-6 text-[var(--color-ink-soft)]">
              읽기와 저장은 로그인 없이 가능하고, 여행 기록만 로그인 후 남길 수 있어요.
              <div className="mt-3">
                <Link
                  data-testid={testIds.detail.tasteLoginCta}
                  href="/auth"
                  className="compass-action-primary compass-soft-press inline-flex rounded-full px-4 py-2 text-xs font-semibold tracking-[0.04em]"
                >
                  로그인하고 취향 남기기
                </Link>
              </div>
            </div>
          )}
        </article>

        <article className="compass-sheet rounded-[var(--radius-card)] px-3.5 py-3.5 sm:px-4 sm:py-4">
          <div className="border-b border-[color:var(--color-frame-soft)] pb-3.5">
            <p className="compass-editorial-kicker">저장·공유</p>
            <h3 className="mt-1.5 font-display text-[1.08rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.22rem]">
              다음 단계로 넘길 링크만 남겨도 충분해요.
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
              저장해서 공유 페이지로 넘기거나, 지금 상세 링크만 복사해 두세요.
            </p>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-2">
            {canSave ? (
              <button
                type="button"
                onClick={() => {
                  void handleSave();
                }}
                disabled={saveState.status === "saving"}
                className="compass-action-primary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveState.status === "saving"
                  ? "저장 중..."
                  : saveState.status === "saved"
                    ? "저장 완료"
                    : "이 추천 저장"}
              </button>
            ) : null}

            {(saveState.sharePath ?? snapshotId) ? (
              <Link
                href={saveState.sharePath ?? `/s/${snapshotId}`}
                className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
              >
                공유 페이지 보기
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => {
                void copyAbsoluteUrl(sharePath);
              }}
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
            >
              {(saveState.sharePath ?? snapshotId) ? "링크 복사" : "상세 링크 복사"}
            </button>

            <Link
              href="/account"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
            >
              내 취향 보기
            </Link>

            <Link
              href="/"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
            >
              홈으로 돌아가기
            </Link>
          </div>

          {saveState.status === "saved" ? (
            <p className="compass-open-info mt-3.5 rounded-[calc(var(--radius-card)-12px)] px-4 py-4 text-sm leading-6 text-[var(--color-ink-soft)]">
              저장을 마쳤어요. 공유 페이지 보기나 compare 전 단계로 이어가 보세요.
            </p>
          ) : null}

          {linkCopyState === "copied" ? (
            <p className="compass-open-info mt-3.5 rounded-[calc(var(--radius-card)-12px)] px-4 py-4 text-sm leading-6 text-[var(--color-ink-soft)]">
              링크를 복사했어요.
            </p>
          ) : null}

          {linkCopyState === "error" ? (
            <p className="compass-warning-card mt-4 rounded-[calc(var(--radius-card)-12px)] px-4 py-3 text-sm leading-6">
              링크를 복사하지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          ) : null}

          {saveState.status === "error" ? (
            <p className="compass-warning-card mt-4 rounded-[calc(var(--radius-card)-12px)] px-4 py-3 text-sm leading-6">
              저장에 실패했어요. 잠시 후 다시 시도해 주세요.
            </p>
          ) : null}
        </article>
      </section>
    </div>
  );
}
