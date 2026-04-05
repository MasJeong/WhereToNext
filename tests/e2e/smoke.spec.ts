import { expect, test } from "@playwright/test";

test("shows the SooGo smoke shell and immediate search entry", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("SooGo");
  await expect(page.getByTestId("home-landing")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /여행지,\s*바로 추천받기/,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("home-cta")).toBeVisible();
  await expect(page.getByTestId("home-step-question")).toHaveCount(0);
  await expect(page.getByTestId("home-step-choice-0")).toHaveCount(0);

  await page.getByTestId("home-cta").click();
  await expect(page.getByTestId("home-step-question")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("home-step-progress")).toBeVisible({ timeout: 10000 });
});

test("keeps the bare home shell without auth and account shortcuts", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("account-link")).toHaveCount(0);
  await expect(page.getByTestId("auth-cta")).toHaveCount(0);
});

test("hides auth and account navigation in ios shell mode", async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_IOS_SHELL !== "true", "Runs only in ios shell mode.");

  await page.goto("/");

  await expect(page.getByTestId("account-link")).toHaveCount(0);
  await expect(page.getByTestId("auth-cta")).toHaveCount(0);
  await expect(page.getByTestId("home-cta")).toBeVisible();
});
