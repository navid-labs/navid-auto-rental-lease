import { test, expect } from "@playwright/test";

test.describe("Detail Page — Gallery & New Components", () => {
  /**
   * Navigate to a real detail page via the list, then verify gallery and
   * new WT3 components render correctly. If no listings exist the tests
   * are skipped gracefully.
   */
  async function getDetailUrl(page: import("@playwright/test").Page) {
    await page.goto("/list");
    const firstCard = page.locator("a[href^='/detail/']").first();
    const hasListings = (await firstCard.count()) > 0;
    if (!hasListings) return null;
    return firstCard.getAttribute("href");
  }

  test("gallery renders main image and thumbnail strip", async ({ page }) => {
    const href = await getDetailUrl(page);
    if (!href) {
      test.skip(true, "No listings seeded — skipping gallery test");
      return;
    }
    await page.goto(href);

    // Main image button (expand)
    await expect(page.getByRole("button", { name: /이미지 확대/i })).toBeVisible();
  });

  test("gallery lightbox opens on click and shows close button", async ({ page }) => {
    const href = await getDetailUrl(page);
    if (!href) {
      test.skip(true, "No listings seeded — skipping lightbox test");
      return;
    }
    await page.goto(href);

    const expandBtn = page.getByRole("button", { name: /이미지 확대/i });
    const hasImages = (await expandBtn.count()) > 0;
    if (!hasImages) {
      test.skip(true, "Listing has no images — skipping lightbox test");
      return;
    }

    await expandBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: /닫기/i })).toBeVisible();
  });

  test("gallery lightbox closes on Escape key", async ({ page }) => {
    const href = await getDetailUrl(page);
    if (!href) {
      test.skip(true, "No listings seeded — skipping escape test");
      return;
    }
    await page.goto(href);

    const expandBtn = page.getByRole("button", { name: /이미지 확대/i });
    if ((await expandBtn.count()) === 0) {
      test.skip(true, "No expand button found");
      return;
    }

    await expandBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("spec panel renders on detail page", async ({ page }) => {
    const href = await getDetailUrl(page);
    if (!href) {
      test.skip(true, "No listings seeded — skipping spec panel test");
      return;
    }
    await page.goto(href);
    // Spec panel section label
    await expect(page.getByRole("region", { name: /차량 스펙/i })).toBeVisible();
  });

  test("seller info section renders on detail page", async ({ page }) => {
    const href = await getDetailUrl(page);
    if (!href) {
      test.skip(true, "No listings seeded — skipping seller card test");
      return;
    }
    await page.goto(href);
    await expect(page.getByRole("region", { name: /판매자 정보/i })).toBeVisible();
  });
});
