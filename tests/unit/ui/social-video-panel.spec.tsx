import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LeadSocialVideoPanel } from "@/components/trip-compass/social-video-panel";
import { defaultRecommendationQuery } from "@/lib/trip-compass/presentation";

describe("LeadSocialVideoPanel fallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows fallback search links when the API returns empty with fallback metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: "empty",
            item: null,
            items: [],
            fallback: {
              reason: "no-candidates",
              headline: "자동 추천 대신 바로 찾을 수 있는 링크를 준비했어요",
              description: "목적지 기준 YouTube 검색 링크를 대신 보여드려요.",
              searches: [
                {
                  label: "도쿄 여행 브이로그",
                  url: "https://www.youtube.com/results?search_query=tokyo+travel+vlog",
                },
              ],
            },
          }),
        ),
      ),
    );

    render(
      <LeadSocialVideoPanel
        destinationId="tokyo"
        destinationName="도쿄"
        leadReason="먹고 걷는 일정과 잘 맞아요"
        query={defaultRecommendationQuery}
      />, 
    );

    expect(await screen.findByTestId("social-video-fallback")).toBeInTheDocument();
    expect(screen.getByTestId("social-video-fallback-link-0")).toHaveTextContent("도쿄 여행 브이로그");
  });

  it("renders decoded YouTube text when the API returns html entities", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            item: {
              provider: "youtube",
              videoId: "tokyo-amp",
              title: "Tokyo Food &amp; Night Walk",
              channelTitle: "Trips &amp; Eats",
              channelUrl: "https://www.youtube.com/channel/trips-and-eats",
              videoUrl: "https://www.youtube.com/watch?v=tokyo-amp",
              thumbnailUrl: "https://img.youtube.com/vi/tokyo-amp/hqdefault.jpg",
              publishedAt: "2026-03-28T00:00:00.000Z",
              durationSeconds: 65,
            },
            items: [
              {
                provider: "youtube",
                videoId: "tokyo-amp",
                title: "Tokyo Food &amp; Night Walk",
                channelTitle: "Trips &amp; Eats",
                channelUrl: "https://www.youtube.com/channel/trips-and-eats",
                videoUrl: "https://www.youtube.com/watch?v=tokyo-amp",
                thumbnailUrl: "https://img.youtube.com/vi/tokyo-amp/hqdefault.jpg",
                publishedAt: "2026-03-28T00:00:00.000Z",
                durationSeconds: 65,
              },
            ],
          }),
        ),
      ),
    );

    render(
      <LeadSocialVideoPanel
        destinationId="tokyo"
        destinationName="도쿄"
        leadReason="먹고 걷는 일정과 잘 맞아요"
        query={defaultRecommendationQuery}
      />,
    );

    expect(await screen.findByText("Tokyo Food & Night Walk")).toBeInTheDocument();
    expect(screen.getByText(/Trips & Eats/)).toBeInTheDocument();
  });
});
