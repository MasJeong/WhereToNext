import { expect, test } from "@playwright/test";

import {
  getAccountFutureTripDeleteTestId,
  getAccountFutureTripEntryTestId,
  getAccountHistoryEntryTestId,
  getHomeChoiceTestId,
  getResultCardTestId,
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
  await page.getByTestId(testIds.account.newHistoryNext).click();
  await page.getByTestId(testIds.account.newHistoryNext).click();
  await page.getByTestId(testIds.account.newHistoryNext).click();
  await page.getByTestId(testIds.account.newHistoryNext).click();
  await page.getByTestId(testIds.account.newHistoryNext).click();
  await page.getByTestId(testIds.account.newHistorySubmit).click();
  await expect(page).toHaveURL(/\/account\?tab=history/);
  await expect(page.getByTestId(getAccountHistoryEntryTestId(0))).toBeVisible();
}

async function clearFutureTrips(page: import("@playwright/test").Page) {
  const futureTrips = await page.evaluate(async () => {
    const response = await fetch("/api/me/future-trips", {
      credentials: "include",
    });

    return (await response.json()) as {
      futureTrips: Array<{ id: string }>;
    };
  });

  for (const futureTrip of futureTrips.futureTrips) {
    await page.evaluate(async (futureTripId) => {
      await fetch(`/api/me/future-trips/${futureTripId}`, {
        method: "DELETE",
        credentials: "include",
      });
    }, futureTrip.id);
  }
}

async function submitQuickRecommendation(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByTestId(testIds.home.cta).click();
  await page.getByTestId(getHomeChoiceTestId(0)).click();
  await page.getByTestId(getHomeChoiceTestId(1)).click();
  await page.getByTestId(getHomeChoiceTestId(1)).click();
  await page.getByTestId(getHomeChoiceTestId(0)).click();
  await page.getByTestId(testIds.home.next).click();
  await page.getByTestId(getHomeChoiceTestId(0)).click();
  await expect(page.getByTestId(getResultCardTestId(0))).toBeVisible({ timeout: 10000 });
}

test("shows future trip empty and list states, then deletes only that collection", async ({ page }) => {
  await signInWithMockGoogle(page);
  await clearFutureTrips(page);

  await page.goto("/account?tab=future-trips");
  await expect(page.getByTestId(testIds.account.futureTripEmptyState)).toBeVisible();

  await createHistoryEntry(page);
  await submitQuickRecommendation(page);
  await page.getByTestId(testIds.snapshot.saveSnapshot).click();
  await expect(page.getByTestId(getSavedSnapshotTestId(0))).toBeVisible();

  const futureTripResponse = await page.evaluate(async () => {
    const response = await fetch("/api/me/future-trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        destinationId: "osaka",
        sourceSnapshotId: "11111111-1111-4111-8111-111111111111",
      }),
    });

    return {
      status: response.status,
      body: (await response.json()) as { futureTrip?: { destinationNameKo: string } },
    };
  });

  expect(futureTripResponse.status).toBe(201);
  expect(futureTripResponse.body.futureTrip?.destinationNameKo).toBe("오사카");

  await page.goto("/account?tab=future-trips");
  await expect(page.getByTestId(getAccountFutureTripEntryTestId(0))).toBeVisible();
  await expect(page.getByTestId(getAccountFutureTripEntryTestId(0))).toContainText("오사카");

  await page.getByTestId(getAccountFutureTripDeleteTestId(0)).click();
  await expect(page.getByTestId(testIds.account.futureTripEmptyState)).toBeVisible();
  await expect(page.getByTestId(testIds.account.futureTripList).getByTestId(getAccountFutureTripEntryTestId(0))).toHaveCount(0);

  await page.getByTestId(testIds.account.tabHistory).click();
  await expect(page.getByTestId(getAccountHistoryEntryTestId(0))).toBeVisible();

  await page.getByTestId(testIds.account.tabSaved).click();
  await expect(page.getByTestId(getSavedSnapshotTestId(0))).toBeVisible();
});
