import { expect, test } from "@playwright/test";

async function submitQuickRecommendation(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByTestId("home-cta").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-1").click();
  await page.getByTestId("home-step-choice-0").click();
  await page.getByTestId("home-step-next").click();
  await page.getByTestId("home-step-choice-0").click();
  await expect(page.getByTestId("result-card-0")).toBeVisible({ timeout: 10000 });
}

test("auth page shows only social providers", async ({ page }) => {
  await page.goto("/auth?next=%2Fresults&intent=save");

  await expect(page.getByTestId("auth-provider-kakao")).toBeVisible();
  await expect(page.getByTestId("auth-provider-google")).toBeVisible();
  await expect(page.getByTestId("auth-provider-apple")).toBeVisible();
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});

test("mock google login redirects to account", async ({ page }) => {
  await page.goto("/auth?next=%2Faccount&intent=account");
  await page.getByTestId("auth-provider-google").click();

  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByTestId("my-taste-root")).toBeVisible();
  await expect(page.getByTestId("auth-cta")).toHaveText("로그아웃");
  await expect(page.getByTestId("account-link")).toHaveCount(0);
  await expect(page.getByTestId("identity-card")).toBeVisible();
  await expect(page.getByTestId("identity-card")).toContainText("로그인됨");
});

test("mock social login resumes saving after auth", async ({ page }) => {
  await submitQuickRecommendation(page);
  await page.getByTestId("save-snapshot").click();

  await expect(page).toHaveURL(/\/auth\?/);
  await page.getByTestId("auth-provider-google").click();

  await expect(page).toHaveURL(/(partyType=couple|\/account)/);
});

test("handles provider collision flow without crashing", async ({ page, request, browserName }) => {
  await request.post("/api/auth/sign-up", {
    data: {
      name: "Existing User",
      email: "user@example.com",
      password: "tripCompass123",
    },
  });

  await page.goto("/auth?mockCase=collision");
  await page.getByTestId("auth-provider-google").click();

  if (browserName === "chromium") {
    await expect(page).toHaveURL(/(\/auth\?.*error=|\/account)/);
    return;
  }

  await expect(page).toHaveURL(/(\/auth|\/account)/);
});

test("mock kakao no-email login succeeds", async ({ page }) => {
  await page.goto("/auth?mockCase=no-email");
  await page.getByTestId("auth-provider-kakao").click();

  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByTestId("my-taste-root")).toBeVisible();
});

test("mock apple form_post login succeeds", async ({ page }) => {
  await page.goto("/auth?mockCase=relay");
  await page.getByTestId("auth-provider-apple").click();

  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByTestId("my-taste-root")).toBeVisible();
});
