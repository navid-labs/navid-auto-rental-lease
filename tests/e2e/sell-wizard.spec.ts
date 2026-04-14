import { test, expect } from "@playwright/test";

test.describe("Sell Wizard", () => {
  test("shows 3-step wizard", async ({ page }) => {
    await page.goto("/sell");
    await expect(page.locator("text=기본 정보")).toBeVisible();
    await expect(page.locator("text=상세 정보")).toBeVisible();
    await expect(page.locator("text=등록 확인")).toBeVisible();
  });

  test("step 1 shows required fields", async ({ page }) => {
    await page.goto("/sell");
    await expect(page.locator("text=월 납입금")).toBeVisible();
    await expect(page.locator("text=잔여 개월 수")).toBeVisible();
    await expect(page.locator("text=매물 유형")).toBeVisible();
  });

  test("next button is visible on step 1", async ({ page }) => {
    await page.goto("/sell");
    const nextButton = page.locator("button:has-text('다음')");
    await expect(nextButton).toBeVisible();
  });

  test("next button is disabled without required fields", async ({ page }) => {
    await page.goto("/sell");
    const nextButton = page.locator("button:has-text('다음')");
    await expect(nextButton).toBeDisabled();
  });

  test("can advance to step 2 after filling step 1", async ({ page }) => {
    await page.goto("/sell");
    // Fill required fields
    await page.fill("input#monthlyPayment", "500000");
    await page.fill("input#remainingMonths", "24");
    // Now next should be enabled
    const nextButton = page.locator("button:has-text('다음')");
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    // Step 2 content should appear
    await expect(page.locator("text=상세 정보 입력")).toBeVisible();
  });

  test("step 2 shows back button", async ({ page }) => {
    await page.goto("/sell");
    await page.fill("input#monthlyPayment", "500000");
    await page.fill("input#remainingMonths", "24");
    await page.locator("button:has-text('다음')").click();
    await expect(page.locator("button:has-text('이전')")).toBeVisible();
  });
});
