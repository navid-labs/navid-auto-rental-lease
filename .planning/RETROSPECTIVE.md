# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Demo MVP

**Shipped:** 2026-03-10
**Phases:** 9 | **Plans:** 22 | **Sessions:** ~5

### What Was Built
- Full-stack used car rental/lease platform (18,276 LOC TypeScript)
- 3-role auth system with Supabase Auth + RLS + middleware route protection
- Vehicle management with 3-step wizard, image upload, drag-and-drop reorder
- Dealer portal with admin approval workflow (batch approve, rejection presets)
- Public search storefront with multi-criteria filters, nuqs URL state
- Pricing calculator with rental vs lease comparison, admin residual value table
- Contract engine with 4-step wizard, mock eKYC, realtime status tracking
- PDF generation with Korean fonts, my page with contract tracking
- Admin dashboard with recharts charts, full CRUD, demo seed data (9 accounts)

### What Worked
- **Foundation-first approach**: RLS, auth, and schema before any features prevented rework
- **Wave-based execution**: Sequential dependency waves with parallel plans within waves
- **Pluggable adapter pattern**: MockPlateProvider, mock eKYC — swap-ready for real APIs in v2
- **nuqs for URL state**: Type-safe filter/sort state persisted in URL, reused across phases
- **Promise.all for parallel queries**: Consistent pattern across all server components
- **vi.hoisted() pattern**: Solved Vitest mock factory hoisting issues early, reused everywhere
- **Zod 4 + react-hook-form**: zodResolver cast pattern established in Phase 3, consistent through Phase 9

### What Was Inefficient
- **EmptyState component orphaned**: Created but never integrated into pages — should have been wired inline
- **Finance modules overbuilt**: acquisition-tax, deposit-credit, residual-value, quote-calculator created but unused
- **Barrel index.ts pattern**: Created but consumers import directly — unnecessary layer
- **Contract redirect bug**: `/auth/login` instead of `/login` — missed because (auth) is parenthesized route group
- **confirm() dialogs**: 4 native dialogs crept in instead of custom modals — should have caught earlier

### Patterns Established
- **Server Action + Prisma $transaction** for atomic operations with audit trails
- **Status machine pattern** (vehicle + approval + contract) with role-based transition enforcement
- **base-ui render prop** pattern (not asChild) for all UI primitives
- **force-dynamic** for admin pages querying database at request time
- **next/dynamic ssr:false** for heavy client libraries (recharts, dnd-kit)
- **searchParams tab state** pattern reused across admin pages (Phases 4, 7, 8)
- **Sheet slide-out** for inline editing without page navigation

### Key Lessons
1. **Parenthesized route groups don't appear in URLs** — `(auth)` resolves to `/login` not `/auth/login`. Must verify redirect paths match actual URL structure.
2. **Create components and wire them in the same task** — orphaned components are tech debt that's easy to miss in verification.
3. **Phase sequencing matters more than parallelization** — sequential waves prevented integration issues that parallel phases would have caused.
4. **Zod 4 works fine** — initial v3 assumption was wrong. Zod 4 + resolvers v5.2.2 is the correct combination.
5. **Demo seed data should be a first-class concern** — comprehensive seed (9 accounts, 13 contracts, all statuses) makes every phase testable.

### Cost Observations
- Model mix: ~70% opus (executors), ~25% sonnet (verifiers), ~5% haiku (checkers)
- Sessions: ~5 sessions across 2 days
- Notable: Average plan execution ~4.5 minutes. Total execution ~1.05 hours for 22 plans.

---

## Milestone: v2.1 — Visual Polish

**Shipped:** 2026-03-23
**Phases:** 3 | **Plans:** 4 | **Sessions:** 1

### What Was Built
- Global 52px navigation height and 24px content breathing room across all layouts
- Homepage 80px+ section gaps, 3-column featured vehicle grid, enlarged search section padding
- Search page 24px card grid gaps, 16px card internal padding, symmetrical filter pill spacing
- Vehicle detail breadcrumb navigation (홈 > 내차사기 > 브랜드 모델)
- Similar vehicles 3-column grid with 6 items, uniform 32px section card spacing

### What Worked
- **Layout-level padding pattern**: Single `pt-6` on layout `<main>` eliminated per-page padding duplication across 6+ pages
- **Negative margin override pattern**: `-mt-6` cleanly counteracts layout padding for edge-to-edge sections (hero, gallery)
- **Smallest milestone yet**: 3 phases, 4 plans, ~1.5 hours — CSS-only changes with high impact
- **Phase dependency design**: Phase 18 (global) → Phase 19+20 (independent) enabled parallel execution
- **3-source requirements verification**: VERIFICATION + SUMMARY + REQUIREMENTS cross-check caught all 14/14

### What Was Inefficient
- **take: 8 vs slice(0, 6) mismatch**: Server query unchanged when render count was reduced — minor DB waste on every detail page
- **Nyquist validation incomplete**: All 3 phases have VALIDATION.md but `nyquist_compliant: false` — CSS-only phases don't benefit from unit tests, but the framework still flags them

### Patterns Established
- **pt-6 + -mt-6 override**: Standard pattern for "global padding with selective edge-to-edge" — reuse in future layout work
- **Breadcrumb with nameKo fallback**: `nameKo || name` pattern for Korean/English brand names in BreadcrumbNav

### Key Lessons
1. **CSS-only milestones are fast and low-risk** — 18 files, +38/-23 lines, zero test regressions. Good candidate for batch execution.
2. **Layout-level spacing > per-page spacing** — Single source of truth prevents accumulation of conflicting padding.
3. **Server queries should match render limits** — When UI reduces item count, update the DB query too.

### Cost Observations
- Model mix: ~60% opus (executors), ~30% sonnet (verifiers+integration), ~10% haiku
- Sessions: 1 session, ~1.5 hours total
- Notable: Fastest milestone — 4 plans averaging ~3.5 minutes each

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 | ~5 | 9 | 22 | Foundation-first, wave-based execution, 22 plans in ~1 hour |
| v2.0 | ~4 | 5 | 18 | K Car design system, component library, 5 pages rebuilt |
| v2.1 | 1 | 3 | 4 | CSS-only spacing polish, layout-level patterns, ~1.5 hours |

### Cumulative Quality

| Milestone | Tests | Source Files Modified | Execution Time |
|-----------|-------|---------------------|----------------|
| v1.0 | 264 (30 files) | 213 created | ~1.05 hours |
| v2.0 | 439 (50 files) | 166 modified | ~1.5 hours |
| v2.1 | 439 (50 files) | 18 modified | ~1.5 hours |

### Top Lessons (Verified Across Milestones)

1. Foundation-first approach (RLS, auth, schema) prevents rework in later phases
2. Pluggable adapter patterns enable mock-to-real API swaps without refactoring
3. Type-safe URL state (nuqs) is reusable infrastructure worth investing in early
4. Layout-level spacing patterns (single source) prevent per-page padding accumulation
5. CSS-only milestones are fast and low-risk — high visual impact with zero functional regressions
