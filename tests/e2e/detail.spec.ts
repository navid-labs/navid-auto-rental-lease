import { test, expect } from "@playwright/test";

test.describe("Detail Page", () => {
  test("shows 404 for invalid listing", async ({ page }) => {
    const response = await page.goto("/detail/nonexistent-id-00000000");
    expect(response?.status()).toBe(404);
  });

  test("list page cards link to detail pages", async ({ page }) => {
    await page.goto("/list");

    // If listings exist, clicking a card should navigate to a detail page
    const firstCard = page.locator("a[href^='/detail/']").first();
    const hasListings = await firstCard.count() > 0;

    if (hasListings) {
      const href = await firstCard.getAttribute("href");
      await firstCard.click();
      await expect(page).toHaveURL(new RegExp(href!.replace("/", "/")));
    } else {
      // Empty state: just verify the empty message is shown
      await expect(page.locator("text=등록된 매물이 없습니다")).toBeVisible();
    }
  });
});
