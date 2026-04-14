import { expect, test } from "@playwright/test";

import {
  getAccountFutureTripEntryTestId,
  getAccountHistoryDestinationResultTestId,
  getAccountHistoryEntryTestId,
  getSavedSnapshotPlanTestId,
  getSavedSnapshotTestId,
  testIds,
} from "@/lib/test-ids";

async function signInWithMockGoogle(page: import("@playwright/test").Page) {
  await page.goto("/auth?next=%2Faccount&intent=account");
  await page.getByTestId(testIds.auth.providerGoogle).click();
  await expect(page).toHaveURL(/\/account/);
}

async function createHistoryEntry(page: import("@playwright/test").Page) {
  await page.goto("/account");
  await page.getByTestId(testIds.account.addHistoryCta).click();
  await page.getByTestId(testIds.account.newHistoryDestinationSearch).fill("tokyo");
  await page.getByTestId(getAccountHistoryDestinationResultTestId(0)).click();
  await page.getByTestId(testIds.account.newHistoryNext).click();
  await page.getByTestId(testIds.account.newHistoryNext).click();
  await page.getByTestId(testIds.account.newHistoryNext).click();
  await page.getByTestId(testIds.account.newHistoryNext).click();
  await page.getByTestId(testIds.account.newHistorySubmit).click();
  await expect(page).toHaveURL(/\/account\?tab=history/);
  await expect(page.getByTestId(getAccountHistoryEntryTestId(0))).toBeVisible();
}

async function submitQuickRecommendation(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByTestId(testIds.home.cta).click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByRole("button", { name: /10~12월/ }).click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId(testIds.home.next).click();
  await page.getByTestId("home-step-choice-0").click();
  await expect(page.getByTestId("result-card-0")).toBeVisible({ timeout: 10000 });
}

test("promotes a saved recommendation into 앞으로 갈 곳 and can move it back", async ({ page }) => {
  await signInWithMockGoogle(page);

  await page.goto("/account?tab=future-trips");
  await expect(page.getByTestId(testIds.account.futureTripList)).toBeVisible();

  await createHistoryEntry(page);
  await submitQuickRecommendation(page);
  await page.getByTestId(testIds.snapshot.saveSnapshot).click();
  await expect(page.getByTestId(getSavedSnapshotTestId(0))).toBeVisible();

  await page.goto("/account?tab=saved");
  await expect(page.getByTestId(getSavedSnapshotTestId(0))).toBeVisible();
  await page.getByTestId(getSavedSnapshotPlanTestId(0)).click();
  await page.getByTestId(testIds.account.tabFutureTrips).click();
  await expect(page).toHaveURL(/\/account\?tab=future-trips/);

  await expect(page.getByTestId(getAccountFutureTripEntryTestId(0))).toBeVisible();

  await page.getByRole("button", { name: "저장 목록으로" }).first().click();

  await page.getByTestId(testIds.account.tabHistory).click();
  await expect(page).toHaveURL(/\/account\?tab=history/);
  await expect(page.getByTestId(getAccountHistoryEntryTestId(0))).toBeVisible();

  await page.getByTestId(testIds.account.tabSaved).click();
  await expect(page).toHaveURL(/\/account\?tab=saved/);
  await expect(page.getByTestId(getSavedSnapshotTestId(0))).toBeVisible();
});
