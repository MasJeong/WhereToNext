"use client";

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
      <section className="compass-top-summary rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--color-frame-soft)] pb-4">
          <span className="compass-editorial-kicker">{destination.nameEn}</span>
          {sceneCopy ? (
            <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
              {sceneCopy.supportingLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <h2 className="font-display text-[1.62rem] leading-[0.96] tracking-[-0.05em] text-[var(--color-ink)] sm:text-[2rem]">
            {destination.nameKo}
          </h2>
          <p className="text-base font-semibold leading-6 tracking-[-0.02em] text-[var(--color-ink)]">
            {sceneCopy?.headline ?? destination.summary}
          </p>
          <p className="text-sm leading-6 text-[var(--color-ink-soft)]">{compactContextLine}</p>
        </div>

        <div data-testid={testIds.detail.coreFacts} className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {decisionFacts.map((fact) => (
            <article key={fact.id} className="compass-open-info rounded-[calc(var(--radius-card)-12px)] px-3.5 py-3.5">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">{fact.label}</p>
              <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em] text-[var(--color-ink)]">{fact.value}</p>
            </article>
          ))}
        </div>

        <article
          data-testid={testIds.detail.watchOuts}
          className="compass-warning-card mt-4 rounded-[calc(var(--radius-card)-6px)] px-4 py-3.5"
        >
          <p className="compass-editorial-kicker text-[var(--color-warning-text)]">체크할 점</p>
          <div className="mt-2 grid gap-2">
            {watchOuts.map((watchOut) => (
              <p key={watchOut} className="text-sm leading-6 text-[var(--color-warning-text)]">
                {watchOut}
              </p>
            ))}
          </div>
        </article>

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
          <button
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
          >
            {showDetails ? "세부 정보 접기" : "세부 정보 보기"}
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
            내 일정에 담았어요. 이어서 다시 보거나 공유 페이지로 열 수 있어요.
          </p>
        ) : null}

        {saveState.status === "error" ? (
          <p className="compass-warning-card mt-3 rounded-[calc(var(--radius-card)-12px)] px-4 py-3 text-sm leading-6">
            저장에 실패했어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : null}
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
          <article data-testid={testIds.detail.fitReason} className="compass-sheet rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">왜 잘 맞는지</p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                길게 읽기보다 핵심만 빠르게 확인하면 돼요.
              </p>
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
          </article>

          <TravelSupportPanel
            supplement={supplement}
            destinationName={destination.nameKo}
            travelMonth={query?.travelMonth}
            layout="summary"
          />

          <article
            data-testid={evidenceTestId ?? testIds.detail.evidence}
            className="compass-open-info rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5"
          >
            <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">분위기 근거</p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                더 보고 싶을 때만 짧게 확인하면 돼요.
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
                  지금은 추가 분위기 근거가 많지 않아요.
                </p>
              )}
            </div>
          </article>

          <article className="compass-note rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
              <p className="compass-editorial-kicker">다음 단계</p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
                저장하거나, 홈으로 돌아가 다른 추천과 비교하면 됩니다.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/"
                className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
              >
                홈으로 돌아가기
              </Link>
              <Link
                href={sharePath}
                className="compass-action-secondary compass-soft-press rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.04em]"
              >
                링크 열기
              </Link>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
