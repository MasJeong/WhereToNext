import { webkit } from "playwright";

(async () => {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    const type = msg.type();
    console.log("CONSOLE", type.toUpperCase(), msg.text());
  });

  page.on("pageerror", (error) => {
    console.log("PAGEERROR", error.message);
  });

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/")) {
      console.log("REQ", request.method(), url, request.postData());
    }
  });

  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/api/snapshots")) {
      const body = await response.text().catch(() => "");
      console.log("RES", response.status(), url, body);
    }
  });

  await page.goto("http://localhost:4010/");
  await page.getByTestId("home-landing").waitFor({ state: "visible" });
  await page.getByTestId("home-search-entry").waitFor({ state: "visible" });
  await page.getByTestId("home-cta").click();

  await page.getByTestId("home-top-summary").waitFor({ state: "visible", timeout: 15000 });
  await page.getByTestId("result-card-0").waitFor({ state: "visible", timeout: 15000 });
  const saveBtn = page.getByTestId("save-snapshot");
  await saveBtn.waitFor({ state: "visible", timeout: 10000 });

  const beforeText = await saveBtn.textContent();
  console.log("buttonTextBefore", beforeText);

  await saveBtn.click();

  for (let i = 0; i < 6; i += 1) {
    await page.waitForTimeout(1000);
    const currentText = await saveBtn.textContent();
    const shareTotal = await page.getByTestId("share-link").count();
    const savedCards = await page.locator('[data-testid^="saved-snapshot-"]').count();
    const fallbackVisible = await page.getByText("링크 복사가 실패했어요.").count();
    console.log(`tick-${i + 1}`, {
      buttonText: currentText,
      shareTotal,
      savedCards,
      fallbackVisible,
    });
  }

  const savedCount = await page.locator('[data-testid="saved-snapshot-0"]').count();
  const shareCount = await page.getByRole("link", { name: "공유 페이지 보기" }).count();
  const cardButtonText = await saveBtn.textContent();
  const html = await page.content();

  console.log("savedCount", savedCount);
  console.log("shareLinkCount", shareCount);
  console.log("buttonTextAfter", cardButtonText);
  console.log("contains saved-snapshot-0", html.includes("saved-snapshot-0"));

  await browser.close();
})();
