"use client";

import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import type {
  DestinationProfile,
  DestinationTravelSupplement,
  RecommendationQuery,
  TrendEvidenceSnapshot,
} from "@/lib/domain/contracts";
import { buildApiUrl } from "@/lib/runtime/url";
import {
  buildDestinationDetailPath,
  buildQueryNarrative,
  buildRecommendationDayFlow,
  buildRecommendationDecisionFacts,
  buildRecommendationSceneCopy,
  describeSourceBadge,
  formatFreshnessState,
  formatVibeList,
  type RecommendationCardView,
} from "@/lib/trip-compass/presentation";
import { buildRecommendationSnapshotPayload } from "@/lib/trip-compass/snapshot-payload";
import { getDestinationTasteTagTestId, testIds } from "@/lib/test-ids";

import { TravelSupportPanel } from "./travel-support-panel";

type DestinationDetailExperienceProps = {
  destination: DestinationProfile;
  card?: RecommendationCardView | null;
  query?: RecommendationQuery | null;
  evidence: TrendEvidenceSnapshot[];
  supplement?: DestinationTravelSupplement | null;
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

function buildFallbackReasonList(destination: DestinationProfile): string[] {
  return [
    `${formatVibeList(destination.vibeTags.slice(0, 2))} 결이 또렷한 편이에요.`,
    `${destination.summary}`,
    `${destination.watchOuts[0] ?? "체크할 점을 먼저 보고 판단하면 돼요."}`,
  ];
}

function buildFallbackDayFlow(destination: DestinationProfile) {
  return [
    {
      id: "day-1" as const,
      label: "Day 1" as const,
      title: "도착 후 핵심 무드 먼저 보기",
      detail: `${destination.summary}`,
    },
    {
      id: "day-2" as const,
      label: "Day 2" as const,
      title: "대표 동선에 오래 머무르기",
      detail: `${formatVibeList(destination.vibeTags.slice(0, 2))} 결을 중심으로 일정을 묶어 보세요.`,
    },
    {
      id: "day-3" as const,
      label: "Day 3" as const,
      title: "내 일정에 남길지 결정하기",
      detail: `${destination.watchOuts[0] ?? "체크할 점"}만 괜찮다면 저장해 둘 만해요.`,
    },
  ];
}

function resolveSharePath(detailPath: string, saveState: SaveState, snapshotId?: string | null): string {
  return saveState.sharePath ?? (snapshotId ? `/s/${snapshotId}` : detailPath);
}

export function DestinationDetailExperience({
  destination,
  card,
  query,
  evidence,
  supplement,
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
  const [copyFallbackUrl, setCopyFallbackUrl] = useState<string | null>(null);

  const canSave = Boolean(allowSave && card && query && scoringVersionId);
  const reasons = card?.recommendation.reasons.slice(0, 3) ?? buildFallbackReasonList(destination);
  const sceneCopy = card ? buildRecommendationSceneCopy(card, query ?? undefined) : null;
  const decisionFacts = buildRecommendationDecisionFacts(destination);
  const dayFlow = card ? buildRecommendationDayFlow(card, query ?? undefined) : buildFallbackDayFlow(destination);
  const evidenceItems = (card?.recommendation.trendEvidence.length ? card.recommendation.trendEvidence : evidence).slice(0, 2);
  const watchOuts = (card?.recommendation.watchOuts.length ? card.recommendation.watchOuts : destination.watchOuts).slice(0, 3);
  const detailPath = buildDestinationDetailPath(destination, query ?? undefined, snapshotId ?? undefined);
  const sharePath = resolveSharePath(detailPath, saveState, snapshotId);
  const contextLine = query
    ? buildQueryNarrative(query)
    : "이 목적지가 내 일정에 맞는지 핵심 정보부터 먼저 확인해 보세요.";

  async function copyAbsoluteUrl(path: string) {
    const shareUrl = `${window.location.origin}${path}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopyState("copied");
      setCopyFallbackUrl(null);
      return true;
    } catch {
      setLinkCopyState("error");
      setCopyFallbackUrl(shareUrl);
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
      const response = await fetch(buildApiUrl("/api/snapshots"), {
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
      const response = await fetch(buildApiUrl("/api/me/history"), {
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
    <div data-testid={rootTestId ?? testIds.detail.root} className="space-y-4 text-[var(--color-ink)]">
      <section className="compass-top-summary rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-3 border-b border-[color:var(--color-frame-soft)] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="compass-editorial-kicker">{destination.nameEn}</span>
            {sceneCopy ? (
              <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                {sceneCopy.supportingLabel}
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-[1.5rem] leading-[0.94] tracking-[-0.05em] text-[var(--color-ink)] sm:text-[1.88rem]">
              {destination.nameKo}
            </h2>
            <p className="text-base font-semibold leading-6 tracking-[-0.02em] text-[var(--color-ink)]">
              {sceneCopy?.headline ?? destination.summary}
            </p>
            <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
              {sceneCopy?.atmosphere ?? contextLine}
            </p>
          </div>
        </div>

        <div data-testid={testIds.detail.coreFacts} className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {decisionFacts.map((fact) => (
            <article key={fact.id} className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">{fact.label}</p>
              <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">{fact.value}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">{fact.detail}</p>
            </article>
          ))}
        </div>

        <TravelSupportPanel
          supplement={supplement}
          destinationName={destination.nameKo}
          heroMode="hero"
          rootClassName="mt-4"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            data-testid={testIds.detail.itineraryCta}
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={!canSave || saveState.status === "saving"}
            className="compass-action-primary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveState.status === "saving"
              ? "내 일정에 담는 중..."
              : saveState.status === "saved"
                ? "내 일정에 담았어요"
                : "내 일정에 담기"}
          </button>
          {(saveState.sharePath ?? snapshotId) ? (
            <Link
              href={saveState.sharePath ?? `/s/${snapshotId}`}
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
            >
              저장한 여행 보기
            </Link>
          ) : null}
        </div>

        {saveState.status === "saved" ? (
          <p className="compass-open-info mt-3 rounded-[calc(var(--radius-card)-12px)] px-4 py-3.5 text-sm leading-6 text-[var(--color-ink-soft)]">
            내 일정에 담았어요. 저장 링크는 그대로 유지되고, 비교 보드나 공유 페이지로 이어갈 수 있어요.
          </p>
        ) : null}

        {saveState.status === "error" ? (
          <p className="compass-warning-card mt-3 rounded-[calc(var(--radius-card)-12px)] px-4 py-3 text-sm leading-6">
            저장에 실패했어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(17rem,0.96fr)] xl:items-start">
        <article data-testid={testIds.detail.fitReason} className="compass-sheet rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
            <p className="compass-editorial-kicker">왜 잘 맞는지</p>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">{contextLine}</p>
          </div>

          <div className="mt-4 grid gap-2.5">
            {reasons.map((reason, index) => (
              <article key={reason} className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
                <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                  이유 {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink)]">{reason}</p>
              </article>
            ))}
          </div>

          <div className="mt-4">
            <p className="compass-editorial-kicker">Day-flow</p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {dayFlow.map((step) => (
                <article key={step.id} className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
                  <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">{step.label}</p>
                  <p className="mt-1.5 text-sm font-semibold leading-5 text-[var(--color-ink)]">{step.title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-[var(--color-ink-soft)]">{step.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </article>

        <div className="space-y-4">
          <article
            data-testid={evidenceTestId ?? testIds.detail.evidence}
            className="compass-open-info rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5"
          >
            <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">분위기 근거</p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                추천 점수와 별개로, 현지 분위기를 짧게 확인하는 용도예요.
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {evidenceItems.length > 0 ? (
                evidenceItems.map((item) => (
                  <article key={item.id} className="rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-stage-divider)] bg-white/60 px-3.5 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                        {describeSourceBadge(item)}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
                        {formatFreshnessState(item.freshnessState)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{item.sourceLabel}</p>
                    <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">{item.summary}</p>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2.5 inline-flex text-xs font-semibold tracking-[0.04em] text-[var(--color-sand-deep)] underline decoration-[color:var(--color-frame-strong)] underline-offset-4"
                    >
                      원문 보기
                    </a>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                  지금은 추가 분위기 근거가 많지 않아요. 핵심 정보와 체크할 점을 먼저 보고 판단해 보세요.
                </p>
              )}
            </div>
          </article>

          <article
            data-testid={testIds.detail.watchOuts}
            className="compass-warning-card rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5"
          >
            <p className="compass-editorial-kicker text-[var(--color-warning-text)]">체크할 점</p>
            <div className="mt-3 grid gap-2.5">
              {watchOuts.map((watchOut) => (
                <p key={watchOut} className="rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-warning-border)] bg-white/22 px-3.5 py-3 text-sm leading-6 text-[var(--color-warning-text)]">
                  {watchOut}
                </p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(18rem,0.98fr)]">
        <article data-testid={testIds.detail.tasteLogger} className="compass-sheet rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
            <p className="compass-editorial-kicker">취향 기록</p>
            <h3 className="mt-1.5 font-display text-[1.08rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.22rem]">
              다녀온 곳이면 짧게 남겨 두세요.
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
              별점, 태그, 재방문 의사만 남겨도 다음 추천이 더 또렷해져요.
            </p>
          </div>

          {session.isPending ? (
            <p className="mt-4 text-sm leading-6 text-[var(--color-ink-soft)]">로그인 상태를 확인하는 중이에요.</p>
          ) : session.data?.user ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">별점</p>
                <div data-testid={testIds.detail.tasteRating} className="mt-2 flex flex-wrap gap-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setTasteState((currentState) => ({ ...currentState, rating }))}
                      className={`rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em] ${
                        tasteState.rating === rating ? "compass-selected" : "compass-selection-chip"
                      }`}
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
                        className={`rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em] ${
                          active ? "compass-selected" : "compass-selection-chip"
                        }`}
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
                    : "여행 기록에 남기기"}
              </button>

              {tasteStatus === "error" ? (
                <p className="compass-warning-card rounded-[calc(var(--radius-card)-12px)] px-4 py-3 text-sm leading-6">
                  취향 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                읽기와 저장은 로그인 없이 가능하고, 여행 기록만 로그인 후 남길 수 있어요.
              </p>
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

        <article className="compass-note rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
            <p className="compass-editorial-kicker">다음으로 이어가기</p>
            <h3 className="mt-1.5 font-display text-[1.08rem] leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.22rem]">
              결정이 끝나면 저장 링크와 여행 기록 루프로 이어지면 돼요.
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
              저장한 여행 다시 보기, 링크 복사, 여행 기록 보기, 홈으로 돌아가 새 추천 찾기로 이어질 수 있어요.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(saveState.sharePath ?? snapshotId) ? (
              <Link
                href={saveState.sharePath ?? `/s/${snapshotId}`}
                className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
              >
                저장한 여행 다시 보기
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => {
                void copyAbsoluteUrl(sharePath);
              }}
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
            >
              {(saveState.sharePath ?? snapshotId) ? "내 일정 링크 복사" : "상세 링크 복사"}
            </button>

            <Link
              href="/account"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
            >
              여행 기록 보기
            </Link>

            <Link
              href="/"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
            >
              홈으로 돌아가기
            </Link>
          </div>

          {linkCopyState === "copied" ? (
            <p className="compass-open-info mt-3 rounded-[calc(var(--radius-card)-12px)] px-4 py-3.5 text-sm leading-6 text-[var(--color-ink-soft)]">
              링크를 복사했어요.
            </p>
          ) : null}

          {linkCopyState === "error" ? (
            <div className="compass-warning-card mt-3 rounded-[calc(var(--radius-card)-12px)] px-4 py-3 text-sm leading-6">
              <p>링크를 복사하지 못했어요. 아래 링크를 길게 눌러 복사해 주세요.</p>
              {copyFallbackUrl ? (
                <input
                  type="text"
                  readOnly
                  value={copyFallbackUrl}
                  onFocus={(event) => event.currentTarget.select()}
                  className="mt-2 w-full rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-frame-soft)] bg-[var(--color-stage-soft)] px-3 py-2.5 text-xs font-semibold text-[var(--color-ink)]"
                />
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void copyAbsoluteUrl(sharePath);
                  }}
                  className="compass-action-secondary compass-soft-press rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em]"
                >
                  다시 시도
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLinkCopyState("idle");
                    setCopyFallbackUrl(null);
                  }}
                  className="compass-action-secondary compass-soft-press rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em]"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
