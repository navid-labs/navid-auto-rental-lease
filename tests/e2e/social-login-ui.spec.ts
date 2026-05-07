import { test, expect } from "@playwright/test";

test.describe("social login buttons surface", () => {
  test("login page shows Google and Kakao buttons", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Google로 로그인" })).toBeVisible();
    await expect(page.getByRole("button", { name: "카카오 로그인" })).toBeVisible();
  });

  test("signup page shows Google and Kakao buttons", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("button", { name: "Google로 로그인" })).toBeVisible();
    await expect(page.getByRole("button", { name: "카카오 로그인" })).toBeVisible();
  });

  test("login page shows email_exists error message", async ({ page }) => {
    await page.goto("/login?error=email_exists");
    await expect(page.getByText(/이미 다른 방법으로 가입된 이메일/)).toBeVisible();
  });
});
