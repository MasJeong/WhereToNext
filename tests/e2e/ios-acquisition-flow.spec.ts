import { expect, test } from "@playwright/test";

async function signInWithMockGoogle(page: import("@playwright/test").Page) {
  await page.goto("/auth");
  await page.getByTestId("auth-provider-google").click();
  await expect(page).toHaveURL(/\/account/);
}

/**
 * Runs the quick-entry recommendation flow used by anonymous iOS acquisition tests.
 */
async function submitQuickRecommendation(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByTestId("home-landing")).toBeVisible();
  await page.getByTestId("home-cta").click();
  await expect(page.getByTestId("home-step-question")).toBeVisible();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByRole("button", { name: /10~12월/ }).click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-next").click();
  await page.getByTestId("home-step-choice-0").click();
  await expect(page.getByTestId("home-top-summary")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("result-card-0")).toBeVisible({ timeout: 10000 });
}

/**
 * Clicks a save button, waits for snapshot API completion, and returns the share link.
 *
 * @param page Playwright page
 * @param saveButton TestId locator for the save button
 * @param expectedIndex Index of the expected saved snapshot card
 */
async function saveSnapshotAndCaptureShareUrl(
  page: import("@playwright/test").Page,
  saveButton: ReturnType<import("@playwright/test").Page["getByTestId"]>,
  expectedIndex: number,
): Promise<string> {
  const snapshotResponsePromise = page.waitForResponse((response) => {
    return (
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/snapshots"
    );
  });

  await saveButton.click();
  const response = await snapshotResponsePromise;

  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as { snapshotId?: string };
  const snapshotId = payload.snapshotId;

  expect(snapshotId).toBeTruthy();

  const expectedHref = `/s/${snapshotId}`;
  await expect(page.getByTestId(`saved-snapshot-${expectedIndex}`)).toHaveCount(1, { timeout: 10000 });

  return expectedHref;
}


test("restores a saved recommendation snapshot after social login on acquisition flow", async ({ page }) => {
  await signInWithMockGoogle(page);
  await submitQuickRecommendation(page);

  const href = await saveSnapshotAndCaptureShareUrl(page, page.getByTestId("save-snapshot"), 0);
  await page.goto(href);
  await expect(page).toHaveURL(/\/s\//);
  await expect(page.getByTestId("restore-brief")).toBeVisible();
  await expect(page.getByTestId("result-card-0")).toBeVisible();
  await expect(page.getByText("저장 당시 조건")).toBeVisible();
});

test("builds a compare board from saved snapshots after social login on acquisition flow", async ({ page }) => {
  await signInWithMockGoogle(page);
  await submitQuickRecommendation(page);

  await saveSnapshotAndCaptureShareUrl(page, page.getByTestId("save-snapshot"), 0);

  await page.getByTestId("show-more-results").click();
  await saveSnapshotAndCaptureShareUrl(page, page.getByTestId("save-snapshot-1"), 1);

  await expect(page.getByTestId("compare-selection-count")).toContainText("선택 2개");
  await page.getByTestId("compare-snapshot").click();

  await expect(page).toHaveURL(/\/compare\//);
  await expect(page.getByTestId("compare-summary")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("compare-column-0")).toBeVisible({ timeout: 10000 });
});

test("shows restore error for an invalid snapshot id", async ({ page }) => {
  await page.goto("/s/invalid-snapshot-id");

  await expect(page.getByTestId("restore-error")).toBeVisible();
  await expect(page.getByRole("link", { name: "홈으로 돌아가기" })).toBeVisible();
});
