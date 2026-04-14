import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CompactSocialVideoPanel, LeadSocialVideoPanel } from "@/components/trip-compass/social-video-panel";
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
    expect(screen.getByRole("link", { name: /Trips & Eats 채널/ })).toBeInTheDocument();
  });

  it("hides fallback guidance when a playable YouTube item exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: "fallback",
            item: {
              provider: "youtube",
              videoId: "tokyo-playable",
              title: "Tokyo Walkable Nights",
              channelTitle: "Trips & Eats",
              channelUrl: "https://www.youtube.com/channel/trips-and-eats",
              videoUrl: "https://www.youtube.com/watch?v=tokyo-playable",
              thumbnailUrl: "https://img.youtube.com/vi/tokyo-playable/hqdefault.jpg",
              publishedAt: "2026-03-28T00:00:00.000Z",
              durationSeconds: 65,
            },
            items: [
              {
                provider: "youtube",
                videoId: "tokyo-playable",
                title: "Tokyo Walkable Nights",
                channelTitle: "Trips & Eats",
                channelUrl: "https://www.youtube.com/channel/trips-and-eats",
                videoUrl: "https://www.youtube.com/watch?v=tokyo-playable",
                thumbnailUrl: "https://img.youtube.com/vi/tokyo-playable/hqdefault.jpg",
                publishedAt: "2026-03-28T00:00:00.000Z",
                durationSeconds: 65,
              },
            ],
            fallback: {
              reason: "low-confidence",
              headline: "대표 영상 대신 더 넓게 찾은 후보를 보여드려요",
              description: "정확도는 조금 낮아 검색 링크도 함께 보여드려요.",
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

    expect(await screen.findByText("Tokyo Walkable Nights")).toBeInTheDocument();
    expect(screen.queryByTestId("social-video-fallback")).not.toBeInTheDocument();
  });

  it("shows staged loading copy before the API resolves", () => {
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
      <LeadSocialVideoPanel
        destinationId="tokyo"
        destinationName="도쿄"
        leadReason="먹고 걷는 일정과 잘 맞아요"
        query={defaultRecommendationQuery}
      />,
    );

    expect(screen.getByText("관련 영상 붙이는 중")).toBeInTheDocument();
    expect(screen.getAllByText("준비 중").length).toBeGreaterThan(0);
  });

  it("renders a compact supporting video card for secondary recommendations", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          status: "ok",
          items: [
            {
              provider: "youtube",
              videoId: "tokyo-support",
              title: "Tokyo Cafes &amp; City Walk",
              channelTitle: "Trips &amp; Eats",
              channelUrl: "https://www.youtube.com/channel/trips-and-eats",
              videoUrl: "https://www.youtube.com/watch?v=tokyo-support",
              thumbnailUrl: "https://img.youtube.com/vi/tokyo-support/hqdefault.jpg",
              publishedAt: "2026-03-28T00:00:00.000Z",
              durationSeconds: 95,
              viewCount: 182000,
            },
          ],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CompactSocialVideoPanel
        destinationId="tokyo"
        destinationName="도쿄"
        leadReason="먹고 걷는 일정과 잘 맞아요"
        query={defaultRecommendationQuery}
      />,
    );

    expect(screen.getByRole("button", { name: /도쿄 영상 보기/ })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /도쿄 영상 보기/ }));

    expect(await screen.findByText("Tokyo Cafes & City Walk")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: /Tokyo Cafes & City Walk/ })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=tokyo-support",
    );
  });

  it("does not request a compact video until the user opens it", () => {
    const fetchMock = vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            items: [
              {
                provider: "youtube",
                videoId: "tokyo-support",
                title: "Tokyo Cafes &amp; City Walk",
                channelTitle: "Trips &amp; Eats",
                channelUrl: "https://www.youtube.com/channel/trips-and-eats",
                videoUrl: "https://www.youtube.com/watch?v=tokyo-support",
                thumbnailUrl: "https://img.youtube.com/vi/tokyo-support/hqdefault.jpg",
                publishedAt: "2026-03-28T00:00:00.000Z",
                durationSeconds: 95,
                viewCount: 182000,
              },
            ],
          }),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CompactSocialVideoPanel
        destinationId="tokyo"
        destinationName="도쿄"
        leadReason="먹고 걷는 일정과 잘 맞아요"
        query={defaultRecommendationQuery}
      />,
    );

    expect(screen.getByRole("button", { name: /도쿄 영상 보기/ })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
