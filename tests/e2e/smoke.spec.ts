import { expect, test } from "@playwright/test";

test("shows the SooGo smoke shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("SooGo");
  await expect(
    page.getByRole("heading", {
      name: "누구와 떠나세요?",
    }),
  ).toBeVisible();
});
