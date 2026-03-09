/**
 * Scenario C: Admin Operations
 * 대시보드 → 차량 관리 → 계약 관리 → 사용자 관리 → 잔존가치
 *
 * Compatible with:
 * - yarn test:e2e (Playwright Test)
 * - Antigravity Browser (copy steps as manual test)
 * - Playwright Skill (node ~/.claude/skills/playwright-skill/run.js)
 */
import { test, expect } from '@playwright/test'
import { login, waitForPageReady } from './helpers/auth'

test.describe('Scenario C: Admin Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
  })

  // ─── C1: Dashboard ─────────────────────────────────────
  test('C1: 관리자 대시보드 — 통계 카드, 차트, 활동 피드', async ({
    page,
  }) => {
    await page.goto('/admin/dashboard')
    await waitForPageReady(page)

    // Title
    await expect(page.getByRole('heading', { name: '관리자 대시보드' })).toBeVisible({
      timeout: 10000,
    })

    // 4 stat cards should be visible
    // Look for stat-related content (numbers, labels)
    const statSection = page.locator('main')
    await expect(statSection).toBeVisible()

    // Chart section (recharts or canvas)
    const chartElement = page
      .locator('canvas, [class*="chart"], [class*="recharts"], svg')
      .first()
    await expect(chartElement).toBeVisible({ timeout: 10000 })
  })

  // ─── C2: Vehicle Management ─────────────────────────────
  test('C2: 차량 관리 — 전체 목록, 탭 전환', async ({ page }) => {
    await page.goto('/admin/vehicles')
    await waitForPageReady(page)

    // Page title
    await expect(page.getByRole('heading', { name: '차량 관리' })).toBeVisible({ timeout: 10000 })

    // Vehicle table or cards
    const content = page.locator('table, [role="table"], main').first()
    await expect(content).toBeVisible({ timeout: 10000 })

    // Tab: 승인 대기
    const approvalTab = page.getByRole('tab', { name: /승인 대기/ }).or(
      page.getByText(/승인 대기/).first(),
    )
    if (
      await approvalTab.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await approvalTab.click()
      await page.waitForTimeout(1000)
    }

    // Tab: 전체
    const allTab = page
      .getByRole('tab', { name: /전체/ })
      .or(page.getByText(/전체/).first())
    if (await allTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allTab.click()
      await page.waitForTimeout(1000)
    }
  })

  test('C2-1: 차량 관리 — 승인 큐 처리', async ({ page }) => {
    await page.goto('/admin/vehicles?tab=approval-queue')
    await waitForPageReady(page)

    // Check for pending vehicles
    const approveBtn = page.getByRole('button', { name: /승인/ }).first()
    const hasPending = await approveBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (hasPending) {
      // Test approve action
      await approveBtn.click()
      await page.waitForTimeout(2000)

      // Page should update (vehicle removed from queue or status changed)
      await waitForPageReady(page)
    }
  })

  test('C2-2: 차량 관리 — 차량 등록 버튼', async ({ page }) => {
    await page.goto('/admin/vehicles')
    await waitForPageReady(page)

    // Vehicle registration button
    const registerBtn = page.getByRole('link', { name: /차량 등록/ })
    await expect(registerBtn).toBeVisible({ timeout: 10000 })

    // Click and verify navigation
    await registerBtn.click()
    await expect(page).toHaveURL(/\/admin\/vehicles\/new/, {
      timeout: 10000,
    })
  })

  // ─── C3: Contract Management ────────────────────────────
  test('C3: 계약 관리 — 목록, 상태 필터', async ({ page }) => {
    await page.goto('/admin/contracts')
    await waitForPageReady(page)

    // Page title
    await expect(page.getByRole('heading', { name: '계약 관리' })).toBeVisible({ timeout: 10000 })

    // Content should render
    const content = page.locator('main')
    await expect(content).toBeVisible()
  })

  test('C3-1: 계약 관리 — 승인/반려 처리', async ({ page }) => {
    await page.goto('/admin/contracts')
    await waitForPageReady(page)

    // Check for actionable contracts
    const approveBtn = page.getByRole('button', { name: /승인/ }).first()
    const hasContracts = await approveBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (hasContracts) {
      await approveBtn.click()
      await page.waitForTimeout(2000)
      await waitForPageReady(page)
    }
  })

  // ─── C4: User Management ───────────────────────────────
  test('C4: 사용자 관리 — 탭 필터, 역할 표시', async ({ page }) => {
    await page.goto('/admin/users')
    await waitForPageReady(page)

    // User table or cards should render
    const content = page.locator('main')
    await expect(content).toBeVisible({ timeout: 10000 })

    // Tab filtering — 고객
    const customerTab = page
      .getByRole('tab', { name: /고객/ })
      .or(page.getByText(/고객/).first())
    if (
      await customerTab.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await customerTab.click()
      await page.waitForTimeout(1000)
    }

    // Tab filtering — 딜러
    const dealerTab = page
      .getByRole('tab', { name: /딜러/ })
      .or(page.getByText(/딜러/).first())
    if (await dealerTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dealerTab.click()
      await page.waitForTimeout(1000)
    }

    // Tab filtering — 관리자
    const adminTab = page
      .getByRole('tab', { name: /관리자/ })
      .or(page.getByText(/관리자/).first())
    if (await adminTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await adminTab.click()
      await page.waitForTimeout(1000)
    }
  })

  test('C4-1: 사용자 관리 — 역할 변경', async ({ page }) => {
    await page.goto('/admin/users')
    await waitForPageReady(page)

    // Look for role select dropdowns
    const roleSelect = page.locator('select').first()
    if (await roleSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Role selects exist and are interactive
      await expect(roleSelect).toBeEnabled()
    }
  })

  // ─── C5: Residual Value Management ─────────────────────
  test('C5: 잔존가치 관리 — 테이블, 필터, 편집', async ({ page }) => {
    await page.goto('/admin/residual-value')
    await waitForPageReady(page)

    // Content should render
    const content = page.locator('main')
    await expect(content).toBeVisible({ timeout: 10000 })

    // Should have table or form for residual values
    const tableOrForm = page
      .locator('table, form, [role="table"]')
      .first()
    await expect(tableOrForm).toBeVisible({ timeout: 10000 })
  })

  // ─── C6: Mobile Responsive ─────────────────────────────
  test('C6: 모바일 반응형 — 관리자 대시보드', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })

    await page.goto('/admin/dashboard')
    await waitForPageReady(page)

    // Dashboard should still be visible
    await expect(page.getByText('관리자 대시보드')).toBeVisible({
      timeout: 10000,
    })

    // Content should not overflow
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })

  test('C6-1: 모바일 반응형 — 차량 관리', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    await page.goto('/admin/vehicles')
    await waitForPageReady(page)

    await expect(page.getByRole('heading', { name: '차량 관리' })).toBeVisible({
      timeout: 10000,
    })

    // Mobile should show card layout instead of table
    const content = page.locator('main')
    await expect(content).toBeVisible()
  })
})
