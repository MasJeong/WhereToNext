"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  RecommendationActionEvidence,
  RecommendationActionsResponse,
  RecommendationQuery,
} from "@/lib/domain/contracts";
import { recommendationActionsResponseSchema } from "@/lib/domain/contracts";
import { buildApiUrl } from "@/lib/runtime/url";

type RecommendationActionsPanelProps = {
  variant: "summary" | "detail" | "compact";
  destinationId: string;
  destinationName: string;
  destinationSummary: string;
  leadReason: string;
  whyThisFits: string;
  watchOuts: string[];
  query: RecommendationQuery;
  nearbyPlaces?: Array<{
    id: string;
    name: string;
    shortAddress: string;
    googleMapsUrl: string;
  }>;
  evidence?: RecommendationActionEvidence[];
  rootTestId?: string;
};

const recommendationActionsCache = new Map<string, RecommendationActionsResponse>();

type RecommendationActionsPanelState = {
  requestKey: string;
  resolved: boolean;
  payload: RecommendationActionsResponse | null;
};

function buildRequestKey(props: Omit<RecommendationActionsPanelProps, "variant" | "rootTestId">) {
  return JSON.stringify({
    destinationId: props.destinationId,
    destinationName: props.destinationName,
    destinationSummary: props.destinationSummary,
    leadReason: props.leadReason,
    whyThisFits: props.whyThisFits,
    watchOuts: props.watchOuts,
    query: props.query,
    nearbyPlaces: props.nearbyPlaces?.map((place) => place.id) ?? [],
    evidence: props.evidence?.map((item) => item.summary) ?? [],
  });
}

function buildInitialState(requestKey: string): RecommendationActionsPanelState {
  const cached = recommendationActionsCache.get(requestKey) ?? null;

  return {
    requestKey,
    resolved: Boolean(cached),
    payload: cached,
  };
}

function buildClientFallbackPayload(
  destinationName: string,
  leadReason: string,
  whyThisFits: string,
  watchOuts: string[],
): RecommendationActionsResponse {
  return recommendationActionsResponseSchema.parse({
    status: "fallback",
    actions: [
      {
        id: "signature",
        label: "대표 경험",
        title: `${destinationName}의 대표 포인트부터 가보세요`,
        description: leadReason,
        placeLabel: destinationName,
      },
      {
        id: "tailored",
        label: "취향 맞춤",
        title: `${destinationName}에서 잘 맞는 동선부터 붙여 보세요`,
        description: whyThisFits,
        placeLabel: destinationName,
      },
      {
        id: "easy-start",
        label: "첫날 가볍게",
        title: `${destinationName}는 첫날 한 구역만 천천히 봐도 감이 옵니다`,
        description: watchOuts[0] ?? "동선을 넓히기보다 한 구역부터 보는 편이 좋아요.",
        placeLabel: destinationName,
      },
    ],
    compactSummary: `${destinationName}는 대표 포인트부터 붙이면 어떻게 놀지 빠르게 감이 옵니다.`,
    detailBlocks: [
      {
        id: "signature",
        title: "대표 경험",
        body: leadReason,
      },
      {
        id: "half-day",
        title: "반나절 코스",
        body: `${destinationName}의 대표 포인트 한 곳과 주변 한 구역만 묶어도 첫날 리듬이 과하지 않게 잡힙니다.`,
      },
      {
        id: "check-point",
        title: "알아두면 좋아요",
        body: watchOuts[0] ?? "동선을 넓히기보다 한 구역부터 천천히 보는 편이 좋아요.",
      },
    ],
  });
}

function normalizeActionTitle(title: string, destinationName: string): string {
  return title
    .replace(new RegExp(`^${destinationName}(의|에서|에선|은|는)?\\s*`), "")
    .replace(/^\s+/, "");
}

function renderSummarySkeleton(rootTestId?: string) {
  return (
    <section data-testid={rootTestId} className="rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-3.5">
      <div className="space-y-1.5">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
          이 도시에서 먼저 할 것
        </p>
        <div className="h-4 w-40 rounded-full bg-white" />
      </div>
      <div className="mt-3 grid gap-2">
        {[0, 1, 2].map((index) => (
          <article
            key={index}
            className="rounded-[0.9rem] border border-[color:var(--color-funnel-border)] bg-white px-3 py-3"
          >
            <div className="h-3 w-16 rounded-full bg-[var(--color-funnel-muted)]" />
            <div className="mt-2 h-3 w-4/5 rounded-full bg-[var(--color-funnel-muted)]" />
            <div className="mt-2 h-3 w-full rounded-full bg-[var(--color-funnel-muted)]" />
          </article>
        ))}
      </div>
    </section>
  );
}

function renderCompactSkeleton(rootTestId?: string) {
  return (
    <article
      data-testid={rootTestId}
      className="rounded-[0.95rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-2.5"
    >
      <div className="h-3 w-20 rounded-full bg-white" />
      <div className="mt-2 h-3 w-5/6 rounded-full bg-white" />
    </article>
  );
}

function renderDetailSkeleton(rootTestId?: string) {
  return (
    <section data-testid={rootTestId} className="compass-open-info rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5">
      <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
        <p className="compass-editorial-kicker">이 도시에서 먼저 할 것</p>
        <div className="mt-2 h-3 w-40 rounded-full bg-[var(--color-funnel-muted)]" />
      </div>
      <div className="mt-4 grid gap-2.5">
        {[0, 1, 2].map((index) => (
          <article
            key={index}
            className="rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-stage-divider)] bg-white/60 px-3.5 py-3.5"
          >
            <div className="h-3 w-16 rounded-full bg-[var(--color-funnel-muted)]" />
            <div className="mt-2 h-4 w-2/3 rounded-full bg-[var(--color-funnel-muted)]" />
            <div className="mt-2 h-3 w-full rounded-full bg-[var(--color-funnel-muted)]" />
          </article>
        ))}
      </div>
    </section>
  );
}

export function RecommendationActionsPanel({
  variant,
  destinationId,
  destinationName,
  destinationSummary,
  leadReason,
  whyThisFits,
  watchOuts,
  query,
  nearbyPlaces,
  evidence,
  rootTestId,
}: RecommendationActionsPanelProps) {
  const requestKey = useMemo(
    () =>
      buildRequestKey({
        destinationId,
        destinationName,
        destinationSummary,
        leadReason,
        whyThisFits,
        watchOuts,
        query,
        nearbyPlaces,
        evidence,
      }),
    [
      destinationId,
      destinationName,
      destinationSummary,
      leadReason,
      whyThisFits,
      watchOuts,
      query,
      nearbyPlaces,
      evidence,
    ],
  );
  const [state, setState] = useState<RecommendationActionsPanelState>(() => buildInitialState(requestKey));

  useEffect(() => {
    const cached = recommendationActionsCache.get(requestKey) ?? null;

    if (cached) {
      setState({
        requestKey,
        resolved: true,
        payload: cached,
      });
      return;
    }

    let cancelled = false;

    setState({
      requestKey,
      resolved: false,
      payload: null,
    });

    async function loadRecommendationActions() {
      try {
        const response = await fetch(buildApiUrl("/api/ai/recommendation-actions"), {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            destinationId,
            destinationName,
            destinationSummary,
            leadReason,
            whyThisFits,
            watchOuts,
            query,
            nearbyPlaces,
            evidence,
          }),
        });

        if (!response.ok) {
          throw new Error("recommendation-actions-failed");
        }

        const payload = recommendationActionsResponseSchema.parse((await response.json()) as unknown);

        recommendationActionsCache.set(requestKey, payload);

        if (!cancelled) {
          setState({
            requestKey,
            resolved: true,
            payload,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            requestKey,
            resolved: true,
            payload: buildClientFallbackPayload(
              destinationName,
              leadReason,
              whyThisFits,
              watchOuts,
            ),
          });
        }
      }
    }

    void loadRecommendationActions();

    return () => {
      cancelled = true;
    };
  }, [
    destinationId,
    destinationName,
    destinationSummary,
    evidence,
    leadReason,
    nearbyPlaces,
    query,
    requestKey,
    watchOuts,
    whyThisFits,
  ]);

  if (!state.resolved || !state.payload) {
    if (variant === "compact") {
      return renderCompactSkeleton(rootTestId);
    }

    if (variant === "detail") {
      return renderDetailSkeleton(rootTestId);
    }

    return renderSummarySkeleton(rootTestId);
  }

  if (variant === "compact") {
    return (
      <article
        data-testid={rootTestId}
        className="rounded-[0.95rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3 py-2.5"
      >
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
          대표 경험
        </p>
        <p className="mt-1 text-[0.82rem] leading-5 text-[var(--color-funnel-text)]">
          {state.payload.compactSummary}
        </p>
      </article>
    );
  }

  if (variant === "detail") {
    return (
      <section
        data-testid={rootTestId}
        className="compass-open-info rounded-[var(--radius-card)] px-4 py-4 sm:px-5 sm:py-5"
      >
        <div className="border-b border-[color:var(--color-frame-soft)] pb-4">
          <p className="compass-editorial-kicker">이 도시에서 먼저 할 것</p>
          <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">
            저장하기 전에, 어떻게 시작하면 좋은지만 짧게 정리했어요.
          </p>
        </div>

        <div className="mt-4 grid gap-2.5">
          {state.payload.actions.map((action) => (
            <article
              key={action.id}
              className="rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-stage-divider)] bg-white/60 px-3.5 py-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="compass-metric-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                  {action.label}
                </span>
                {action.placeLabel && action.placeLabel !== destinationName ? (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
                    {action.placeLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink)]">
                {normalizeActionTitle(action.title, destinationName)}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink-soft)]">{action.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-2.5">
          {state.payload.detailBlocks.map((block) => (
            <article
              key={block.id}
              className="rounded-[calc(var(--radius-card)-12px)] border border-[color:var(--color-stage-divider)] bg-[var(--color-funnel-muted)] px-3.5 py-3.5"
            >
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                {block.title}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-ink)]">{block.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <SummaryActions
      rootTestId={rootTestId}
      destinationName={destinationName}
      actions={state.payload.actions}
    />
  );
}

const stepIcons: Record<string, string> = {
  "대표 경험": "📍",
  "취향 맞춤": "✦",
  "첫날 가볍게": "☀",
  "바다 시간": "🌊",
  "맛집 동선": "🍽",
  "산책 코스": "🚶",
};

function resolveStepIcon(label: string): string {
  return stepIcons[label] ?? `${Object.keys(stepIcons).length + 1}`;
}

function SummaryActions({
  rootTestId,
  destinationName,
  actions,
}: {
  rootTestId?: string;
  destinationName: string;
  actions: RecommendationActionsResponse["actions"];
}) {
  return (
    <section
      data-testid={rootTestId}
      className="rounded-[1rem] border border-[color:var(--color-funnel-border)] bg-[var(--color-funnel-muted)] px-3.5 py-4"
    >
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-funnel-text-soft)]">
        이 도시에서 먼저 할 것
      </p>

      {/* Timeline */}
      <div className="mt-3.5 flex flex-col">
        {actions.map((action, index) => {
          const isLast = index === actions.length - 1;

          return (
            <div key={action.id} className="flex gap-3.5">
              {/* Timeline rail */}
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-funnel-border)] bg-white text-sm">
                  {resolveStepIcon(action.label)}
                </span>
                {!isLast ? (
                  <div className="my-1 w-px flex-1 bg-[var(--color-funnel-border)]" />
                ) : null}
              </div>

              {/* Content */}
              <div className={`min-w-0 ${isLast ? "pb-0" : "pb-4"}`}>
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-funnel-text-soft)]">
                  {action.label}
                </p>
                <p className="mt-1 text-[0.88rem] font-semibold leading-6 text-[var(--color-funnel-text)]">
                  {normalizeActionTitle(action.title, destinationName)}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--color-funnel-text-soft)]">
                  {action.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
