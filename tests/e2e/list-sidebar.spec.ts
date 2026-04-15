import { test, expect } from "@playwright/test";

test("sidebar filter updates URL with fuel param", async ({ page }) => {
  await page.goto("/list");
  // The sidebar is hidden on mobile viewports; use desktop size
  await page.setViewportSize({ width: 1280, height: 800 });

  // Wait for sidebar to be visible (lg breakpoint)
  const gasolineLabel = page.getByLabel("GASOLINE");
  await gasolineLabel.waitFor({ state: "visible", timeout: 5000 });
  await gasolineLabel.check();
  await expect(page).toHaveURL(/fuel=GASOLINE/);
});

test("sort select adds year_desc to URL", async ({ page }) => {
  await page.goto("/list");
  // AdvancedFilters: expand and select sort
  await page.getByRole("button", { name: /상세필터/ }).click();
  await page.getByRole("combobox").selectOption("year_desc");
  await expect(page).toHaveURL(/sort=year_desc/);
});

test("result-meta shows total count", async ({ page }) => {
  await page.goto("/list");
  await expect(page.locator("text=개 매물")).toBeVisible({ timeout: 5000 });
});
