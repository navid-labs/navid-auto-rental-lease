---
phase: 20-detail-page-spacing
plan: 01
subsystem: ui
tags: [breadcrumb, spacing, grid, tailwind, vehicle-detail]

# Dependency graph
requires:
  - phase: 18-global-spacing
    provides: pt-6 layout padding and -mt-6 override pattern
provides:
  - Breadcrumb navigation on vehicle detail page (Home > 내차사기 > Brand Model)
  - 3-column similar vehicles grid on desktop with 6 vehicles
  - Uniform 32px section card spacing at all breakpoints
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Breadcrumb uses nameKo || name pattern for Korean brand/model names"
    - "mx-auto max-w-7xl px-4 lg:px-0 wrapper for breadcrumb to match content width"

key-files:
  created: []
  modified:
    - src/app/(public)/vehicles/[id]/page.tsx
    - src/features/vehicles/components/detail/vehicle-detail-page.tsx

key-decisions:
  - "Removed -mt-6 edge-to-edge override to make breadcrumb visible between nav and gallery"
  - "Reduced similar vehicles from 8 to 6 for clean 2-row alignment with 3-col grid"

patterns-established:
  - "Breadcrumb wrapper: mx-auto max-w-7xl px-4 lg:px-0 outside VehicleDetailPage component"

requirements-completed: [DETL-01, DETL-02, DETL-03]

# Metrics
duration: 2min
completed: 2026-03-23
---

# Phase 20 Plan 01: Detail Page Spacing Summary

**Breadcrumb trail (Home > 내차사기 > Brand Model) with 24px nav gap, 3-col similar vehicles grid, and uniform 32px section card spacing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-23T14:30:26Z
- **Completed:** 2026-03-23T14:32:19Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Breadcrumb navigation renders between nav bar and gallery with 24px top spacing from layout pt-6
- Similar vehicles grid changed to 3 columns on desktop with 6 vehicles (2 clean rows)
- All 10 section cards use uniform 32px vertical gap at every breakpoint (lg:space-y-10 removed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add breadcrumb navigation and remove edge-to-edge override** - `96f9f29` (feat)
2. **Task 2: Normalize similar vehicles grid and section spacing** - `9dd0007` (feat)

## Files Created/Modified
- `src/app/(public)/vehicles/[id]/page.tsx` - Added BreadcrumbNav import and JSX, removed -mt-6, added brand/model extraction
- `src/features/vehicles/components/detail/vehicle-detail-page.tsx` - Changed lg:grid-cols-4 to lg:grid-cols-3, slice(0,8) to slice(0,6), removed lg:space-y-10

## Decisions Made
- Removed -mt-6 edge-to-edge override to make breadcrumb visible (layout pt-6 provides the 24px gap)
- Reduced similar vehicles count from 8 to 6 for clean 2-row alignment with 3-column grid (no orphan cards)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 14 v2.1 Visual Polish requirements complete (GLBL-01 through DETL-03)
- Phase 20 is the final phase of the v2.1 milestone

## Self-Check: PASSED

- [x] src/app/(public)/vehicles/[id]/page.tsx exists
- [x] src/features/vehicles/components/detail/vehicle-detail-page.tsx exists
- [x] Commit 96f9f29 exists (Task 1)
- [x] Commit 9dd0007 exists (Task 2)

---
*Phase: 20-detail-page-spacing*
*Completed: 2026-03-23*
