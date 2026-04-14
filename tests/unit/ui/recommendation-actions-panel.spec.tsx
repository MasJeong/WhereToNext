import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecommendationActionsPanel } from "@/components/trip-compass/recommendation-actions-panel";
import { defaultRecommendationQuery } from "@/lib/trip-compass/presentation";
import { testIds } from "@/lib/test-ids";

const okPayload = {
  status: "ok",
  actions: [
    {
      id: "signature",
      label: "대표 경험",
      title: "마리나베이부터 가보세요",
      description: "도시 감을 빨리 잡는 시작입니다.",
      placeLabel: "마리나베이",
    },
    {
      id: "tailored",
      label: "취향 맞춤",
      title: "호커센터 식사 동선부터 붙여 보세요",
      description: "먹고 걷는 일정과 잘 맞아요.",
      placeLabel: "라우파삿",
    },
    {
      id: "easy-start",
      label: "첫날 가볍게",
      title: "강변 산책부터 천천히 시작해도 좋아요",
      description: "첫날은 한 구역만 봐도 감이 옵니다.",
      placeLabel: "리버워크",
    },
  ],
  compactSummary: "마리나베이부터 시작하면 싱가포르 무드가 빨리 옵니다.",
  detailBlocks: [
    {
      id: "signature",
      title: "대표 경험",
      body: "마리나베이 야경부터 보면 싱가포르 무드가 빨리 옵니다.",
    },
    {
      id: "half-day",
      title: "반나절 코스",
      body: "마리나베이에서 시작해 라우파삿 쪽으로 이어가면 첫날 동선이 과하지 않습니다.",
    },
    {
      id: "check-point",
      title: "체크할 포인트",
      body: "야외 이동이 길어질 수 있어요.",
    },
  ],
};

describe("RecommendationActionsPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a quiet loading state on the result page before the API resolves", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>(() => {
            return undefined;
          }),
      ),
    );

    render(
      <RecommendationActionsPanel
        variant="summary"
        rootTestId={testIds.result.actionPlan}
        destinationId="singapore"
        destinationName="싱가포르"
        destinationSummary="도시 리듬과 야경이 강한 도시예요."
        leadReason="야간 동선과 먹거리 흐름이 잘 맞아요."
        whyThisFits="먹고 걷는 일정과 잘 맞는 도시예요."
        watchOuts={["야외 이동이 길어질 수 있어요."]}
        query={defaultRecommendationQuery}
      />,
    );

    expect(screen.getByTestId(testIds.result.actionPlan)).toBeInTheDocument();
    expect(screen.getByText("이 도시에서 먼저 할 것")).toBeInTheDocument();
  });

  it("renders three action cards on the result page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(okPayload))));

    render(
      <RecommendationActionsPanel
        variant="summary"
        rootTestId={testIds.result.actionPlan}
        destinationId="singapore"
        destinationName="싱가포르"
        destinationSummary="도시 리듬과 야경이 강한 도시예요."
        leadReason="야간 동선과 먹거리 흐름이 잘 맞아요."
        whyThisFits="먹고 걷는 일정과 잘 맞는 도시예요."
        watchOuts={["야외 이동이 길어질 수 있어요."]}
        query={defaultRecommendationQuery}
      />,
    );

    expect(await screen.findByText("마리나베이부터 가보세요")).toBeInTheDocument();
    expect(screen.getByText("호커센터 식사 동선부터 붙여 보세요")).toBeInTheDocument();
    expect(screen.getByText("강변 산책부터 천천히 시작해도 좋아요")).toBeInTheDocument();
  });

  it("renders detail blocks in the expanded detail variant", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(okPayload))));

    render(
      <RecommendationActionsPanel
        variant="detail"
        rootTestId={testIds.detail.actionPlan}
        destinationId="singapore"
        destinationName="싱가포르"
        destinationSummary="도시 리듬과 야경이 강한 도시예요."
        leadReason="야간 동선과 먹거리 흐름이 잘 맞아요."
        whyThisFits="먹고 걷는 일정과 잘 맞는 도시예요."
        watchOuts={["야외 이동이 길어질 수 있어요."]}
        query={defaultRecommendationQuery}
      />,
    );

    expect(await screen.findByTestId(testIds.detail.actionPlan)).toBeInTheDocument();
    expect(screen.getByText("반나절 코스")).toBeInTheDocument();
    expect(screen.getByText("야외 이동이 길어질 수 있어요.")).toBeInTheDocument();
  });

  it("renders a compact summary for secondary recommendation cards", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(okPayload))));

    render(
      <RecommendationActionsPanel
        variant="compact"
        rootTestId={testIds.result.actionCompact0}
        destinationId="singapore"
        destinationName="싱가포르"
        destinationSummary="도시 리듬과 야경이 강한 도시예요."
        leadReason="야간 동선과 먹거리 흐름이 잘 맞아요."
        whyThisFits="먹고 걷는 일정과 잘 맞는 도시예요."
        watchOuts={["야외 이동이 길어질 수 있어요."]}
        query={defaultRecommendationQuery}
      />,
    );

    expect(await screen.findByTestId(testIds.result.actionCompact0)).toBeInTheDocument();
    expect(screen.getByText("마리나베이부터 시작하면 싱가포르 무드가 빨리 옵니다.")).toBeInTheDocument();
  });
});
