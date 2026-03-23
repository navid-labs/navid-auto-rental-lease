# Phase 20: Detail Page Spacing - Research

**Researched:** 2026-03-23
**Domain:** CSS layout spacing, breadcrumb navigation, Tailwind CSS 4, vehicle detail page structure
**Confidence:** HIGH

## Summary

Phase 20 addresses three spacing and layout requirements on the vehicle detail page (`/vehicles/[id]`). The page currently uses `vehicle-detail-page.tsx` as its main client component, rendered inside a `-mt-6` wrapper (established in Phase 18 for edge-to-edge gallery). There are three specific changes needed: (1) add a breadcrumb trail between the navigation bar and the gallery with 24px separation, (2) change the similar vehicles recommendation grid from 4-column to 3-column on desktop, and (3) unify the vertical gap between information section cards to 32px.

All changes are localized to 2 files: the server page component (`src/app/(public)/vehicles/[id]/page.tsx`) and the client detail component (`src/features/vehicles/components/detail/vehicle-detail-page.tsx`). The `BreadcrumbNav` component already exists and is used on 6 other pages. No new libraries or components are needed.

The key architectural decision is how to handle the breadcrumb insertion while preserving the edge-to-edge gallery. Currently, the page uses `-mt-6` to bleed the gallery into the layout's `pt-6` padding. Adding a breadcrumb means the gallery should no longer be flush with the nav -- the breadcrumb becomes the first visible element below the nav, with the layout's existing `pt-6` (24px) providing the gap above it.

**Primary recommendation:** Remove the `-mt-6` wrapper on the detail page (letting the layout's `pt-6` provide 24px above the breadcrumb), add `BreadcrumbNav` before `VehicleDetailPage`, add `mb-6` (24px) below the breadcrumb, then change `lg:grid-cols-4` to `lg:grid-cols-3` on similar vehicles and `lg:space-y-10` to `space-y-8` (32px uniform) on section cards.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DETL-01 | Breadcrumb trail between nav bar and gallery with 24px spacing | Remove `-mt-6` wrapper, add `BreadcrumbNav` component (already exists), layout `pt-6` provides 24px top gap. See Breadcrumb Insertion Strategy. |
| DETL-02 | Similar vehicles grid from 4-col to 3-col | Line 198 of `vehicle-detail-page.tsx`: `lg:grid-cols-4` -> `lg:grid-cols-3`. Direct class change matching Phase 19 homepage pattern. |
| DETL-03 | Section cards vertical gap unified to 32px | Line 114 of `vehicle-detail-page.tsx`: `space-y-8 py-6 lg:space-y-10` -> `space-y-8 py-6` (remove `lg:space-y-10`). `space-y-8` = 32px at all breakpoints. |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase only modifies existing Tailwind CSS classes and adds usage of an existing component.

### Core (Already Installed)
| Library | Version | Purpose | Relevance |
|---------|---------|---------|-----------|
| tailwindcss | 4.x | Utility-first CSS | All spacing changes use Tailwind classes |
| next | 15.x | App Router | Server page component renders breadcrumb |

**No installation required.**

## Architecture Patterns

### Current Detail Page Structure

```
/vehicles/[id]/page.tsx (Server Component)
  <div className="-mt-6 pb-safe">          <- edge-to-edge override from Phase 18
    <VehicleDetailPage                      <- Client component
      vehicle={...}
      similarVehicles={...}
    />
  </div>

VehicleDetailPage (Client Component)
  <div className="mx-auto max-w-7xl">
    <SectionGallery />                      <- Category tabs + Embla carousel + lightbox
    <StickyTabNav />                        <- Sticky section navigation (top-16)
    <div className="flex gap-8 ...">        <- 7:3 content + sidebar split
      <div className="space-y-8 py-6 lg:space-y-10">  <- SECTION CARDS
        <section id="price">...</section>
        <section id="basic-info">...</section>
        <section id="options">...</section>
        <section id="body-diagram">...</section>
        <section id="diagnosis">...</section>
        <section id="history">...</section>
        <section id="warranty">...</section>
        <section id="home-service">...</section>
        <section id="reviews-faq">...</section>
        <section id="evaluator">...</section>
      </div>
      <div className="hidden w-[340px] lg:block">  <- Sidebar
        <StickySidebar />
      </div>
    </div>
    <section className="mt-12 ...">         <- SIMILAR VEHICLES
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">  <- 4-col grid
        ...VehicleCards
      </div>
    </section>
  </div>
```

### Breadcrumb Insertion Strategy (DETL-01)

**Current state:**
- Public layout provides `pt-6` (24px) on `<main>` (Phase 18)
- Detail page has `-mt-6` wrapper to counteract this, making gallery edge-to-edge
- No breadcrumb exists on the detail page

**Target state:**
- Breadcrumb appears between nav bar and gallery
- 24px gap above breadcrumb (between nav bottom and breadcrumb)
- 24px gap below breadcrumb (between breadcrumb and gallery tabs)

**Approach:**
1. Remove `-mt-6` from the wrapper in `/vehicles/[id]/page.tsx`
2. The layout's `pt-6` automatically provides 24px above the first element (breadcrumb)
3. Add `BreadcrumbNav` component with items: `[{ label: '내차사기', href: '/vehicles' }, { label: vehicleName }]`
4. `BreadcrumbNav` already has `mb-4` (16px). Need to increase to `mb-6` (24px) OR add spacing on the gallery side

**Two implementation options:**

**Option A (Recommended): Add breadcrumb in server page, above client component**

```tsx
// src/app/(public)/vehicles/[id]/page.tsx
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav'

return (
  <div className="pb-safe">
    <div className="mx-auto max-w-7xl px-4 lg:px-0">
      <BreadcrumbNav
        items={[
          { label: '내차사기', href: '/vehicles' },
          { label: vehicleName },
        ]}
      />
    </div>
    <VehicleDetailPage ... />
  </div>
)
```

This is cleaner because the breadcrumb is static content (no interactivity), so it can render as a Server Component, avoiding unnecessary client JS. The `BreadcrumbNav` component has `mb-4` built in. To get 24px total gap below the breadcrumb, we can either: (a) modify the breadcrumb's `mb-4` to `mb-6` for this instance, or (b) wrap the breadcrumb div with additional margin.

**Note on BreadcrumbNav's `mb-4`:** The component has `mb-4` (16px) hardcoded in its className. This is used site-wide. For DETL-01's 24px requirement, we need 24px between breadcrumb and gallery. Options:
- Override via wrapper: wrap in a `<div className="mb-2">` to add 8px -> 16 + 8 = 24px
- Alternatively, the BreadcrumbNav's `mb-4` (16px) plus the `SectionGallery`'s internal spacing already provides visual separation. The 24px specification is between the nav bar and the breadcrumb, not below the breadcrumb. The layout's `pt-6` (24px) already satisfies this.

**Recommended interpretation:** "24px of spacing separating them" refers to the gap between the nav bar bottom and the breadcrumb/gallery zone. The layout's `pt-6` = 24px satisfies this. The breadcrumb's built-in `mb-4` = 16px provides separation from the gallery below.

**Option B: Add breadcrumb inside VehicleDetailPage client component**

This would require passing `vehicleName` and brand/model data as props and rendering the breadcrumb client-side. Less optimal -- adds unnecessary client JS for static content.

**Recommendation:** Option A.

### Section Card Spacing Analysis (DETL-03)

**Current spacing (line 114 of vehicle-detail-page.tsx):**
```
<div className="min-w-0 flex-1 space-y-8 py-6 lg:space-y-10">
```

- Mobile/tablet: `space-y-8` = 32px between section cards
- Desktop (lg+): `space-y-10` = 40px between section cards

**Target:** Uniform 32px at all breakpoints.

**Change:** Remove `lg:space-y-10` to keep only `space-y-8` (32px) everywhere.

```
<div className="min-w-0 flex-1 space-y-8 py-6">
```

This is a single class removal. All 10 section cards will have exactly 32px vertical gap.

### Similar Vehicles Grid Analysis (DETL-02)

**Current grid (line 198 of vehicle-detail-page.tsx):**
```
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
```

- Mobile: 2 columns
- Desktop (lg+): 4 columns

**Target:** 3 columns on desktop, matching homepage pattern established in Phase 19 (HOME-02).

**Change:**
```
<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
```

**Note:** The section currently slices to 8 vehicles max (`similarVehicles.slice(0, 8)`). With a 3-column grid, 8 vehicles = 2 full rows + 2 orphan cards. Consider adjusting to 6 (`slice(0, 6)`) for 2 clean rows, or 9 for 3 rows. However, this is a data concern, not a spacing concern. The planner can decide whether to adjust the slice count.

### Exact Change Map

| File | Line | Current | Target | Requirement |
|------|------|---------|--------|-------------|
| `src/app/(public)/vehicles/[id]/page.tsx` | 109 | `<div className="-mt-6 pb-safe">` | `<div className="pb-safe">` (remove -mt-6) | DETL-01 |
| `src/app/(public)/vehicles/[id]/page.tsx` | 109-117 | No breadcrumb | Add `BreadcrumbNav` with max-w-7xl wrapper before `VehicleDetailPage` | DETL-01 |
| `src/features/vehicles/components/detail/vehicle-detail-page.tsx` | 114 | `space-y-8 py-6 lg:space-y-10` | `space-y-8 py-6` (remove lg:space-y-10) | DETL-03 |
| `src/features/vehicles/components/detail/vehicle-detail-page.tsx` | 198 | `grid grid-cols-2 gap-4 lg:grid-cols-4` | `grid grid-cols-2 gap-4 lg:grid-cols-3` | DETL-02 |

### Anti-Patterns to Avoid

- **Do NOT keep `-mt-6` after adding breadcrumb.** The `-mt-6` was added in Phase 18 specifically because the gallery was edge-to-edge. With a breadcrumb above the gallery, the layout's `pt-6` is now wanted (it creates the 24px nav-to-breadcrumb gap). Keeping `-mt-6` would push the breadcrumb behind the sticky header.
- **Do NOT add a second breadcrumb instance.** `public-vehicle-detail.tsx` is a legacy file that has a breadcrumb -- it is NOT used by the current route. Only add breadcrumb in the active server page or client component.
- **Do NOT modify the `BreadcrumbNav` component's built-in `mb-4` globally.** Other pages depend on its current 16px bottom margin. If 24px is needed below the breadcrumb on this page, use a wrapper or override.
- **Do NOT change `space-y-8` to a different value.** The requirement says 32px, and `space-y-8` = 32px in Tailwind. Only the desktop override (`lg:space-y-10` = 40px) needs removal.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Breadcrumb navigation | Custom breadcrumb component | `BreadcrumbNav` from `@/components/layout/breadcrumb-nav` | Already exists, tested, used on 6+ pages |
| Spacing tokens | CSS variable system for section gaps | Tailwind `space-y-8` class | Single class handles uniform gap |

**Key insight:** Every change in this phase is either a Tailwind class modification or adding an existing component import. Zero new code to write.

## Common Pitfalls

### Pitfall 1: Breadcrumb Hidden Behind Sticky Header
**What goes wrong:** Keeping `-mt-6` on the wrapper after adding the breadcrumb causes the breadcrumb to render behind (underneath) the sticky header, invisible to the user.
**Why it happens:** `-mt-6` pulls the content up 24px, exactly the amount that `pt-6` pushes it down. The breadcrumb renders in the 24px zone that overlaps with the sticky header.
**How to avoid:** Remove `-mt-6` when adding the breadcrumb. The layout `pt-6` is now desired.
**Warning signs:** Breadcrumb text not visible, or overlapping with the mega menu bar.

### Pitfall 2: Breadcrumb Width Mismatch With Gallery
**What goes wrong:** The breadcrumb wrapper uses a different max-width than the gallery, causing misalignment.
**Why it happens:** `VehicleDetailPage` uses `max-w-7xl` (1280px). The breadcrumb wrapper must match.
**How to avoid:** Use `mx-auto max-w-7xl px-4 lg:px-0` on the breadcrumb wrapper, matching the `VehicleDetailPage` container.
**Warning signs:** Breadcrumb text indented differently from the gallery/content below.

### Pitfall 3: Scroll Spy Offset After Removing -mt-6
**What goes wrong:** The `IntersectionObserver` in `useActiveSection` uses `rootMargin: '-80px 0px -60% 0px'`. Adding 24px content above the gallery shifts all section positions down by ~24px. The tab highlighting could activate slightly earlier/later.
**Why it happens:** The rootMargin was calibrated for the previous layout (gallery flush with nav). Now there is 24px more content above.
**How to avoid:** The 24px shift is small relative to the 80px rootMargin offset. It should not cause noticeable issues. However, verify scroll-spy behavior after the change by scrolling through sections and checking tab highlighting.
**Warning signs:** Wrong tab highlighted in the sticky nav while scrolling.

### Pitfall 4: StickyTabNav Top Offset After Layout Change
**What goes wrong:** `StickyTabNav` is `sticky top-16` (64px). After removing `-mt-6`, the sticky behavior still works because the tab nav is inside `VehicleDetailPage` which renders after the breadcrumb. No change needed.
**Why it happens:** Sticky positioning is relative to the scroll container, not the initial position. The `top-16` value matches the main header height.
**How to avoid:** No change needed. Just verify the tab nav still sticks correctly after the breadcrumb is added.
**Warning signs:** Tab nav not sticking at the right position during scroll.

### Pitfall 5: Similar Vehicles Orphan Cards
**What goes wrong:** With `lg:grid-cols-3` and 8 vehicles, the last row has 2 cards instead of 3, looking unbalanced.
**Why it happens:** 8 is not divisible by 3. Two orphan cards in the last row.
**How to avoid:** Consider changing `slice(0, 8)` to `slice(0, 6)` for 2 clean rows. However, this is an optional improvement -- the grid still works correctly with orphan cards. The requirement only specifies 3-column layout, not card count.
**Warning signs:** Last row of similar vehicles looks sparse with 2 cards and an empty space.

## Code Examples

### DETL-01: Add Breadcrumb and Remove Edge-to-Edge Override

```tsx
// src/app/(public)/vehicles/[id]/page.tsx
// BEFORE:
import { VehicleDetailPage } from '@/features/vehicles/components/detail/vehicle-detail-page'

return (
  <div className="-mt-6 pb-safe">
    <VehicleDetailPage
      vehicle={vehicle as unknown as VehicleDetailData}
      residualRate={residualRate}
      vehicleName={vehicleName}
      similarVehicles={similarVehicles as unknown as VehicleWithDetails[]}
    />
  </div>
)

// AFTER:
import { VehicleDetailPage } from '@/features/vehicles/components/detail/vehicle-detail-page'
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav'

const brand = vehicle.trim.generation.carModel.brand
const model = vehicle.trim.generation.carModel

return (
  <div className="pb-safe">
    <div className="mx-auto max-w-7xl px-4 lg:px-0">
      <BreadcrumbNav
        items={[
          { label: '내차사기', href: '/vehicles' },
          { label: `${brand.nameKo || brand.name} ${model.nameKo || model.name}` },
        ]}
      />
    </div>
    <VehicleDetailPage
      vehicle={vehicle as unknown as VehicleDetailData}
      residualRate={residualRate}
      vehicleName={vehicleName}
      similarVehicles={similarVehicles as unknown as VehicleWithDetails[]}
    />
  </div>
)
```

**Spacing math:**
- Layout `pt-6` = 24px above breadcrumb (satisfies "24px spacing" requirement)
- BreadcrumbNav `mb-4` = 16px below breadcrumb to gallery tabs
- Total nav-to-gallery = 24px + breadcrumb height (~20px) + 16px = ~60px visual separation

### DETL-02: Similar Vehicles 3-Column Grid

```tsx
// src/features/vehicles/components/detail/vehicle-detail-page.tsx
// BEFORE (line 198):
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

// AFTER:
<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
```

### DETL-03: Uniform 32px Section Card Spacing

```tsx
// src/features/vehicles/components/detail/vehicle-detail-page.tsx
// BEFORE (line 114):
<div className="min-w-0 flex-1 space-y-8 py-6 lg:space-y-10">

// AFTER:
<div className="min-w-0 flex-1 space-y-8 py-6">
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No breadcrumb on detail page, gallery flush with nav | Breadcrumb trail with 24px nav gap | This phase | User sees navigation context (Home > Search > Vehicle) |
| 4-col similar vehicles grid | 3-col grid matching homepage | This phase | Consistent card size with homepage; more breathing room |
| 32px mobile / 40px desktop section gaps | Uniform 32px at all breakpoints | This phase | Consistent visual rhythm regardless of screen size |

**Patterns from prior phases used here:**
- Phase 18 established `-mt-6` pattern; this phase removes it for the detail page
- Phase 18 established layout-level `pt-6`; this phase relies on it for breadcrumb top gap
- Phase 19 established 3-col grid pattern; this phase applies it to similar vehicles

## Open Questions

1. **Similar vehicles slice count**
   - What we know: Currently `slice(0, 8)` shows up to 8 vehicles. With 3 columns, 8 = 2.67 rows (2 orphans).
   - What's unclear: Should we adjust to 6 (2 rows) or 9 (3 rows) for clean grid alignment?
   - Recommendation: Change to `slice(0, 6)` for cleaner presentation. But this is optional -- the planner can decide.

2. **BreadcrumbNav bottom margin sufficiency**
   - What we know: `BreadcrumbNav` has `mb-4` (16px). The success criteria says "24px of spacing separating [nav bar and gallery]" -- this likely refers to the gap between nav bar bottom and the content start (which the layout `pt-6` provides).
   - What's unclear: Does "24px" refer to nav-to-breadcrumb gap (provided by layout `pt-6`) or breadcrumb-to-gallery gap (provided by `mb-4`)?
   - Recommendation: The layout `pt-6` = 24px satisfies nav-to-breadcrumb. The `mb-4` = 16px below breadcrumb is reasonable for breadcrumb-to-gallery. If 24px is needed below the breadcrumb too, add `mb-2` wrapper (8px extra) to reach 24px total.

3. **Brand name field access in server component**
   - What we know: The brand and model data is deeply nested: `vehicle.trim.generation.carModel.brand`. The `brand` object has both `name` and optional `nameKo` fields.
   - What's unclear: Whether `nameKo` is always populated in the database.
   - Recommendation: Use `nameKo || name` pattern (already used in `vehicle-card.tsx` and `public-vehicle-detail.tsx`). This is safe.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.x + happy-dom |
| Config file | `vitest.config.mts` |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DETL-01 | Breadcrumb renders on detail page; -mt-6 removed | manual-only | Visual inspection (server component rendering cannot be tested with happy-dom) | N/A |
| DETL-02 | Similar vehicles grid uses 3-col layout on desktop | unit | `yarn test tests/unit/features/vehicles/detail-grid.test.tsx` | No -- Wave 0 |
| DETL-03 | Section cards have uniform space-y-8 (no lg:space-y-10) | unit | `yarn test tests/unit/features/vehicles/detail-spacing.test.tsx` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn type-check`
- **Per wave merge:** `yarn test && yarn type-check`
- **Phase gate:** Full suite green + visual verification of detail page (breadcrumb visible, section spacing uniform, similar vehicles 3-col)

### Wave 0 Gaps
- [ ] `tests/unit/features/vehicles/detail-grid.test.tsx` -- render VehicleDetailPage similar vehicles section, assert `lg:grid-cols-3` present and `lg:grid-cols-4` absent
- [ ] `tests/unit/features/vehicles/detail-spacing.test.tsx` -- render VehicleDetailPage content area, assert `space-y-8` present and `lg:space-y-10` absent

*(Note: DETL-01 involves a Server Component change (adding breadcrumb import + removing -mt-6). This cannot be meaningfully tested with happy-dom which only handles client components. Visual verification is the primary validation for DETL-01.)*

## Sources

### Primary (HIGH confidence)
- **Codebase audit** -- direct reading of all files involved:
  - `src/app/(public)/vehicles/[id]/page.tsx` -- server page component (lines 108-118, -mt-6 wrapper)
  - `src/features/vehicles/components/detail/vehicle-detail-page.tsx` -- client detail component (line 114: space-y-8 lg:space-y-10, line 198: lg:grid-cols-4)
  - `src/features/vehicles/components/detail/section-gallery.tsx` -- gallery structure
  - `src/features/vehicles/components/detail/sticky-tab-nav.tsx` -- sticky nav (top-16, h-12)
  - `src/components/layout/breadcrumb-nav.tsx` -- existing breadcrumb component (mb-4)
  - `src/app/(public)/layout.tsx` -- public layout (pt-6 on main)
- **Phase 18 SUMMARY** -- established patterns: layout pt-6, -mt-6 edge-to-edge override
- **Phase 19 SUMMARY** -- established 3-col grid pattern for homepage

### Secondary (MEDIUM confidence)
- None

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, pure CSS class changes + existing component import
- Architecture: HIGH -- full codebase audit of all 6 affected files, exact line numbers identified
- Pitfalls: HIGH -- identified from direct code analysis; scroll-spy offset and breadcrumb alignment are concrete risks

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable -- pure CSS + component composition, no API changes)
