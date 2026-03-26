# Stack Research: v3.0 Hardening

**Domain:** Security hardening, performance optimization, design system cleanup, code quality
**Researched:** 2026-03-27
**Confidence:** HIGH
**Mode:** Subsequent milestone -- tooling additions only (core stack unchanged)

## Context

The core stack (Next.js 16, React 19, Tailwind v4, shadcn/ui, Prisma, Supabase, Zustand, Vitest, bun) is validated across 4 milestones and 425 tests. This document covers ONLY the new tools and configurations needed for v3.0 hardening across four domains: security, performance, design system, and code quality.

Current state analysis:
- **Font:** `@fontsource/pretendard` loads 4 weights (400/500/600/700), Latin-only woff2 files ~750KB each = ~3MB total. Korean glyphs NOT included via current import pattern.
- **Bundle:** No bundle analysis tooling. Next.js 16.1 has experimental built-in analyzer.
- **CSS:** Design tokens already use CSS variables via shadcn `@theme inline` pattern. 33 inline `hsl()`/`rgb()` occurrences across 9 files (mostly in marketing components and recharts).
- **Security:** No security headers in middleware. No CSP. No dependency audit in CI.
- **Tests:** 425 tests, no coverage tracking configured. No accessibility tests.
- **ESLint:** Uses `eslint-config-next/core-web-vitals` (includes jsx-a11y already).

---

## Recommended Stack Additions

### 1. Font Optimization: next/font/local + PretendardVariable Dynamic Subset

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `next/font/local` | Built into Next.js 16 | Self-hosted font loading with automatic optimization | Eliminates layout shift via `size-adjust`, preloads only needed glyphs, removes external CDN dependency. Zero additional package needed. |
| PretendardVariable.woff2 | v1.3.9 | Single variable font file covering all weights | Replaces 4 separate weight files with 1 variable font file. Variable axis covers 100-900 weights in a single ~6MB file (full Korean glyphs). |

**Migration approach: CDN Dynamic Subset (recommended over self-hosting full file).**

The PretendardVariable.woff2 full file is ~6.4MB because it includes all 11,172 Korean syllable blocks. Self-hosting this is wasteful. Instead, use Pretendard's **dynamic subset** which splits the font into ~100 small chunks by unicode-range, loading only the glyphs actually used on each page.

**Two viable approaches:**

**Option A: CDN Dynamic Subset (recommended for demo/MVP)**
```css
/* Replace @fontsource imports in globals.css with: */
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");
```
- Pros: Zero config, automatic unicode-range subsetting, ~50-200KB actual download per page
- Cons: External CDN dependency (jsDelivr), no `next/font` optimization (no size-adjust)
- Best for: Demo/investor MVP where simplicity beats perfection

**Option B: next/font/local with subset woff2 files (recommended for production)**
```typescript
import localFont from 'next/font/local'

const pretendard = localFont({
  src: './fonts/PretendardVariable.subset.woff2',
  display: 'swap',
  weight: '100 900',
  variable: '--font-pretendard',
})
```
- Requires: Download PretendardVariable.woff2 from GitHub release, optionally subset with `subset-font` npm package
- Pros: Full `next/font` optimization (size-adjust, preload, self-hosted), no CDN dependency
- Cons: Larger initial setup, ~6MB file if not subsetted

**Recommendation: Option A (CDN Dynamic Subset) for v3.0, migrate to Option B when going to real production.** The dynamic subset CSS uses `@font-face` with fine-grained `unicode-range` declarations, so browsers only download the chunks containing glyphs actually rendered on the page. Typical page load downloads 50-200KB total instead of 3MB+.

**What to remove:**
```bash
bun remove @fontsource/pretendard
```
Remove all `@fontsource/pretendard/*.css` imports from `globals.css`.

**Confidence:** HIGH -- Pretendard official repo documents the dynamic subset approach. jsDelivr CDN is production-grade (used by Bootstrap, Font Awesome, etc.).

---

### 2. Bundle Analysis: Next.js Experimental Analyzer (built-in)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `next experimental-analyze` | Built into Next.js 16.1+ | Interactive bundle composition analysis | Works with Turbopack (which this project uses via `--turbopack` flag). No package installation needed. Analyzes both server and client bundles. |
| `@next/bundle-analyzer` | ^16.2.1 | Webpack-based bundle visualization (fallback) | Only needed if experimental analyzer lacks detail. Generates `client.html` showing treemap of all chunks. |

**Usage:**
```bash
# Primary: built-in experimental analyzer (Turbopack-native)
bun next experimental-analyze

# Fallback: traditional webpack analyzer
ANALYZE=true bun run build
```

**Recommendation: Start with `next experimental-analyze`.** It is Turbopack-native and does not require wrapping `next.config.ts`. Only add `@next/bundle-analyzer` if the experimental version lacks actionable detail.

**If @next/bundle-analyzer is needed:**
```bash
bun add -D @next/bundle-analyzer@^16.2.1
```
```typescript
// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer'

const nextConfig = { /* existing config */ }
export default process.env.ANALYZE === 'true'
  ? withBundleAnalyzer({ enabled: true })(nextConfig)
  : nextConfig
```

**Known large dependencies to investigate:**
- `@react-pdf/renderer` -- already externalized via `serverExternalPackages`, but client bundle impact unknown
- `framer-motion` -- ~30KB gzipped, ensure tree-shaking works (import `motion` not full package)
- `recharts` -- ~40KB gzipped, only used in admin dashboard (should be code-split via `next/dynamic`)
- `zod` v4 -- verify tree-shaking; v4 is significantly larger than v3

**Confidence:** HIGH -- `next experimental-analyze` is documented in Next.js 16.1 blog post and CLI reference.

---

### 3. Security Headers: Middleware Configuration (no new packages)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Security headers in `middleware.ts` | N/A (code change) | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | Standard web security headers. Missing entirely from current middleware. Zero package cost. |
| CSP with nonce | N/A (code change) | Content-Security-Policy header with per-request nonce | Prevents XSS via inline script injection. Next.js 16 supports nonce extraction from CSP header automatically. |

**Implementation pattern (add to existing middleware.ts):**
```typescript
// Generate nonce for CSP
const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

// Set security headers on response
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'on',
  'Content-Security-Policy': [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'unsafe-inline'`,  // Required for Tailwind
    `img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co`,
    `font-src 'self' https://cdn.jsdelivr.net`,  // For Pretendard CDN
    `connect-src 'self' https://*.supabase.co`,
    `frame-ancestors 'none'`,
  ].join('; '),
}
```

**Important notes:**
- `'unsafe-inline'` for `style-src` is required because Tailwind CSS injects inline styles
- `'unsafe-eval'` must NOT be in production CSP (only needed in dev mode for React hot reload)
- Font CDN domain (`cdn.jsdelivr.net`) must be in `font-src` if using CDN dynamic subset approach
- Supabase domains must be in `connect-src` for Auth and Realtime

**No new packages needed.** The `@edge-csrf/nextjs` package exists but is unnecessary since Supabase Auth uses JWT tokens (not cookies for API auth), and Server Actions have built-in Origin checking.

**Confidence:** HIGH -- Next.js official docs cover CSP with nonce pattern. Security headers are standard HTTP practice.

---

### 4. Dependency Auditing: bun audit (built-in)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `bun audit` | Built into bun | Scan dependencies for known vulnerabilities | Native to bun, no installation. Reports severity levels and advisory links. Run as CI gate. |

**Usage:**
```bash
# One-time check
bun audit

# Add to package.json scripts
"security:audit": "bun audit"
```

**No additional scanning tools recommended for v3.0.** Socket.dev and Snyk are valuable for production but overkill for a demo/investor MVP. `bun audit` covers CVE scanning against the npm advisory database.

**Confidence:** HIGH -- `bun audit` is documented at bun.com/docs/pm/cli/audit.

---

### 5. Test Coverage: @vitest/coverage-v8

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@vitest/coverage-v8` | ^4.0.18 | V8-native code coverage tracking | Matches vitest 4.x version. V8 coverage is faster than Istanbul (no source instrumentation). Since Vitest 3.2.0, V8 accuracy matches Istanbul via AST-based remapping. |

**Installation:**
```bash
bun add -D @vitest/coverage-v8@^4.0.18
```

**Configuration (vitest.config.mts):**
```typescript
export default defineConfig({
  // ... existing config
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/types/**',
        'src/lib/api/generated/**',  // Orval-generated code
        'src/app/**/layout.tsx',      // Layout files are thin wrappers
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
      ],
      reporter: ['text', 'text-summary', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        // Start conservative, increase over time
        statements: 40,
        branches: 30,
        functions: 35,
        lines: 40,
      },
    },
  },
})
```

**Why V8 over Istanbul:**
- V8 is ~2-3x faster because it uses V8 engine's built-in coverage tracking instead of source code instrumentation
- Since Vitest 3.2.0+, V8 accuracy matches Istanbul (previous JSX blind spots are resolved)
- V8 is the default recommended provider for Vitest 4

**Important Vitest 4 migration note:** `coverage.all` was removed in Vitest 4. You MUST define `coverage.include` to control which files appear in reports. Without it, only files touched by tests appear.

**Coverage improvement strategy:**
1. Start with `bun run test:coverage` to establish baseline
2. Set initial thresholds at 80% of current baseline (to avoid blocking CI immediately)
3. Ratchet thresholds up by 5% per milestone
4. Focus new tests on: API route handlers, Zod validation schemas, business logic in `features/*/queries/` and `features/*/mutations/`
5. Skip coverage for: generated code (Orval), thin layout wrappers, pure presentation components

**Confidence:** HIGH -- @vitest/coverage-v8@4.1.1 published 2 days ago, actively maintained, version-locked to Vitest 4.

---

### 6. Accessibility Testing: vitest-axe

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `vitest-axe` | ^0.1.0 | axe-core integration for Vitest | Custom matcher `toHaveNoViolations()` for accessibility testing in component tests. Forked from jest-axe, avoids Jest/Vitest type conflicts. |

**Installation:**
```bash
bun add -D vitest-axe@^0.1.0
```

**Setup (vitest.setup.ts):**
```typescript
import 'vitest-axe/extend-expect'
```

**Usage in tests:**
```typescript
import { axe } from 'vitest-axe'
import { render } from '@testing-library/react'

it('has no accessibility violations', async () => {
  const { container } = render(<VehicleCard vehicle={mockVehicle} />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

**Why vitest-axe over @chialab/vitest-axe:**
- `vitest-axe` has simpler API, directly compatible with existing testing-library patterns
- `@chialab/vitest-axe` (v0.19.0) is more actively maintained but has different API conventions
- For v3.0 scope (adding a11y tests to key components), `vitest-axe@0.1.0` is sufficient

**Important caveat:** Automated a11y testing catches ~30% of real accessibility issues. It verifies ARIA attributes, color contrast ratios, heading hierarchy, alt text, etc. Manual testing with screen readers is still needed for production.

**ESLint a11y linting is already configured.** `eslint-config-next/core-web-vitals` includes `eslint-plugin-jsx-a11y`. No additional ESLint plugins needed.

**Confidence:** MEDIUM -- vitest-axe has not been updated in ~3 years, but the underlying axe-core engine is stable and the API is minimal. If issues arise, fall back to using `axe-core` directly with a small wrapper function.

---

### 7. CSS Variable Cleanup: No New Tools (Manual Refactor)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| N/A (manual refactor) | N/A | Replace hardcoded `hsl()`/`rgb()` values with CSS variable references | 33 occurrences across 9 files. All are in component `className` or inline styles. Manual find-and-replace with existing design tokens from `globals.css`. |

**Scope of work:**
- `src/features/marketing/components/hero-section.tsx` -- 12 occurrences (gradients, shadows)
- `src/features/marketing/components/sell-my-car-sections.tsx` -- 7 occurrences
- `src/app/admin/dashboard/recharts-bar.tsx` -- 6 occurrences (chart colors)
- Remaining 5 files -- 1-2 occurrences each

**Pattern to follow:**
```tsx
// BEFORE: hardcoded
className="bg-[hsl(217,91%,60%)]"

// AFTER: use existing CSS variable
className="bg-accent"
```

**For Recharts colors** (which require hex/hsl strings, not Tailwind classes):
```tsx
// BEFORE: hardcoded
fill="hsl(217, 91%, 60%)"

// AFTER: reference CSS variable via getComputedStyle or a token constant
fill="var(--accent)"  // Recharts supports CSS variables in SVG fill
```

**No new tools, libraries, or packages needed.** The shadcn `@theme inline` block in `globals.css` already defines the complete token system. This is purely a mechanical refactor.

**Confidence:** HIGH -- 33 occurrences is small scope, existing token system covers all needed values.

---

## Installation Summary

```bash
# New dev dependencies (2 packages)
bun add -D @vitest/coverage-v8@^4.0.18 vitest-axe@^0.1.0

# Remove (replaced by CDN dynamic subset)
bun remove @fontsource/pretendard

# Optional (only if experimental analyzer is insufficient)
# bun add -D @next/bundle-analyzer@^16.2.1
```

**Total new packages: 2 dev dependencies.**
**Total removed packages: 1 production dependency.**
**Net bundle impact: NEGATIVE (removing @fontsource/pretendard saves ~3MB from build).**

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@edge-csrf/nextjs` | Supabase Auth uses JWT tokens, not cookie-based session auth. Server Actions have built-in Origin checking. CSRF tokens add complexity without benefit. | SameSite cookie attributes + Origin header validation (already handled by Supabase SSR) |
| `helmet` / `next-safe` | These are Express.js middleware packages. Next.js middleware handles headers natively. Adding them creates confusing dual-header configuration. | Manual security headers in `middleware.ts` |
| `@vitest/coverage-istanbul` | V8 coverage is faster and equally accurate since Vitest 3.2.0+. Istanbul adds source instrumentation overhead. | `@vitest/coverage-v8` |
| `subset-font` / `glyphhanger` | Font subsetting tools are for build-time optimization of self-hosted fonts. With CDN dynamic subset approach, subsetting is handled by the CDN automatically. Only needed if migrating to Option B (self-hosted). | Pretendard CDN dynamic subset |
| `stylelint` | CSS linting adds marginal value when using Tailwind (most CSS is utility classes). The 33 hardcoded values are a one-time refactor, not an ongoing pattern. | Manual refactor + PR review |
| `lighthouse-ci` | Valuable for production monitoring but overkill for v3.0 demo hardening. Bundle analyzer + manual Lighthouse checks are sufficient. | `next experimental-analyze` + Chrome DevTools Lighthouse |
| `Snyk` / `Socket.dev` | Enterprise security scanning. `bun audit` covers CVE scanning for demo scope. Add these when approaching real production deployment. | `bun audit` |
| `pa11y` / `@axe-core/react` | Runtime a11y testing tools. `vitest-axe` covers component-level testing. `@axe-core/react` overlays in dev mode are noisy and slow. | `vitest-axe` in unit tests + manual testing |

---

## Package Scripts to Add

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "security:audit": "bun audit",
    "analyze": "next experimental-analyze"
  }
}
```

Note: `test:coverage` already exists in package.json but needs the `@vitest/coverage-v8` package installed to work. `security:audit` and `analyze` are new.

---

## Version Compatibility Matrix

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `@vitest/coverage-v8` | ^4.0.18 | Vitest ^4.0.18 | Must match Vitest major version. Project uses Vitest 4.0.18. |
| `vitest-axe` | ^0.1.0 | Vitest 4.x, axe-core 4.x | Thin wrapper, version coupling is loose. |
| `@next/bundle-analyzer` | ^16.2.1 | Next.js 16.x | Must match Next.js major version. Only if needed. |
| `next/font/local` | Built-in | Next.js 16.x | No version to manage. Available since Next.js 13. |
| `bun audit` | Built-in | bun 1.x | No version to manage. |
| `next experimental-analyze` | Built-in | Next.js 16.1+ | Requires Turbopack (already configured via `--turbopack` dev flag). |

---

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| Font loading | CDN dynamic subset | next/font/local + full woff2 | When eliminating CDN dependency matters (real production) |
| Bundle analysis | `next experimental-analyze` | `@next/bundle-analyzer` | If experimental lacks treemap visualization detail |
| Coverage provider | `@vitest/coverage-v8` | `@vitest/coverage-istanbul` | If V8 has blind spots with specific JSX patterns in this codebase |
| a11y testing | `vitest-axe` | `@chialab/vitest-axe` | If vitest-axe has compatibility issues with Vitest 4 |
| Dependency audit | `bun audit` | Snyk CLI | When approaching real production with compliance requirements |
| Security headers | Manual middleware | `next-safe` | Never -- Next.js middleware is the correct layer |

---

## Sources

- [Next.js Font Optimization docs](https://nextjs.org/docs/app/getting-started/fonts) -- next/font/local setup, verified 2026-03-27
- [Pretendard GitHub](https://github.com/orioncactus/pretendard) -- v1.3.9, dynamic subset CDN links
- [Next.js 16.1 blog](https://nextjs.org/blog/next-16-1) -- experimental bundle analyzer announcement
- [@next/bundle-analyzer npm](https://www.npmjs.com/package/@next/bundle-analyzer) -- v16.2.1, last published 5 days ago
- [Vitest Coverage docs](https://vitest.dev/guide/coverage) -- V8 vs Istanbul comparison, configuration
- [@vitest/coverage-v8 npm](https://www.npmjs.com/package/@vitest/coverage-v8) -- v4.1.1, published 2 days ago
- [vitest-axe GitHub](https://github.com/chaance/vitest-axe) -- fork of jest-axe for Vitest
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) -- nonce generation, middleware pattern
- [Next.js Security blog](https://nextjs.org/blog/security-nextjs-server-components-actions) -- Server Actions CSRF protection
- [bun audit docs](https://bun.com/docs/pm/cli/audit) -- built-in dependency scanning

---
*Stack research for: Navid Auto v3.0 Hardening*
*Researched: 2026-03-27*
