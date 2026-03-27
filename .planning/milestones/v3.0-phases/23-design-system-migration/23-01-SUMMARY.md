---
phase: 23-design-system-migration
plan: 01
subsystem: ui
tags: [accessibility, wcag, focus-visible, reduced-motion, dark-mode, tailwind, css]

# Dependency graph
requires:
  - phase: 21-infrastructure-foundation
    provides: 9 brand CSS tokens defined in globals.css with dark mode values
provides:
  - Global prefers-reduced-motion CSS reset (WCAG 2.3.3)
  - Homepage semantic h1 element (WCAG 1.3.1)
  - Verified dark mode token completeness (all 9 brand tokens)
  - focus-visible:ring on all 33 non-shadcn interactive elements (WCAG 2.4.7)
affects: [23-design-system-migration, 24-performance-optimization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 for keyboard focus"
    - "prefers-reduced-motion: reduce global CSS reset in @layer base"
    - "sr-only h1 for pages with visual hero sections"

key-files:
  created: []
  modified:
    - src/app/globals.css
    - src/app/(public)/page.tsx
    - src/features/marketing/components/hero-section.tsx
    - src/features/marketing/components/hero-search-box.tsx
    - src/features/marketing/components/sell-my-car-sections.tsx
    - src/features/inventory/components/quote-builder.tsx
    - src/features/admin/components/vehicle-edit-sheet.tsx
    - src/features/vehicles/components/vehicle-search-bar.tsx
    - src/features/vehicles/components/public-vehicle-detail.tsx
    - src/features/pricing/components/pricing-calculator.tsx
    - src/features/settings/components/settings-auth-gate.tsx
    - src/features/contracts/components/admin-contract-list.tsx

key-decisions:
  - "Used focus-visible (not focus) for ring styles to avoid showing ring on mouse clicks"
  - "Used brand-blue token for focus ring color to maintain design system consistency"
  - "Kept existing focus:border-* rules alongside new focus-visible:ring for visual continuity"

patterns-established:
  - "WCAG focus pattern: outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
  - "Reduced motion: Global @media query in @layer base disables all animations/transitions"

requirements-completed: [DS-04, DS-05, DS-06, DS-07]

# Metrics
duration: 7min
completed: 2026-03-27
---

# Phase 23 Plan 01: Accessibility & Dark Mode Summary

**WCAG AA focus-visible rings on 33 interactive elements, global prefers-reduced-motion reset, homepage h1, and verified dark mode tokens**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-27T06:03:56Z
- **Completed:** 2026-03-27T06:10:34Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Added global `@media (prefers-reduced-motion: reduce)` CSS reset that disables all animations, transitions, and scroll behavior
- Added semantic `<h1>` element (visually hidden via sr-only) to homepage for WCAG 1.3.1 heading hierarchy
- Verified all 9 brand design tokens have dark mode values in `.dark` selector
- Replaced 33 bare `outline-none` instances across 10 component files with `focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2`
- Build and type-check pass cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Add global reduced-motion CSS + homepage h1 + dark mode token audit** - `c05ec3e` (feat)
2. **Task 2: Replace outline-none with focus-visible ring on all 33 unprotected elements** - `ee26dd3` (feat)

## Files Created/Modified
- `src/app/globals.css` - Added prefers-reduced-motion global reset in @layer base
- `src/app/(public)/page.tsx` - Added sr-only h1 for WCAG heading hierarchy
- `src/features/marketing/components/hero-section.tsx` - 4 selects: focus-visible:ring added
- `src/features/marketing/components/hero-search-box.tsx` - 4 selects: focus-visible:ring added
- `src/features/marketing/components/sell-my-car-sections.tsx` - 1 input: focus-visible:ring added
- `src/features/inventory/components/quote-builder.tsx` - 6 form elements: focus-visible:ring added
- `src/features/admin/components/vehicle-edit-sheet.tsx` - 6 form elements: focus-visible:ring added
- `src/features/vehicles/components/vehicle-search-bar.tsx` - 1 input: focus-visible:ring added
- `src/features/vehicles/components/public-vehicle-detail.tsx` - 1 input: focus-visible:ring added
- `src/features/pricing/components/pricing-calculator.tsx` - 1 input: focus-visible:ring added
- `src/features/settings/components/settings-auth-gate.tsx` - 1 input: focus-visible:ring added
- `src/features/contracts/components/admin-contract-list.tsx` - 1 textarea: focus-visible:ring added

## Decisions Made
- Used `focus-visible` instead of `focus` for ring styles -- ensures focus ring only shows on keyboard navigation, not mouse clicks (per WCAG 2.4.7 best practices)
- Used `brand-blue` token for all focus rings to maintain design system consistency across light and dark modes
- Retained existing `focus:border-*` rules alongside new `focus-visible:ring` for visual continuity during the migration
- Files that already had proper `focus-visible:ring` patterns (promotion-banner, event-banners, brand-filter-client, residual-value-form, floating-cta) were left unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Accessibility foundation complete for all interactive elements
- Dark mode tokens verified ready for future toggle implementation
- Next plans (23-02 through 23-04) can proceed with token migration and component cleanup

## Self-Check: PASSED

All 12 modified files verified present. Both task commits (c05ec3e, ee26dd3) verified in git log.

---
*Phase: 23-design-system-migration*
*Completed: 2026-03-27*
