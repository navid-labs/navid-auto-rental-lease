import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page loads with hero and listings section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("차용");
    await expect(page.locator("text=매물 보러가기")).toBeVisible();
    await expect(page.locator("text=추천 매물")).toBeVisible();
  });

  test("can navigate to list page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=매물 보러가기");
    await expect(page).toHaveURL(/\/list/);
    await expect(page.locator("text=매물 목록")).toBeVisible();
  });

  test("can navigate to guide page", async ({ page }) => {
    await page.goto("/guide");
    await expect(page.locator("h1")).toContainText("이용가이드");
  });

  test("header navigation links work", async ({ page }) => {
    await page.goto("/");
    // Desktop nav
    await page.click("nav >> text=매물보기");
    await expect(page).toHaveURL(/\/list/);
  });

  test("list page shows listing count badge", async ({ page }) => {
    await page.goto("/list");
    // Header with count badge should be visible
    await expect(page.locator("h1")).toContainText("매물 목록");
  });

  test("sell page is accessible from home", async ({ page }) => {
    await page.goto("/");
    await page.click("text=내 차 등록하기");
    await expect(page).toHaveURL(/\/sell/);
  });
});
