import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import {
  seedListings,
  seedLeads,
  seedEscrows,
  cleanupByPrefix,
} from "./helpers/admin-fixtures";

const prisma = new PrismaClient();

test.describe("Admin pagination & filters", () => {
  let workerPrefix: string;
  let adminProfileId: string;

  test.beforeAll(async ({}, testInfo) => {
    workerPrefix = `테스트-w${testInfo.workerIndex}`;
    const admin = await prisma.profile.findFirst({ where: { role: "ADMIN" } });
    if (!admin) throw new Error("ADMIN Profile not found — globalSetup failed?");
    adminProfileId = admin.id;

    await seedListings(adminProfileId, workerPrefix, 25);

    const buyer = await prisma.profile.findFirst({ where: { role: "BUYER" } });
    const seededListings = await prisma.listing.findMany({
      where: { brand: workerPrefix },
      take: 1,
    });
    if (buyer && seededListings[0]) {
      await seedLeads(buyer.id, seededListings[0].id, workerPrefix, 25);
      await seedEscrows(buyer.id, adminProfileId, seededListings[0].id, workerPrefix, 25);
    }
  });

  test.afterAll(async () => {
    await cleanupByPrefix(workerPrefix);
    await prisma.$disconnect();
  });

  test("listings page 2 with size 10 shows exactly 10 rows", async ({ page }) => {
    await page.goto("/admin/listings?page=2&size=10");
    await expect(page.locator("tbody > tr")).toHaveCount(10);
  });

  test("escrow DISPUTED filter shows seeded disputed rows only", async ({ page }) => {
    await page.goto("/admin/escrow?status=DISPUTED");
    const chip = page.getByRole("link", { name: "분쟁" });
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("tbody > tr")).toHaveCount(5);
  });

  test("leads INVALID status shows AdminErrorView", async ({ page }) => {
    await page.goto("/admin/leads?status=INVALID");
    await expect(page.getByText("잘못된 필터입니다.")).toBeVisible();
    await expect(page.getByRole("link", { name: "필터 초기화" })).toBeVisible();
  });

  test("sidebar does not link to /admin/settings", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator('a[href="/admin/settings"]')).toHaveCount(0);
  });

  test("GET /api/admin/leads returns 404", async ({ request }) => {
    const res = await request.get("/api/admin/leads");
    expect(res.status()).toBe(404);
  });

  test("listings?page=9999 renders empty table", async ({ page }) => {
    await page.goto("/admin/listings?page=9999");
    await expect(page.locator("tbody > tr")).toHaveCount(1); // empty state row
  });

  test("listings page=abc falls back silently to page=1", async ({ page }) => {
    await page.goto("/admin/listings?page=abc");
    await expect(page.locator("tbody > tr").first()).toBeVisible();
  });

  test("escrow DISPUTED + page=1 preserves filter across pagination", async ({ page }) => {
    await page.goto("/admin/escrow?status=DISPUTED&page=1");
    const chip = page.getByRole("link", { name: "분쟁" });
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  test("changing filter resets page to 1", async ({ page }) => {
    await page.goto("/admin/escrow?status=PAID&page=2");
    await page.getByRole("link", { name: "분쟁" }).click();
    await expect(page).toHaveURL(/status=DISPUTED/);
    await expect(page).not.toHaveURL(/page=2/);
  });

  test("전체 chip removes status param", async ({ page }) => {
    await page.goto("/admin/escrow?status=DISPUTED");
    await page.getByRole("link", { name: "전체" }).click();
    await expect(page).toHaveURL(/\/admin\/escrow(\?.*)?$/);
    await expect(page).not.toHaveURL(/status=/);
  });

  test("pagination bar has aria-current on active page", async ({ page }) => {
    await page.goto("/admin/listings?page=2&size=10");
    const active = page.locator('nav[aria-label="페이지네이션"] [aria-current="page"]');
    await expect(active).toHaveText("2");
  });
});
