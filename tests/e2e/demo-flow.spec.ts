import { test, expect } from '@playwright/test'

test.describe('Demo Flow - Public Pages', () => {
  test('landing page loads with hero and vehicle cards', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Navid/)
    // Hero section should be visible
    const hero = page.locator('section, [class*="hero"], main').first()
    await expect(hero).toBeVisible()
    // Should have CTA or navigation elements
    const ctaOrLink = page.getByRole('link', { name: /차량|검색|시작/ }).first()
    await expect(ctaOrLink).toBeVisible({ timeout: 10000 })
  })

  test('vehicle search page loads and displays vehicles', async ({ page }) => {
    await page.goto('/vehicles')
    // Wait for vehicle cards to render
    const vehicleCards = page.locator('[class*="card"], [class*="vehicle"], article').first()
    await expect(vehicleCards).toBeVisible({ timeout: 15000 })
  })

  test('vehicle detail page loads with vehicle info', async ({ page }) => {
    await page.goto('/vehicles')
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    // Click first vehicle link/card
    const firstVehicle = page.locator('a[href*="/vehicles/"]').first()
    await expect(firstVehicle).toBeVisible({ timeout: 15000 })
    await firstVehicle.click()
    // Should be on detail page
    await expect(page).toHaveURL(/\/vehicles\//)
    // Vehicle info should be visible (year, price, etc.)
    await page.waitForLoadState('networkidle')
    const content = page.locator('main, [class*="detail"], [class*="vehicle"]').first()
    await expect(content).toBeVisible()
  })
})

test.describe('Demo Flow - Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByLabel(/이메일|email/i).fill('admin@navid.kr')
    await page.getByLabel(/비밀번호|password/i).fill('navid1234!')
    await page.getByRole('button', { name: /로그인|login/i }).click()
    // Wait for redirect after login
    await page.waitForURL(/\/(admin|$)/, { timeout: 10000 })
  })

  test('admin dashboard loads with stats', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    // Should have stat cards (4 cards)
    const cards = page.locator('[class*="card"]')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
    // Chart section should exist
    const chartSection = page.locator('canvas, [class*="chart"], [class*="recharts"]').first()
    await expect(chartSection).toBeVisible({ timeout: 10000 })
  })

  test('admin vehicles page loads with table', async ({ page }) => {
    await page.goto('/admin/vehicles')
    await page.waitForLoadState('networkidle')
    // Should have vehicle table or card rows
    const content = page.locator('table, [class*="table"], [class*="card"]').first()
    await expect(content).toBeVisible({ timeout: 10000 })
    // Page title
    await expect(page.getByText('차량 관리')).toBeVisible()
  })
})
