"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { resolveDestinationFlightAffiliateLink } from "@/lib/affiliate/links";
import {
  buildCurrentRoute,
  consumeMatchingPostAuthIntent,
  savePostAuthIntent,
} from "@/lib/post-auth-intent";
import type {
  DestinationProfile,
  DestinationTravelSupplement,
  RecommendationQuery,
  TrendEvidenceSnapshot,
} from "@/lib/domain/contracts";
import { buildApiUrl } from "@/lib/runtime/url";
import {
  buildDestinationDetailPath,
  buildRecommendationDecisionFacts,
  buildRecommendationSceneCopy,
  describeSourceBadge,
  formatDestinationWithCountry,
  formatDepartureAirport,
  formatFreshnessState,
  formatTravelMonth,
  formatTripLengthBand,
  formatVibeList,
  type RecommendationCardView,
} from "@/lib/trip-compass/presentation";
import { buildRecommendationSnapshotPayload } from "@/lib/trip-compass/snapshot-payload";
import { testIds } from "@/lib/test-ids";

import { FlightAffiliatePanel } from "./flight-affiliate-panel";
import { RecommendationActionsPanel } from "./recommendation-actions-panel";

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

function buildFallbackReasonList(destination: DestinationProfile): string[] {
  return [
    `${formatVibeList(destination.vibeTags.slice(0, 2))} 결이 분명해요.`,
    destination.summary,
  ];
}

function buildCompactContextLine(query?: RecommendationQuery | null): string {
  if (!query) {
    return "핵심 정보만 빠르게 보고 결정해 보세요.";
  }

  return `${formatDepartureAirport(query.departureAirport)} · ${formatTravelMonth(query.travelMonth)} · ${formatTripLengthBand(query.tripLengthDays)}`;
}

function resolveSharePath(detailPath: string, saveState: SaveState, snapshotId?: string | null): string {
  return saveState.sharePath ?? (snapshotId ? `/s/${snapshotId}` : detailPath);
}

function buildDecisionBadgeItems(query?: RecommendationQuery | null): string[] {
  if (!query) {
    return [];
  }

  return [
    `${formatDepartureAirport(query.departureAirport)} 출발`,
    `${formatTravelMonth(query.travelMonth)} · ${formatTripLengthBand(query.tripLengthDays)}`,
    query.partyType === "solo"
      ? "혼자 떠나는 여행"
      : query.partyType === "friends"
        ? `${query.partySize}명 우정 여행`
        : query.partyType === "family"
          ? `${query.partySize}명 가족 여행`
          : `${query.partySize}명 함께 가는 여행`,
  ];
}

function isInstagramSource(sourceUrl: string): boolean {
  return sourceUrl.includes("instagram.com");
}

function buildSourceActionLabel(sourceLabel: string, sourceUrl: string): string {
  if (isInstagramSource(sourceUrl)) {
    return `${sourceLabel}에서 보기`;
  }

  return "바로 보기";
}

function InstagramSourceIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="3.25" y="3.25" width="13.5" height="13.5" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="3.1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14.3" cy="5.7" r="1" fill="currentColor" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M11.5 4.5h4v4M10.75 9.25 15.5 4.5M8 5.5H6.75A2.25 2.25 0 0 0 4.5 7.75v5.5a2.25 2.25 0 0 0 2.25 2.25h5.5a2.25 2.25 0 0 0 2.25-2.25V12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  const [showDetails, setShowDetails] = useState(false);
  const replayedIntentRef = useRef<string | null>(null);

  const canSave = Boolean(allowSave && card && query && scoringVersionId);
  const sceneCopy = card ? buildRecommendationSceneCopy(card, query ?? undefined) : null;
  const decisionFacts = buildRecommendationDecisionFacts(destination);
  const reasons = card?.recommendation.reasons.slice(0, 2) ?? buildFallbackReasonList(destination);
  const watchOuts = (card?.recommendation.watchOuts.length ? card.recommendation.watchOuts : destination.watchOuts).slice(0, 2);
  const evidenceItems = (card?.recommendation.trendEvidence.length ? card.recommendation.trendEvidence : evidence).slice(0, 2);
  const detailPath = buildDestinationDetailPath(destination, query ?? undefined, snapshotId ?? undefined);
  const sharePath = resolveSharePath(detailPath, saveState, snapshotId);
  const flightAffiliateLink = resolveDestinationFlightAffiliateLink(destination, query);
  const compactContextLine = buildCompactContextLine(query);
  const decisionBadges = buildDecisionBadgeItems(query);
  const headlineCopy = sceneCopy?.headline ?? destination.summary;
  const hasSavedViewLink = Boolean(saveState.sharePath ?? snapshotId);

  const handleSave = useCallback(async () => {
    if (!card || !query || !scoringVersionId) {
      return;
    }

    if (!session.data?.user) {
      const currentRoute = buildCurrentRoute(window.location.pathname, new URLSearchParams(window.location.search));
      savePostAuthIntent({
        kind: "save-detail-card",
        route: currentRoute,
        destinationId: destination.id,
      });
      window.location.assign(`/auth?next=${encodeURIComponent(currentRoute)}&intent=save`);
      return;
    }

    setSaveState({ status: "saving" });

    try {
      const response = await fetch(buildApiUrl("/api/snapshots"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildRecommendationSnapshotPayload(query, card, scoringVersionId, "private")),
      });

      if (!response.ok) {
        throw new Error("save-failed");
      }

      const payload = (await response.json()) as { snapshotId: string };
      setSaveState({
        status: "saved",
        snapshotId: payload.snapshotId,
        sharePath: `/s/${payload.snapshotId}`,
      });
    } catch {
      setSaveState({ status: "error" });
    }
  }, [card, destination.id, query, scoringVersionId, session.data?.user]);

  useEffect(() => {
    if (session.isPending || !session.data?.user || !card || !query || !scoringVersionId) {
      return;
    }

    const currentRoute = buildCurrentRoute(window.location.pathname, new URLSearchParams(window.location.search));
    const intent = consumeMatchingPostAuthIntent(currentRoute);

    if (!intent || intent.kind !== "save-detail-card" || intent.destinationId !== destination.id) {
      return;
    }

    const intentKey = `${intent.kind}:${intent.route}:${intent.destinationId}`;

    if (replayedIntentRef.current === intentKey) {
      return;
    }

    replayedIntentRef.current = intentKey;
    void handleSave();
  }, [card, destination.id, handleSave, query, scoringVersionId, session.data?.user, session.isPending]);

  return (
    <div data-testid={rootTestId ?? testIds.detail.root} className="space-y-4 text-[var(--color-ink)]">
      <section className="compass-top-summary overflow-hidden rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.92fr)] xl:items-start">
          <div className="space-y-4">
            <div className="rounded-[1.2rem] border border-[color:var(--color-frame-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,249,255,0.88))] px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="compass-editorial-kicker">{destination.nameEn}</span>
                {sceneCopy ? (
                  <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                    {sceneCopy.supportingLabel}
                  </span>
                ) : null}
                {destination.vibeTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[color:var(--color-frame-soft)] bg-white/76 px-3 py-1 text-[0.68rem] font-semibold text-[var(--color-ink-soft)]"
                  >
                    #{formatVibeList([tag])}
                  </span>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <h2 className="text-[1.85rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--color-ink-strong)] sm:text-[2.35rem]">
                  {formatDestinationWithCountry(destination)}
                </h2>
                <p className="max-w-2xl text-[1.02rem] font-semibold leading-7 tracking-[-0.02em] text-[var(--color-ink)] sm:text-[1.08rem]">
                  {headlineCopy}
                </p>
                <p className="max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">{compactContextLine}</p>
              </div>
            </div>

            {decisionBadges.length > 0 ? (
              <article className="rounded-[1.1rem] border border-[color:var(--color-frame-soft)] bg-white/84 px-4 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
                  이번 결정 기준
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {decisionBadges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-[color:var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-[0.72rem] font-semibold text-[var(--color-ink)]"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </article>
            ) : null}

            <div data-testid={testIds.detail.coreFacts} className="grid gap-2.5 sm:grid-cols-3">
              {decisionFacts.map((fact) => (
                <article
                  key={fact.id}
                  className="rounded-[1.1rem] border border-[color:var(--color-frame-soft)] bg-white/88 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
                >
                  <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">{fact.label}</p>
                  <p className="mt-2 text-[0.96rem] font-semibold leading-6 tracking-[-0.02em] text-[var(--color-ink)]">
                    {fact.value}
                  </p>
                </article>
              ))}
            </div>

            <article className="rounded-[1.15rem] border border-[color:var(--color-frame-soft)] bg-white/86 px-4 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
                추천 이유
              </p>
              <div className="mt-3 grid gap-2">
                {reasons.map((reason, index) => (
                  <article
                    key={reason}
                    className="rounded-[0.95rem] border border-[color:var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-3.5 py-3"
                  >
                    <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                      포인트 {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink)]">{reason}</p>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <aside className="xl:sticky xl:top-24">
            <div className="space-y-3">
              {supplement?.heroImage ? (
                <div className="relative overflow-hidden rounded-[1.2rem] border border-[color:var(--color-frame-soft)] bg-white shadow-[0_18px_36px_rgba(15,23,42,0.08)] aspect-[4/3]">
                  <Image
                    src={supplement.heroImage.url}
                    alt={supplement.heroImage.alt}
                    fill
                    sizes="(max-width: 1279px) 100vw, 34vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.16)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-sm font-semibold leading-6">{destination.nameKo}의 분위기</p>
                  </div>
                </div>
              ) : null}

              <article className="rounded-[1.2rem] border border-[color:var(--color-frame-soft)] bg-white/94 px-4 py-4 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                <p className="text-[1rem] font-semibold leading-7 tracking-[-0.02em] text-[var(--color-ink)]">
                  담을지, 더 볼지 여기서 결정하세요
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    data-testid={testIds.detail.itineraryCta}
                    type="button"
                    onClick={() => {
                      void handleSave();
                    }}
                    disabled={!canSave || saveState.status === "saving"}
                    className="compass-action-primary compass-soft-press min-h-[3rem] rounded-[1rem] px-4 py-3 text-sm font-semibold tracking-[0.02em] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saveState.status === "saving"
                      ? "내 일정에 담는 중..."
                      : saveState.status === "saved"
                        ? "내 일정에 담았어요"
                        : "내 일정에 담기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDetails((current) => !current)}
                    className="compass-action-secondary compass-soft-press min-h-[3rem] rounded-[1rem] px-4 py-3 text-sm font-semibold tracking-[0.02em]"
                  >
                    {showDetails ? "접기" : "더 보기"}
                  </button>
                  {hasSavedViewLink ? (
                    <Link
                      href={saveState.sharePath ?? `/s/${snapshotId}`}
                      className="compass-action-secondary compass-soft-press inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-4 py-3 text-sm font-semibold tracking-[0.02em]"
                    >
                      저장한 여행 보기
                    </Link>
                  ) : null}
                </div>

                <article
                  data-testid={testIds.detail.watchOuts}
                  className="mt-4 rounded-[1rem] border border-[color:var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3.5"
                >
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-warning-text)]">
                    체크할 점
                  </p>
                  <div className="mt-2 grid gap-2">
                    {watchOuts.map((watchOut) => (
                      <p key={watchOut} className="text-sm leading-6 text-[var(--color-warning-text)]">
                        {watchOut}
                      </p>
                    ))}
                  </div>
                </article>

                {saveState.status === "saved" ? (
                  <p className="mt-4 rounded-[1rem] border border-[color:var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                    담았어요. 계정에서 다시 볼 수 있어요.
                  </p>
                ) : null}

                {saveState.status === "error" ? (
                  <p className="mt-4 rounded-[1rem] border border-[color:var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm leading-6 text-[var(--color-warning-text)]">
                    저장에 실패했어요. 잠시 후 다시 시도해 주세요.
                  </p>
                ) : null}
              </article>
            </div>
          </aside>
        </div>
      </section>

      {query && flightAffiliateLink ? (
        <FlightAffiliatePanel
          destinationId={destination.id}
          destinationName={destination.nameKo}
          query={query}
          link={flightAffiliateLink}
        />
      ) : null}

      {showDetails ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.78fr)]">
          <div className="space-y-4">
            {query ? (
              <RecommendationActionsPanel
                variant="detail"
                rootTestId={testIds.detail.actionPlan}
                destinationId={destination.id}
                destinationName={destination.nameKo}
                destinationSummary={destination.summary}
                leadReason={reasons[0] ?? destination.summary}
                whyThisFits={card?.recommendation.whyThisFits ?? destination.summary}
                watchOuts={watchOuts}
                query={query}
                nearbyPlaces={supplement?.nearbyPlaces}
                evidence={evidenceItems.map((item) => ({
                  sourceLabel: item.sourceLabel,
                  summary: item.summary,
                }))}
              />
            ) : null}

            <article
              data-testid={testIds.detail.fitReason}
              className="rounded-[var(--radius-card)] border border-[color:var(--color-frame-soft)] bg-white px-4 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)] sm:px-5 sm:py-5"
            >
              <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
                <p className="compass-editorial-kicker">왜 잘 맞는지</p>
              </div>

              <div className="mt-4 grid gap-2.5">
                {reasons.map((reason, index) => (
                  <article
                    key={reason}
                    className="rounded-[1rem] border border-[color:var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-4 py-3.5"
                  >
                    <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                      이유 {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink)]">{reason}</p>
                  </article>
                ))}
              </div>
            </article>

            <article
              data-testid={evidenceTestId ?? testIds.detail.evidence}
              className="rounded-[var(--radius-card)] border border-[color:var(--color-frame-soft)] bg-white px-4 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)] sm:px-5 sm:py-5"
            >
              <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
                <p className="compass-editorial-kicker">실제 분위기</p>
              </div>

              <div className="mt-4 grid gap-3">
                {evidenceItems.length > 0 ? (
                  evidenceItems.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[1rem] border border-[color:var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-4 py-3.5"
                    >
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
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-frame-soft)] bg-white px-3 py-2 text-[0.76rem] font-semibold tracking-[0.01em] text-[var(--color-ink)] transition-colors hover:border-[var(--color-action-primary-soft)] hover:bg-[var(--color-action-primary-surface)]"
                      >
                        {isInstagramSource(item.sourceUrl) ? <InstagramSourceIcon /> : <ExternalLinkIcon />}
                        {buildSourceActionLabel(item.sourceLabel, item.sourceUrl)}
                      </a>
                    </article>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                    지금은 참고할 만한 내용이 많지 않아요.
                  </p>
                )}
              </div>
            </article>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <article className="rounded-[var(--radius-card)] border border-[color:var(--color-frame-soft)] bg-white px-4 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)] sm:px-5 sm:py-5">
              <div className="border-b border-[color:var(--color-frame-soft)] pb-3">
                <p className="compass-editorial-kicker">다음 단계</p>
              </div>

              <div className="mt-4 grid gap-2">
                <Link
                  href="/"
                  className="compass-action-secondary compass-soft-press inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-4 py-3 text-sm font-semibold tracking-[0.02em]"
                >
                  홈으로 돌아가기
                </Link>
                <Link
                  href={sharePath}
                  className="compass-action-secondary compass-soft-press inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-4 py-3 text-sm font-semibold tracking-[0.02em]"
                >
                  링크 열기
                </Link>
              </div>
            </article>
          </aside>
        </section>
      ) : null}
    </div>
  );
}
