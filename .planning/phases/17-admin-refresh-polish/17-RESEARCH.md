# Phase 17: Admin Refresh & Polish - Research

**Researched:** 2026-03-22
**Domain:** Design token unification, comparison table UX, mobile responsive audit, regression testing
**Confidence:** HIGH

## Summary

Phase 17 is a polishing phase with no new features. The work divides into four clearly bounded tasks: (1) applying v2.0 design tokens to admin dashboard pages, (2) adding visual highlighting to comparison tables, (3) auditing all Phase 13-16 redesigned pages at 375px viewport, and (4) running regression tests to ensure the full demo flow works end-to-end.

The codebase is mature with 50 test files (439 tests) all passing, a clean `yarn build`, and well-established Tailwind CSS variable patterns in `globals.css`. The admin pages use a mix of semantic tokens (`bg-muted`, `text-foreground`) and hardcoded Tailwind classes (`bg-slate-50`, `text-slate-500`, `bg-blue-100`). The comparison table already has `getBestIndex()` / `betterIs` logic but lacks visual cell-level highlighting. Mobile layouts exist for most admin pages but were built for v1.0 and may not match the v2.0 design language.

**Primary recommendation:** Work in four sequential tasks: admin token unification (CSS-only changes to admin components), comparison highlighting (minimal logic + style changes), mobile audit (systematic 375px viewport check with CSS fixes), and regression verification (vitest + build + manual demo walkthrough).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Admin dashboard: apply v2.0 color/typography tokens from `globals.css` K Car layout tokens -- reuse existing CSS variable system
- Admin sidebar structure: MAINTAIN existing layout -- color/font updates ONLY (no layout changes)
- Admin layout already `use client` -- no Server Component conversion needed
- Apply targets: admin-sidebar.tsx, dashboard stats-cards/chart-section, data table headers/cells
- Verify that Tailwind CSS variables (globals.css) v2.0 tokens naturally inherit to admin, apply explicit tokens where needed
- Compare dialog: `betterIs` logic already implemented -- ADD VISUAL HIGHLIGHTING ONLY
- Comparison cell highlighting: `bg-green-50/bg-red-50` (or design token colors) for better/worse
- Apply same highlighting to both compare-dialog.tsx AND /vehicles/compare/page.tsx
- Highlight only rows where values differ (same values get no highlight)
- Spec rows: price, year, mileage, monthly rental, monthly lease, fuel, transmission, color, warranty
- Mobile audit: 375px viewport, systematic check of ALL Phase 13-16 redesigned pages
- Target pages: home, search/listing, vehicle detail, compare, calculator, inquiry, rental/lease, sell
- Breakage criteria: horizontal scroll, text truncation, button touch area < 44px, image overflow
- Discovered issues fixed immediately via CSS/Tailwind responsive classes
- Admin pages included in mobile audit but desktop-first -- fix critical only
- Demo flow: Home -> Search -> Detail -> Contract -> PDF generation
- Verify redesigned components render correctly at each step
- Test with existing 9 demo accounts (admin/dealer/customer roles)
- PDF: check build success only (Vercel serverless timeout known issue)
- Regression: existing vitest unit tests + yarn build success

### Claude's Discretion
- Admin sidebar specific token values (map from bg-background/text-foreground to v2.0 tokens)
- Comparison table highlighting exact colors (reference design-tokens from globals.css)
- Mobile audit CSS fix scope (driven by actual audit findings)
- Regression test coverage expansion range (based on existing 439+ tests)
- Vehicle detail page mobile layout fine-tuning

### Deferred Ideas (OUT OF SCOPE)
- Kakao Maps branch locations (MAP-01)
- Actual eKYC/e-signature integration (EXT-02, EXT-03)
- AI vehicle recommendations
- Reverse auction comparison quotes (HeyDealer style)
- Real-time chat
- Capacitor mobile app
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMIN-01 | Admin dashboard design language unification -- apply new color/typography tokens | Hardcoded color audit identifies 40+ instances across 8 admin files needing semantic token replacement; globals.css already defines sidebar-* tokens that admin-sidebar.tsx uses correctly |
| ADMIN-02 | Comparison table improvement -- side-by-side spec comparison + visual difference highlighting | Existing `getBestIndex()` + `betterIs` logic in compare-dialog.tsx handles winner detection; compare/page.tsx COMPARE_FIELDS lacks highlighting entirely; both need cell-level bg color |
| ADMIN-03 | Full redesigned page mobile responsive verification (375px viewport) | 9 public pages + admin pages identified; Playwright e2e infrastructure exists with chromium config; systematic audit checklist defined |
| ADMIN-04 | Demo flow re-verification -- contract application -> PDF generation regression test | Existing demo-flow.spec.ts covers landing/search/detail/admin; 439 vitest tests pass; yarn build clean; PDF timeout is known v1.0 blocker |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15 | App Router framework | Project foundation |
| Tailwind CSS | 4 | Utility-first styling with CSS variables | All token changes via globals.css |
| vitest | 4.0.18 | Unit test runner | 439 existing tests, happy-dom env |
| Playwright | (installed) | E2E testing | Existing demo-flow.spec.ts + 4 scenario specs |

### Supporting (No New Installs)
No new packages required. Phase 17 is CSS/style changes + testing only.

## Architecture Patterns

### Admin Token Unification Pattern

The admin pages use two color systems that need reconciliation:

**Current state -- hardcoded Tailwind colors in admin:**
```
bg-slate-50, bg-slate-100, text-slate-400, text-slate-500, text-slate-600
bg-blue-50, bg-blue-100, text-blue-600, text-blue-700, text-blue-800
bg-white, hover:bg-blue-50/40, hover:bg-slate-50
bg-green-100, text-green-700
bg-violet-100, text-violet-800
```

**Target state -- semantic tokens from globals.css:**
```
bg-slate-50    -> bg-muted/50 or bg-secondary
text-slate-500 -> text-muted-foreground
bg-blue-100    -> bg-accent/10
text-blue-700  -> text-accent
bg-white       -> bg-card or bg-background
hover:bg-slate-50 -> hover:bg-muted/50
```

**Files requiring token updates (8 files, ~40 instances):**

| File | Hardcoded Instances | Priority |
|------|-------------------|----------|
| `src/app/admin/users/page.tsx` | ~18 (table headers, cells, avatars, badges) | HIGH |
| `src/features/vehicles/components/vehicle-table.tsx` | ~12 (table headers, rows, pagination) | HIGH |
| `src/app/admin/dashboard/recent-activity.tsx` | ~6 (row alternation, hover, badges) | HIGH |
| `src/app/admin/dashboard/stats-cards.tsx` | ~4 (icon bg/color -- KEEP as accent colors) | MEDIUM |
| `src/app/admin/dashboard/recharts-bar.tsx` | ~2 (axis ticks, grid stroke) | LOW |
| `src/features/contracts/components/admin-contract-list.tsx` | ~4 (type badges) | MEDIUM |
| `src/app/admin/users/deactivate-button.tsx` | ~1 (deactivated badge) | LOW |
| `src/features/vehicles/components/status-badge.tsx` | Check individually | LOW |

**Key insight:** The admin sidebar (`admin-sidebar.tsx`) already uses semantic `sidebar-*` tokens correctly. The layout (`admin/layout.tsx`) also uses semantic tokens. The problem is concentrated in data tables and dashboard cards.

**Stats card exception:** The four stats cards use distinct colors (blue, emerald, violet, amber) intentionally for visual differentiation. These should be KEPT as-is because they serve a functional color-coding purpose, not a branding one.

### Comparison Highlighting Pattern

**compare-dialog.tsx (existing betterIs logic):**
```typescript
// Already implemented -- getBestIndex returns winner index
const bestIdx = getBestIndex(values, row.betterIs)

// Current styling -- accent color for winner only:
bestIdx === idx ? 'bg-accent/5 font-semibold text-accent' : 'text-foreground'

// Target -- add loser highlighting:
// Winner: bg-green-50 text-green-700 font-semibold (or bg-badge-success/10)
// Loser:  bg-red-50 text-red-700 (or bg-destructive/10)
// Same/null: no highlight
```

**compare/page.tsx (NO highlighting currently):**
The full-page comparison table uses a `<table>` with COMPARE_FIELDS but has zero highlighting logic. Needs:
1. Add getBestIndex-equivalent logic (reuse from compare-dialog or extract shared utility)
2. Apply cell-level bg colors for winner/loser
3. Additional spec rows beyond current 5: fuel, transmission, color, warranty period

**Shared utility extraction pattern:**
```typescript
// src/features/vehicles/lib/compare-utils.ts
export type CompareDirection = 'lower' | 'higher'

export function getBestIndex(
  values: (string | number | null)[],
  betterIs?: CompareDirection
): number | null { /* ... */ }

export function getCompareClass(
  idx: number, bestIdx: number | null, totalValid: number
): string {
  if (bestIdx === null) return ''
  if (idx === bestIdx) return 'bg-green-50 font-semibold text-green-700'
  return 'bg-red-50 text-red-700'
}
```

### Mobile Audit Systematic Checklist

**Pages to audit (9 public + admin dashboard):**

| Page | Route | Phase | Key Components |
|------|-------|-------|---------------|
| Homepage | `/` | 16 | HeroBanner, QuickLinks, RecommendedVehicles, PromoBanners |
| Search/Listing | `/vehicles` | 15 | SearchFilters (Sheet mobile), VehicleListClient, InfiniteScroll |
| Vehicle Detail | `/vehicles/[id]` | 14 | Gallery, PriceSection, Options, Diagnosis, Sidebar |
| Compare | `/vehicles/compare` | 15 | CompareTable (overflow-x-auto), FloatingBar |
| Calculator | `/calculator` | v1.0 | PricingCalculator |
| Inquiry | `/inquiry` | v1.0 | InquiryForm |
| Rental/Lease | `/rental-lease` | v1.0 | Redirect page |
| Sell | `/sell` | 16 | SellHero, Bonus, Process, FAQ |
| Admin Dashboard | `/admin/dashboard` | v1.0 | StatsCards, Charts, RecentActivity |

**375px breakage criteria:**
1. **Horizontal scroll**: `overflow-x` on body or main container
2. **Text truncation**: Important text cut off without ellipsis
3. **Touch targets**: Buttons/links < 44x44px touch area
4. **Image overflow**: Images wider than viewport
5. **Layout collapse**: Flex/grid items not wrapping properly

**Audit method:** Playwright script with 375px viewport width, screenshot each page, then manual review. Fixes are CSS-only (Tailwind responsive classes).

### Regression Test Strategy

**Existing infrastructure:**
- 50 test files, 439 tests (all passing)
- vitest 4.0.18 + happy-dom
- Playwright with chromium (demo-flow.spec.ts + 4 scenario specs)
- `yarn build` clean

**Regression layers:**
1. `yarn test` -- all 439 unit tests must pass
2. `yarn build` -- production build must succeed
3. `yarn type-check` -- TypeScript compilation clean
4. Manual demo flow walkthrough (only needed if Supabase is active):
   - Home -> `/vehicles` -> `/vehicles/[id]` -> Contract -> PDF
   - Admin login -> Dashboard -> Vehicles -> Contracts

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color token mapping | Manual find-and-replace | Systematic file-by-file token audit | Too many instances to safely batch-replace |
| Mobile viewport testing | Manual browser resize | Playwright 375px viewport script | Repeatable, screenshotable, automated |
| Compare highlighting logic | New getBestIndex per component | Extract shared compare-utils.ts | DRY principle, consistent behavior |
| Regression testing | Custom test runner | Existing vitest + yarn build | Already 439 tests covering core functionality |

## Common Pitfalls

### Pitfall 1: Breaking Stats Card Visual Hierarchy
**What goes wrong:** Replacing ALL hardcoded colors with semantic tokens makes the 4 stats cards (blue/emerald/violet/amber) look identical.
**Why it happens:** Aggressive token replacement doesn't distinguish functional color-coding from branding colors.
**How to avoid:** Keep stats-cards.tsx `borderColor`, `bg`, `color`, `iconRing` as-is. Only update text colors that should be semantic (e.g., `text-muted-foreground` for labels).
**Warning signs:** All 4 cards look the same shade.

### Pitfall 2: Comparison Highlight Without Null Safety
**What goes wrong:** Highlighting logic crashes or highlights incorrectly when values are null/undefined (e.g., no monthly rental set).
**Why it happens:** `betterIs` comparison on null values causes NaN/false positives.
**How to avoid:** The existing `getBestIndex` already filters nulls with `validValues.length < 2` guard. Maintain this pattern in compare/page.tsx port.
**Warning signs:** Cells with "--" text getting green/red background.

### Pitfall 3: Admin Table Header Token Creates Dark Mode Regression
**What goes wrong:** Replacing `bg-slate-50` table headers with `bg-muted/50` changes dark mode appearance unexpectedly.
**Why it happens:** The admin doesn't have a dark mode toggle, but `bg-muted` resolves to `hsl(220 25% 18%)` in `.dark` scope.
**How to avoid:** The project doesn't implement dark mode switching (no toggle exists). Use semantic tokens which default to light mode `:root` values. Dark mode is defined but not activated.
**Warning signs:** None (dark mode is inactive).

### Pitfall 4: Mobile Audit Scope Creep
**What goes wrong:** Finding dozens of mobile issues leads to endless CSS fixes that delay the phase.
**Why it happens:** Polishing is unbounded -- there's always more to fix.
**How to avoid:** Classify issues as CRITICAL (horizontal scroll, broken layout) vs MINOR (spacing, alignment). Fix CRITICAL only in Phase 17. Log MINOR for future work.
**Warning signs:** Spending more than 30 minutes on a single mobile CSS fix.

### Pitfall 5: Compare Page Max Vehicles Mismatch
**What goes wrong:** compare/page.tsx still shows `comparison.length < 4` for the "add more" slot, but store MAX_COMPARISON is 3.
**Why it happens:** The compare page was written before Phase 15 reduced max from 4 to 3. The `< 4` check was never updated.
**How to avoid:** Fix during ADMIN-02 by changing to `comparison.length < MAX_COMPARISON` (import from store or use constant 3).
**Warning signs:** 4th empty slot shown when only 3 is max.

## Code Examples

### Token Replacement Pattern (Admin Table Headers)

**Before:**
```typescript
// src/app/admin/users/page.tsx
<TableHeader className="bg-slate-50">
  <TableRow className="hover:bg-slate-50">
    <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-500">
      이름
    </TableHead>
```

**After:**
```typescript
<TableHeader className="bg-muted/50">
  <TableRow className="hover:bg-muted/50">
    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      이름
    </TableHead>
```

### Token Replacement Pattern (Row Alternation)

**Before:**
```typescript
// recent-activity.tsx
className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
```

**After:**
```typescript
className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
```

### Comparison Highlighting (compare-dialog.tsx Enhancement)

**Before:**
```typescript
className={`flex-1 px-3 py-2.5 text-center text-sm ${
  bestIdx === idx
    ? 'bg-accent/5 font-semibold text-accent'
    : 'text-foreground'
}`}
```

**After:**
```typescript
className={`flex-1 px-3 py-2.5 text-center text-sm ${
  bestIdx === null
    ? 'text-foreground'
    : bestIdx === idx
      ? 'bg-green-50 font-semibold text-green-700'
      : typeof values[idx] === 'number'
        ? 'bg-red-50 text-red-600'
        : 'text-foreground'
}`}
```

### Compare Page Highlighting (compare/page.tsx Addition)

**Current (no highlighting):**
```typescript
{comparison.map((vehicle) => {
  const value = vehicle[field.key as keyof typeof vehicle]
  return (
    <td key={vehicle.id} className="px-4 py-3 text-center">
      <span className={`text-sm ${isPrice && value ? 'font-bold text-accent' : 'font-medium'}`}>
        {field.format(value as never)}
      </span>
    </td>
  )
})}
```

**Target (with highlighting):**
```typescript
{comparison.map((vehicle, idx) => {
  const value = vehicle[field.key as keyof typeof vehicle]
  const bestIdx = getBestIndex(
    comparison.map(v => v[field.key as keyof typeof v] as number | null),
    field.betterIs
  )
  const highlightClass = bestIdx === null
    ? ''
    : bestIdx === idx
      ? 'bg-green-50'
      : typeof value === 'number' ? 'bg-red-50' : ''
  return (
    <td key={vehicle.id} className={`px-4 py-3 text-center ${highlightClass}`}>
      <span className={`text-sm ${bestIdx === idx ? 'font-bold text-green-700' : 'font-medium'}`}>
        {field.format(value as never)}
      </span>
    </td>
  )
})}
```

### Playwright Mobile Audit Script Pattern

```typescript
// tests/e2e/mobile-audit.spec.ts
import { test, expect } from '@playwright/test'

const MOBILE_VIEWPORT = { width: 375, height: 812 }

const PAGES = [
  '/',
  '/vehicles',
  '/vehicles/compare',
  '/calculator',
  '/inquiry',
  '/sell',
]

test.use({ viewport: MOBILE_VIEWPORT })

test.describe('Mobile 375px Audit', () => {
  for (const path of PAGES) {
    test(`${path} has no horizontal overflow`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const clientWidth = await page.evaluate(() => document.body.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // 1px tolerance
    })
  }
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded Tailwind colors | CSS variable tokens via @theme inline | Phase 13 (v2.0) | Public pages already migrated; admin pages still on old approach |
| No comparison highlighting | betterIs logic in compare-dialog | Phase 15 | Logic exists, visual highlighting incomplete |
| Manual responsive testing | Playwright viewport automation | Available from v1.0 | E2E infrastructure in place but not used for responsive audit |

## Open Questions

1. **Supabase paused state**
   - What we know: Phase 14-05 was verified code-level only due to Supabase being paused
   - What's unclear: Whether demo flow walkthrough can be done with live data
   - Recommendation: Verify with `yarn build` + `yarn test` + type-check. If Supabase is active, add manual walkthrough. If paused, accept build-level verification.

2. **Compare page extended spec rows**
   - What we know: CONTEXT says to add fuel, transmission, color, warranty to compare rows
   - What's unclear: VehicleSummary type only has id/brand/model/year/mileage/price/rental/lease -- no fuel/transmission/color/warranty fields
   - Recommendation: Extended rows require either expanding VehicleSummary type or displaying "N/A". Since ADMIN-02 says "visual highlighting only" on existing betterIs logic, focus on highlighting existing fields. If extended rows are needed, they need VehicleSummary type expansion.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 + happy-dom |
| Config file | vitest.config.mts |
| Quick run command | `yarn test` |
| Full suite command | `yarn test && yarn build && yarn type-check` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMIN-01 | Admin pages use semantic tokens | unit | `yarn test tests/unit/features/component-foundation/design-tokens.test.ts -x` | Partial (tests globals.css tokens, not admin file usage) |
| ADMIN-01 | Build succeeds after token changes | smoke | `yarn build` | N/A (build script) |
| ADMIN-02 | Comparison highlighting renders correctly | unit | `yarn test tests/unit/features/vehicles/vehicle-interaction-store.test.ts -x` | Partial (tests store, not UI rendering) |
| ADMIN-03 | No horizontal overflow at 375px | e2e | `yarn test:e2e tests/e2e/mobile-audit.spec.ts` | Wave 0 |
| ADMIN-04 | Demo flow renders without errors | e2e | `yarn test:e2e tests/e2e/demo-flow.spec.ts` | Existing |
| ADMIN-04 | All existing tests pass | unit | `yarn test` | Existing (439 tests) |
| ADMIN-04 | Production build succeeds | smoke | `yarn build` | N/A (build script) |

### Sampling Rate
- **Per task commit:** `yarn test && yarn type-check`
- **Per wave merge:** `yarn test && yarn build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/e2e/mobile-audit.spec.ts` -- covers ADMIN-03 (375px viewport horizontal overflow check)
- [ ] Consider extending `tests/unit/features/component-foundation/design-tokens.test.ts` to verify admin files don't use hardcoded slate/blue colors -- covers ADMIN-01

*(Existing demo-flow.spec.ts and 439 unit tests cover ADMIN-04 regression requirements)*

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- direct file reads of all 8 admin files, 2 compare files, globals.css, vitest config
- `src/app/globals.css` -- complete token system with :root, .dark, @theme inline, sidebar-* tokens
- `src/app/admin/` -- 28 files across dashboard, vehicles, contracts, users, inventory, settings, residual-value
- `src/features/vehicles/components/compare-dialog.tsx` -- getBestIndex + betterIs pattern
- `src/app/(public)/vehicles/compare/page.tsx` -- COMPARE_FIELDS without highlighting

### Secondary (MEDIUM confidence)
- Test suite run (`yarn test`) -- 50 files, 439 tests, all passing
- Build verification (`yarn build`) -- clean production build
- Playwright config -- chromium, localhost:3000, existing 5 e2e spec files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing tooling
- Architecture: HIGH -- patterns verified by reading actual source code in all 8+ admin files
- Pitfalls: HIGH -- identified from actual hardcoded color instances (40+ across files) and existing compare logic
- Mobile audit: MEDIUM -- scope depends on actual findings at 375px; strategy is well-defined
- Regression: HIGH -- existing 439 tests + clean build provide strong baseline

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- polishing phase with no external dependencies)
