---
phase: 15-search-listing-page
plan: 01
subsystem: api
tags: [nuqs, prisma, zustand, search, filters, infinite-scroll, css-tokens]

# Dependency graph
requires:
  - phase: 13-component-foundation
    provides: design tokens, badge components, format utils, react-intersection-observer
provides:
  - Extended searchParamsParsers with 27 URL-synced filter params
  - Exported SearchFilters type for shared filter contract
  - buildWhereClause handling 15 filter types including fuel, transmission, color, monthly range
  - buildOrderBy with 9 sort options including recommended, monthly-asc, popular
  - loadMoreVehicles server action for infinite scroll
  - vehicleInclude constant for reuse across page and server action
  - Comparison store MAX=3 with toast warning and comparisonDialogOpen state
  - badge-discount CSS token for vehicle card discount badges
affects: [15-02, 15-03, 15-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [trimWhere accumulator for merging nested Prisma relations, comma-separated multi-select URL params]

key-files:
  created:
    - src/features/vehicles/actions/load-more-vehicles.ts
    - tests/unit/features/vehicles/search-params.test.ts
    - tests/unit/features/vehicles/search-query.test.ts
    - tests/unit/stores/vehicle-interaction-store.test.ts
  modified:
    - src/features/vehicles/lib/search-params.ts
    - src/features/vehicles/lib/search-query.ts
    - src/lib/stores/vehicle-interaction-store.ts
    - src/app/globals.css
    - src/features/vehicles/lib/search-params.test.ts
    - src/features/vehicles/lib/search-query.test.ts

key-decisions:
  - "Price filter changed from monthlyRental to price field (bug fix from plan)"
  - "Sort 'newest' uses createdAt to differentiate from 'recommended' (approvedAt)"
  - "trimWhere accumulator pattern merges brand/model/gen + fuel/transmission into single trim relation"
  - "Comparison MAX reduced from 4 to 3 per K Car pattern alignment"

patterns-established:
  - "trimWhere accumulator: collect all trim-level conditions, merge into where.trim once"
  - "Comma-separated multi-select: store 'GASOLINE,DIESEL' in URL, split in buildWhereClause"

requirements-completed: [SEARCH-01, SEARCH-05, SEARCH-07]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 15 Plan 01: Data Layer Foundation Summary

**Extended search data layer with 15 filters, 9 sort options, loadMoreVehicles server action, comparison MAX=3 with toast, and badge-discount CSS token**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T11:56:21Z
- **Completed:** 2026-03-22T12:01:13Z
- **Tasks:** 2 (both TDD: RED/GREEN)
- **Files modified:** 10

## Accomplishments
- search-params.ts extended from 11 to 27 parsers covering all 15 filter categories + view mode + sort
- search-query.ts refactored with trimWhere accumulator pattern for correct Prisma nested relation merging, fixed price filter bug (was filtering monthlyRental instead of price)
- buildOrderBy expanded from 6 to 9 sort options with proper differentiation between recommended/newest/popular
- loadMoreVehicles server action created for infinite scroll with shared vehicleInclude constant
- Comparison store MAX_COMPARISON reduced 4->3, added toast.warning via sonner, added comparisonDialogOpen state
- badge-discount CSS token (hsl(24 95% 53%)) added to both light and dark modes
- 50 tests green, type-check clean

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Search params + query tests** - `0677c2d` (test)
2. **Task 1 GREEN: Extended search params and query** - `ee84865` (feat)
3. **Task 2 RED: Store comparison tests** - `bf69b29` (test)
4. **Task 2 GREEN: Server action + store + CSS token** - `65dc681` (feat)

## Files Created/Modified
- `src/features/vehicles/lib/search-params.ts` - Extended from 11 to 27 nuqs parsers
- `src/features/vehicles/lib/search-query.ts` - Extended SearchFilters type, buildWhereClause with 15 filters, buildOrderBy with 9 sorts
- `src/features/vehicles/actions/load-more-vehicles.ts` - NEW: Server action for infinite scroll
- `src/lib/stores/vehicle-interaction-store.ts` - MAX_COMPARISON=3, toast, comparisonDialogOpen
- `src/app/globals.css` - badge-discount token in :root, .dark, and @theme inline
- `src/features/vehicles/lib/search-params.test.ts` - Updated key count from 11 to 27
- `src/features/vehicles/lib/search-query.test.ts` - Updated for new behavior (price field, createdAt sort)
- `tests/unit/features/vehicles/search-params.test.ts` - NEW: 4 tests for extended parsers
- `tests/unit/features/vehicles/search-query.test.ts` - NEW: 23 tests for filters + sort
- `tests/unit/stores/vehicle-interaction-store.test.ts` - NEW: 6 tests for comparison store

## Decisions Made
- **Price filter bug fix**: priceMin/priceMax now correctly filter on `price` field instead of `monthlyRental` (monthlyRental has its own monthlyMin/monthlyMax filters)
- **Sort differentiation**: `recommended` uses `approvedAt: desc`, `newest` uses `createdAt: desc`, `popular` falls back to `createdAt: desc` (no viewCount field yet)
- **trimWhere accumulator**: Instead of spreading `where.trim as object`, accumulate all trim-level conditions in a plain object, then assign once. Prevents overwriting brand/model/gen when adding fuel/transmission.
- **toast.warning for comparison overflow**: Replaced console.warn with sonner toast for user-visible feedback

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated existing co-located tests for new behavior**
- **Found during:** Task 1 (search-params and search-query implementation)
- **Issue:** Existing test files `src/features/vehicles/lib/search-params.test.ts` and `src/features/vehicles/lib/search-query.test.ts` had hard-coded expectations for the old behavior (11 keys, monthlyRental for price, approvedAt for newest)
- **Fix:** Updated test expectations to match new behavior: 27 keys, price field for price filter, createdAt for newest sort
- **Files modified:** src/features/vehicles/lib/search-params.test.ts, src/features/vehicles/lib/search-query.test.ts
- **Verification:** All 50 tests pass
- **Committed in:** ee84865 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix for existing tests)
**Impact on plan:** Necessary update -- existing tests had hard-coded old behavior that conflicted with planned changes. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All data contracts (SearchFilters type, buildWhereClause, buildOrderBy, loadMoreVehicles) are ready for Plan 02 (vehicle card components) and Plan 03 (page assembly)
- vehicleInclude exported from load-more-vehicles.ts for reuse in page.tsx
- badge-discount CSS token ready for card badge rendering
- comparisonDialogOpen state ready for compare dialog UI

## Self-Check: PASSED

All 5 created files exist. All 4 commits verified (0677c2d, ee84865, bf69b29, 65dc681).

---
*Phase: 15-search-listing-page*
*Completed: 2026-03-22*
