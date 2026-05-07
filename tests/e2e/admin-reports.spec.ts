import { test, expect } from "@playwright/test";

test.describe("Admin Reports", () => {
  test("authenticated admin can open /admin/reports and see the page smoke UI", async ({
    page,
  }) => {
    await page.goto("/admin/reports");

    await expect(page).toHaveURL(/\/admin\/reports(\?.*)?$/);
    await expect(page).toHaveTitle(/신고/);
    await expect(page.locator("text=신고").first()).toBeVisible();
  });

  test("unauthenticated access to /admin/reports redirects to /login", async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.goto("/admin/reports");

    await expect(page).toHaveURL(/\/login(\?.*)?$/);

    const url = new URL(page.url());
    const redirect = url.searchParams.get("redirect") ?? "";
    expect(redirect.startsWith("/admin")).toBe(true);
  });
});
