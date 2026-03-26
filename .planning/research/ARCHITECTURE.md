# Architecture Research: v3.0 Hardening

**Domain:** Security, performance, design system, and code quality integration for existing Next.js 16 used car rental/lease platform
**Researched:** 2026-03-27
**Confidence:** HIGH (direct codebase analysis of 52 API routes, 50 test files, all CSS files, middleware, layout, and auth infrastructure)

## System Overview: Where Hardening Integrates

The existing architecture has four distinct layers where hardening work intersects. Each improvement area touches different layers, and understanding these boundaries prevents accidental coupling.

```
+----------------------------------------------------------------------+
|                     Edge / Middleware Layer                            |
|  src/middleware.ts                                                     |
|  - Route protection (page-level)                                      |
|  + NEW: Security headers (CSP, HSTS, X-Frame-Options)                |
|  + NEW: Rate limiting headers / Vercel WAF config                    |
+----------------------------------------------------------------------+
|                     API Route Layer (52 endpoints)                     |
|  src/app/api/***/route.ts                                             |
|  - Auth guards via requireAuth/requireAdmin/requireRole               |
|  + FIX: 5 unguarded endpoints needing auth or rate limiting          |
|  + FIX: Quote PDF route missing auth entirely                        |
|  + FIX: File upload missing MIME/size validation                     |
+----------------------------------------------------------------------+
|                     Component Layer                                    |
|  src/components/layout/ (6 files, 47 hardcoded hex colors)           |
|  src/features/**/ (23 files, 347 hardcoded hex colors)               |
|  src/app/layout.tsx (font loading, root structure)                    |
|  + FIX: Migrate 394 hardcoded hex values -> CSS variable references  |
|  + FIX: Font loading strategy (@fontsource -> next/font/local)       |
|  + FIX: Bundle splitting for framer-motion heavy components          |
+----------------------------------------------------------------------+
|                     Foundation Layer                                   |
|  src/app/globals.css (design tokens, theme variables)                 |
|  src/lib/api/ (auth.ts, response.ts, validation.ts)                  |
|  tests/ + src/**/*.test.ts (50 files, 425+ tests)                    |
|  + ADD: New semantic color tokens for hex replacement targets         |
|  + ADD: API route-level test coverage                                |
|  + FIX: Hardcoded password in settings auth mutation                 |
+----------------------------------------------------------------------+
```

---

## 1. Security Hardening: Integration Points

### 1.1 Unguarded API Endpoints (CRITICAL)

Direct codebase analysis reveals the following API routes with missing or incomplete auth guards:

| Endpoint | Method | Current Auth | Risk | Fix |
|----------|--------|-------------|------|-----|
| `/api/inquiry` | POST | **NONE** | Spam/abuse -- no rate limit, no captcha | Add rate limiting (IP-based, 5/min) |
| `/api/vehicles/[id]/inquiry` | POST | **NONE** | Same spam risk | Add rate limiting |
| `/api/contracts/ekyc/send-code` | POST | **NONE** | SMS bombing attack vector | Add `requireAuth()` + rate limit |
| `/api/admin/inventory/quote-pdf` | POST | **NONE** | PDF generation abuse (CPU-intensive) | Add `requireAdmin()` |
| `/api/pricing/residual-rate` | GET | **NONE** | Low risk (read-only public data) | Acceptable as-is, optional rate limit |

**Integration pattern -- all fixes use the existing `requireAuth`/`requireRole` from `src/lib/api/auth.ts`:**

```typescript
// BEFORE (src/app/api/admin/inventory/quote-pdf/route.ts)
export async function POST(request: Request) {
  try {
    const data: QuotePDFData = await request.json()
    // ... no auth check at all

// AFTER
import { requireAdmin } from '@/lib/api/auth'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  // ... rest unchanged
```

**Files to modify:** 4 route files (add auth guards), 0 new files needed.

### 1.2 Hardcoded Password (CRITICAL)

**Location:** `src/features/settings/mutations/auth.ts` line 3

```typescript
const DEFAULT_PASSWORD = 'admin1234'  // HARDCODED IN SOURCE
```

**Fix:** Move to environment variable with fallback disabled in production.

```typescript
// AFTER
export async function verifySettingsPasswordMutation(password: string) {
  const record = await prisma.defaultSetting.findUnique({
    where: { key: 'settings_password' },
  })

  if (!record) {
    // No password configured -- require setup
    return { error: 'Settings password not configured. Set via admin panel.' }
  }

  // Use bcrypt or argon2 for hash comparison
  const isValid = await bcrypt.compare(password, record.value)
  if (!isValid) return { error: 'Password incorrect.' }
  return { success: true }
}
```

**Files to modify:** `src/features/settings/mutations/auth.ts`, seed script to hash default password.
**New dependency:** `bcryptjs` (4KB, zero native deps, safe for Vercel serverless).

### 1.3 File Upload Validation (HIGH)

**Location:** `src/features/vehicles/mutations/images.ts`

Current upload accepts any file from FormData without MIME type validation or file size limits. The `file.type` is passed to Supabase storage but never validated server-side.

```typescript
// CURRENT (line 46-47)
const file = formData.get('file') as File | null
if (!file) return { error: 'Please select a file.' }
// File is uploaded directly -- no type/size check

// FIX: Add validation before upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

if (!ALLOWED_TYPES.includes(file.type)) {
  return { error: 'Only JPEG, PNG, WebP images are allowed.' }
}
if (file.size > MAX_FILE_SIZE) {
  return { error: 'File size must be under 5MB.' }
}
```

**Files to modify:** `src/features/vehicles/mutations/images.ts` (add validation block before line 48).

### 1.4 Security Headers via next.config.ts

**Location:** `next.config.ts` -- currently only has `serverExternalPackages` and `images`.

Add security headers. Middleware-based CSP is unnecessary for this app (no strict nonce requirement for a demo/investment platform).

```typescript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  // ...existing config
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}
```

**Files to modify:** `next.config.ts` only.

### 1.5 Rate Limiting Strategy

For Vercel deployment, server-side rate limiting within serverless functions is stateless (no shared memory between invocations). Two options:

**Option A (Recommended -- simple): Vercel WAF / Edge Config**
- Configure rate limiting rules in `vercel.json` or Vercel dashboard
- Zero code changes for basic IP-based limiting
- Available on Pro plan

**Option B: Upstash Redis rate limiter**
- `@upstash/ratelimit` package (serverless-compatible, uses Redis)
- Add to specific route handlers

For a demo/investment-stage product, Option A is sufficient. Add Option B only if abuse is observed.

---

## 2. Performance Optimization: Integration Points

### 2.1 Font Loading -- @fontsource to next/font/local (CRITICAL)

**Current problem:** The `@fontsource/pretendard` package (16MB installed) ships **Latin subset only** -- no Korean glyphs. On a Korean-language platform, ALL Korean text falls back to `system-ui`, defeating the purpose of the custom font.

**Evidence:** `node_modules/@fontsource/pretendard/files/` contains only `pretendard-latin-*` files. No `pretendard-korean-*` files exist. Each weight file is ~748KB (Latin woff2), and 4 weights are imported via CSS (400, 500, 600, 700 = ~3MB of Latin-only fonts downloaded on page load).

**Fix: Switch to `next/font/local` with Pretendard Variable woff2.**

Step 1: Download PretendardVariable.woff2 from the official Pretendard repo (includes Korean glyphs, ~3.2MB variable font, or use dynamic subset CDN).

Step 2: Replace font loading in `src/app/layout.tsx`:

```typescript
// BEFORE
// (font loaded via @import in globals.css)
<body className="font-sans antialiased">

// AFTER
import localFont from 'next/font/local'

const pretendard = localFont({
  src: '../fonts/PretendardVariable.subset.woff2',
  display: 'swap',
  weight: '400 700',
  variable: '--font-pretendard',
  preload: true,
})

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

Step 3: Update `globals.css`:
```css
/* REMOVE these 4 lines: */
@import "@fontsource/pretendard/400.css";
@import "@fontsource/pretendard/500.css";
@import "@fontsource/pretendard/600.css";
@import "@fontsource/pretendard/700.css";

/* UPDATE font-sans definition: */
--font-sans: var(--font-pretendard), system-ui, sans-serif;
```

Step 4: Remove `@fontsource/pretendard` dependency (`bun remove @fontsource/pretendard`).

**Benefits:**
- Korean glyphs actually work (currently missing)
- `next/font` self-hosts and preloads at build time (no external requests)
- Automatic `size-adjust` fallback prevents layout shift
- Variable font = single file instead of 4 weight files

**Files to modify:** `src/app/layout.tsx`, `src/app/globals.css`, `package.json`
**New file:** `src/fonts/PretendardVariable.subset.woff2` (download from Pretendard repo)
**Confidence:** HIGH -- next/font/local is the canonical Next.js approach per official docs.

### 2.2 Bundle Splitting -- framer-motion

**Current state:** `framer-motion` (~30KB gzipped) is imported in 7 component files:

| File | Usage | Dynamic-loadable? |
|------|-------|-------------------|
| `components/layout/floating-cta.tsx` | AnimatePresence + motion | YES (below fold) |
| `components/layout/recently-viewed-drawer.tsx` | motion + AnimatePresence | YES (user interaction) |
| `components/layout/comparison-bar.tsx` | motion + AnimatePresence | YES (conditional) |
| `features/marketing/components/promotion-banner.tsx` | AnimatePresence + motion | YES (below fold) |
| `features/marketing/components/finance-partners.tsx` | AnimatePresence + motion | YES (below fold) |
| `features/marketing/components/sell-my-car-sections.tsx` | motion + Variants | YES (below fold) |
| `features/marketing/components/hero-section.tsx` | motion + Variants | NO (above fold, LCP) |

**Strategy:** Dynamic import wrapper for framer-motion components that are below-fold or interaction-triggered.

```typescript
// src/components/layout/floating-cta.tsx
// BEFORE: static import
import { AnimatePresence, motion } from 'framer-motion'

// AFTER: Replace with CSS transitions for simple fade/slide
// framer-motion only needed for complex orchestrated animations
// Simple show/hide can use Tailwind transition classes
```

For components where framer-motion is genuinely needed (hero section entrance animation), keep the import but ensure the component is in a separate chunk:

```typescript
// In page-level server component:
const HeroSection = dynamic(
  () => import('@/features/marketing/components/hero-section'),
  { ssr: true } // SSR enabled for LCP, hydration adds animation
)
```

**Recharts:** Already correctly dynamic-imported in `src/app/admin/dashboard/chart-section.tsx` with `{ ssr: false }`. No changes needed.

**Files to modify:** Up to 6 component files (replace framer-motion with CSS transitions where possible).

### 2.3 HTTP Request Optimization

**Current issue:** `export const dynamic = 'force-dynamic'` is set on 14 pages, including pages that could benefit from ISR or static generation:

| Page | Current | Could Be |
|------|---------|----------|
| `/login`, `/signup` | Static (correct) | No change |
| `/` (homepage) | force-dynamic | ISR with `revalidate: 60` (recommended vehicles change infrequently) |
| `/vehicles` | force-dynamic | Correct (search params drive data) |
| `/vehicles/[id]` | force-dynamic | ISR with `revalidate: 300` (vehicle details rarely change) |
| `/calculator` | force-dynamic | Could be static (no server data needed) |

For `force-dynamic` pages that do need fresh data, ensure parallel data fetching with `Promise.all()` (already done correctly in vehicle detail page).

**Files to modify:** 2-3 page files (change `force-dynamic` to ISR where appropriate).

---

## 3. Design System Cleanup: Integration Points

### 3.1 Hardcoded Hex Color Inventory

**Total hardcoded hex values found:**
- `src/components/layout/` -- 47 occurrences across 6 files
- `src/features/` -- 347 occurrences across 23 files
- **Total: 394 hardcoded hex values in 29 files**

**Most affected files (top 10):**

| File | Hex Count | Primary Colors Used |
|------|-----------|---------------------|
| `features/vehicles/components/public-vehicle-detail.tsx` | 142 | `#0D0D0D`, `#555555`, `#999999`, `#E8E8E8`, `#1A6DFF` |
| `features/marketing/components/hero-section.tsx` | 36 | `#1A6DFF`, `#0D0D0D`, `#F8F8F8` |
| `features/marketing/components/hero-search-box.tsx` | 34 | `#1A6DFF`, `#0D0D0D`, `#E8E8E8`, `#999999` |
| `features/marketing/components/sell-my-car-sections.tsx` | 27 | `#0D0D0D`, `#555555`, `#1A6DFF` |
| `components/layout/header.tsx` | 17 | `#0D0D0D`, `#7A7A7A`, `#E8E8E8`, `#1A6DFF` |
| `features/marketing/components/featured-vehicles.tsx` | 14 | `#0D0D0D`, `#1A6DFF` |
| `components/layout/mobile-nav.tsx` | 13 | `#0D0D0D`, `#555555`, `#999999`, `#E8E8E8`, `#1A6DFF` |
| `features/marketing/components/finance-partners.tsx` | 13 | `#0D0D0D`, `#555555` |
| `features/marketing/components/rent-subscription.tsx` | 12 | `#0D0D0D`, `#1A6DFF`, `#555555` |
| `features/vehicles/components/color-filter.tsx` | 11 | Various car color swatches |

### 3.2 Hex-to-CSS-Variable Mapping

The hardcoded values cluster into a small palette that maps directly to semantic tokens:

| Hex Value | Frequency | Semantic Meaning | CSS Variable Target |
|-----------|-----------|------------------|---------------------|
| `#0D0D0D` | ~80 | Primary text (near-black) | `var(--foreground)` |
| `#555555` | ~50 | Secondary text | `var(--muted-foreground)` or new `--text-secondary` |
| `#999999` | ~30 | Tertiary/placeholder text | `var(--muted-foreground)` |
| `#7A7A7A` | ~15 | Utility bar text | `var(--muted-foreground)` |
| `#1A6DFF` | ~60 | Brand accent blue | `var(--accent)` or `var(--ring)` |
| `#E8E8E8` | ~40 | Border / separator | `var(--border)` |
| `#F8F8F8` | ~20 | Subtle background | `var(--secondary)` |
| `#F5F5F5` | ~15 | Hover background | `var(--card-hover)` |
| `#EBF3FF` | ~10 | Accent hover bg | New `--accent-muted` |
| `#3B82F6` | ~5 | CTA buttons (Tailwind blue-500) | `var(--accent)` |

**Implementation approach:**

Step 1: Add missing semantic tokens to `globals.css` `:root`:
```css
:root {
  /* ... existing tokens ... */

  /* NEW: fill gaps in semantic token coverage */
  --text-tertiary: hsl(0 0% 60%);       /* replaces #999999 */
  --accent-muted: hsl(217 91% 96%);     /* replaces #EBF3FF */
  --utility-text: hsl(0 0% 48%);        /* replaces #7A7A7A */
}
```

Step 2: Add Tailwind theme mappings in `@theme inline`:
```css
@theme inline {
  /* ... existing mappings ... */
  --color-text-tertiary: var(--text-tertiary);
  --color-accent-muted: var(--accent-muted);
  --color-utility-text: var(--utility-text);
}
```

Step 3: File-by-file replacement using find-and-replace:
- `text-[#0D0D0D]` -> `text-foreground`
- `text-[#555555]` -> `text-muted-foreground`
- `text-[#999999]` -> `text-text-tertiary`
- `text-[#1A6DFF]` -> `text-accent`
- `bg-[#1A6DFF]` -> `bg-accent`
- `border-[#E8E8E8]` -> `border-border`
- `bg-[#F8F8F8]` -> `bg-secondary`
- `bg-[#F5F5F5]` -> `bg-card-hover`
- `hover:bg-[#EBF3FF]` -> `hover:bg-accent-muted`

**Exception: `color-filter.tsx`** -- car color swatches (White, Black, Silver, Red, etc.) are inherently hardcoded hex values representing actual car colors. These should NOT be converted to CSS variables. They should be moved to a constants file instead.

**Files to modify:** 29 component files (mechanical find-replace), `globals.css` (add 3-4 new tokens).
**Risk:** LOW -- purely visual, no logic changes. Test with visual regression (Playwright screenshot comparison).

### 3.3 Accessibility: Color Contrast Audit

After CSS variable migration, verify WCAG AA contrast ratios:

| Token Pair | Ratio Required | Current HSL | Action |
|-----------|----------------|-------------|--------|
| `--foreground` on `--background` | 4.5:1 min | Dark on near-white | PASS (estimated 18:1) |
| `--muted-foreground` on `--background` | 4.5:1 min | `hsl(220 10% 45%)` on `hsl(220 30% 98%)` | CHECK -- may be 3.8:1, borderline |
| `--accent` on `--primary` (button text on navy bg) | 4.5:1 min | Blue on dark navy | CHECK |
| `--text-secondary` on `--card` | 4.5:1 min | `hsl(220 10% 45%)` on white | CHECK |

**Tool:** Use `axe-core` via Playwright for automated WCAG scanning.

---

## 4. Code Quality: Integration Points

### 4.1 Test Coverage Gaps

**Current state:** 50 test files with 425+ tests. Strong coverage in:
- Vehicle mutations (6 test files)
- Contract mutations/schemas (4 test files)
- Finance calculations (5 test files)
- Auth schemas/actions (4 test files)

**Gaps identified:**

| Area | Test Files | Coverage Gap |
|------|-----------|-------------|
| API route handlers | 0 | **No API route tests at all** -- auth guards untested |
| Middleware | 1 (`middleware.test.ts`) | Exists but may not cover all edge cases |
| Marketing components | 3 | Only hero-banner, quick-links, recommended-vehicles |
| Layout components | 3 | Only header, footer, breadcrumb-nav |
| Settings mutations | 1 | Exists (settings-actions.test.ts) |
| Vehicle queries | 1 | Only inquiry.test.ts, no search query tests |

**Priority: API route auth guard tests.** These directly validate security hardening.

```typescript
// tests/unit/api/vehicles-route.test.ts (NEW)
describe('POST /api/vehicles', () => {
  it('returns 401 when not authenticated', async () => {
    // Mock getCurrentUser to return null
    // Call POST handler
    // Assert 401 response
  })

  it('returns 403 when user is CUSTOMER', async () => {
    // Mock getCurrentUser to return CUSTOMER profile
    // Call POST handler
    // Assert 403 response
  })
})
```

**Test structure for new tests:**
```
tests/
  unit/
    api/                    # NEW directory
      vehicles-route.test.ts
      contracts-route.test.ts
      inquiry-route.test.ts
      admin-routes.test.ts
    features/
      settings/
        password-hash.test.ts   # NEW: test bcrypt migration
```

### 4.2 Test Factory Pattern

The existing tests use inline mock objects. Before modifying shared types (for security improvements or CSS variable changes), create a test factory:

```typescript
// tests/helpers/factories.ts (NEW)
import type { UserProfile } from '@/lib/auth/helpers'

export function createMockUser(overrides?: Partial<UserProfile>): UserProfile {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    phone: '010-1234-5678',
    role: 'CUSTOMER',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockAdmin(overrides?: Partial<UserProfile>): UserProfile {
  return createMockUser({ role: 'ADMIN', ...overrides })
}
```

---

## 5. Recommended Build Order

The four improvement areas have the following dependency relationships:

```
[A] Security Headers (next.config.ts)         -- Independent
[B] Font Migration (@fontsource -> next/font)  -- Independent
[C] CSS Token Foundation (globals.css)          -- Independent
[D] Test Factory (tests/helpers/factories.ts)   -- Independent

[E] API Auth Guards (4 route fixes)            -- Depends on D (tests needed)
[F] Password Hashing (settings/mutations)       -- Depends on D (tests needed)
[G] File Upload Validation (images mutation)    -- Depends on D (tests needed)

[H] Hex-to-CSS-Variable Migration (29 files)   -- Depends on C (tokens defined first)

[I] Bundle Optimization (framer-motion)         -- Independent
[J] ISR/Caching Optimization (page configs)     -- Independent

[K] API Route Tests                            -- Depends on D, E, F, G
[L] Visual Regression Tests                    -- Depends on H
[M] Accessibility Audit                        -- Depends on H
```

### Suggested Phase Structure

**Phase 1: Foundation (security headers, font fix, CSS tokens, test factory)**
- Items A, B, C, D -- all independent, can be parallel plans
- Establishes the groundwork for all subsequent work
- No risk of breaking existing functionality (additive only)

**Phase 2: Security Fixes (auth guards, password hashing, upload validation)**
- Items E, F, G -- depends on test factory from Phase 1
- Each fix is small (10-30 lines per file) but critical
- Write tests alongside each fix

**Phase 3: Design System Migration (hex -> CSS variables)**
- Item H -- depends on CSS tokens from Phase 1
- Largest volume of file changes (29 files, 394 replacements)
- Purely mechanical, low logic risk, high visual impact
- Follow with visual regression testing (L)

**Phase 4: Performance + Quality (bundle, caching, coverage)**
- Items I, J, K, M -- depends on Phases 1-3 being stable
- Bundle optimization and ISR changes
- Fill remaining test coverage gaps
- Accessibility audit after colors are stabilized

---

## Data Flow: Security Hardening

### Current Auth Flow (Pages)

```
Browser Request
    |
    v
[middleware.ts] -- checks PROTECTED_ROUTES map
    |               (page paths: /admin, /dealer, /mypage)
    |               queries profiles table for role
    v
[Page Server Component] -- fetches data
    |
    v
[Client Component] -- renders UI
```

### Current Auth Flow (API Routes)

```
API Request
    |
    v
[middleware.ts] -- RUNS but only checks page routes
    |               API routes /api/* pass through
    v
[Route Handler] -- manually calls requireAuth/requireAdmin/requireRole
    |               (or skips auth entirely for 5 routes)
    v
[Business Logic] -- mutations/queries
```

**Key insight:** Middleware DOES NOT protect API routes. The `PROTECTED_ROUTES` map only includes page paths (`/admin`, `/dealer`, `/mypage`). All API auth is handled per-route via `requireAuth`/`requireAdmin`/`requireRole` calls at the top of each handler function. This is actually the correct pattern (per Next.js security guidance post-CVE-2025-29927), but it means every route handler is responsible for its own auth check.

### After Hardening

```
API Request
    |
    v
[middleware.ts] -- security headers applied
    |               (CSP, HSTS, X-Frame-Options via next.config.ts headers)
    v
[Route Handler] -- ALL handlers now call auth guard
    |               (no unguarded write endpoints)
    |               + Input validation (file type, size)
    |               + Rate limiting (inquiry/ekyc endpoints)
    v
[Business Logic] -- password hashing via bcrypt
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Middleware-Only Auth

**What people do:** Put all API auth checks in `middleware.ts` and skip per-route guards.
**Why it is wrong:** Next.js CVE-2025-29927 (CVSS 9.1) showed middleware can be bypassed via `x-middleware-subrequest` header. Middleware is for routing decisions, not security enforcement. The existing per-route `requireAuth`/`requireRole` pattern is correct -- extend it, do not consolidate into middleware.
**Do this instead:** Keep the Data Access Layer pattern. Every route handler validates auth. Middleware adds headers and handles redirects only.

### Anti-Pattern 2: CSS Variable Migration via Search-and-Replace-All

**What people do:** Global find-replace `#0D0D0D` -> `var(--foreground)` across all files at once.
**Why it is wrong:** Same hex value may have different semantic meanings in different contexts. `#0D0D0D` as text color maps to `--foreground`, but as a border color it might map to `--border` (wrong hex). Context matters.
**Do this instead:** Migrate file by file. Review each replacement in context. Group by semantic meaning, not by hex value.

### Anti-Pattern 3: Dynamic Import Everything for Bundle Size

**What people do:** Wrap every component in `next/dynamic` to reduce initial bundle.
**Why it is wrong:** Dynamic imports add loading states, delay hydration, and can cause layout shift. Above-fold components (hero section, header, navigation) must load synchronously for LCP.
**Do this instead:** Only dynamic-import components that are: (a) below fold, (b) triggered by user interaction, or (c) conditionally rendered. The hero section and navigation stay as static imports.

### Anti-Pattern 4: Adding ISR Globally

**What people do:** Set `revalidate` on every page to avoid `force-dynamic`.
**Why it is wrong:** Pages with auth-dependent data (admin, dealer, mypage, contract pages) MUST be dynamic. Caching auth-gated pages can leak user data across sessions.
**Do this instead:** Only apply ISR to truly public pages with slowly-changing data: homepage (60s), vehicle detail (300s), calculator (static).

---

## Component Changes Summary

### New Files

| File | Purpose | Phase |
|------|---------|-------|
| `src/fonts/PretendardVariable.subset.woff2` | Self-hosted Korean + Latin variable font | 1 |
| `tests/helpers/factories.ts` | Test fixture factory for UserProfile, Vehicle mocks | 1 |
| `tests/unit/api/` (directory, 3-4 files) | API route auth guard tests | 2 |

### Modified Files

| File | Changes | Phase |
|------|---------|-------|
| `next.config.ts` | Add security headers | 1 |
| `src/app/layout.tsx` | Replace `font-sans` with `next/font/local` variable class | 1 |
| `src/app/globals.css` | Remove @fontsource imports, add 3-4 semantic tokens, update `--font-sans` | 1 |
| `package.json` | Remove `@fontsource/pretendard`, add `bcryptjs` | 1-2 |
| `src/features/settings/mutations/auth.ts` | Replace hardcoded password with bcrypt hash comparison | 2 |
| `src/app/api/admin/inventory/quote-pdf/route.ts` | Add `requireAdmin()` | 2 |
| `src/app/api/contracts/ekyc/send-code/route.ts` | Add `requireAuth()` | 2 |
| `src/app/api/inquiry/route.ts` | Add rate limiting consideration | 2 |
| `src/app/api/vehicles/[id]/inquiry/route.ts` | Add rate limiting consideration | 2 |
| `src/features/vehicles/mutations/images.ts` | Add MIME type + file size validation | 2 |
| 29 component files (layout + features) | Replace hardcoded hex -> CSS variable references | 3 |
| 6 component files | Replace framer-motion with CSS transitions where possible | 4 |
| 2-3 page files | Change `force-dynamic` to ISR where appropriate | 4 |

### Unchanged (Explicitly)

| Component | Reason Not Changed |
|-----------|-------------------|
| `src/middleware.ts` | Auth pattern is correct -- per-route guards, not middleware-only |
| `prisma/schema.prisma` | No schema changes in v3.0 hardening |
| `src/lib/api/auth.ts` | Already well-structured, no changes needed |
| `src/lib/api/response.ts` | Already well-structured |
| `src/lib/api/validation.ts` | Already well-structured |
| All admin/dealer page routes | No changes to routing structure |

---

## Scaling Considerations

| Scale | Hardening Impact |
|-------|-----------------|
| Demo (current) | Security headers prevent common attacks. Font fix improves Korean UX. Hex cleanup eases future theming. |
| 100 users | Rate limiting on inquiry/ekyc endpoints prevents abuse. ISR reduces server load for public pages. |
| 10K users | Bcrypt password hashing critical for real user data. Upload validation prevents storage abuse. Test coverage prevents regression at scale. |

### First Bottleneck After Hardening

If the app moves to production with real users, the next bottleneck will be **Prisma cold starts on Vercel serverless**. Each function invocation that creates a new Prisma client has a ~200ms cold start. This is not addressed in v3.0 but should be flagged for v3.1 (connection pooling via Prisma Accelerate or PgBouncer).

---

## Sources

- Existing codebase analysis -- HIGH confidence (direct file reads of all 52 API route handlers, middleware, layout, CSS, all 50 test files)
- [Next.js CSP Configuration Guide](https://nextjs.org/docs/app/guides/content-security-policy) -- HIGH confidence (official docs)
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) -- HIGH confidence (official docs)
- [Next.js Security Best Practices 2026](https://www.authgear.com/post/nextjs-security-best-practices) -- MEDIUM confidence (third-party, but comprehensive)
- [Next.js CVE-2025-29927 Middleware Bypass](https://www.hashbuilds.com/articles/next-js-middleware-authentication-protecting-routes-in-2025) -- HIGH confidence (documented CVE)
- [Pretendard Official Repository](https://github.com/orioncactus/pretendard) -- HIGH confidence (font source)
- [@fontsource/pretendard npm](https://www.npmjs.com/package/@fontsource/pretendard) -- HIGH confidence (verified Latin-only subset limitation)
- [MetaMask hex-to-CSS-variable migration](https://github.com/MetaMask/metamask-extension/issues/13247) -- MEDIUM confidence (real-world migration reference)
- [Next.js Bundle Optimization Guide](https://nextjs.org/docs/app/guides/package-bundling) -- HIGH confidence (official docs)

---
*Architecture research for: v3.0 Hardening -- Security, Performance, Design System, Code Quality*
*Researched: 2026-03-27*
