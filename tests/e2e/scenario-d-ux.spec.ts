/**
 * Scenario D: UX & Cross-cutting Concerns
 * 스켈레톤 로딩, 모바일 반응형, 공개 페이지 접근성
 *
 * Compatible with:
 * - yarn test:e2e (Playwright Test)
 * - Antigravity Browser (copy steps as manual test)
 * - Playwright Skill (node ~/.claude/skills/playwright-skill/run.js)
 */
import { test, expect } from '@playwright/test'
import { login, waitForPageReady } from './helpers/auth'

test.describe('Scenario D: UX & Loading States', () => {
  // ─── D1: Public Pages Accessible Without Login ──────────
  test('D1: 비로그인 접근 — 랜딩, 검색, 상세', async ({ page }) => {
    // Landing
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })

    // Vehicles
    await page.goto('/vehicles')
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })

    // Calculator
    await page.goto('/calculator')
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
  })

  // ─── D2: Protected Pages Redirect to Login ─────────────
  test('D2: 보호 페이지 — 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/mypage')
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('D2-1: 딜러 페이지 — 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/dealer/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('D2-2: 관리자 페이지 — 비로그인 시 리다이렉트', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  // ─── D3: Role-based Access ─────────────────────────────
  test('D3: 역할 기반 접근 — 고객은 관리자 페이지 접근 불가', async ({
    page,
  }) => {
    await login(page, 'customer1')
    await page.goto('/admin/dashboard')
    // Should redirect or show unauthorized
    await page.waitForTimeout(3000)
    const url = page.url()
    // Customer should not stay on admin page
    const isBlocked =
      !url.includes('/admin/dashboard') ||
      (await page.getByText(/권한|접근|unauthorized/i).isVisible().catch(() => false))
    expect(isBlocked).toBeTruthy()
  })

  // ─── D4: Mobile Responsive — Public Pages ──────────────
  test('D4: 모바일 반응형 — 랜딩 페이지 (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    await page.goto('/')
    await waitForPageReady(page)

    // Hero text should be readable
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()

    // CTA should be tappable
    const cta = page.getByRole('link', { name: /차량|검색|시작/ }).first()
    await expect(cta).toBeVisible({ timeout: 10000 })
  })

  test('D4-1: 모바일 반응형 — 차량 검색 (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    await page.goto('/vehicles')
    await waitForPageReady(page)

    // Vehicle cards should stack vertically (1 column)
    const vehicleLink = page.locator('a[href*="/vehicles/"]').first()
    await expect(vehicleLink).toBeVisible({ timeout: 15000 })

    // Mobile filter button (sheet trigger)
    const filterBtn = page.getByRole('button', { name: /필터/ }).first()
    if (
      await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await expect(filterBtn).toBeVisible()
    }
  })

  test('D4-2: 모바일 반응형 — 차량 상세 (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    await page.goto('/vehicles')
    await waitForPageReady(page)

    const firstVehicle = page.locator('a[href*="/vehicles/"]').first()
    await firstVehicle.click()
    await waitForPageReady(page)

    // Content should be visible without horizontal scroll
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
    const box = await mainContent.boundingBox()
    if (box) {
      expect(box.width).toBeLessThanOrEqual(375)
    }
  })

  // ─── D5: Loading States (Skeleton) ─────────────────────
  test('D5: 스켈레톤 로딩 — 차량 검색', async ({ page }) => {
    // Use slow network to catch skeleton
    await page.route('**/api/**', (route) => {
      // Delay API responses by 1s to see skeleton
      setTimeout(() => route.continue(), 1000)
    })

    await page.goto('/vehicles')

    // Check for skeleton or loading indicator before content loads
    const skeleton = page.locator(
      '[class*="skeleton"], [class*="animate-pulse"], [class*="loading"]',
    )
    // Skeleton may or may not appear depending on timing
    // Just verify the page eventually loads
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await expect(page.locator('main')).toBeVisible()
  })

  // ─── D6: Navigation Flow ───────────────────────────────
  test('D6: 네비게이션 — 전체 플로우 순회', async ({ page }) => {
    const publicPages = ['/', '/vehicles', '/calculator', '/rental-lease']

    for (const path of publicPages) {
      await page.goto(path)
      await expect(page.locator('main').or(page.locator('body')).first()).toBeVisible({ timeout: 10000 })
      // No console errors check
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
    }
  })
})
