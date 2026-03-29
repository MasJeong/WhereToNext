import { expect, test } from "@playwright/test";

async function signInWithMockGoogle(page: import("@playwright/test").Page, next?: string) {
  await page.goto(next ? `/auth?next=${encodeURIComponent(next)}` : "/auth");
  await page.getByTestId("auth-provider-google").click();
}

async function submitQuickRecommendation(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("home-landing")).toBeVisible();
  await page.getByTestId("home-cta").click();
  await expect(page.getByTestId("home-step-question")).toBeVisible();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-next").click();
  await page.getByTestId("home-step-choice-0").click();
  await expect(page.getByTestId("home-top-summary")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("result-filter-bar")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("result-card-0")).toBeVisible({ timeout: 10000 });
}

async function submitGuidedRecommendation(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("home-landing")).toBeVisible();
  await expect(page.getByTestId("home-step-question")).toHaveCount(0);
  await page.getByTestId("home-cta").click();
  await expect(page.getByTestId("home-step-question")).toBeVisible();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-choice-2").click();
  await page.getByTestId("home-step-prev").click();
  await expect(page.getByTestId("home-step-question")).toContainText("언제쯤 떠나고 싶으세요?");
  await page.getByTestId("home-step-choice-2").click();
  await expect(page.getByTestId("home-step-question")).toContainText("며칠 정도 생각하고 있나요?");
  await page.getByTestId("home-step-choice-1").click();
  await expect(page.getByTestId("home-step-question")).toContainText("이번 여행에서는 뭐가 더 중요해요?");
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-choice-8").click();
  await page.getByTestId("home-step-next").click();
  await page.getByTestId("home-step-choice-0").click();
  await expect(page.getByTestId("home-top-summary")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("result-card-0")).toBeVisible({ timeout: 10000 });
}

async function mockSocialVideoOk(page: import("@playwright/test").Page) {
  await page.route("**/api/social-video*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        item: {
          provider: "youtube",
          videoId: "tokyo-social-video",
          title: "도쿄 골목과 야경을 빠르게 보는 여행 브이로그",
          channelTitle: "서울 여행자",
          channelUrl: "https://www.youtube.com/channel/seoul-traveler",
          videoUrl: "https://www.youtube.com/watch?v=tokyo-social-video",
          thumbnailUrl:
            "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'%3E%3Crect width='1280' height='720' fill='%230b63ce'/%3E%3Ccircle cx='640' cy='360' r='120' fill='white' fill-opacity='0.18'/%3E%3Cpolygon points='600,305 600,415 715,360' fill='white'/%3E%3C/svg%3E",
          publishedAt: "2026-03-24T09:00:00.000Z",
          durationSeconds: 342,
        },
      }),
    });
  });
}

async function mockSocialVideoEmpty(page: import("@playwright/test").Page) {
  await page.route("**/api/social-video*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "empty",
        item: null,
      }),
    });
  });
}

test("starts on a landing page and reaches results through the funnel", async ({ page }) => {
  await submitQuickRecommendation(page);
});

test("supports back navigation during the one-question-per-screen funnel", async ({ page }) => {
  await submitGuidedRecommendation(page);
  await expect(page.getByTestId("home-step-question")).toHaveCount(0);
});

test("asks realistic travel conditions instead of romance-first and departure-airport questions", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("home-cta").click();

  await expect(page.getByTestId("home-step-question")).toContainText("누구와 가세요?");
  await page.getByTestId("home-step-choice-0").click();

  await expect(page.getByTestId("home-step-question")).toContainText("언제쯤 떠나고 싶으세요?");
  await page.getByTestId("home-step-choice-1").click();

  await expect(page.getByTestId("home-step-question")).toContainText("며칠 정도 생각하고 있나요?");
  await page.getByTestId("home-step-choice-1").click();

  await expect(page.getByTestId("home-step-question")).toContainText("이번 여행에서는 뭐가 더 중요해요?");
  await expect(page.getByText("체험·액티비티")).toBeVisible();
  await expect(page.getByText("SNS 핫플레이스")).toBeVisible();
  await expect(page.getByText("관광보다 먹방")).toBeVisible();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-choice-8").click();
  await page.getByTestId("home-step-next").click();

  await expect(page.getByTestId("home-step-question")).toContainText("비행이나 이동 부담은 어느 정도 괜찮아요?");
  await expect(page.getByText("가까운 곳 위주")).toBeVisible();
  await expect(page.getByText("중거리까지 괜찮아요")).toBeVisible();
  await expect(page.getByText("멀어도 괜찮아요")).toBeVisible();

  await expect(page.getByText("가장 먼저 챙기고 싶은 분위기는요?")).toHaveCount(0);
  await expect(page.getByText("출발은 어디 기준으로 볼까요?")).toHaveCount(0);
});

test("reflects the selected practical conditions in the result summary", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("home-cta").click();

  await page.getByTestId("home-step-choice-2").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-choice-2").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-7").click();
  await page.getByTestId("home-step-next").click();
  await page.getByTestId("home-step-choice-2").click();

  await expect(page.getByTestId("home-top-summary")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("query-summary")).toContainText("7월 · 8일");
  await expect(page.getByTestId("query-summary")).toContainText("장거리도 가능");
  await expect(page.getByTestId("query-summary")).toContainText("도시");
  await expect(page.getByTestId("query-summary")).toContainText("쇼핑");
});

test("redirects signed-out save actions to the social auth gate", async ({ page }) => {
  await submitQuickRecommendation(page);

  await page.getByTestId("save-snapshot").click();

  await expect(page).toHaveURL(/\/auth\?/);
  await expect(page.getByTestId("auth-provider-google")).toBeVisible();
});

test("redirects signed-out compare-save entry points to the social auth gate", async ({ page }) => {
  await submitQuickRecommendation(page);

  await page.getByTestId("save-snapshot").click();

  await expect(page).toHaveURL(/\/auth\?/);
  await expect(page.getByTestId("auth-provider-google")).toBeVisible();
});

test("redirects mobile save actions to the social auth gate", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await submitQuickRecommendation(page);

  await page.getByTestId("save-snapshot").click();
  await expect(page).toHaveURL(/\/auth\?/);
  await expect(page.getByTestId("auth-provider-google")).toBeVisible();
});

test("allows social sign-in, trip history save, and personalized recommendations", async ({ page }) => {
  await signInWithMockGoogle(page);

  await expect(page).toHaveURL(/\/account/);
  await page.getByTestId("add-history-cta").click();
  await expect(page).toHaveURL(/\/account\/history\/new/);
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-image-input").setInputFiles({
    name: "trip-note.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn4xWQAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-memo").fill("골목 산책과 야시장 분위기가 특히 좋았어요.");
  await expect(page.getByTestId("new-history-submit")).toBeVisible();
  await page.getByTestId("new-history-submit").click();
  await expect(page).toHaveURL(/\/account\?tab=history/);
  await expect(page.getByTestId("history-entry-0")).toBeVisible();

  await page.goto("/");
  await submitQuickRecommendation(page);
  await expect(page.getByTestId("personalized-note")).toBeVisible();
});

test("shows saved recommendations in a separate account tab", async ({ page }) => {
  await signInWithMockGoogle(page);
  await expect(page).toHaveURL(/\/account/);
  await page.goto("/");
  await expect(page.getByTestId("home-landing")).toBeVisible();
  await submitQuickRecommendation(page);
  await page.getByTestId("save-snapshot").click();
  await expect(page.getByTestId("saved-snapshot-0")).toBeVisible();

  await page.goto("/account?tab=saved");
  await expect(page.getByTestId("account-tab-saved")).toBeVisible();
  await expect(page.getByTestId("saved-snapshot-0")).toBeVisible();
});

test("lets users edit an existing trip history entry from the list", async ({ page }) => {
  await signInWithMockGoogle(page);
  await expect(page).toHaveURL(/\/account/);
  await page.getByTestId("add-history-cta").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-submit").click();
  const firstHistoryCard = page.getByTestId("history-entry-0");
  await expect(firstHistoryCard).toBeVisible();
  await expect(firstHistoryCard.getByRole("button", { name: "수정" })).toBeVisible();

  await firstHistoryCard.getByRole("button", { name: "수정" }).click();
  await expect(page).toHaveURL(/\/account\/history\/.*\/edit/);
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-next").click();
  await page.getByTestId("new-history-memo").fill("수정 후에는 메모를 더 짧게 다시 정리했어요.");
  await page.getByTestId("new-history-submit").click();

  await expect(page).toHaveURL(/\/account\?tab=history/);
  await expect(page.getByTestId("history-entry-0")).toContainText("수정 후에는 메모를 더 짧게 다시 정리했어요.");
});

test("shows the lead summary and primary actions on the lead card", async ({ page }) => {
  await submitQuickRecommendation(page);

  const leadCard = page.getByTestId("result-card-0");

  await expect(leadCard.getByRole("link", { name: "상세 보기" })).toBeVisible();
  await expect(leadCard.getByRole("button", { name: "일정 담기" })).toBeVisible();
  await expect(leadCard.getByText("추천 시기")).toBeVisible();
});

test("shows a social video block only for the lead recommendation", async ({ page }) => {
  await mockSocialVideoOk(page);
  await submitQuickRecommendation(page);

  await expect(page.getByTestId("social-video-block")).toHaveCount(1);
  await expect(page.getByTestId("social-video-title")).toContainText("도쿄 골목과 야경");
  await expect(page.getByTestId("social-video-link")).toHaveAttribute(
    "href",
    "https://www.youtube.com/watch?v=tokyo-social-video",
  );
});

test("keeps recommendation results visible when social video is unavailable", async ({ page }) => {
  await mockSocialVideoEmpty(page);
  await submitQuickRecommendation(page);

  await expect(page.getByTestId("social-video-block")).toHaveCount(0);
  await expect(page.getByTestId("result-card-0")).toBeVisible();
});

test("shows the detail first fold with 3 facts and an itinerary CTA", async ({ page }) => {
  await submitQuickRecommendation(page);

  const leadCard = page.getByTestId("result-card-0");
  await leadCard.getByRole("link", { name: "상세 보기" }).click();

  const coreFacts = page.getByTestId("destination-core-facts");
  await expect(coreFacts).toBeVisible();
  await expect(coreFacts.locator("article")).toHaveCount(3);
  await expect(page.getByTestId("destination-itinerary-cta")).toBeVisible();
  await expect(page.getByTestId("destination-itinerary-cta")).toHaveText("내 일정에 담기");
});

test("recovers from the empty state through a relaxation action", async ({ page }) => {
  let shouldReturnEmpty = true;

  await page.route("**/api/recommendations*", async (route) => {
    if (!shouldReturnEmpty) {
      await route.fallback();
      return;
    }

    shouldReturnEmpty = false;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query: {
          partyType: "couple",
          partySize: 2,
          budgetBand: "mid",
          tripLengthDays: 5,
          departureAirport: "ICN",
          travelMonth: 10,
          pace: "balanced",
          flightTolerance: "medium",
          vibes: ["romance"],
        },
        recommendations: [],
        meta: {
          scoringVersion: "mvp-v1",
          resultCount: 0,
        },
        sourceSummary: {
          mode: "fallback",
          evidenceCount: 0,
          tiers: [],
        },
      }),
    });
  });

  await page.goto("/");
  await page.getByTestId("home-cta").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-next").click();
  await page.getByTestId("home-step-choice-0").click();
  await expect(page.getByTestId("empty-state")).toBeVisible();

  await page.getByTestId("relax-filter-action-0").click();
  await expect(page.getByTestId("result-card-0")).toBeVisible();
});

test("shows a retry path when recommendation loading fails", async ({ page }) => {
  let shouldFailOnce = true;

  await page.route("**/api/recommendations*", async (route) => {
    if (shouldFailOnce) {
      shouldFailOnce = false;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: "INTERNAL_ERROR" }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/");
  await page.getByTestId("home-cta").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-next").click();
  await page.getByTestId("home-step-choice-0").click();

  await expect(page.getByText("지금은 추천 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();

  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(page.getByTestId("result-card-0")).toBeVisible({ timeout: 10000 });
});

test("keeps signed-out snapshot save behind the social auth gate even when clipboard is unavailable", async ({ page }) => {
  await submitQuickRecommendation(page);

  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error("clipboard-blocked");
    };
  });

  await page.getByTestId("save-snapshot").click();

  await expect(page).toHaveURL(/\/auth\?/);
  await expect(page.getByTestId("auth-provider-google")).toBeVisible();
});

test("shows a manual-copy fallback when detail clipboard copy fails", async ({ page }) => {
  await submitQuickRecommendation(page);
  await page.getByTestId("result-card-0").getByRole("link", { name: "상세 보기" }).click();

  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error("clipboard-blocked");
    };
  });

  await page.getByRole("button", { name: "상세 링크 복사" }).click();

  await expect(page.getByText("링크를 복사하지 못했어요. 아래 링크를 길게 눌러 복사해 주세요.")).toBeVisible();
  await expect(page.locator('input[readonly][value*="/destinations/"]')).toBeVisible();
});
