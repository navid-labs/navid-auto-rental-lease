import { test, expect } from "@playwright/test";

const ADMIN_PATHS = ["/admin", "/admin/leads", "/admin/listings", "/admin/escrow"];

test.describe("Admin Auth Guard", () => {
  for (const path of ADMIN_PATHS) {
    test(`unauthenticated access to ${path} redirects to /login`, async ({ page, context }) => {
      await context.clearCookies();

      await page.goto(path);

      await expect(page).toHaveURL(/\/login(\?.*)?$/);

      const url = new URL(page.url());
      const redirect = url.searchParams.get("redirect") ?? "";
      expect(redirect.startsWith("/admin")).toBe(true);
    });
  }

  test("login page header matches after admin redirect", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/admin");
    await expect(page.locator("h1")).toContainText("로그인");
  });
});
