# Project Research Summary

**Project:** Navid Auto v3.0 Hardening
**Domain:** Security hardening, performance optimization, design system cleanup, code quality for Korean used car rental/lease platform (Next.js 16 + Supabase)
**Researched:** 2026-03-27
**Confidence:** HIGH

## Executive Summary

Navid Auto is a production-bound Korean B2B2C used car rental/lease platform that has shipped 4 milestones across 20 phases with a validated core stack. The v3.0 milestone is not a feature expansion — it is a production-readiness gate. Research reveals four categories of technical debt accumulated during rapid feature delivery: security vulnerabilities (one critical: plaintext password in source code; three high: unguarded API endpoints, no file upload validation, missing security headers), performance waste (Korean platform serving Latin-only fonts — zero Korean glyphs ever loaded, 1,197KB JavaScript bundle on homepage), design system fragmentation (394-411 hardcoded hex values across 29-35 files bypassing the existing CSS variable system), and code quality gaps (3.9% line coverage despite 425 tests, no API route handler tests at all).

The recommended approach is sequential hardening across four phases ordered by risk and dependency. Security fixes first because they are launch-blocking, independent of each other, and small in scope (4-6 files, 30-80 LOC). Performance second because font migration and bundle splitting reduce visible quality issues and eliminate wasted infrastructure. Design system third because it is the highest-volume mechanical work (394 replacements across 29 files) and must follow security stabilization to avoid chasing a moving target. Code quality and CSP last because tests should validate the already-fixed behavior, not the broken baseline. A critical infrastructure task — renaming `middleware.ts` to `proxy.ts` per Next.js 16 convention — must precede all other work as it gates security header implementation.

The key risk is the CSS variable migration: 394 hardcoded hex values across 29 files with no visual regression test suite means broken colors can go undetected. Research strongly recommends taking Playwright screenshots of all pages before starting migration, migrating file-by-file rather than via global find-replace, and validating each batch visually before committing. The second risk is CSP implementation: adding Content-Security-Policy in enforcing mode will silently break Recharts, framer-motion, Sonner toasts, and PDF generation. Always start with `Content-Security-Policy-Report-Only` first. The third risk that research surfaced is that `@fontsource/pretendard` — which the project depends on — ships zero Korean glyphs; every Korean character on this Korean-language platform falls back to system fonts.

## Key Findings

### Recommended Stack

The core stack (Next.js 16, React 19, Tailwind v4, shadcn/ui, Prisma, Supabase, Zustand, Vitest 4, bun) is unchanged and validated across 20 phases and 425 tests. v3.0 adds only 2 new dev dependencies, removes 1 production dependency, and results in a net bundle reduction.

**Core technology additions:**
- `@vitest/coverage-v8@^4.0.18`: V8-native coverage tracking — matches Vitest 4.x major version, 2-3x faster than Istanbul, AST-based remapping for accurate JSX coverage since Vitest 3.2.0; `coverage.all` was removed in Vitest 4, must use `coverage.include` instead
- `vitest-axe@^0.1.0`: axe-core integration for Vitest — enables `toHaveNoViolations()` in component tests without Jest/Vitest type conflicts; thin wrapper, low coupling risk
- Remove `@fontsource/pretendard`: replaced by Pretendard CDN dynamic subset (`cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9`) — eliminates 16MB Latin-only package, loads only Unicode-range glyphs used on each page (~50-200KB actual download per page)
- `bcryptjs` (optional fallback): for settings password hashing if not using `Bun.password.hash()` — 4KB, zero native deps, Vercel serverless safe; `Bun.password` (argon2) is preferred as it is built into the bun runtime
- `next experimental-analyze` (built-in): Turbopack-native bundle analysis — no package installation needed, works with existing `--turbopack` dev configuration; only add `@next/bundle-analyzer@^16.2.1` as fallback if experimental analyzer lacks treemap detail

**What NOT to add:** CSRF tokens (Supabase JWT pattern makes them unnecessary — Server Actions have built-in Origin checking), helmet/next-safe (Express.js middleware, wrong layer for Next.js), @vitest/coverage-istanbul (V8 is faster and equally accurate since Vitest 3.2.0), stylelint (Tailwind makes CSS linting marginal value), Lighthouse CI (overkill for demo/MVP hardening scope), Sentry (needs real user traffic to justify the dependency), socket.dev/Snyk (enterprise scanning, `bun audit` covers CVE scanning for demo scope).

### Expected Features

This milestone defines production-readiness fixes, not user-visible features. Every item maps to a concrete audit finding with measurable before/after targets. Total scope estimate: ~75 files touched, ~2,000 LOC changed/added.

**Must have — P1 (launch-blocking security and performance):**
- Auth guard on quote-pdf endpoint — currently accepts unauthenticated POST, CPU abuse vector; 5-line fix using existing `requireAdmin()` helper
- Password hashing with `Bun.password` argon2 — plaintext `admin1234` hardcoded in `src/features/settings/mutations/auth.ts`, compared with `===` (timing attack vulnerable)
- Server-side MIME type + magic byte validation on image uploads — `uploadImageMutation` trusts client-provided `file.type` without server verification; Supabase Storage does not validate content types server-side
- Next.js 16.1.6 CVE verification — confirm coverage of CVE-2025-29927 (middleware bypass, fixed in 16.0.10), CVE-2025-66478 (RSC RCE, fixed in 16.0.7)
- Pretendard font switch to CDN dynamic subset — 3MB Latin-only fonts serving zero Korean glyphs on a Korean-language platform
- JS bundle reduction from 1,197KB toward 500KB — recharts (~200KB), framer-motion (~130KB), @react-pdf/renderer (~500KB) as dynamic imports

**Should have — P2 (accessibility and maintainability):**
- Hardcoded hex to CSS variables (394-411 occurrences across 29-35 files) with brand blue decision (#1A6DFF recommended as canonical, 43 uses vs #3B82F6's 6)
- Focus-visible fixes for 27 interactive elements missing keyboard focus indicators (WCAG 2.4.7 AA failure) — concentrated in `hero-section.tsx`, `hero-search-box.tsx`, `quote-builder.tsx`, `vehicle-edit-sheet.tsx`
- Homepage h1 element — currently no `<h1>` at all (WCAG 1.3.1 Level A failure, SEO impact)
- prefers-reduced-motion support — zero instances in codebase despite framer-motion animations, Embla carousel auto-play, CSS transitions
- Test coverage expansion from 3.9% to 30%+ line coverage — focus on API route handlers (currently zero tests for 52 endpoints) and critical behavioral paths

**Defer to future milestones:**
- Dark mode toggle — requires hex migration to complete first, then visual regression testing across all 35+ component files with both `:root` and `.dark` token values
- Full CSP without `unsafe-inline` — Tailwind CSS and shadcn/ui require `unsafe-inline` for `style-src`; nonce-based approach adds per-request rendering overhead
- Sentry error monitoring — add when product has real user traffic to justify third-party dependency
- axe-core in CI — needs E2E Playwright tests as foundation; fix the 27 known violations first

### Architecture Approach

The existing architecture has four integration layers where hardening work intersects. The middleware/proxy layer (currently deprecated `src/middleware.ts`, must rename to `src/proxy.ts`) handles routing decisions — security headers move to `next.config.ts` headers configuration, not middleware, because per Next.js CVE-2025-29927 guidance, middleware is for routing only, not security enforcement. The API route layer (52 endpoints) uses per-route auth guards via `requireAuth`/`requireRole` in `src/lib/api/auth.ts` — 5 endpoints currently bypass these entirely. The component layer (29-35 files) contains 394-411 hardcoded hex values bypassing the existing CSS variable system. The foundation layer receives new semantic color tokens and API route-level test coverage.

**Major components and their hardening changes:**
1. `src/proxy.ts` (renamed from `src/middleware.ts`) — auth routing logic unchanged; use `npx @next/codemod middleware-to-proxy` to automate rename
2. `next.config.ts` — receives security headers (X-Frame-Options DENY, HSTS 63072000s, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy) and CSP in report-only mode initially
3. `src/app/layout.tsx` + `src/app/globals.css` — font migration from 4 `@fontsource` weight imports to single Pretendard dynamic subset CDN import
4. `src/app/globals.css` (@theme inline block) — receives 3-4 new semantic tokens to cover K Car palette gaps: `--text-tertiary` (#999999), `--accent-muted` (#EBF3FF), `--utility-text` (#7A7A7A)
5. 29 component files — mechanical hex-to-CSS-variable replacement; `color-filter.tsx` car color swatches are intentionally hardcoded and must NOT be converted
6. `tests/helpers/factories.ts` (new) + `tests/unit/api/` directory (new) — test factory pattern with `createMockUser()`/`createMockAdmin()` and API route auth guard integration tests

**Recommended build order within phases:** Foundation tasks first (security headers in next.config.ts, font fix, CSS tokens, test factory) because they are independent and additive-only. Security fixes next (depend on test factory being ready). Design system migration third (depends on CSS tokens defined). Performance and quality last (depends on stable security and design system baseline).

### Critical Pitfalls

1. **middleware.ts not renamed to proxy.ts for Next.js 16** — file still works with deprecation warnings but a future minor version will break auth silently. Rename file and exported function, run `npx @next/codemod middleware-to-proxy`, update `src/middleware.test.ts` to `src/proxy.test.ts`. Do this first before any other security work.

2. **CSP added in enforcing mode silently breaks Recharts, framer-motion, Sonner, PDF generation** — always start with `Content-Security-Policy-Report-Only`, add `/api/csp-report` endpoint, test ALL user flows in production build mode (`bun run build && bun start`, not dev). Expect `style-src 'unsafe-inline'` is permanently required for Tailwind.

3. **CSS variable migration via global find-replace causes visual regressions** — same hex value (`#0D0D0D`) means different things in different contexts (text color vs border color). Migrate file-by-file with visual verification after each file. Take Playwright screenshots of every page before starting. Car color swatches in `color-filter.tsx` are intentional one-offs, not design token violations.

4. **Korean font never loads — @fontsource/pretendard ships Latin-only subset** — the 16MB package ships zero Korean glyphs. `node_modules/@fontsource/pretendard/files/` contains only `pretendard-latin-*` files. Every Korean character falls back to system font. Fix: switch to Pretendard CDN dynamic subset. Verify fix on Windows where system font fallback (Malgun Gothic) is most visually distinct from Pretendard.

5. **Plaintext password in source code and unguarded PDF endpoint are the two critical vulnerabilities** — `const DEFAULT_PASSWORD = 'admin1234'` compared with `===` in `src/features/settings/mutations/auth.ts`. Quote-PDF POST endpoint at `/api/admin/inventory/quote-pdf` has zero auth checks. Both are 5-30 line fixes using patterns already in the codebase.

## Implications for Roadmap

Based on combined research (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md), suggested phase structure:

### Phase 1: Infrastructure Foundation
**Rationale:** The middleware rename is a prerequisite for all other security work — it must be done first to avoid rename conflicts mid-security-sprint. Security headers in `next.config.ts` are additive-only (zero regression risk). Font migration eliminates the Korean glyph bug immediately and is independent of all other work. New CSS semantic tokens must be defined before hex migration can begin. Test factory must exist before security fix tests can be written. All Phase 1 items are independent and can be parallelized as sub-plans within a single phase.
**Delivers:** `src/proxy.ts` replaces `src/middleware.ts`, security headers active (non-breaking set: X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), Pretendard Korean font loading correctly via CDN dynamic subset, 3-4 new CSS semantic tokens added to `globals.css` @theme inline, `tests/helpers/factories.ts` with `createMockUser`/`createMockAdmin` factories
**Addresses:** Pitfall #1 (middleware deprecation), Pitfall #5 (Latin-only font), Pitfall #3 (missing security headers — non-CSP headers only in Phase 1)
**Avoids:** Committing security fixes before test infrastructure is ready; deploying with deprecated middleware convention

### Phase 2: Security Fixes
**Rationale:** All four security vulnerabilities use existing patterns in the codebase — no new abstractions needed. They are small in scope but high in severity. Writing integration tests alongside each fix (enabled by Phase 1 test factory) validates the fix and prevents regression. Rate limiting on inquiry/eKYC endpoints requires a decision (Vercel WAF rules vs. @upstash/ratelimit) that depends on the Vercel plan tier.
**Delivers:** Password hashing via `Bun.password.hash()` (argon2) in settings auth, progressive migration to hash existing DB value, quote-pdf `requireAdmin()` guard, eKYC send-code `requireAuth()` guard, image upload MIME type + magic byte validation (ALLOWED_TYPES + 5MB limit), Next.js CVE status verified, rate limiting on inquiry/eKYC endpoints, `tests/unit/api/` with auth guard integration tests
**Uses:** Existing `src/lib/api/auth.ts` `requireAuth`/`requireAdmin`/`requireRole` helpers, `Bun.password` (zero new dependencies), existing vitest + `vi.hoisted()` test patterns
**Implements:** Complete API route security layer — all write endpoints have auth guards
**Avoids:** Pitfall #2 (hardcoded password), Pitfall #7 (file upload abuse), Pitfall #10 (brittle over-mocked tests — integration tests over unit tests for security fixes)

### Phase 3: Design System Migration
**Rationale:** This is the highest-volume phase (394 replacements, 29 files) but lowest logic risk — purely mechanical visual changes. Must follow Phase 1 (CSS tokens defined) to have valid replacement targets. Safer after security work is complete and stable (no moving targets). Brand blue decision (#1A6DFF as canonical) must be locked at phase start before any replacements begin. Visual regression risk is highest here — Playwright baseline screenshots are mandatory before starting.
**Delivers:** Brand blue unified to #1A6DFF via `--accent` CSS variable, 394+ hardcoded hex values replaced with CSS variable references across 29 files, focus-visible fixes for 27 interactive elements (`hero-section.tsx`, `hero-search-box.tsx`, `quote-builder.tsx`, `vehicle-edit-sheet.tsx`), homepage `<h1>` added (visually hidden or visible), global `prefers-reduced-motion` CSS reset, `framer-motion` wrapped in `useReducedMotion()` hook
**Uses:** Tailwind v4 `@theme inline` pattern, existing shadcn CSS variable system, Playwright for visual regression baseline
**Avoids:** Pitfall #6 (global find-replace regression minefield — file-by-file only), Pitfall #11 (accessibility contrast fixes breaking K Car aesthetic — use minimum passing 4.5:1 ratio, not overcorrected heavy text)

### Phase 4: Performance Optimization
**Rationale:** Bundle optimization requires measurement before action — run `next experimental-analyze` first, then fix actual offenders with data not assumptions. ISR can only be applied to public pages with slowly-changing data; auth-gated pages (admin, dealer, mypage, contracts) MUST remain `force-dynamic` to prevent cross-session data leaks. framer-motion must stay synchronous in the hero section (above-fold, LCP) but can be dynamic-imported in below-fold components.
**Delivers:** First-load JS for public pages below 300KB target (from 1,197KB), ISR applied to homepage (`revalidate: 60`) and vehicle detail pages (`revalidate: 300`), recharts and below-fold framer-motion components dynamic-imported, `@fontsource/pretendard` removed from dependencies (-16MB from node_modules), caching headers on vehicle list API (`stale-while-revalidate`), `bun audit` passing with no high/critical vulnerabilities
**Uses:** `next experimental-analyze` (built-in), `next/dynamic` (built-in), ISR `revalidate` config, `bun audit` (built-in)
**Avoids:** Pitfall #12 (dynamic importing above-fold components breaks LCP), Anti-Pattern ISR on auth-gated pages (data leak risk)

### Phase 5: Code Quality + CSP
**Rationale:** Test expansion should cover the already-fixed behavior (security guards, hashed passwords, validated uploads), not the broken baseline. Setting coverage thresholds after fixes are in place ensures thresholds reflect correct behavior. CSP is last because it requires the most user-flow testing, is highest regression risk, and benefits from all other phases being stable. Report-Only mode for at least one full dev cycle before promoting to enforcing.
**Delivers:** Test coverage from 3.9% to 30%+ line coverage with `@vitest/coverage-v8`, API route handler tests for auth, contracts, vehicles with integration-style testing (real Request objects, mock only Prisma/Supabase boundary), `vitest-axe` accessibility tests on key components (`VehicleCard`, `SearchFilters`, `ContractWizard`), CSP in `Content-Security-Policy-Report-Only` mode with violation endpoint, coverage thresholds configured at 40/30/35/40 (statements/branches/functions/lines) starting conservative
**Uses:** `@vitest/coverage-v8@^4.0.18`, `vitest-axe@^0.1.0`, existing vitest 4.x infrastructure
**Avoids:** Pitfall #10 (brittle over-mocked tests — each test must answer "what real bug would this catch?"), Pitfall #4 (CSP enforcing mode breaking Recharts/PDF/animations)

### Phase Ordering Rationale

- Infrastructure (Phase 1) before security fixes (Phase 2) because test factory is a prerequisite for meaningful security tests, and middleware rename + `next.config.ts` headers are infrastructure-level changes safest done atomically before touching business logic
- Design system (Phase 3) after security (Phase 2) because security fixes stabilize the API route patterns that the design system components depend on; also, 29 files changing in Phase 3 is safest when the test suite already covers the security layer
- Performance (Phase 4) after design system (Phase 3) because bundle composition analysis is more accurate when CSS variable migration is complete (some framer-motion usage changes during Phase 3)
- Code quality and CSP (Phase 5) last because tests validate correct post-fix behavior, not pre-fix bugs; CSP needs all phases stable before comprehensive flow testing
- Brand blue decision (#1A6DFF vs #3B82F6) must be made as Phase 3's first task — it gates all downstream hex migration work

### Research Flags

Phases needing deeper research or pre-work during planning:
- **Phase 5 (CSP):** Manual testing required across ALL user flows in production build mode before promoting CSP from Report-Only to enforcing. User flows to cover: homepage, search, vehicle detail, contract wizard (all steps), admin dashboard (Recharts charts), PDF generation, login/signup. Needs a `/api/csp-report` endpoint or external service (report-uri.com) to capture violations during Report-Only phase.

Phases with standard patterns (skip additional research):
- **Phase 1 (Infrastructure):** All items follow official Next.js docs — middleware rename has a published codemod, font migration is documented in Next.js fonts guide, CSS tokens follow existing shadcn `@theme inline` pattern.
- **Phase 2 (Security):** All fixes use existing `requireAuth`/`requireRole` helpers. `Bun.password` is documented at bun.sh. Magic byte validation is a 10-line addition. Patterns are well-understood.
- **Phase 3 (Design System):** Mechanical find-replace following the hex-to-variable mapping table in ARCHITECTURE.md. No research needed — only discipline (file-by-file, not global replace) and visual regression testing.
- **Phase 4 (Performance):** Measure first with `next experimental-analyze`, then apply `next/dynamic`. Both are official Next.js documented patterns with no ambiguity.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack validated across 20 phases and 425 tests. New additions (@vitest/coverage-v8 v4.1.1 published 2026-03-25, vitest-axe v0.1.0) are version-pinned. vitest-axe has not been updated in ~3 years but the axe-core engine it wraps is actively maintained. |
| Features | HIGH | Every feature item backed by concrete codebase audit (specific file paths, line numbers, occurrence counts verified via direct code inspection of all 52 API routes, 50 test files, 35 component files). No speculative items. |
| Architecture | HIGH | Based on direct codebase analysis of all 52 API routes, 50 test files, middleware.ts, globals.css, layout.tsx, package.json, and all component files. Findings are observed, not inferred. |
| Pitfalls | HIGH | Critical pitfalls verified against official Next.js CVE advisories (CVE-2025-29927, CVE-2025-66478), Supabase Storage issue tracker (#639), and direct code inspection confirming the vulnerabilities exist. |

**Overall confidence:** HIGH

### Gaps to Address

- **Rate limiting implementation choice:** Two viable options — Vercel WAF rules (simpler, Vercel Pro plan feature) vs. `@upstash/ratelimit` with Vercel KV (requires setup, works on all plans). Confirm the Vercel account plan tier before Phase 2 to pick the right approach. For in-memory rate limiting in demo stage, document the limitation explicitly.
- **CSP `img-src` and `connect-src` allowlist:** The exact domains required for CSP directives need enumeration from actual network traffic. Confirmed required: `*.supabase.co` (auth + storage), `images.unsplash.com` (vehicle placeholder images), `cdn.jsdelivr.net` (Pretendard font CDN after Phase 1 migration). Any other third-party image or API domains must be catalogued before Phase 5 CSP implementation.
- **vitest-axe Vitest 4 compatibility:** If `toHaveNoViolations()` matcher fails with Vitest 4, the fallback is using `axe-core` directly: `const results = await axe(container); expect(results.violations).toHaveLength(0)`. Low probability risk but worth having the fallback ready.
- **PretendardVariable.woff2 self-hosting decision:** Research recommends CDN dynamic subset for Phase 1 (simplest, immediate fix). If the team wants zero external CDN dependency for production, `next/font/local` with the Pretendard Variable woff2 file (~3.2MB) is Option B. This decision affects whether `cdn.jsdelivr.net` appears in the CSP `font-src` directive in Phase 5.

## Sources

### Primary (HIGH confidence)
- [Next.js Font Optimization docs](https://nextjs.org/docs/app/getting-started/fonts) — next/font/local setup, verified 2026-03-27
- [Next.js CSP Configuration Guide](https://nextjs.org/docs/app/guides/content-security-policy) — nonce generation, middleware vs config headers
- [Next.js Security blog](https://nextjs.org/blog/security-nextjs-server-components-actions) — per-route auth pattern rationale, CSRF in Server Actions
- [Next.js CVE-2025-29927 advisory](https://nextjs.org/blog/cve-2025-29927) — middleware bypass, fixed in 16.0.10; confirms per-route auth is correct pattern
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — middleware.ts to proxy.ts migration
- [Next.js 16.1 blog](https://nextjs.org/blog/next-16-1) — `next experimental-analyze` announcement
- [Vitest Coverage docs](https://vitest.dev/guide/coverage) — V8 vs Istanbul, Vitest 4 `coverage.include` requirement
- [@vitest/coverage-v8 npm](https://www.npmjs.com/package/@vitest/coverage-v8) — v4.1.1, published 2026-03-25
- [Pretendard GitHub](https://github.com/orioncactus/pretendard) — v1.3.9, dynamic subset CDN links, Latin-only limitation confirmed
- [bun audit docs](https://bun.com/docs/pm/cli/audit) — built-in CVE scanning
- [Bun Password Hashing](https://bun.com/docs/runtime/hashing) — native argon2 support via `Bun.password`
- Codebase direct analysis — all 52 API routes, 50 test files, middleware.ts, globals.css, package.json, 35 component files (highest confidence source for all architecture findings)

### Secondary (MEDIUM confidence)
- [Next.js Security Best Practices 2026](https://www.authgear.com/post/nextjs-security-best-practices) — comprehensive checklist, third-party source
- [Next.js Bundle Optimization Case Study](https://blog.nazrulkabir.com/2026/01/nextjs-bundle-size-optimization-case-study/) — 40-75% reduction techniques
- [Design Tokens with Tailwind v4 + CSS Variables](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026) — @theme directive migration
- [WCAG 2.4.7 Focus Visible](https://www.digitala11y.com/focus-visible-understanding-sc-2-4-7/) — 4.5:1 contrast ratio requirement
- [Accessible Animation with prefers-reduced-motion](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) — implementation patterns
- [vitest-axe GitHub](https://github.com/chaance/vitest-axe) — fork of jest-axe for Vitest, API stable but package not recently updated

### Tertiary (LOW confidence — needs validation)
- [Supabase Storage MIME type issue #639](https://github.com/supabase/storage/issues/639) — MIME type checks filename only; needs re-verification against current Supabase version before Phase 2
- [Vercel rate limiting discussion](https://github.com/vercel/vercel/discussions/5325) — serverless rate limiting strategies; community discussion, implementation details may vary

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
