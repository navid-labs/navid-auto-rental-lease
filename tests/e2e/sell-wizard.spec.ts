import { test, expect } from "@playwright/test";

test.describe("Sell entry flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sell page shows public plate lookup entry", async ({ page }) => {
    await page.goto("/sell");

    await expect(page.getByRole("heading", { name: /차량번호만 확인/ })).toBeVisible();
    await expect(page.getByLabel(/차량번호/)).toBeVisible();
    await expect(page.getByText("등록 정보 입력")).toBeVisible();
  });

  test("valid lookup offers seller signup for anonymous users", async ({ page }) => {
    await page.goto("/sell");
    await page.getByLabel(/차량번호/).fill("12가3456");
    await page.getByRole("button", { name: "조회" }).click();

    const cta = page.getByRole("link", { name: /회원가입하고 등록하기/ });
    await expect(cta).toBeVisible({ timeout: 5000 });
    await cta.click();
    await expect(page).toHaveURL(/\/signup\?role=SELLER&redirect=\/sell\/new$/);
  });

  test("sell new redirects anonymous users to seller signup", async ({ page }) => {
    await page.goto("/sell/new");

    await expect(page).toHaveURL(/\/signup\?role=SELLER&redirect=\/sell\/new$/);
  });
});
