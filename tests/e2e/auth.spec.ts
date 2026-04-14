import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("로그인");
    await expect(page.locator("input[type=email]")).toBeVisible();
    await expect(page.locator("input[type=password]")).toBeVisible();
    await expect(page.locator("button:has-text('로그인')")).toBeVisible();
  });

  test("login page has signup link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("a[href='/signup']")).toBeVisible();
  });

  test("signup page renders form with role selector", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("h1")).toContainText("회원가입");
    await expect(page.locator("text=매수자")).toBeVisible();
    await expect(page.locator("text=매도자")).toBeVisible();
  });

  test("signup page has all required inputs", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("input#name")).toBeVisible();
    await expect(page.locator("input#phone")).toBeVisible();
    await expect(page.locator("input#email")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.locator("input#passwordConfirm")).toBeVisible();
  });

  test("login link from signup works", async ({ page }) => {
    await page.goto("/signup");
    await page.click("a[href='/login']");
    await expect(page).toHaveURL(/\/login/);
  });

  test("signup link from login works", async ({ page }) => {
    await page.goto("/login");
    await page.click("a[href='/signup']");
    await expect(page).toHaveURL(/\/signup/);
  });

  test("role selector toggles between buyer and seller", async ({ page }) => {
    await page.goto("/signup");
    // BUYER is selected by default — click SELLER
    await page.click("text=매도자");
    // Click back to BUYER
    await page.click("text=매수자");
    // No assertion on internal state, just confirm no crash
    await expect(page.locator("h1")).toContainText("회원가입");
  });
});
