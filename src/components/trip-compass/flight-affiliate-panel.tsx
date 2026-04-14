"use client";

import { buildApiUrl } from "@/lib/runtime/url";
import { testIds } from "@/lib/test-ids";
import type { DestinationFlightAffiliateLink } from "@/lib/affiliate/links";
import type { RecommendationQuery } from "@/lib/domain/contracts";

type FlightAffiliatePanelProps = {
  destinationId: string;
  destinationName: string;
  query: RecommendationQuery;
  link: DestinationFlightAffiliateLink;
};

const affiliateSessionStorageKey = "trip-compass-affiliate-session-id";

function resolveAffiliateSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window.sessionStorage.getItem(affiliateSessionStorageKey);

  if (existing) {
    return existing;
  }

  const nextId =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `affiliate-${Date.now().toString(36)}`;

  window.sessionStorage.setItem(affiliateSessionStorageKey, nextId);
  return nextId;
}

function logAffiliateClick(payload: {
  destinationId: string;
  partner: DestinationFlightAffiliateLink["partner"];
  category: DestinationFlightAffiliateLink["category"];
  pageType: "destination-detail";
  query: RecommendationQuery;
}) {
  const body = JSON.stringify({
    destinationId: payload.destinationId,
    partner: payload.partner,
    category: payload.category,
    pageType: payload.pageType,
    departureAirport: payload.query.departureAirport,
    travelMonth: payload.query.travelMonth,
    tripLengthDays: payload.query.tripLengthDays,
    flightTolerance: payload.query.flightTolerance,
    sessionId: resolveAffiliateSessionId(),
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(buildApiUrl("/api/affiliate/clicks"), blob);
    return;
  }

  void fetch(buildApiUrl("/api/affiliate/clicks"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * 목적지 상세에서 항공권 비교로 이어지는 제휴 패널을 렌더한다.
 * @param props 패널 렌더 정보
 * @returns 항공권 비교 제휴 패널
 */
export function FlightAffiliatePanel({
  destinationId,
  destinationName,
  query,
  link,
}: FlightAffiliatePanelProps) {
  return (
    <article
      data-testid={testIds.detail.flightAffiliate}
      className="rounded-[var(--radius-card)] border border-[color:var(--color-frame-strong)] bg-[linear-gradient(180deg,#fdfefe_0%,#eef7ff_100%)] px-4 py-4 shadow-[var(--shadow-paper)] sm:px-5 sm:py-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--color-frame-soft)] pb-4">
        <div className="min-w-0">
          <p className="compass-editorial-kicker">{link.eyebrow}</p>
          <h3 className="mt-1.5 text-[1.02rem] font-semibold leading-7 tracking-[-0.03em] text-[var(--color-ink)] sm:text-[1.12rem]">
            {link.title}
          </h3>
          <p className="mt-1.5 text-[0.93rem] leading-6 text-[var(--color-ink-soft)]">
            {destinationName} 기준으로 {link.summary}
          </p>
        </div>

        <span className="rounded-full bg-[var(--color-funnel-muted)] px-2 py-0.5 text-[0.62rem] font-semibold text-[var(--color-ink-soft)]">
          광고
        </span>
      </div>

      <div className="mt-4">
        <a
          data-testid={testIds.detail.flightAffiliateCta}
          href={link.url}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => {
            logAffiliateClick({
              destinationId,
              partner: link.partner,
              category: link.category,
              pageType: "destination-detail",
              query,
            });
          }}
          className="compass-action-primary compass-soft-press inline-flex rounded-full px-4 py-2.5 text-[0.82rem] font-semibold tracking-[0.01em]"
        >
          {link.ctaLabel}
        </a>
      </div>
    </article>
  );
}
