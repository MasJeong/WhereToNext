import { expect, test } from "@playwright/test";

/**
 * 추천 흐름의 핵심 선택값을 채운다.
 * @param page Playwright 페이지 객체
 * @returns 없음
 */
async function submitGuidedRecommendation(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByTestId("party-type-couple").click();
  await page.getByTestId("budget-mid").click();
  await page.getByTestId("trip-length-5").click();
  await page.getByTestId("travel-month-10").click();
  await page.getByTestId("vibe-romance").click();
  await page.getByTestId("departure-airport-ICN").click();
  await page.getByTestId("submit-recommendation").click();
  await expect(page.getByTestId("result-card-0")).toBeVisible();
}

test("restores a saved recommendation snapshot", async ({ page }) => {
  await submitGuidedRecommendation(page);

  await page.getByTestId("save-snapshot").click();
  await expect(page.getByTestId("saved-snapshot-0")).toBeVisible();

  const shareLink = page.getByRole("link", { name: "공유 페이지 보기" }).first();
  await expect(shareLink).toBeVisible();

  const href = await shareLink.getAttribute("href");
  expect(href).toBeTruthy();

  await page.goto(href!);
  await expect(page).toHaveURL(/\/s\//);
  await expect(page.getByTestId("result-card-0")).toBeVisible();
  await expect(page.getByTestId("instagram-vibe-0")).toBeVisible();
});

test("builds a compare board from two saved picks", async ({ page }) => {
  await submitGuidedRecommendation(page);

  await page.getByTestId("save-snapshot").click();
  await expect(page.getByTestId("saved-snapshot-0")).toBeVisible();

  await page.getByTestId("show-more-results").click();
  await page.getByTestId("save-snapshot-1").click();

  await expect(page.getByTestId("compare-selection-count")).toContainText("선택 2개");
  await page.getByTestId("compare-snapshot").click();

  await expect(page).toHaveURL(/\/compare\//);
  await expect(page.getByTestId("compare-column-0")).toBeVisible();
});

test("shows a sticky compare tray on mobile after saving a card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await submitGuidedRecommendation(page);

  await page.getByTestId("save-snapshot").click();
  await expect(page.getByTestId("sticky-compare-tray")).toBeVisible();
  await expect(page.getByTestId("sticky-compare-action")).toBeVisible();
});

test("shows trust-first recommendation signals on the lead card", async ({ page }) => {
  await submitGuidedRecommendation(page);

  const leadCard = page.getByTestId("result-card-0");

  await expect(leadCard.getByText("먼저 확인할 신뢰 신호")).toBeVisible();
  await expect(leadCard.getByText("신뢰 요약")).toBeVisible();
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
  await page.getByTestId("party-type-couple").click();
  await page.getByTestId("budget-mid").click();
  await page.getByTestId("trip-length-5").click();
  await page.getByTestId("travel-month-10").click();
  await page.getByTestId("vibe-romance").click();
  await page.getByTestId("departure-airport-ICN").click();
  await page.getByTestId("submit-recommendation").click();
  await expect(page.getByTestId("empty-state")).toBeVisible();

  await page.getByTestId("relax-filter-action-0").click();
  await expect(page.getByTestId("result-card-0")).toBeVisible();
});
