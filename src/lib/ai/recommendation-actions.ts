import type {
  RecommendationActionDetailBlock,
  RecommendationActionItem,
  RecommendationActionRequest,
  RecommendationActionsResponse,
  RecommendationQuery,
} from "@/lib/domain/contracts";
import { recommendationActionsResponseSchema } from "@/lib/domain/contracts";

type RecommendationActionNearbyPlace = NonNullable<RecommendationActionRequest["nearbyPlaces"]>[number];
type RecommendationLeadVibe = RecommendationQuery["vibes"][number];

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

function getOpenAiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() ?? "",
    model: process.env.OPENAI_TRIP_ACTIONS_MODEL?.trim() ?? "gpt-5-mini",
  };
}

function getLeadVibe(query: RecommendationQuery): RecommendationLeadVibe {
  return query.vibes[0] ?? "city";
}

function resolvePrimaryPlace(nearbyPlaces: RecommendationActionNearbyPlace[] | undefined, index = 0) {
  return nearbyPlaces?.[index] ?? null;
}

function buildVibeLabel(vibe: RecommendationLeadVibe) {
  switch (vibe) {
    case "food":
      return "맛집 동선";
    case "nature":
      return "바깥 풍경";
    case "beach":
      return "바다 시간";
    case "shopping":
      return "쇼핑 무드";
    case "nightlife":
      return "밤 산책";
    case "culture":
      return "도시 이야기";
    case "luxury":
      return "좋은 서피스";
    case "family":
      return "가볍게 움직이기";
    default:
      return "도시 리듬";
  }
}

function buildTailoredActionTitle(
  destinationName: string,
  vibe: RecommendationLeadVibe,
  nearbyPlaces: RecommendationActionNearbyPlace[] | undefined,
) {
  const secondPlace = resolvePrimaryPlace(nearbyPlaces, 1);

  switch (vibe) {
    case "food":
      return secondPlace
        ? `${secondPlace.name} 쪽으로 식사 동선을 먼저 잡아보세요`
        : `${destinationName}에서 먹고 걷는 동선부터 시작해 보세요`;
    case "nature":
    case "beach":
      return secondPlace
        ? `${secondPlace.name}처럼 바깥 풍경이 열리는 곳부터 가보세요`
        : `${destinationName}에서 풍경부터 보는 일정이 잘 맞아요`;
    case "shopping":
      return secondPlace
        ? `${secondPlace.name} 주변부터 둘러보면 리듬이 빨라져요`
        : `${destinationName}는 동네를 훑듯 둘러보는 시작이 잘 맞아요`;
    case "culture":
      return secondPlace
        ? `${secondPlace.name} 같은 대표 포인트를 먼저 찍어보세요`
        : `${destinationName}의 대표 포인트를 먼저 보며 감을 잡아보세요`;
    default:
      return secondPlace
        ? `${secondPlace.name} 근처부터 걸으면 이 도시 무드가 빨리 와요`
        : `${destinationName}는 한 구역부터 천천히 걸어보는 시작이 좋아요`;
  }
}

function buildCompactSummary(actions: RecommendationActionItem[]) {
  const leadAction = actions[0];

  if (!leadAction) {
    return "도착하자마자 갈 첫 포인트만 정해도 이 도시 감이 빨리 와요.";
  }

  return `${leadAction.title} 이 한 가지부터 잡으면 이 도시에서 어떻게 놀지 바로 감이 옵니다.`;
}

function buildFallbackActions(input: RecommendationActionRequest): RecommendationActionsResponse {
  const vibe = getLeadVibe(input.query);
  const firstPlace = resolvePrimaryPlace(input.nearbyPlaces, 0);
  const secondPlace = resolvePrimaryPlace(input.nearbyPlaces, 1);
  const thirdPlace = resolvePrimaryPlace(input.nearbyPlaces, 2);
  const firstWatchOut = input.watchOuts[0] ?? `${input.destinationName}에서는 이동 동선을 너무 넓히지 않는 편이 좋아요.`;

  const actions: RecommendationActionItem[] = [
    {
      id: "signature",
      label: "대표 경험",
      title: firstPlace
        ? `${firstPlace.name}부터 보고 도시 감을 잡아보세요`
        : `${input.destinationName}의 대표 포인트부터 가보세요`,
      description: `${input.leadReason} 같은 리듬을 가장 빨리 체감하기 좋은 시작입니다.`,
      placeLabel: firstPlace?.name ?? input.destinationName,
    },
    {
      id: "tailored",
      label: buildVibeLabel(vibe),
      title: buildTailoredActionTitle(input.destinationName, vibe, input.nearbyPlaces),
      description: input.whyThisFits,
      placeLabel: secondPlace?.name ?? input.destinationName,
    },
    {
      id: "easy-start",
      label: "첫날 가볍게",
      title: thirdPlace
        ? `${thirdPlace.name}처럼 부담 적은 곳부터 붙여 보세요`
        : `${input.destinationName}에선 첫날 한 구역만 천천히 보는 편이 좋아요`,
      description: firstWatchOut,
      placeLabel: thirdPlace?.name ?? input.destinationName,
    },
  ];

  const detailBlocks: RecommendationActionDetailBlock[] = [
    {
      id: "signature",
      title: "대표 경험",
      body: actions[0].description,
    },
    {
      id: "half-day",
      title: "반나절 코스",
      body: `${actions[0].placeLabel ?? input.destinationName}로 시작해 ${actions[1].placeLabel ?? input.destinationName} 쪽으로 이어가면 첫날 동선이 과하지 않게 잡힙니다.`,
    },
    {
      id: "check-point",
      title: "체크할 포인트",
      body: firstWatchOut,
    },
  ];

  return recommendationActionsResponseSchema.parse({
    status: "fallback",
    actions,
    compactSummary: buildCompactSummary(actions),
    detailBlocks,
  });
}

function buildSystemPrompt() {
  return [
    "너는 여행 추천 결과를 실제 행동 제안으로 바꿔 주는 한국어 여행 플래너다.",
    "이미 선택된 목적지를 바꾸지 마라.",
    "결과는 짧고 실행 가능하게 써라.",
    "과장, 감탄사, 블로그 말투를 쓰지 마라.",
    "확실하지 않은 가격, 운영시간, 예약 정보는 만들지 마라.",
    "출력은 JSON만 반환하고, 카드 수는 정확히 3개로 유지한다.",
  ].join(" ");
}

function buildUserPrompt(input: RecommendationActionRequest) {
  return JSON.stringify(
    {
      task: "추천 결과를 행동 제안으로 변환",
      destination: {
        id: input.destinationId,
        name: input.destinationName,
        summary: input.destinationSummary,
      },
      recommendation: {
        leadReason: input.leadReason,
        whyThisFits: input.whyThisFits,
        watchOuts: input.watchOuts,
      },
      tripQuery: input.query,
      nearbyPlaces: (input.nearbyPlaces ?? []).map((place) => ({
        name: place.name,
        shortAddress: place.shortAddress,
      })),
      evidence: (input.evidence ?? []).map((item) => ({
        sourceLabel: item.sourceLabel,
        summary: item.summary,
      })),
      outputRules: {
        actions: [
          "대표 경험 1개",
          "취향 맞춤 경험 1개",
          "첫날 가볍게 할 것 1개",
        ],
        labels: ["대표 경험", "취향 맞춤", "첫날 가볍게"],
        detailBlocks: ["대표 경험", "반나절 코스", "체크할 포인트"],
      },
    },
    null,
    2,
  );
}

function unwrapOpenAiTextContent(content: string | Array<{ type?: string; text?: string }> | undefined) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter((item) => item.type === "text" && typeof item.text === "string")
      .map((item) => item.text ?? "")
      .join("");
  }

  return "";
}

function extractJsonPayload(rawContent: string) {
  const trimmed = rawContent.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed
    .replace(/^```json\s*/u, "")
    .replace(/^```\s*/u, "")
    .replace(/\s*```$/u, "");

  return normalized;
}

async function requestOpenAiRecommendationActions(
  input: RecommendationActionRequest,
): Promise<RecommendationActionsResponse | null> {
  const { apiKey, model } = getOpenAiConfig();

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`openai-${response.status}`);
  }

  const payload = (await response.json()) as OpenAiChatCompletionResponse;
  const rawContent = unwrapOpenAiTextContent(payload.choices?.[0]?.message?.content);
  const normalized = extractJsonPayload(rawContent);

  if (!normalized) {
    return null;
  }

  return recommendationActionsResponseSchema.parse({
    ...JSON.parse(normalized),
    status: "ok",
  });
}

/**
 * 추천 결과를 행동 제안으로 바꿔 UI에서 바로 쓸 수 있게 정리한다.
 * @param input 추천 결과와 보조 정보
 * @returns AI 또는 fallback 기반 행동 제안 응답
 */
export async function getRecommendationActionsResult(
  input: RecommendationActionRequest,
): Promise<RecommendationActionsResponse> {
  const fallback = buildFallbackActions(input);

  try {
    const aiResult = await requestOpenAiRecommendationActions(input);

    if (!aiResult) {
      return fallback;
    }

    return recommendationActionsResponseSchema.parse({
      ...aiResult,
      compactSummary: aiResult.compactSummary || buildCompactSummary(aiResult.actions),
    });
  } catch {
    return fallback;
  }
}
