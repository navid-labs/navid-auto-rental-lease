# Roadmap: Navid Auto

## Milestones

- ✅ **v1.0 Demo MVP** -- Phases 1-9 (shipped 2026-03-10)
- ✅ **v1.1 Inventory Admin** -- Phases 10-12 (shipped 2026-03-10)
- ✅ **v2.0 K Car Style Redesign** -- Phases 13-17 (shipped 2026-03-23)
- ✅ **v2.1 Visual Polish** -- Phases 18-20 (shipped 2026-03-23)
- [ ] **v3.0 Hardening** -- Phases 21-25 (in progress)

## Phases

<details>
<summary>v1.0 Demo MVP (Phases 1-9) -- SHIPPED 2026-03-10</summary>

- [x] Phase 1: Foundation (2/2 plans) -- completed 2026-03-09
- [x] Phase 2: Authentication & User Management (2/2 plans) -- completed 2026-03-09
- [x] Phase 3: Vehicle Data & Storage (3/3 plans) -- completed 2026-03-09
- [x] Phase 4: Dealer Portal & Approval Workflow (2/2 plans) -- completed 2026-03-09
- [x] Phase 5: Public Search & Discovery (2/2 plans) -- completed 2026-03-09
- [x] Phase 6: Pricing & Calculation (3/3 plans) -- completed 2026-03-10
- [x] Phase 7: Contract Engine (3/3 plans) -- completed 2026-03-09
- [x] Phase 8: Contract Completion & My Page (2/2 plans) -- completed 2026-03-09
- [x] Phase 9: Admin Dashboard & Demo Readiness (3/3 plans) -- completed 2026-03-10

</details>

<details>
<summary>v1.1 Inventory Admin (Phases 10-12) -- SHIPPED 2026-03-10</summary>

- [x] Phase 10: Inventory Data & Table UI (2/2 plans) -- completed 2026-03-09
- [x] Phase 11: Quote Generation Engine (3/3 plans) -- completed 2026-03-09
- [x] Phase 12: Settings Management & Polish (3/3 plans) -- completed 2026-03-10

</details>

<details>
<summary>v2.0 K Car Style Redesign (Phases 13-17) -- SHIPPED 2026-03-23</summary>

- [x] Phase 13: Component Foundation (2/2 plans) -- completed 2026-03-19
- [x] Phase 14: Vehicle Detail Page (5/5 plans) -- completed 2026-03-20
- [x] Phase 15: Search & Listing Page (5/5 plans) -- completed 2026-03-22
- [x] Phase 16: Homepage & Navigation (4/4 plans) -- completed 2026-03-22
- [x] Phase 17: Admin Refresh & Polish (2/2 plans) -- completed 2026-03-23

</details>

<details>
<summary>v2.1 Visual Polish (Phases 18-20) -- SHIPPED 2026-03-23</summary>

- [x] Phase 18: Global Spacing Foundation (1/1 plans) -- completed 2026-03-23
- [x] Phase 19: Homepage & Search Spacing (2/2 plans) -- completed 2026-03-23
- [x] Phase 20: Detail Page Spacing (1/1 plans) -- completed 2026-03-23

</details>

### v3.0 Hardening (In Progress)

**Milestone Goal:** gstack 종합 피드백(보안/성능/디자인/품질) 전면 개선 -- 프로덕션 수준 품질 관문

- [x] **Phase 21: Infrastructure Foundation** - Proxy rename, security headers, font fix, CSS tokens, test tooling (completed 2026-03-27)
- [x] **Phase 22: Security Fixes** - Auth guards, password hashing, upload validation (completed 2026-03-27)
- [ ] **Phase 23: Design System Migration** - Hex-to-CSS variables, brand color, accessibility
- [ ] **Phase 24: Performance Optimization** - Bundle analysis, dynamic imports, RSC prefetch, ISR
- [ ] **Phase 25: Code Quality + CSP** - Test coverage 30%+, tech debt cleanup, CSP Report-Only

## Phase Details

### Phase 21: Infrastructure Foundation
**Goal**: Platform infrastructure is production-ready with correct Next.js 16 conventions, security headers active, Korean font loading properly, CSS token system defined, and test tooling in place for subsequent phases
**Depends on**: Nothing (first phase of v3.0)
**Requirements**: SEC-01, SEC-05, SEC-06, PERF-01, DS-02, CQ-01
**Success Criteria** (what must be TRUE):
  1. `src/proxy.ts` exists and handles routing correctly (middleware.ts is gone, no deprecation warnings in dev server logs)
  2. Browser DevTools Network tab shows HSTS, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers on every response
  3. Korean text on the homepage renders in Pretendard font (not system fallback) and font file download is under 300KB per page load
  4. `globals.css` contains named CSS custom properties for all core brand colors, and the `@theme inline` block defines semantic tokens
  5. Running `bun run test:coverage` produces a coverage report with baseline percentages for statements, branches, functions, and lines
**Plans**: 3 plans

Plans:
- [x] 21-01-PLAN.md -- Proxy rename (middleware.ts to proxy.ts) + security headers in next.config.ts
- [x] 21-02-PLAN.md -- Pretendard CDN font migration + brand CSS token definitions
- [x] 21-03-PLAN.md -- @vitest/coverage-v8 install + baseline coverage measurement

### Phase 22: Security Fixes
**Goal**: All known security vulnerabilities are patched -- every write API endpoint requires authentication, passwords are hashed, and file uploads are validated server-side
**Depends on**: Phase 21 (test factory needed for security tests, proxy rename must be complete)
**Requirements**: SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. Unauthenticated POST to `/api/admin/inventory/quote-pdf` and `/api/contracts/ekyc/send-code` returns 401 (not 200). `/api/inquiry` remains intentionally public (anonymous contact form).
  2. The settings password in the database is an argon2 hash (not plaintext `admin1234`), and login with the correct password still succeeds
  3. Uploading a `.js` file renamed to `.jpg` via the vehicle image upload endpoint returns a validation error (magic byte check rejects it)
**Plans**: 2 plans

Plans:
- [ ] 22-01-PLAN.md -- Auth guards for unprotected endpoints + argon2id password hashing
- [ ] 22-02-PLAN.md -- Server-side image upload validation with magic byte checks

### Phase 23: Design System Migration
**Goal**: The codebase uses a single source of truth for colors via CSS variables, brand blue is unified, and core accessibility gaps (focus-visible, reduced-motion, heading hierarchy) are resolved
**Depends on**: Phase 21 (CSS tokens must be defined first)
**Requirements**: DS-01, DS-03, DS-04, DS-05, DS-06, DS-07
**Success Criteria** (what must be TRUE):
  1. Searching the codebase for `#3B82F6`, `#1A6DFF`, and other hardcoded hex brand blues returns zero results outside of `globals.css` token definitions and intentional exceptions (car color swatches)
  2. All 394+ hardcoded hex values across 29 component files are replaced with `var(--token-name)` references (verified by grep count)
  3. Pressing Tab through interactive elements on homepage, search page, and contract wizard shows a visible focus ring on every focusable element
  4. Toggling `prefers-reduced-motion: reduce` in browser DevTools causes all animations (framer-motion, carousel, CSS transitions) to be disabled or reduced
  5. Homepage has exactly one `<h1>` element (verifiable via `document.querySelectorAll('h1').length === 1`)
**Plans**: 4 plans

Plans:
- [ ] 23-01-PLAN.md -- Accessibility foundations (focus-visible, reduced-motion, h1, dark mode tokens)
- [ ] 23-02-PLAN.md -- Hex migration batch 1: 4 largest files (public-vehicle-detail, hero-section, hero-search-box, sell-my-car)
- [ ] 23-03-PLAN.md -- Hex migration batch 2: layout + remaining marketing + page files (24 files)
- [ ] 23-04-PLAN.md -- Verification sweep + visual regression checkpoint

### Phase 24: Performance Optimization
**Goal**: Public pages load fast with optimized JavaScript bundles, server-rendered content is cached via ISR, and unnecessary client-side prefetching is eliminated
**Depends on**: Phase 23 (bundle analysis is more accurate after CSS variable migration is complete)
**Requirements**: PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. `next experimental-analyze` shows first-load JS for homepage under 300KB (down from 1,197KB)
  2. Recharts and @react-pdf/renderer are loaded only when their respective pages/components are rendered (verified by checking they do not appear in the shared bundle)
  3. Homepage uses ISR with `revalidate: 60` and vehicle detail pages use ISR with `revalidate: 300` (verified by checking response headers for `x-nextjs-cache`)
  4. Homepage renders without triggering 59 simultaneous prefetch requests (prefetch={false} applied to non-critical links)
**Plans**: TBD

Plans:
- [ ] 24-01: TBD
- [ ] 24-02: TBD

### Phase 25: Code Quality + CSP
**Goal**: Test coverage reaches 30%+ with meaningful API route tests, accumulated tech debt is cleaned up, and Content-Security-Policy is deployed in report-only mode to prepare for future enforcement
**Depends on**: Phase 22 (tests should validate post-fix behavior), Phase 24 (all optimizations stable before CSP)
**Requirements**: CQ-02, CQ-03, CQ-04, CQ-05
**Success Criteria** (what must be TRUE):
  1. `bun run test:coverage` shows line coverage at 30% or above (up from 3.9%)
  2. API route handler tests exist for auth endpoints, contract creation, and vehicle search -- each test uses real Request objects and validates HTTP status codes and response shapes
  3. `native confirm()` calls are replaced with a proper confirmation dialog component, orphaned modules are removed, and the `/contracts` route redirect bug is fixed
  4. Browser DevTools shows `Content-Security-Policy-Report-Only` header on responses, and visiting `/api/csp-report` endpoint accepts POST requests for violation logging
**Plans**: TBD

Plans:
- [ ] 25-01: TBD
- [ ] 25-02: TBD
- [ ] 25-03: TBD

## Progress

**Execution Order:** Phases 21 -> 22 -> 23 -> 24 -> 25

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9 | v1.0 | 22/22 | Complete | 2026-03-10 |
| 10-12 | v1.1 | 8/8 | Complete | 2026-03-10 |
| 13-17 | v2.0 | 18/18 | Complete | 2026-03-23 |
| 18-20 | v2.1 | 4/4 | Complete | 2026-03-23 |
| 21. Infrastructure Foundation | 3/3 | Complete    | 2026-03-27 | - |
| 22. Security Fixes | 2/2 | Complete    | 2026-03-27 | - |
| 23. Design System Migration | v3.0 | 0/4 | Not started | - |
| 24. Performance Optimization | v3.0 | 0/2 | Not started | - |
| 25. Code Quality + CSP | v3.0 | 0/3 | Not started | - |
