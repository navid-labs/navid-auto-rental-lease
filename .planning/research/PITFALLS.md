# Pitfalls Research

**Domain:** v3.0 Hardening -- Security, Performance, Design System, Code Quality improvements to existing Next.js 16 + Supabase platform
**Researched:** 2026-03-27
**Confidence:** HIGH (based on codebase analysis of 44 API routes, 49 test files, 411 hardcoded hex occurrences across 35 files, and verified against official Next.js 16 / Tailwind v4 / Supabase documentation)

---

## Critical Pitfalls

### Pitfall 1: Next.js 16 middleware.ts Deprecated -- Must Rename to proxy.ts

**What goes wrong:**
The project runs Next.js 16.1.6 but still uses `src/middleware.ts` with an exported `middleware` function. Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`, and the exported function must be renamed from `middleware` to `proxy`. The edge runtime is NOT supported in proxy -- the proxy runtime is always `nodejs`. Currently the file works because Next.js 16 still supports the deprecated name with warnings, but a future minor version will remove support entirely. More critically, the runtime change from Edge to Node.js means behavior differences around available APIs, cold start times, and response streaming.

**Why it happens:**
The project upgraded `next` from 15 to 16.1.6 (visible in package.json) but the middleware file was never renamed. This is a common oversight because the deprecated file still works and the deprecation warning may only appear in dev console logs that developers ignore.

**How to avoid:**
1. Rename `src/middleware.ts` to `src/proxy.ts`
2. Rename the exported `middleware` function to `proxy`
3. Run `npx @next/codemod middleware-to-proxy` to automate both changes
4. Update `src/middleware.test.ts` to `src/proxy.test.ts` and update all test imports
5. The `config.matcher` pattern stays the same -- just the file and function names change
6. Verify all existing auth logic (token refresh via `getUser()`, protected route checks, profile role query) still works identically under Node.js runtime

**Warning signs:**
- Console warning: `middleware.ts is deprecated, use proxy.ts` during `bun dev`
- Build warnings about deprecated file conventions
- If a future Next.js update removes the deprecated path, the entire auth/routing layer silently stops working

**Phase to address:**
Security phase (first) -- this is infrastructure-level and blocks adding security headers in the same file

---

### Pitfall 2: Hardcoded Password in Source Code -- Plaintext 'admin1234'

**What goes wrong:**
`src/features/settings/mutations/auth.ts` contains `const DEFAULT_PASSWORD = 'admin1234'` in plaintext. This is a settings auth gate -- the admin must enter this password to modify pricing/promo settings. The password is compared via `===` (no hashing). If the DB record `settings_password` is missing, the hardcoded default is used. This is a textbook credential-in-source vulnerability: anyone with repo access knows the admin settings password, and the plaintext comparison means the password is vulnerable to timing attacks.

**Why it happens:**
This was acceptable for the demo/MVP phase (v1.0), where the priority was showing the flow works. The password was never upgraded to use hashing or environment variables because "it works" and the feature was forgotten during the v2.0 redesign focus.

**How to avoid:**
1. Move the default password to an environment variable: `SETTINGS_DEFAULT_PASSWORD`
2. Hash passwords with `bcrypt` or `argon2` before storing in the `DefaultSetting` table
3. Compare using `bcrypt.compare()` (constant-time comparison, immune to timing attacks)
4. Add a migration to hash the existing plaintext value in the database
5. Remove the hardcoded string entirely from source code
6. Add a lint rule or git hook that flags `password.*=.*['"]` patterns in committed code

**Warning signs:**
- `grep -r "admin1234" src/` returns matches
- The `verifySettingsPasswordMutation` function uses `===` for comparison
- No bcrypt/argon2 in `package.json` dependencies

**Phase to address:**
Security phase (first) -- this is the single highest-severity vulnerability in the codebase

---

### Pitfall 3: Missing Security Headers -- No CSP, HSTS, X-Frame-Options, X-Content-Type-Options

**What goes wrong:**
The `next.config.ts` has zero security headers configured. No Content-Security-Policy, no Strict-Transport-Security, no X-Frame-Options, no X-Content-Type-Options. The proxy/middleware also sets no headers. This means: the site can be embedded in any iframe (clickjacking risk), browsers will MIME-sniff uploaded content (XSS via SVG uploads), inline scripts run without restriction, and there is no HTTPS enforcement.

**Why it happens:**
Security headers are invisible to users and developers -- the app works perfectly without them. They are a "production-only" concern that demo/MVP phases skip. Adding them retroactively is tricky because CSP can break inline scripts, styles, and third-party resources.

**How to avoid:**
1. Add headers in `next.config.ts` via the `headers()` async function:
   ```typescript
   async headers() {
     return [{
       source: '/(.*)',
       headers: [
         { key: 'X-Frame-Options', value: 'DENY' },
         { key: 'X-Content-Type-Options', value: 'nosniff' },
         { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
         { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
         { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
       ],
     }]
   }
   ```
2. For CSP: start with `Content-Security-Policy-Report-Only` first, then promote to enforcing after verifying nothing breaks
3. CSP must allow Supabase domains (`*.supabase.co`), Unsplash (`images.unsplash.com`), and inline styles from Tailwind
4. Avoid nonce-based CSP unless necessary -- it forces all pages to dynamic rendering, killing static generation
5. Use `unsafe-inline` for styles (Tailwind generates inline styles) but NOT for scripts
6. Test the deployed site with [securityheaders.com](https://securityheaders.com) after adding headers

**Warning signs:**
- `grep -r "Content-Security-Policy\|X-Frame-Options" src/` returns zero matches (confirmed)
- Site scores "F" on securityheaders.com
- No `headers()` function in `next.config.ts`

**Phase to address:**
Security phase -- add non-breaking headers first (X-Frame-Options, HSTS, etc.), then CSP-Report-Only, then enforcing CSP

---

### Pitfall 4: CSP Breaks Existing Functionality When Added Carelessly

**What goes wrong:**
Adding Content-Security-Policy as an enforcing header without testing every page breaks: (a) Recharts in the admin dashboard (uses inline SVG with `style` attributes), (b) react-pdf/renderer (generates inline scripts/styles for PDF), (c) Sonner toast notifications (inline styles), (d) Supabase Auth redirect callbacks, (e) Embla Carousel (inline style transforms), (f) framer-motion (inline `style` prop animations). CSP violations cause silent failures -- components render as blank white or simply disappear without error messages visible to the user.

**Why it happens:**
Developers add a strict CSP in one commit, test the homepage (which works), and ship. But CSP violations are page-specific -- they only fire when a blocked resource loads. The admin dashboard with Recharts, the contract PDF page, and the vehicle gallery all use different inline patterns. Without visiting every page after adding CSP, violations go undetected.

**How to avoid:**
1. Always start with `Content-Security-Policy-Report-Only` header
2. Add a reporting endpoint: `report-uri /api/csp-report` or use a service like report-uri.com
3. Run through ALL user flows: homepage, search, vehicle detail, contract wizard, admin dashboard, PDF generation, login/signup
4. Expect to need `style-src 'unsafe-inline'` (Tailwind + CSS-in-JS libraries make it unavoidable)
5. For scripts: enumerate allowed sources explicitly rather than `'unsafe-inline'`
6. Test in production mode (`bun run build && bun start`) -- dev mode adds HMR scripts that mask CSP issues

**Warning signs:**
- Browser console shows `Refused to apply inline style because it violates the following Content Security Policy directive`
- Components silently disappear or render as blank
- PDF generation returns empty pages
- Recharts charts do not render

**Phase to address:**
Security phase -- implement as the LAST security task, after all other headers are stable. Use Report-Only for at least one dev cycle before enforcing.

---

### Pitfall 5: Font Subsetting Serves Latin-Only Glyphs to a Korean-Language Platform

**What goes wrong:**
The current font setup imports `@fontsource/pretendard/400.css` through `@fontsource/pretendard/700.css`. Inspecting the actual CSS file reveals it loads ONLY `pretendard-latin-400-normal.woff2` -- the **latin** subset. The `node_modules/@fontsource/pretendard/files/` directory contains only 18 font files, all prefixed with `pretendard-latin-`. There are ZERO Korean (`korean`) subset files. This means **every Korean character on the entire site falls back to the system font** (Malgun Gothic on Windows, Apple SD Gothic Neo on macOS). The declared `font-family: "Pretendard"` applies only to Latin characters, creating a jarring font mismatch between Korean and English text.

**Why it happens:**
The `@fontsource/pretendard` package includes only the Latin subset by default when importing weight-specific CSS files. The full Korean subset is available via `@fontsource/pretendard/korean.css` or the base `index.css`, but the project specifically imports the weight files (`400.css`, `500.css`, etc.) which map to Latin only. This is a 16MB package that ships 0 bytes of Korean glyphs. The font appears to work in development because macOS has excellent Korean system fonts that mask the fallback.

**How to avoid:**
Option A (recommended): Switch to `next/font/local` with the Pretendard variable font file:
```typescript
import localFont from 'next/font/local'
const pretendard = localFont({
  src: './fonts/PretendardVariable.subset.woff2',
  weight: '45 920',
  display: 'swap',
})
```
Download the variable dynamic subset from the [Pretendard GitHub releases](https://github.com/orioncactus/pretendard) -- it uses Google Fonts-style on-demand subsetting with `unicode-range`, loading only glyphs actually used on the page. The dynamic subset WOFF2 is approximately 2.5MB total vs 16MB for all weights.

Option B: Import `@fontsource/pretendard/korean-400.css` etc. for Korean subset. But this ships a fixed 6MB+ regardless of which glyphs are used.

**Warning signs:**
- Open the site on Windows -- Korean text looks noticeably different from English text
- DevTools > Network > Font filter shows zero Korean font files loaded
- Inspect a Korean paragraph, computed `font-family` shows system fallback not "Pretendard"

**Phase to address:**
Performance phase -- this is both a visual correctness bug AND a performance opportunity (moving from @fontsource to next/font/local eliminates the 16MB dependency)

---

### Pitfall 6: 411 Hardcoded Hex Colors Create Regression Minefield During CSS Variable Migration

**What goes wrong:**
A search reveals 411 hardcoded hex color values (`#XXXXXX`) across 35 source files. The heaviest offenders: `hero-search-box.tsx` (34 occurrences), `sell-my-car-sections.tsx` (27), `public-vehicle-detail.tsx` (142), `hero-section.tsx` (36), `featured-vehicles.tsx` (14), `header.tsx` (17), `mobile-nav.tsx` (13), `mega-menu.tsx` (6). Migrating these to CSS variables risks visual regressions because: (a) multiple slightly different hex values represent the "same" semantic color (e.g., `#555555` vs `text-muted-foreground`), (b) some hex values are intentionally different from the design system (e.g., K Car branded colors), and (c) find-replace across 35 files with no visual regression test suite means broken colors go undetected.

**Why it happens:**
The v2.0 K Car redesign was built by extracting exact hex values from the K Car reference site. These values were hardcoded directly in components because speed was the priority. The existing CSS variables in `globals.css` (shadcn tokens like `--primary`, `--accent`, etc.) cover the design system, but the K Car-specific colors were never mapped to them.

**How to avoid:**
1. **Audit before replacing.** Create a color mapping document: which hex values map to which semantic token. Group the 411 occurrences into categories:
   - Direct token replacements (e.g., `#1A6DFF` -> `text-accent`)
   - New tokens needed (e.g., K Car-specific grays: `#7A7A7A`, `#555555`, `#999999` -> `--color-text-tertiary`, `--color-text-caption`)
   - Intentional one-offs (chart colors, gradient stops) that should stay as arbitrary values
2. **Add visual regression screenshots BEFORE starting migration.** Capture every page (home, search, detail, admin, mypage, login, calculator) at desktop and mobile widths. Compare after each batch of changes.
3. **Migrate by component, not by color.** Change one file at a time, verify visually, commit. Do NOT do a global find-replace.
4. **Keep arbitrary values where they belong.** Gradient stops, chart colors, and one-off decorative values are fine as `bg-[#0f1e3c]`. Not everything needs a CSS variable.
5. **Define new tokens in `globals.css` under `@theme inline`:**
   ```css
   @theme inline {
     --color-text-tertiary: var(--text-tertiary);
     --color-text-caption: var(--text-caption);
     --color-border-subtle: var(--border-subtle);
     --color-surface-hover: var(--surface-hover);
   }
   ```
   Then add the HSL values in `:root` and `.dark`.

**Warning signs:**
- PR changes 20+ files in a single color migration commit -- too risky
- Before/after screenshots show different shades on the same page
- `bun run type-check` passes but the site looks visually wrong

**Phase to address:**
Design system phase -- must happen BEFORE adding new components that should use the tokens. Create the token mapping first, then migrate file-by-file.

---

### Pitfall 7: File Upload Accepts Any MIME Type -- No Server-Side Validation

**What goes wrong:**
The `uploadImageMutation` in `src/features/vehicles/mutations/images.ts` accepts any file from `formData.get('file')` and uploads it directly to Supabase Storage with `contentType: file.type`. There is zero server-side validation of: (a) file type (MIME type check), (b) file extension whitelist, (c) file magic bytes (actual content verification), (d) file size limits. A malicious user can upload an HTML file renamed to `.jpg`, and if Supabase serves it with the original content-type header, it becomes a stored XSS vector. Additionally, Supabase Storage MIME type restrictions check only the filename, not actual content (confirmed by Supabase Storage issue #639).

**Why it happens:**
The client-side `browser-image-compression` library handles compression and provides reasonable defaults, so the developer assumed validation was happening. But client-side validation is trivially bypassed with curl or Postman. The Supabase bucket may have MIME restrictions, but those are filename-based only.

**How to avoid:**
1. Add server-side validation in `uploadImageMutation` BEFORE the Supabase upload:
   ```typescript
   const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
   const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

   if (!ALLOWED_TYPES.includes(file.type)) {
     return { error: 'JPG, PNG, WebP 이미지만 업로드 가능합니다.' }
   }
   if (file.size > MAX_FILE_SIZE) {
     return { error: '파일 크기는 5MB 이하여야 합니다.' }
   }
   ```
2. Verify magic bytes (file signature) for defense-in-depth:
   ```typescript
   const buffer = Buffer.from(await file.arrayBuffer())
   const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8
   const isPng = buffer[0] === 0x89 && buffer[1] === 0x50
   const isWebp = buffer[4] === 0x57 && buffer[5] === 0x45 && buffer[6] === 0x42 && buffer[7] === 0x50
   if (!isJpeg && !isPng && !isWebp) {
     return { error: '유효한 이미지 파일이 아닙니다.' }
   }
   ```
3. Set Supabase Storage bucket to serve with `Content-Disposition: attachment` for non-image types as an additional layer

**Warning signs:**
- No `ALLOWED_TYPES` or file size check in `images.ts`
- `file.type` is used only for the upload `contentType`, never for validation
- Uploading a `.html` file renamed to `.jpg` succeeds

**Phase to address:**
Security phase -- high severity, easy fix, do early

---

## Moderate Pitfalls

### Pitfall 8: No API Rate Limiting on 44 Public and Authenticated Endpoints

**What goes wrong:**
The project has 44 API route handlers across vehicles, contracts, admin, auth, inquiry, and pricing. None have rate limiting. The public `GET /api/vehicles` endpoint can be hammered with thousands of requests, causing Prisma connection pool exhaustion and Supabase rate limit hits. The `POST /api/inquiry` endpoint (contact form) has no throttling, enabling spam floods. The `POST /api/contracts/ekyc/send-code` endpoint (mock eKYC) has no rate limit, which would be catastrophic with a real SMS API.

**How to avoid:**
1. For Vercel serverless: use `@upstash/ratelimit` with Vercel KV (Redis-compatible, designed for serverless). In-memory `Map`-based rate limiters do not work reliably because each Vercel instance has its own memory.
2. Start with the most sensitive endpoints: `POST /api/inquiry`, `POST /api/contracts/ekyc/send-code`, `POST /api/auth/profile`, `POST /api/admin/settings/verify-password`
3. Use sliding window algorithm: 10 requests per minute for mutation endpoints, 60 per minute for read endpoints
4. Return `429 Too Many Requests` with `Retry-After` header
5. For the demo/MVP stage: an in-memory LRU rate limiter is acceptable -- just document the limitation

**Phase to address:**
Security phase -- implement after auth fixes, before CSP

---

### Pitfall 9: Unauthenticated API Endpoints Leaking Data

**What goes wrong:**
Several API endpoints lack authentication checks. `GET /api/vehicles/[id]/images` returns vehicle images without any auth (confirmed by code inspection -- no `requireAuth()` or `requireRole()` call). While vehicle images may be intentionally public, the pattern is inconsistent: `POST /api/vehicles/[id]/images` requires DEALER/ADMIN role, but `GET` does not verify the vehicle's status. This means deleted or rejected vehicles' images remain publicly accessible. Similarly, `GET /api/vehicles` has no auth -- appropriate for public search, but it should not return vehicles with status `REJECTED` or `DRAFT` to unauthenticated users.

**How to avoid:**
1. Audit every API route for auth requirements. Create a matrix:
   | Route | Method | Auth Required | Roles | Data Filtering |
   |-------|--------|---------------|-------|----------------|
   | `/api/vehicles` | GET | No | Public | Filter: status=APPROVED only for public |
   | `/api/vehicles/[id]/images` | GET | No | Public | Filter: vehicle must be APPROVED |
   | `/api/admin/*` | ALL | Yes | ADMIN | Enforce in every handler |
2. For public endpoints, add status filtering: only return data for `APPROVED` vehicles
3. Add integration tests that verify: unauthenticated requests to admin endpoints return 401, non-admin requests return 403
4. Verify that the `searchVehicles` query in `GET /api/vehicles` filters by approved status

**Phase to address:**
Security phase -- audit and fix alongside rate limiting

---

### Pitfall 10: Test Coverage Expansion Creates Brittle Over-Mocked Tests

**What goes wrong:**
The existing test suite (49 files, 425 tests) uses a heavy mocking pattern: `vi.hoisted()` + `vi.mock()` for every Prisma call, every Supabase call, and every auth helper. Adding new tests for security fixes (e.g., testing that rate limiting works, CSP headers are set, file validation rejects bad files) tempts developers to mock everything, creating tests that pass but test nothing meaningful. Example: a test that mocks `verifySettingsPasswordMutation` to return `{ success: true }` and then asserts it returns `{ success: true }` is circular.

**How to avoid:**
1. **New security tests should be integration-style where possible.** Test the actual API route handler with a real request:
   ```typescript
   const response = await POST(new Request('http://localhost/api/...', {
     method: 'POST',
     body: JSON.stringify({ ... }),
   }))
   expect(response.status).toBe(401)
   ```
2. **Mock only the external boundary** (Prisma, Supabase), not the business logic under test
3. **For CSP/header tests:** test against `next.config.ts` headers configuration directly, or use Playwright e2e to verify response headers
4. **Avoid "coverage padding" tests** -- tests that exist only to increase coverage percentage without testing behavior. Each test should have a clear "what would break if this test were deleted?" answer.
5. **Set a coverage threshold but do not chase 100%.** A reasonable target for this project: 70% line coverage on `src/lib/` and `src/features/*/mutations/`, 50% on components (UI tests are lower ROI than logic tests)

**Warning signs:**
- Test file has more `vi.mock()` calls than `expect()` assertions
- Test name describes implementation ("calls prisma.vehicle.update") not behavior ("returns 403 for non-admin")
- Removing the test does not make any real bug detectable

**Phase to address:**
Code quality phase -- establish testing guidelines BEFORE writing new tests

---

### Pitfall 11: Accessibility Changes Conflict with K Car Design Patterns

**What goes wrong:**
Adding WCAG 2.1 compliance retroactively to the K Car-styled UI causes visual conflicts: (a) the light gray text used for "secondary" information (`#7A7A7A` on white `#F8F8F8` background = 2.9:1 contrast ratio, fails AA 4.5:1 minimum), (b) the blue accent `#1A6DFF` on white passes for normal text but fails for the smaller 12px text used in the header top bar, (c) adding visible focus outlines to the clean K Car navigation disrupts the minimal aesthetic, (d) adding skip-navigation links and ARIA landmarks to the existing layout requires markup restructuring.

**How to avoid:**
1. **Run an automated audit first** using `axe-core` or Lighthouse accessibility before making changes. Document all existing violations.
2. **Fix contrast issues by adjusting the FAILING color, not the design:**
   - `#7A7A7A` -> `#616161` (passes 4.5:1 on white, visually similar gray)
   - Keep `#1A6DFF` for normal text but darken to `#1557CC` for 12px text
3. **Focus indicators: use `focus-visible` (not `focus`)** so keyboard-only users see outlines but mouse users do not
4. **Add ARIA landmarks progressively:** `<main>`, `<nav>`, `<header>`, `<footer>` tags (already partially present in layout). Add `aria-label` to navigation regions to differentiate multiple navs.
5. **Do NOT add `role` attributes to standard HTML elements** -- `<header>`, `<nav>`, `<main>` have implicit roles
6. **Test with keyboard navigation** through the entire site: Tab through header nav, search, vehicle cards, comparison bar, footer. Every interactive element must be reachable and operable.

**Warning signs:**
- Lighthouse Accessibility score below 80
- `axe-core` reports contrast failures on text smaller than 14px
- Tab key skips interactive elements or gets trapped in a component

**Phase to address:**
Design system phase -- fix contrast ratios as part of the color token migration. Keyboard/focus improvements as a separate sub-task.

---

### Pitfall 12: Bundle Optimization Breaks Dynamic Imports and Code Splitting

**What goes wrong:**
The project uses `next/dynamic` for `@react-pdf/renderer` (configured via `serverExternalPackages` in next.config.ts). Aggressive bundle optimization -- like manually configuring chunk splitting, modifying the webpack/turbopack config, or consolidating imports -- can break existing code-split boundaries. Specifically: (a) importing from barrel files (`index.ts`) instead of direct file paths defeats tree-shaking, (b) adding `"sideEffects": false` to package.json can strip CSS imports from `@fontsource`, (c) enabling experimental turbopack features may change chunking behavior from the current working state.

**How to avoid:**
1. **Measure before optimizing.** Run `ANALYZE=true bun run build` with `@next/bundle-analyzer` to see the current state. Common large chunks in this project: `recharts` (~200KB), `framer-motion` (~130KB), `@react-pdf/renderer` (~500KB), `@supabase/supabase-js` (~80KB)
2. **Dynamic import heavy libraries:**
   ```typescript
   const Recharts = dynamic(() => import('recharts'), { ssr: false })
   ```
   This is safe for admin dashboard charts (not SEO-critical).
3. **Do NOT modify turbopack config.** The project uses `--turbopack` for dev only. Production builds use webpack. Turbopack config changes may cause dev/prod behavior divergence.
4. **Keep barrel file imports minimal.** Import from `@/features/vehicles/mutations/create` not `@/features/vehicles`
5. **Test the build output size before and after changes:**
   ```bash
   bun run build 2>&1 | grep "First Load JS"
   ```

**Warning signs:**
- Build output `First Load JS` increases after "optimization" changes
- Pages that previously worked show blank content after chunk changes
- `@react-pdf/renderer` throws errors about missing server-side dependencies

**Phase to address:**
Performance phase -- measure baseline first, then optimize the largest chunks only

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Plaintext password comparison (`===`) | Fast to implement | Security vulnerability, no timing attack protection | Never in production |
| `as any` casts (11 occurrences across 7 files) | Bypasses type errors quickly | Hides real type mismatches that cause runtime errors | Only in test files with mock objects |
| Hardcoded hex colors (411 occurrences) | Fast UI development | Inconsistent theming, dark mode breakage, no design system | Only for one-off decorative values (gradient stops) |
| No file upload validation | Fast file handling | XSS via malicious uploads, storage abuse | Never |
| `console.log` in production code (6 files) | Quick debugging | Leaks internal state to browser console | Only with structured logging in server-side code |
| Latin-only font subset for Korean platform | Smaller font package | Korean text uses system fallback, visual inconsistency | Never for a Korean-language product |

## Integration Gotchas

Common mistakes when connecting to external services during hardening.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Storage (file upload) | Trusting client-provided MIME type | Validate file magic bytes server-side before upload |
| Supabase Auth (middleware) | Using deprecated `middleware.ts` with Next.js 16 | Rename to `proxy.ts`, export `proxy` function |
| Vercel (security headers) | Adding CSP in enforcing mode immediately | Start with `Content-Security-Policy-Report-Only`, test all pages |
| Vercel (rate limiting) | Using in-memory Map for rate limiting | Use Vercel KV / Upstash -- serverless instances don't share memory |
| next/font (Pretendard) | Importing `@fontsource` weight files (Latin-only) | Use `next/font/local` with Pretendard variable dynamic subset |
| Recharts (CSP) | Adding `style-src` without `'unsafe-inline'` | Recharts uses inline SVG styles; `'unsafe-inline'` is required for `style-src` |
| Supabase Auth (CSP) | Blocking Supabase redirect URLs | Add `*.supabase.co` to `connect-src` and `frame-src` |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 16MB @fontsource package loaded for Latin-only subset | Slow font loading, no visible Korean font | Switch to next/font/local with dynamic subset (~2.5MB) | Immediately -- Korean glyphs never load |
| No rate limiting on 44 API endpoints | Prisma connection pool exhaustion under load | Upstash/Vercel KV rate limiter | 100+ concurrent users |
| Unoptimized Recharts bundle (~200KB) on admin pages | Slow admin dashboard First Load JS | dynamic import with `{ ssr: false }` | When admin pages are frequently visited |
| Full `@fontsource/pretendard` in node_modules (16MB) | Slower CI/CD install, larger deployment | Remove package, use self-hosted subset | Immediately (wasted bandwidth every deploy) |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Hardcoded `admin1234` password in source code | Anyone with repo access can access admin settings | Move to env var, hash with bcrypt |
| No MIME type validation on file uploads | Stored XSS via malicious file uploads | Server-side magic byte verification |
| No CSP headers | XSS attacks have no browser-level defense | Add CSP-Report-Only first, then enforcing |
| No rate limiting on eKYC code endpoint | Abuse when connected to real SMS API | Rate limit to 3 requests per 10 minutes |
| Vehicle images accessible for DRAFT/REJECTED vehicles | Information leak of unapproved content | Filter by vehicle status in public GET endpoints |
| Plaintext password comparison with `===` | Timing attack vulnerability | Use `crypto.timingSafeEqual()` or bcrypt.compare() |

## UX Pitfalls

Common user experience mistakes during hardening.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| CSP blocks inline styles, killing Recharts/framer-motion | Admin dashboard and animations break silently | Always start CSP in report-only mode |
| Font migration breaks Korean text rendering temporarily | Korean text falls back to system font during migration | Test font rendering on Windows (where fallback is most visible) |
| Accessibility contrast fixes make text too dark/heavy | Overcompensating turns light-gray captions into heavy text | Use minimum passing contrast (4.5:1 for AA) not maximum |
| Rate limiting returns generic 500 instead of 429 | Users confused about why their request failed | Return proper 429 with Retry-After header and Korean error message |
| Security header changes break image loading | Vehicle images from Supabase/Unsplash stop rendering | Whitelist all image domains in CSP `img-src` directive |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Security headers:** Often missing Supabase domains in CSP `connect-src` -- verify auth callback still works
- [ ] **Font migration:** Often missing Korean glyphs -- verify on Windows with DevTools font inspection
- [ ] **Color token migration:** Often breaks dark mode -- verify both `:root` and `.dark` values exist for each new token
- [ ] **File upload validation:** Often checks MIME type but not magic bytes -- verify by uploading a renamed `.html` file
- [ ] **Rate limiting:** Often implemented per-route but missing on the eKYC and inquiry endpoints -- verify all sensitive POST endpoints
- [ ] **Accessibility:** Often adds ARIA labels but misses keyboard navigation -- verify Tab key traversal through entire page
- [ ] **Test coverage:** Often has high line count but no meaningful assertions -- verify each test has at least one behavior-testing `expect()`
- [ ] **proxy.ts rename:** Often renamed file but forgot to rename the test file or update CI config -- verify `bun run test` passes
- [ ] **Bundle optimization:** Often reduces one chunk but increases another -- verify total First Load JS did not increase

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| CSP breaks production | LOW | Switch to `Content-Security-Policy-Report-Only` immediately (one config change) |
| Font migration breaks Korean text | LOW | Revert to `@fontsource` import while fixing `next/font/local` setup |
| Color migration causes visual regressions | MEDIUM | Revert individual file changes using git; regressions are per-component |
| Hardcoded password exposed | HIGH | Rotate the password immediately, hash stored value, invalidate existing sessions |
| Malicious file uploaded | MEDIUM | Scan Supabase bucket, delete non-image files, add validation retroactively |
| Rate limiting blocks legitimate users | LOW | Increase rate limit thresholds; use per-user (not per-IP) limits for authenticated users |
| proxy.ts rename breaks auth | LOW | Revert to `middleware.ts` (still works with deprecation warning), fix naming later |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| #1 middleware.ts -> proxy.ts | Security (first task) | `bun run test` passes, auth flows work in dev |
| #2 Hardcoded password | Security (first task) | `grep -r "admin1234" src/` returns zero matches |
| #3 Missing security headers | Security | securityheaders.com score >= B |
| #4 CSP breaks functionality | Security (last security task) | All pages render correctly with CSP-Report-Only, zero violations in console |
| #5 Latin-only font | Performance | DevTools Network shows Korean WOFF2 files loaded |
| #6 Hardcoded hex migration | Design System | `grep -c "#[0-9a-fA-F]" src/` count reduced by >70% |
| #7 File upload validation | Security | Upload test: `.html` renamed to `.jpg` is rejected |
| #8 No rate limiting | Security | POST to `/api/inquiry` 20 times in 1 minute returns 429 |
| #9 Unauthenticated data leak | Security | GET `/api/vehicles/[draft-id]/images` returns 404 or empty |
| #10 Brittle test expansion | Code Quality | No test has more vi.mock() calls than expect() assertions |
| #11 Accessibility conflicts | Design System | Lighthouse Accessibility score >= 85 |
| #12 Bundle optimization breaks | Performance | `First Load JS` for homepage < 150KB |

## Sources

- [Next.js 16 middleware to proxy migration](https://nextjs.org/docs/messages/middleware-to-proxy) -- Official migration guide
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) -- Breaking changes list
- [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy) -- Nonce-based vs header-based CSP
- [Next.js security best practices 2026](https://www.authgear.com/post/nextjs-security-best-practices) -- Comprehensive security checklist
- [Supabase Storage MIME type issue #639](https://github.com/supabase/storage/issues/639) -- MIME type checks filename only, not content
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control) -- RLS for storage buckets
- [File upload MIME type bypass](https://www.sourcery.ai/vulnerabilities/file-upload-content-type-bypass) -- Magic byte verification necessity
- [Pretendard GitHub](https://github.com/orioncactus/pretendard) -- Variable dynamic subset for Korean web fonts
- [Next.js font optimization](https://nextjs.org/docs/app/getting-started/fonts) -- next/font/local usage
- [Korean font subsetting with korsubset](https://github.com/SeokminHong/korsubset) -- Korean font subset tooling
- [WCAG contrast minimum 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) -- 4.5:1 ratio requirement
- [Vercel rate limiting discussion](https://github.com/vercel/vercel/discussions/5325) -- Serverless rate limiting strategies
- [Vitest coverage guide](https://vitest.dev/guide/coverage) -- Coverage configuration and thresholds
- [Tailwind CSS v4 migration](https://www.digitalapplied.com/blog/tailwind-css-v4-2026-migration-best-practices) -- @theme and CSS variable patterns
- Codebase analysis: `src/middleware.ts`, `src/features/settings/mutations/auth.ts`, `src/features/vehicles/mutations/images.ts`, `src/app/globals.css`, `next.config.ts`, 44 API route handlers -- direct inspection

---
*Pitfalls research for: Navid Auto v3.0 Hardening*
*Researched: 2026-03-27*
