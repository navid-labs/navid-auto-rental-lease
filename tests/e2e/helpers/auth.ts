import { type Page, expect } from '@playwright/test'

export const ACCOUNTS = {
  admin: { email: 'admin@navid.kr', password: 'navid1234!' },
  dealer1: { email: 'dealer1@navid.kr', password: 'navid1234!' },
  dealer2: { email: 'dealer2@navid.kr', password: 'navid1234!' },
  customer1: { email: 'customer1@navid.kr', password: 'navid1234!' },
  customer2: { email: 'customer2@navid.kr', password: 'navid1234!' },
} as const

export type AccountKey = keyof typeof ACCOUNTS

export async function login(page: Page, account: AccountKey) {
  const { email, password } = ACCOUNTS[account]

  // Ensure we're on the login page and it's fully loaded
  await page.goto('/login', { waitUntil: 'networkidle' })

  // If already redirected (already logged in), go back to login
  if (!page.url().includes('/login')) {
    await page.context().clearCookies()
    await page.goto('/login', { waitUntil: 'networkidle' })
  }

  const emailInput = page.locator('input#email')
  await expect(emailInput).toBeVisible({ timeout: 15000 })
  await emailInput.fill(email)
  await page.locator('input#password').fill(password)
  await page.getByRole('button', { name: /로그인/i }).click()
  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15000,
  })
}

export async function ensureLoggedOut(page: Page) {
  // Navigate to a page and check if logged in, if so logout
  await page.goto('/')
  const logoutBtn = page.getByRole('button', { name: /로그아웃|logout/i })
  if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutBtn.click()
    await page.waitForLoadState('networkidle')
  }
}

export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle')
  // Extra wait for hydration
  await page.waitForTimeout(500)
}
