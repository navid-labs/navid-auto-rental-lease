import { test, expect } from "@playwright/test";

test("home search hub links to /list with filter", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "승계" }).click();
  await page.getByRole("button", { name: /30~50만/ }).click();
  await page.getByRole("link", { name: /매물 검색/ }).click();
  await expect(page).toHaveURL(/\/list\?type=TRANSFER.*minPayment=30/);
});
