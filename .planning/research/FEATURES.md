# Feature Research: v3.0 Hardening

**Domain:** Security hardening, performance optimization, design system cleanup, code quality for used car rental/lease platform
**Researched:** 2026-03-27
**Confidence:** HIGH

## Feature Landscape

This milestone is not about new user-facing features. It is a production-readiness gate: fixing security vulnerabilities, eliminating performance waste, unifying the design system, and raising test coverage. Every item here was surfaced by concrete gstack audit findings with measurable before/after targets.

---

### Table Stakes (Must Fix -- Blocks Production Deployment)

Features and fixes that are non-negotiable for a production-grade application. Missing any of these is a deployment blocker or security liability.

#### Security

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Auth guard on quote-pdf endpoint** | `POST /api/admin/inventory/quote-pdf` accepts unauthenticated requests. Any internet user can generate PDFs with arbitrary data. This is an API abuse vector and potential cost attack (PDF rendering is CPU-intensive). | LOW | Add `requireRole('DEALER', 'ADMIN')` at top of handler, same pattern as `POST /api/vehicles/[id]/images`. 5-line fix. Existing `requireRole` helper in `src/lib/api/auth.ts`. |
| **Password hashing (replace hardcoded admin1234)** | Settings auth in `src/features/settings/mutations/auth.ts` stores and compares passwords in plaintext. Default password `admin1234` is hardcoded. Any settings password stored in `DefaultSetting` table is also plaintext. This fails basic security audits. | MEDIUM | Use `Bun.password.hash()` (argon2 by default) and `Bun.password.verify()` -- native Bun runtime support, zero dependencies. Migration: hash existing plaintext passwords on first comparison, store hashed version back. Progressive migration pattern. |
| **Server-side MIME type validation for image uploads** | `uploadImageMutation` in `src/features/vehicles/mutations/images.ts` trusts `file.type` from the client FormData without server-side verification. Attackers can upload executable files with spoofed MIME types. Supabase Storage does not validate content types server-side. | MEDIUM | Read first 12 bytes (magic bytes) to verify actual file type. Accept only `image/jpeg`, `image/png`, `image/webp`, `image/avif`. Use `file-type` npm package or manual magic byte check. Also enforce max file size server-side (current limit is client-only via `browser-image-compression`). |
| **Next.js security update verification** | Current version 16.1.6 -- need to verify this is patched against CVE-2025-29927 (middleware bypass, fixed in 16.0.10), CVE-2025-66478 (RSC RCE, fixed in 16.0.7), and CVE-2026-23864 (DoS). The 16.1.6 version should be past all critical fixes but requires explicit verification. | LOW | Run `npx fix-react2shell-next` to verify. If any patch is missing, `bun add next@latest`. Check React version alignment per Vercel security advisory. |

#### Performance

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Pretendard font optimization (3MB to ~300KB)** | Current setup imports 4 weights of `@fontsource/pretendard` (400, 500, 600, 700) = ~3MB WOFF2 total. Critically, these are **Latin-only** subsets -- Korean text falls back to system fonts, defeating the purpose. The 16MB `@fontsource/pretendard` package is wasted. | MEDIUM | **Option A (recommended):** Switch to Pretendard dynamic subset via CDN (`cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendard-dynamic-subset.min.css`). Uses unicode-range subsetting -- only characters on the page are downloaded. Variable font = single file for all weights. **Option B:** Download Pretendard Variable WOFF2 (~2.5MB for full Korean) and use `next/font/local` for self-hosting with automatic `font-display: swap` and `size-adjust`. Either way, remove `@fontsource/pretendard` dependency. |
| **JS bundle reduction (1,197KB to target 500KB)** | Homepage loads 1,197KB of JavaScript. For a content-heavy used car listing site, this is excessive. Key offenders likely include: `recharts` (500KB+), `framer-motion` (150KB+), `@react-pdf/renderer` (200KB+), `embla-carousel` (bundled on non-carousel pages). | HIGH | Multi-pronged approach: (1) Dynamic import heavy libraries with `next/dynamic` -- `recharts` only on admin dashboard, `@react-pdf/renderer` only on PDF download, `framer-motion` animations lazy-loaded. (2) Audit barrel file imports -- import from specific paths not index files. (3) Use `@next/bundle-analyzer` or Turbopack analyzer to identify actual offenders. (4) Tree-shake unused exports. Target: first-load JS under 300KB for public pages. |
| **HTTP request reduction (59 to target ~25)** | Homepage makes 59 HTTP requests. RSC prefetch, multiple font files, unoptimized image loading contribute. Each request adds latency, especially on mobile. | MEDIUM | (1) Reduce RSC prefetch by setting `prefetch={false}` on non-critical Links or using `prefetch="intent"`. (2) Consolidate font loading to single variable font file. (3) Use `loading="lazy"` on below-fold images. (4) Verify no duplicate API calls from parallel component trees. (5) Consider Vercel Edge caching headers. |
| **CDN/caching strategy** | No explicit caching headers on API responses or static assets beyond Next.js defaults. Repeat visitors re-download everything. | LOW | Add `Cache-Control` headers to vehicle list API (short TTL, stale-while-revalidate), static assets (immutable for hashed filenames), and font files (long TTL). Vercel Edge Network handles most of this automatically but API responses need explicit headers. |

#### Design System

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Hardcoded hex to CSS variables (408 occurrences)** | 411 hardcoded hex values across 35 source files. The design system has proper CSS variables defined in `globals.css` with `@theme` tokens, but components bypass them. This makes theme changes impossible and creates visual inconsistency. | HIGH | Systematic find-and-replace, file by file. Two distinct color sets to address: (1) **#1A6DFF** (43 occurrences, 17 files) -- K Car brand blue, not mapped to any CSS variable. Needs a new token like `--brand-blue` or consolidation with `--accent`. (2) **#3B82F6** (6 occurrences, 3 files) -- Tailwind blue-500, used in admin charts. Map to `--chart-primary` or `--accent`. Other hex values: grays (#E8E8E8, #F8F8F8, #999999, #555555, #0D0D0D, #D1D5DB, #F5F5F5, #EBF3FF) need mapping to existing `--muted`, `--border`, `--foreground` tokens. |
| **Brand blue unification (#1A6DFF vs #3B82F6)** | Two different blues used for the same semantic purpose. #1A6DFF (K Car brand blue, 43 uses) and #3B82F6 (Tailwind blue-500, 6 uses in charts + floating CTA). The design decision from MEMORY.md says "Blue accent (#3B82F6)" but the K Car redesign introduced #1A6DFF widely. | MEDIUM | **Decision required:** Pick ONE brand blue. Recommend #1A6DFF since it has 43 occurrences vs 6 for #3B82F6, and it was the deliberate K Car style choice. Map to `--accent` CSS variable (currently `hsl(217 91% 60%)` which is actually #3B82F6). Update `--accent` to #1A6DFF's HSL equivalent, then replace all hardcoded instances with the `accent` design token. |
| **Focus-visible accessibility (51 outline-none)** | 51 instances of `outline-none` across 29 files. Only 24 of those have a corresponding `focus-visible` replacement. That means **27 interactive elements lose keyboard focus indicators entirely** -- a WCAG 2.4.7 (Level AA) failure. Screen reader and keyboard users cannot navigate the site. | MEDIUM | Audit all 51 `outline-none` usages. For each: (1) If it has `focus-visible:ring-*`, it is already correct -- keep. (2) If it has no focus replacement, add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. Most are in `src/components/ui/` (shadcn) which already follow the pattern. The violations are concentrated in marketing components (`hero-section.tsx` 4x, `hero-search-box.tsx` 4x, `quote-builder.tsx` 6x, `vehicle-edit-sheet.tsx` 6x). |
| **prefers-reduced-motion support** | Zero instances of `prefers-reduced-motion` in the entire codebase. The site uses `framer-motion` animations, Embla carousel auto-play, and CSS transitions. ~35% of adults 40+ have vestibular sensitivity. This is a WCAG 2.3.3 (Level AAA) and increasingly an AA expectation. | MEDIUM | (1) Add global CSS: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }`. (2) Wrap `framer-motion` animations in `useReducedMotion()` hook. (3) Disable Embla carousel auto-play when reduced motion is preferred. (4) Add `autoPlay` toggle to hero banner respecting the preference. |
| **Homepage missing h1** | Homepage (`src/app/(public)/page.tsx`) has no `<h1>` element. The hero banner and search box are all `<div>` elements. This is a WCAG 1.3.1 (Level A) failure and hurts SEO -- Google expects one `<h1>` per page for content hierarchy. | LOW | Add `<h1 className="sr-only">Navid Auto - 중고차 렌탈 리스</h1>` at top of page, or convert the hero banner title to an `<h1>`. The visually-hidden approach is common for image-heavy hero sections. |

#### Code Quality

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Test coverage expansion (3.9% to target 30%+)** | 49 test files covering 385 source files = 12.7% file coverage, but line/branch coverage is 3.9%. Most tests are unit tests on schemas, utilities, and mutations. No integration tests for API route handlers. No component rendering tests for key user flows. | HIGH | Focus on behavioral tests, not coverage metrics: (1) API route handler tests for critical endpoints (contract creation, vehicle CRUD, auth flows). (2) Component tests for key user journeys (search + filter, vehicle detail view, contract wizard steps). (3) Use MSW for network mocking in integration tests. Target 30% line coverage as a floor, but prioritize high-value paths: auth, contracts, payments. |
| **Push 145 unpushed commits** | 145 commits on local main that have not been pushed to remote. Risk of data loss if local machine fails. Also blocks CI/CD and team collaboration. | LOW | `git push origin main`. Verify remote is configured. If remote rejects (diverged history), investigate before force-pushing. This is a one-time operational task, not a code change. |

---

### Differentiators (Competitive Advantage)

Features that go beyond fixing problems -- they elevate the product above the audit baseline.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Lighthouse CI in CI/CD pipeline** | Automated performance regression detection. Every PR gets a performance score. Prevents reintroduction of bundle bloat or accessibility issues after v3.0 fixes them. | LOW | Use `@lhci/cli` in GitHub Actions. Set budgets: performance >80, accessibility >90, FCP <2s. Fails PR if budgets are violated. |
| **Design token documentation page** | Internal `/design-system` page showing all CSS variables, color swatches, typography scale, spacing. Makes the token system self-documenting and prevents future hardcoded hex drift. | LOW | Server component that reads `globals.css` variables and renders swatches. Valuable for any future designer/developer joining the project. |
| **Error boundary with user-friendly fallback** | Currently uncaught errors show Next.js default error page. A branded error boundary with "Try again" button and error reporting improves perceived quality. | LOW | `error.tsx` files in key route segments. Log errors to console or future monitoring service. |
| **Security headers (CSP, HSTS, X-Frame-Options)** | Content Security Policy prevents XSS. Strict-Transport-Security forces HTTPS. X-Frame-Options prevents clickjacking. These are standard production headers that security auditors check first. | MEDIUM | Add via `next.config.ts` headers configuration or Vercel edge middleware. CSP is the hardest to get right with inline styles from Tailwind -- may need `unsafe-inline` for style-src initially. |
| **Structured logging for API errors** | Current error handling uses `console.error`. Production needs structured JSON logging with request context (user ID, route, timestamp) for debugging. | MEDIUM | Create a `logger.ts` utility wrapping `console` with structured output. Add request context to API error responses. Prepares for future integration with Vercel Log Drain or Axiom. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem valuable for a hardening milestone but create more problems than they solve.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **100% test coverage target** | "More tests = better quality" mindset. Coverage reports look impressive. | Chasing coverage numbers leads to brittle snapshot tests, trivial assertion tests, and tests that test implementation not behavior. The marginal value of going from 30% to 100% is negative if those tests are low quality. | Target 30% line coverage with focus on **behavioral tests** for critical paths (auth, contracts, search). Use coverage as a guide, not a goal. |
| **Full CSP without unsafe-inline** | "Best practice" for Content Security Policy. Eliminates all inline script/style vectors. | Tailwind CSS generates utility classes that often require `unsafe-inline` for `style-src`. Removing it requires nonce-based CSP which adds complexity to every server response. shadcn/ui components use inline styles. | Start with CSP that allows `unsafe-inline` for styles but blocks scripts. Tighten incrementally. The most important CSP directive is `default-src 'self'` and `script-src`. |
| **Dark mode support** | CSS variables are already dark-mode ready (`.dark` variant exists in `globals.css`). Seems easy to enable. | Adding dark mode during a hardening milestone introduces visual regression risk across 35+ component files. Every hardcoded hex value (411 of them) needs dark mode equivalents. The hex cleanup must happen first. | Complete hex-to-variable migration first (this milestone). Enable dark mode toggle in a future milestone when all components use tokens. |
| **Migrate from Vitest to Bun test runner** | Project uses Bun as package manager. Bun has built-in test runner. Seems natural to consolidate. | Bun's test runner lacks React Testing Library integration maturity, happy-dom/jsdom compatibility has edge cases, and vitest has superior watch mode, coverage reporting, and IDE integration. The existing 49 test files all use vitest patterns. | Keep Vitest. MEMORY.md explicitly warns: "`bun test` is bun's built-in runner -- do not use." The test infrastructure works. |
| **Automated accessibility scanner (axe-core in CI)** | Catch all a11y issues automatically. | axe-core in CI without Playwright E2E tests only catches static HTML issues. The real a11y problems (focus management, keyboard navigation, dynamic content) require runtime testing. Adding axe-core before fixing the known 27 focus-visible violations is putting the cart before the horse. | Fix the known violations first (focus-visible, h1, reduced-motion). Then add `@axe-core/playwright` to E2E tests in a future milestone. |
| **Sentry/error monitoring integration** | "Production apps need error monitoring." | Adds a third-party dependency, requires configuration, and needs a Sentry account. For a demo/investment-stage product, `console.error` with structured logging is sufficient. Sentry adds value at scale with real users. | Implement structured logging (`logger.ts`) this milestone. Add Sentry when the product has real user traffic. |

---

## Feature Dependencies

```
[Next.js Security Update]  (independent, do first)

[Password Hashing]  (independent)

[Quote-PDF Auth Guard]  (independent)

[Image Upload MIME Validation]  (independent)

[Brand Blue Decision: #1A6DFF vs #3B82F6]
    └──required-by──> [Hardcoded Hex to CSS Variables]
                           └──required-by──> [Dark Mode] (future, not this milestone)

[Pretendard Font Optimization]  (independent)
    └──reduces──> [HTTP Request Count]

[JS Bundle Reduction]
    └──requires──> [Bundle Analyzer Setup] (first step)
    └──reduces──> [HTTP Request Count]

[Focus-Visible Audit]  (independent, parallelize with hex migration)

[prefers-reduced-motion]  (independent)

[Homepage h1]  (independent, trivial)

[Test Coverage Expansion]
    └──depends-on──> [All security fixes complete] (tests should cover fixed behavior)
    └──depends-on──> [API route patterns stable] (don't test routes that are about to change)

[Push Unpushed Commits]  (do immediately, before any code changes)
```

### Dependency Notes

- **Brand Blue Decision before Hex Migration:** Cannot replace hardcoded hex values without knowing the canonical brand color. The decision between #1A6DFF and #3B82F6 must be made before systematic replacement begins.
- **Security Fixes before Test Expansion:** Write tests for the correct behavior (with auth guards, with hashed passwords). Don't test the broken state.
- **Bundle Analyzer before Bundle Reduction:** Identify actual offenders with data, not assumptions. `recharts` and `framer-motion` are likely candidates but must be measured.
- **Font Optimization reduces HTTP Requests:** Switching from 4 separate font weight files to 1 variable font file eliminates 3 HTTP requests immediately.
- **Push Commits first:** All changes build on current codebase. If remote is out of sync, merge conflicts will compound.

---

## MVP Definition (v3.0 Scope)

### Phase 1: Security Hardening (Launch-blocking)

- [x] Push 145 unpushed commits to remote
- [ ] Verify Next.js 16.1.6 covers all known CVEs
- [ ] Add auth guard to quote-pdf endpoint
- [ ] Implement password hashing with Bun.password (argon2)
- [ ] Add server-side MIME type validation for image uploads
- [ ] Add file size limit enforcement server-side

### Phase 2: Performance Optimization

- [ ] Replace @fontsource/pretendard with Pretendard dynamic subset (CDN or next/font/local)
- [ ] Set up bundle analyzer and identify top 5 JS weight offenders
- [ ] Dynamic import recharts, @react-pdf/renderer, framer-motion
- [ ] Audit and fix barrel file imports
- [ ] Reduce RSC prefetch on homepage
- [ ] Add caching headers to vehicle list API

### Phase 3: Design System Cleanup

- [ ] Decide canonical brand blue (#1A6DFF recommended)
- [ ] Create new CSS variable tokens for K Car colors (--brand-blue, --text-gray-*, --bg-gray-*)
- [ ] Systematic hex-to-variable migration across 35 files
- [ ] Add homepage h1 (visually hidden)
- [ ] Audit and fix 27 outline-none violations missing focus-visible
- [ ] Add global prefers-reduced-motion CSS reset
- [ ] Wrap framer-motion in useReducedMotion
- [ ] Disable carousel auto-play for reduced-motion users

### Phase 4: Code Quality

- [ ] Write API route handler tests for auth, contracts, vehicles (integration layer)
- [ ] Write component tests for search, detail, contract wizard (behavioral)
- [ ] Set up MSW for network mocking
- [ ] Target 30% line coverage floor
- [ ] Add Lighthouse CI to GitHub Actions (optional, differentiator)

### Defer to Future Milestones

- [ ] Dark mode toggle -- requires hex migration first, visual regression testing
- [ ] Sentry integration -- needs real user traffic to justify
- [ ] Full CSP without unsafe-inline -- needs nonce-based approach research
- [ ] axe-core in CI -- needs E2E Playwright tests as foundation
- [ ] Bun test migration -- no benefit, risks breaking 49 test files

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Risk if Skipped | Priority |
|---------|------------|---------------------|-----------------|----------|
| Quote-PDF auth guard | HIGH (security) | LOW | Data abuse, cost attack | P1 |
| Password hashing | HIGH (security) | MEDIUM | Credential exposure | P1 |
| Next.js CVE verification | HIGH (security) | LOW | RCE vulnerability | P1 |
| Image MIME validation | HIGH (security) | MEDIUM | Malicious file upload | P1 |
| Push unpushed commits | HIGH (operational) | LOW | Data loss | P1 |
| Pretendard font optimization | HIGH (performance) | MEDIUM | 3MB font load, no Korean | P1 |
| JS bundle reduction | HIGH (performance) | HIGH | Slow page load, poor CWV | P1 |
| Brand blue decision | MEDIUM (consistency) | LOW | Blocks hex migration | P1 |
| Hex to CSS variables | MEDIUM (maintainability) | HIGH | Theme changes impossible | P2 |
| Focus-visible fixes | MEDIUM (accessibility) | MEDIUM | WCAG AA failure | P2 |
| Homepage h1 | MEDIUM (SEO/a11y) | LOW | WCAG A failure | P2 |
| prefers-reduced-motion | MEDIUM (accessibility) | MEDIUM | Vestibular sensitivity | P2 |
| HTTP request reduction | MEDIUM (performance) | MEDIUM | Slow mobile experience | P2 |
| CDN/caching headers | MEDIUM (performance) | LOW | Repeat visitor penalty | P2 |
| Test coverage to 30% | MEDIUM (quality) | HIGH | Low confidence in changes | P2 |
| Lighthouse CI | LOW (process) | LOW | No regression detection | P3 |
| Design token doc page | LOW (DX) | LOW | Future hardcoded drift | P3 |
| Security headers | MEDIUM (security) | MEDIUM | XSS/clickjacking risk | P3 |
| Error boundaries | LOW (UX) | LOW | Raw error pages shown | P3 |
| Structured logging | LOW (ops) | MEDIUM | Hard to debug production | P3 |

**Priority key:**
- P1: Must complete this milestone -- security/performance blockers
- P2: Should complete -- accessibility and maintainability improvements
- P3: Nice to have -- operational excellence, can defer if time-constrained

---

## Complexity and Effort Estimates

| Category | Files to Touch | Estimated LOC Changed | Risk Level |
|----------|---------------|----------------------|------------|
| Security (4 items) | ~6 files | +80 / -15 | **Low** -- well-understood patterns, existing helpers |
| Performance (font) | ~3 files | +10 / -12 | **Low** -- swap import, remove dependency |
| Performance (bundle) | ~10-15 files | +30 / -10 | **Medium** -- dynamic imports, needs measurement first |
| Performance (HTTP) | ~5 files | +15 / -5 | **Low** -- config changes |
| Design System (hex) | ~35 files | +411 / -411 | **Medium** -- high volume, low complexity per change |
| Design System (a11y) | ~12 files | +27 / -0 | **Low** -- adding classes |
| Test Coverage | ~15-20 new test files | +1500 / -0 | **Medium** -- test infrastructure exists, need to write meaningful tests |

**Total estimated: ~75 files touched, ~2,000 LOC changed/added**

---

## Sources

### Security
- [Next.js Security Best Practices 2026](https://www.authgear.com/post/nextjs-security-best-practices) -- API route auth, middleware patterns
- [CVE-2025-29927: Next.js Middleware Bypass](https://nextjs.org/blog/cve-2025-29927) -- Fixed in 16.0.10
- [CVE-2025-66478: RSC RCE](https://nextjs.org/blog/CVE-2025-66478) -- Fixed in 16.0.7, current 16.1.6 is patched
- [Bun Password Hashing](https://bun.com/docs/runtime/hashing) -- Native argon2 support
- [Server-side File Upload Validation](https://dev.to/thesameeric/how-to-validate-uploaded-files-in-node-js-2dc4) -- Magic bytes validation

### Performance
- [Pretendard Dynamic Subset](https://github.com/orioncactus/pretendard/blob/main/packages/pretendard/docs/en/README.md) -- CDN URLs, variable font
- [Next.js Bundle Optimization Case Study](https://blog.nazrulkabir.com/2026/01/nextjs-bundle-size-optimization-case-study/) -- 40-75% reduction techniques
- [Font Optimization in 2026](https://medium.com/design-bootcamp/font-optimization-in-2026-stop-letting-fonts-silently-kill-your-core-web-vitals-4ec4250736e1) -- Core Web Vitals impact
- [Next.js Package Bundling Guide](https://nextjs.org/docs/app/guides/package-bundling) -- Code splitting, tree shaking

### Design System / Accessibility
- [Design Tokens with Tailwind v4 + CSS Variables](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026) -- @theme directive migration
- [WCAG 2.4.7 Focus Visible](https://www.digitala11y.com/focus-visible-understanding-sc-2-4-7/) -- Focus indicator requirements
- [WCAG 2.4.13 Focus Appearance](https://www.allaccessible.org/blog/wcag-2413-focus-appearance-guide) -- Contrast and size requirements
- [Accessible Animation with prefers-reduced-motion](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) -- Implementation patterns

### Code Quality
- [Vitest + RTL with Next.js 2026](https://noqta.tn/en/tutorials/vitest-react-testing-library-nextjs-unit-testing-2026/) -- Testing strategy
- [Next.js App Router Testing Strategy](https://shinagawa-web.com/en/blogs/nextjs-app-router-testing-setup) -- Multi-layer testing approach
- [Vitest Component Testing](https://vitest.dev/guide/browser/component-testing) -- Browser-based component tests

---
*Feature research for: v3.0 Hardening -- Security, Performance, Design System, Code Quality*
*Researched: 2026-03-27*
