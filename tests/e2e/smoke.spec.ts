import { expect, test } from "@playwright/test";

test("shows the 떠나볼래 smoke shell and immediate search entry", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("떠나볼래?");
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

test("shows the home header with auth and account shortcuts", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /떠나볼래.*홈으로/i })).toBeVisible();
  await expect(page.getByLabel("주요 메뉴").getByRole("link", { name: "추천 받기" })).toBeVisible();
  await expect(page.getByLabel("주요 메뉴").getByRole("link", { name: "내 여행" })).toBeVisible();
  await expect(page.getByTestId("account-link")).toBeVisible();
  await expect(page.getByTestId("account-link")).toHaveText("내 여행");
  await expect(page.getByTestId("auth-cta")).toBeVisible();
  await expect(page.getByTestId("auth-cta")).toHaveText("로그인");
});

test("opens the question flow from the header start link", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "추천 받기" }).click();
  await expect(page.getByTestId("home-step-question")).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(/\/$/);
});

test("resets to landing when the logo is clicked from the home funnel", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "추천 받기" }).click();
  await expect(page.getByTestId("home-step-question")).toBeVisible({ timeout: 10000 });

  await page.getByRole("link", { name: /떠나볼래.*홈으로/i }).click();
  await expect(page.getByTestId("home-landing")).toBeVisible();
  await expect(page.getByTestId("home-step-question")).toHaveCount(0);
});

test("hides auth and account navigation in ios shell mode", async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_IOS_SHELL !== "true", "Runs only in ios shell mode.");

  await page.goto("/");

  await expect(page.getByTestId("account-link")).toHaveCount(0);
  await expect(page.getByTestId("auth-cta")).toHaveCount(0);
  await expect(page.getByTestId("home-cta")).toBeVisible();
});

test("shows a social-only auth entry that keeps browsing optional", async ({ page }) => {
  await page.goto("/auth?next=%2Fresults&intent=save");

  await expect(page.getByTestId("auth-provider-kakao")).toBeVisible();
  await expect(page.getByTestId("auth-provider-google")).toBeVisible();
  await expect(page.getByTestId("auth-provider-apple")).toBeVisible();
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByText("로그인 없이 계속 보기")).toBeVisible();
});
