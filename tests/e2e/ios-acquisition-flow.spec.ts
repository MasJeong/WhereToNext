import { expect, test } from "@playwright/test";

/**
 * Runs the quick-entry recommendation flow used by anonymous iOS acquisition tests.
 */
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
  const shareLinkByHref = page.locator(`[data-testid="share-link"][href="${expectedHref}"]`);

  await expect(shareLinkByHref).toHaveCount(1, { timeout: 10000 });
  await expect(page.getByTestId(`saved-snapshot-${expectedIndex}`)).toHaveCount(1, { timeout: 10000 });

  const href = await shareLinkByHref.first().getAttribute("href");

  expect(href).toBeTruthy();
  expect(href).toBe(expectedHref);

  return href as string;
}


test("restores a saved recommendation snapshot on anonymous acquisition flow", async ({ page }) => {
  await submitQuickRecommendation(page);

  const href = await saveSnapshotAndCaptureShareUrl(page, page.getByTestId("save-snapshot"), 0);
  await page.goto(href);
  await expect(page).toHaveURL(/\/s\//);
  await expect(page.getByTestId("restore-brief")).toBeVisible();
  await expect(page.getByTestId("result-card-0")).toBeVisible();
  await expect(page.getByText("저장 당시 조건")).toBeVisible();
});

test("builds a compare board from saved snapshots in anonymous flow", async ({ page }) => {
  await submitQuickRecommendation(page);

  await saveSnapshotAndCaptureShareUrl(page, page.getByTestId("save-snapshot"), 0);

  await page.getByTestId("show-more-results").click();
  await saveSnapshotAndCaptureShareUrl(page, page.getByTestId("save-snapshot-1"), 1);

  await expect(page.getByTestId("compare-selection-count")).toContainText("선택 2개");
  await page.getByTestId("compare-snapshot").click();

  await expect(page).toHaveURL(/\/compare\//);
  await expect(page.getByTestId("compare-summary")).toBeVisible();
  await expect(page.getByTestId("compare-column-0")).toBeVisible();
});

test("shows restore error for an invalid snapshot id", async ({ page }) => {
  await page.goto("/s/invalid-snapshot-id");

  await expect(page.getByTestId("restore-error")).toBeVisible();
  await expect(page.getByRole("link", { name: "홈으로 돌아가기" })).toBeVisible();
});
