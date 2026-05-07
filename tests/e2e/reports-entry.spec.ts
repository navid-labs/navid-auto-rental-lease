import { expect, test, type Page } from "@playwright/test";

async function enterFirstListingDetail(page: Page) {
  await page.goto("/list");

  const cards = page.locator("a[href^='/detail/']");
  const cardCount = await cards.count();

  if (cardCount === 0) {
    return false;
  }

  const firstCard = cards.first();
  await firstCard.scrollIntoViewIfNeeded();
  await firstCard.click();
  await expect(page).toHaveURL(/\/detail\/[^/]+$/);

  return true;
}

test.describe("Reports Entry Points", () => {
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

  test("detail page shows report button entry point", async ({ page }) => {
    const hasListings = await enterFirstListingDetail(page);

    if (!hasListings) {
      test.skip(true, "등록된 매물이 없어서 신고 버튼 smoke를 건너뜁니다.");
      return;
    }

    await expect(page.locator('button:has-text("신고")').first()).toBeVisible();
  });
});
