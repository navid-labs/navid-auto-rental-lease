---
phase: 15-search-listing-page
plan: 04
subsystem: ui
tags: [infinite-scroll, intersection-observer, nuqs, zustand, comparison, server-actions, nextjs]

# Dependency graph
requires:
  - phase: 15-01
    provides: search-params parsers, search-query builder, load-more-vehicles server action, vehicle-interaction-store
  - phase: 15-02
    provides: VehicleCard, VehicleCardList, VehicleCardSkeleton, CardPreviewDialog
  - phase: 15-03
    provides: SearchFilters, QuickFilterBadges, ActiveFilterChips, SearchSort, DualRangeSlider
provides:
  - Hybrid Server/Client page architecture for /vehicles
  - VehicleListClient client orchestrator with infinite scroll
  - VehicleGrid with grid/list view toggle
  - CompareFloatingBar with vehicle thumbnails and CTA
  - CompareDialog with side-by-side spec comparison and difference highlighting
  - BackToTop button with compare bar offset awareness
affects: [16-homepage-navigation, 17-admin-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns: [hybrid-server-client-infinite-scroll, view-toggle-via-nuqs, comparison-floating-bar-pattern]

key-files:
  created:
    - src/features/vehicles/components/vehicle-list-client.tsx
    - src/features/vehicles/components/compare-floating-bar.tsx
    - src/features/vehicles/components/compare-dialog.tsx
    - src/features/vehicles/components/back-to-top.tsx
    - src/features/vehicles/lib/vehicle-include.ts
  modified:
    - src/app/(public)/vehicles/page.tsx
    - src/features/vehicles/components/vehicle-grid.tsx
    - src/features/vehicles/actions/load-more-vehicles.ts

key-decisions:
  - "vehicleInclude extracted to shared lib (server action 'use server' files cannot export non-async values)"
  - "base-ui ToggleGroup value is string array -- ViewToggle wraps with single-select semantics"
  - "CompareDialog spec rows limited to VehicleSummary fields (price/year/mileage/rental/lease) -- fuel/transmission deferred until store type is extended"

patterns-established:
  - "Hybrid Server/Client infinite scroll: Server Component renders first page for SEO, Client Component manages scroll state via IntersectionObserver"
  - "vehicleInclude lives in lib/vehicle-include.ts, shared between page and server action"
  - "View mode persisted in URL via nuqs view param for shareable/bookmarkable state"

requirements-completed: [SEARCH-03, SEARCH-04, SEARCH-05, SEARCH-08]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 15 Plan 04: Page Assembly Summary

**Hybrid Server/Client page with IntersectionObserver infinite scroll, grid/list toggle, comparison floating bar + dialog with difference highlighting, and offset-aware back-to-top**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T12:13:35Z
- **Completed:** 2026-03-22T12:17:45Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Rewrote /vehicles page.tsx to hybrid Server/Client architecture: first page server-rendered for SEO, subsequent pages loaded via IntersectionObserver sentinel
- Created VehicleListClient orchestrating infinite scroll, grid/list toggle, quick filters, active chips, sort, compare bar, and back-to-top
- Built CompareFloatingBar with vehicle thumbnails, dashed empty slots, and comparison CTA
- Built CompareDialog with side-by-side spec table and numeric difference highlighting (lower price/mileage = better, higher year = better)
- BackToTop button shifts from bottom-6 to bottom-20 when compare bar is visible (Pitfall 7 fix)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite page.tsx + VehicleListClient + VehicleGrid** - `1dfc3cc` (feat)
2. **Task 2: Compare floating bar + comparison dialog + back-to-top** - `6187ac9` (feat)

## Files Created/Modified
- `src/app/(public)/vehicles/page.tsx` - Server Component with initial fetch, passes to VehicleListClient
- `src/features/vehicles/components/vehicle-list-client.tsx` - Client orchestrator: infinite scroll, view toggle, filter integration
- `src/features/vehicles/components/vehicle-grid.tsx` - Grid/list hybrid rendering based on viewMode prop
- `src/features/vehicles/components/compare-floating-bar.tsx` - Fixed bottom bar with comparison vehicle slots
- `src/features/vehicles/components/compare-dialog.tsx` - Fullscreen comparison table with highlighting
- `src/features/vehicles/components/back-to-top.tsx` - Scroll-to-top button with compare bar offset
- `src/features/vehicles/lib/vehicle-include.ts` - Shared Prisma include for vehicle queries
- `src/features/vehicles/actions/load-more-vehicles.ts` - Imports vehicleInclude from shared lib

## Decisions Made
- Extracted `vehicleInclude` from server action to shared lib file because Next.js "use server" modules cannot export non-async values
- base-ui ToggleGroup uses array-based `value` prop; ViewToggle wraps it with single-select semantics
- CompareDialog spec rows limited to fields available in VehicleSummary store type (price, year, mileage, monthlyRental, monthlyLease) -- fields like fuel type, transmission require store type extension (deferred)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] vehicleInclude cannot be exported from 'use server' module**
- **Found during:** Task 1 (page.tsx rewrite)
- **Issue:** Plan imported vehicleInclude from load-more-vehicles.ts (a "use server" file), but Next.js forbids exporting non-async values from server action modules
- **Fix:** Created `src/features/vehicles/lib/vehicle-include.ts` as shared module, updated both page.tsx and load-more-vehicles.ts to import from it
- **Files modified:** src/features/vehicles/lib/vehicle-include.ts (new), src/features/vehicles/actions/load-more-vehicles.ts, src/app/(public)/vehicles/page.tsx
- **Verification:** `yarn build` succeeds
- **Committed in:** 1dfc3cc (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for Next.js module system constraint. No scope creep.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 15 search/listing page is fully assembled with all 4 plans complete
- All components integrated: data layer, cards, filters, page assembly
- Ready for Phase 16 (Homepage & Navigation) and Phase 17 (Admin Refresh)

## Self-Check: PASSED

All 5 created files verified on disk. Both commit hashes (1dfc3cc, 6187ac9) verified in git log.

---
*Phase: 15-search-listing-page*
*Completed: 2026-03-22*
