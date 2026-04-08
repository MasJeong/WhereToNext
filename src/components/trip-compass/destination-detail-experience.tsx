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
  buildRecommendationSceneCopy,
  formatDestinationWithCountry,
  formatDepartureAirport,
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
    return "이 도시가 어떤 곳인지 한눈에 볼 수 있어요.";
  }

  return `${formatDepartureAirport(query.departureAirport)} · ${formatTravelMonth(query.travelMonth)} · ${formatTripLengthBand(query.tripLengthDays)}`;
}

function isInstagramSource(sourceUrl: string): boolean {
  return sourceUrl.includes("instagram.com");
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
  const reasons = card?.recommendation.reasons.slice(0, 2) ?? buildFallbackReasonList(destination);
  const watchOuts = (card?.recommendation.watchOuts.length ? card.recommendation.watchOuts : destination.watchOuts).slice(0, 2);
  const evidenceItems = (card?.recommendation.trendEvidence.length ? card.recommendation.trendEvidence : evidence).slice(0, 2);
  const flightAffiliateLink = resolveDestinationFlightAffiliateLink(destination, query);
  const compactContextLine = buildCompactContextLine(query);
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

            <article className="rounded-[1.15rem] border border-[color:var(--color-frame-soft)] bg-white/90 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
                이 도시를 추천한 이유
              </p>
              <ul className="mt-3 space-y-2">
                {reasons.map((reason) => (
                  <li key={reason} className="flex gap-2.5 text-sm leading-6 text-[var(--color-ink)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-action-primary)]" />
                    {reason}
                  </li>
                ))}
              </ul>
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
                    <p className="text-sm font-semibold leading-6">{destination.nameKo}</p>
                  </div>
                </div>
              ) : null}

              <article className="rounded-[1.2rem] border border-[color:var(--color-frame-soft)] bg-white/94 px-4 py-4 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                <p className="text-[1rem] font-semibold leading-7 tracking-[-0.02em] text-[var(--color-ink)]">
                  마음에 드시나요?
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
                    알아두면 좋아요
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
        <section className="space-y-4">
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

          {evidenceItems.length > 0 ? (
            <article
              data-testid={evidenceTestId ?? testIds.detail.evidence}
              className="rounded-[1.3rem] border border-[color:var(--color-frame-soft)] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:px-5 sm:py-5"
            >
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
                실제 분위기
              </p>
              <ul className="mt-3 space-y-3">
                {evidenceItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[1rem] border border-[color:var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-4 py-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-frame-soft)] bg-white text-[var(--color-ink-soft)]">
                        {isInstagramSource(item.sourceUrl) ? <InstagramSourceIcon /> : <ExternalLinkIcon />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">{item.sourceLabel}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--color-ink-soft)]">{item.summary}</p>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[var(--color-action-primary)] hover:underline"
                        >
                          {isInstagramSource(item.sourceUrl) ? (
                            <>
                              <InstagramSourceIcon />
                              인스타그램에서 보기
                            </>
                          ) : (
                            <>
                              <ExternalLinkIcon />
                              자세히 보기
                            </>
                          )}
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
