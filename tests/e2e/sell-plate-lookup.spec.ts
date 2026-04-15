import { test, expect } from "@playwright/test";

test("plate lookup auto-fills brand/model", async ({ page }) => {
  await page.goto("/sell");
  await page.getByLabel(/차량번호/).fill("12가3456");
  await page.getByRole("button", { name: /조회/ }).click();
  // after auto-advance, next step shows auto-filled vehicle info (벤츠/E220d for this plate hash)
  await expect(page.getByText(/차종을 확인해주세요/)).toBeVisible({ timeout: 5000 });
  await expect(page.locator("input[placeholder='예: 현대']")).toHaveValue(/^.+$/, { timeout: 5000 });
});

test("manual skip continues without lookup", async ({ page }) => {
  await page.goto("/sell");
  await page.getByRole("button", { name: /수동 입력/ }).click();
  // progress bar should advance
  await expect(page.locator("text=2/8")).toBeVisible();
});
