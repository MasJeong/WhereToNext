import { expect, test } from "@playwright/test";

test("shows the Trip Compass smoke shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Trip Compass");
  await expect(
    page.getByRole("heading", {
      name: "어디로 갈지 아직 몰라도, 내 여행 조건으로 목적지를 먼저 추려드려요.",
    }),
  ).toBeVisible();
});
