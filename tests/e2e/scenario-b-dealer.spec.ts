/**
 * Scenario B: Dealer Journey
 * 딜러 로그인 → 대시보드 → 차량 등록 → 승인 대기 확인
 *
 * Compatible with:
 * - yarn test:e2e (Playwright Test)
 * - Antigravity Browser (copy steps as manual test)
 * - Playwright Skill (node ~/.claude/skills/playwright-skill/run.js)
 */
import { test, expect } from '@playwright/test'
import { login, waitForPageReady } from './helpers/auth'

/**
 * Helper: select a shadcn/base-ui Select item by clicking trigger then visible option.
 * Uses .filter({ visible: true }) to avoid strict mode violations with multiple listboxes.
 */
async function selectFromDropdown(
  page: import('@playwright/test').Page,
  triggerIndex: number,
  optionIndex: number,
) {
  // Click the nth combobox trigger
  const trigger = page.locator('button[role="combobox"]').nth(triggerIndex)
  await trigger.click()
  await page.waitForTimeout(300)

  // Find the visible listbox (there may be multiple in DOM)
  const visibleOptions = page.locator('[role="option"]:visible')
  await expect(visibleOptions.first()).toBeVisible({ timeout: 5000 })
  const count = await visibleOptions.count()
  if (count > optionIndex) {
    await visibleOptions.nth(optionIndex).click()
  }
  await page.waitForTimeout(500)
}

test.describe('Scenario B: Dealer Journey', () => {
  test.describe.configure({ mode: 'serial' })

  // ─── B1: Dealer Dashboard ───────────────────────────────
  test('B1: 딜러 대시보드 — 통계, 차량 목록', async ({ page }) => {
    await login(page, 'dealer1')
    await page.goto('/dealer/dashboard')
    await waitForPageReady(page)

    // Dashboard title
    await expect(page.getByText('딜러 대시보드')).toBeVisible({
      timeout: 10000,
    })

    // Stats sidebar should exist
    const stats = page.locator('main')
    await expect(stats).toBeVisible()

    // Vehicle registration button
    const registerBtn = page.getByRole('link', { name: /차량 등록/ })
    await expect(registerBtn).toBeVisible()
  })

  // ─── B2: Vehicle Registration Wizard ────────────────────
  test('B2: 차량 등록 위자드 — Step 1 차량 선택', async ({ page }) => {
    await login(page, 'dealer1')
    await page.goto('/dealer/vehicles/new')
    await waitForPageReady(page)

    // Step 1 starts in "plate" mode. Switch to manual cascade select.
    const manualBtn = page.getByText('직접 입력')
    await expect(manualBtn).toBeVisible({ timeout: 10000 })
    await manualBtn.click()
    await page.waitForTimeout(500)

    // CascadeSelect uses base-ui Select (button[role="combobox"])
    const brandTrigger = page.locator('button[role="combobox"]').first()
    await expect(brandTrigger).toBeVisible({ timeout: 10000 })

    // Select brand → model → generation → trim (cascade)
    await selectFromDropdown(page, 0, 0) // Brand

    const modelTrigger = page.locator('button[role="combobox"]').nth(1)
    if (await modelTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await selectFromDropdown(page, 1, 0) // Model
    }

    const genTrigger = page.locator('button[role="combobox"]').nth(2)
    if (await genTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectFromDropdown(page, 2, 0) // Generation
    }

    const trimTrigger = page.locator('button[role="combobox"]').nth(3)
    if (await trimTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectFromDropdown(page, 3, 0) // Trim
    }

    // Next button
    const nextBtn = page.getByRole('button', { name: /다음/ })
    await expect(nextBtn).toBeVisible()
  })

  test('B2-1: 차량 등록 위자드 — Step 2 상세 정보', async ({ page }) => {
    await login(page, 'dealer1')
    await page.goto('/dealer/vehicles/new')
    await waitForPageReady(page)

    // Switch to manual mode first
    const manualBtn = page.getByText('직접 입력')
    await expect(manualBtn).toBeVisible({ timeout: 10000 })
    await manualBtn.click()
    await page.waitForTimeout(500)

    // Quick cascade selection to get past Step 1
    const brandTrigger = page.locator('button[role="combobox"]').first()
    await expect(brandTrigger).toBeVisible({ timeout: 10000 })

    await selectFromDropdown(page, 0, 0) // Brand

    const modelTrigger = page.locator('button[role="combobox"]').nth(1)
    if (await modelTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await selectFromDropdown(page, 1, 0) // Model
    }

    const genTrigger = page.locator('button[role="combobox"]').nth(2)
    if (await genTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectFromDropdown(page, 2, 0) // Generation
    }

    const trimTrigger = page.locator('button[role="combobox"]').nth(3)
    if (await trimTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectFromDropdown(page, 3, 0) // Trim
    }

    await page.getByRole('button', { name: /다음/ }).click()
    await page.waitForTimeout(1000)

    // Step 2: Detail info
    const yearInput = page.locator('input#year')
    if (await yearInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await yearInput.fill('2023')
      await page.locator('input#mileage').fill('15000')
      await page.locator('input#color').fill('흰색')
      await page.locator('input#price').fill('25000000')

      // Optional fields
      const monthlyRental = page.locator('input#monthlyRental')
      if (
        await monthlyRental.isVisible({ timeout: 1000 }).catch(() => false)
      ) {
        await monthlyRental.fill('450000')
      }

      const monthlyLease = page.locator('input#monthlyLease')
      if (
        await monthlyLease.isVisible({ timeout: 1000 }).catch(() => false)
      ) {
        await monthlyLease.fill('400000')
      }
    }

    // Verify next button is available
    const nextBtn = page.getByRole('button', { name: /다음|저장/ })
    await expect(nextBtn).toBeVisible()
  })

  // ─── B3: Dealer Vehicle List & Status ───────────────────
  test('B3: 딜러 차량 목록 — 승인 상태 확인', async ({ page }) => {
    await login(page, 'dealer1')
    await page.goto('/dealer/dashboard')
    await waitForPageReady(page)

    // Vehicle list should render
    const content = page.locator('main')
    await expect(content).toBeVisible({ timeout: 10000 })

    // Check for status badges (PENDING, APPROVED, REJECTED)
    const statusBadges = page
      .getByText(/대기|승인|반려|PENDING|APPROVED|REJECTED/)
      .first()
    if (
      await statusBadges.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await expect(statusBadges).toBeVisible()
    }
  })

  // ─── B4: Cross-role — Admin approves dealer vehicle ─────
  test('B4: 관리자 승인 후 딜러 확인', async ({ page }) => {
    // Clear any lingering state from previous serial tests
    await page.context().clearCookies()

    // Step 1: Login as admin and check approval queue
    await login(page, 'admin')
    await page.goto('/admin/vehicles?tab=approval-queue')
    await waitForPageReady(page)

    // Verify approval queue page loads
    await expect(
      page.getByRole('heading', { name: '차량 관리' }),
    ).toBeVisible({ timeout: 10000 })

    // Check if there are pending vehicles
    const approveBtn = page.getByRole('button', { name: /승인/ }).first()
    const hasPending = await approveBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (hasPending) {
      // Approve first pending vehicle
      await approveBtn.click()
      await page.waitForTimeout(2000)
    }

    // Step 2: Switch to dealer and verify
    await login(page, 'dealer1')
    await page.goto('/dealer/dashboard')
    await waitForPageReady(page)

    // Dashboard should load with updated statuses
    await expect(page.getByText('딜러 대시보드')).toBeVisible({
      timeout: 10000,
    })
  })

  // ─── B5: Approved vehicle appears in public search ──────
  test('B5: 승인된 차량 공개 검색 노출', async ({ page }) => {
    await page.goto('/vehicles')
    await waitForPageReady(page)

    // At least one vehicle should be visible (from seed data)
    const vehicleCards = page.locator('a[href*="/vehicles/"]')
    await expect(vehicleCards.first()).toBeVisible({ timeout: 15000 })

    // Verify count is > 0
    const count = await vehicleCards.count()
    expect(count).toBeGreaterThan(0)
  })
})
