import { expect, test } from "@playwright/test";

test("shows the Trip Compass smoke shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Trip Compass");
  await expect(
    page.getByRole("heading", {
      name: "한국에서 떠나는 해외여행, 취향에 맞는 목적지를 빠르게 골라보세요.",
    }),
  ).toBeVisible();
});
