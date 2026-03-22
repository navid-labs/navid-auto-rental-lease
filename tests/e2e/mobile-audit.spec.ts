// ADMIN-03: 375px mobile responsive audit for Phase 13-16 redesigned pages
// Verifies no horizontal overflow, no console errors, and visible content
// at iPhone SE equivalent viewport (375x812)

import { test, expect, type ConsoleMessage } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 } })

const PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/vehicles', name: 'Search Listing' },
  { path: '/vehicles/compare', name: 'Compare' },
  { path: '/calculator', name: 'Calculator' },
  { path: '/inquiry', name: 'Inquiry' },
  { path: '/sell', name: 'Sell' },
] as const

test.describe('Mobile 375px Audit', () => {
  for (const { path, name } of PAGES) {
    test(`${name} (${path}) - no horizontal overflow at 375px`, async ({
      page,
    }) => {
      const consoleErrors: string[] = []

      // Listen for console error-level messages
      page.on('console', (msg: ConsoleMessage) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      // Navigate and wait for load
      await page.goto(path, { waitUntil: 'networkidle' })

      // Check no horizontal overflow (1px tolerance)
      const hasOverflow = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1
        )
      })
      expect(hasOverflow, `Horizontal overflow detected on ${name}`).toBe(
        false,
      )

      // Main content container should be visible
      const mainContent = page.locator('main, [role="main"], #__next > div').first()
      await expect(mainContent).toBeVisible({ timeout: 10000 })

      // Filter out known non-critical console errors (e.g. hydration warnings, 3rd party)
      const criticalErrors = consoleErrors.filter(
        (e) =>
          !e.includes('hydration') &&
          !e.includes('Hydration') &&
          !e.includes('third-party') &&
          !e.includes('favicon'),
      )

      expect(
        criticalErrors,
        `Console errors on ${name}: ${criticalErrors.join('\n')}`,
      ).toHaveLength(0)
    })
  }
})
