import { expect, test } from "@playwright/test";

async function submitQuickRecommendation(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("home-landing")).toBeVisible();
  await page.getByTestId("home-cta").click();
  await expect(page.getByTestId("home-step-question")).toBeVisible();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-0").click();
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
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-choice-0").click();
  await expect(page.getByTestId("home-top-summary")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("result-card-0")).toBeVisible({ timeout: 10000 });
}

test("starts on a landing page and reaches results through the funnel", async ({ page }) => {
  await submitQuickRecommendation(page);
});

test("supports back navigation during the one-question-per-screen funnel", async ({ page }) => {
  await submitGuidedRecommendation(page);
  await expect(page.getByTestId("home-step-question")).toHaveCount(0);
});

test("restores a saved recommendation snapshot", async ({ page }) => {
  await submitQuickRecommendation(page);

  await page.getByTestId("save-snapshot").click();
  await expect(page.getByTestId("saved-snapshot-0")).toBeVisible();

  const shareLink = page.getByRole("link", { name: "공유 페이지 보기" }).first();
  await expect(shareLink).toBeVisible();

  const href = await shareLink.getAttribute("href");
  expect(href).toBeTruthy();

  await page.goto(href!);
  await expect(page).toHaveURL(/\/s\//);
  await expect(page.getByText("저장 당시 조건")).toBeVisible();
  await expect(page.getByTestId("restore-brief")).toBeVisible();
  await expect(page.getByTestId("result-card-0")).toBeVisible();
  await expect(page.getByTestId("instagram-vibe-0")).toBeVisible();
});

test("builds a compare board from two saved picks", async ({ page }) => {
  await submitQuickRecommendation(page);

  await page.getByTestId("save-snapshot").click();
  await expect(page.getByTestId("saved-snapshot-0")).toBeVisible();

  await page.getByTestId("show-more-results").click();
  await page.getByTestId("save-snapshot-1").click();

  await expect(page.getByTestId("compare-selection-count")).toContainText("선택 2개");
  await page.getByTestId("compare-snapshot").click();

  await expect(page).toHaveURL(/\/compare\//);
  await expect(page.getByTestId("compare-summary")).toBeVisible();
  await expect(page.getByTestId("compare-column-0")).toBeVisible();
  await expect(page.locator('[data-testid="compare-verdict-row"]:visible').first()).toBeVisible();
});

test("shows a sticky compare tray on mobile after saving a card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await submitQuickRecommendation(page);

  await page.getByTestId("save-snapshot").click();
  await expect(page.getByTestId("sticky-compare-tray")).toBeVisible();
  await expect(page.getByTestId("sticky-compare-action")).toBeVisible();
});

test("allows sign-up, trip history save, and personalized recommendations", async ({ page }) => {
  const email = `trip-compass-${Date.now()}@example.com`;

  await page.goto("/auth");
  await page.getByTestId("auth-mode-sign-up").click();
  await page.getByTestId("auth-name-input").fill("지훈");
  await page.getByTestId("auth-email-input").fill(email);
  await page.getByTestId("auth-password-input").fill("tripCompass123");
  await page.getByTestId("auth-submit").click();

  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByTestId("new-history-submit")).toBeVisible();
  await page.getByTestId("new-history-submit").click();
  await expect(page.getByTestId("history-entry-0")).toBeVisible();

  await page.goto("/");
  await submitQuickRecommendation(page);
  await expect(page.getByTestId("personalized-note")).toBeVisible();
});

test("shows recommendation reason and day-flow on the lead card", async ({ page }) => {
  await submitQuickRecommendation(page);

  const leadCard = page.getByTestId("result-card-0");

  await expect(leadCard.getByText("추천 이유")).toBeVisible();
  await expect(leadCard.getByText("Day-flow")).toBeVisible();
  await expect(leadCard.getByText("Day 1")).toBeVisible();
  await expect(leadCard.getByText("Day 2")).toBeVisible();
  await expect(leadCard.getByText("Day 3")).toBeVisible();
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
  await page.getByTestId("home-step-choice-0").click();

  await expect(page.getByText("지금은 추천 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();

  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(page.getByTestId("result-card-0")).toBeVisible({ timeout: 10000 });
});

test("shows a manual-copy fallback when snapshot clipboard copy fails", async ({ page }) => {
  await submitQuickRecommendation(page);

  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error("clipboard-blocked");
    };
  });

  await page.getByTestId("save-snapshot").click();

  await expect(page.getByText("링크 복사가 실패했어요.")).toBeVisible();
  await expect(page.locator('input[readonly][value*="/s/"]')).toBeVisible();
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
