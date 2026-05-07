import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("plate lookup auto-fills brand/model", async ({ page }) => {
  await page.goto("/sell");
  await page.getByLabel(/차량번호/).fill("12가3456");
  await page.getByRole("button", { name: /조회/ }).click();
  await expect(page.getByText(/조회 완료/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("link", { name: /회원가입하고 등록하기/ })).toBeVisible();
});

test("manual skip continues without lookup", async ({ page }) => {
  await page.goto("/sell");
  await page.getByRole("button", { name: /수동 입력/ }).click();
  await expect(page).toHaveURL(/\/signup\?role=SELLER&redirect=\/sell\/new$/);
});
