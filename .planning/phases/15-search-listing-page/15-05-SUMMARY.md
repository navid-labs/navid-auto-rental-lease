---
phase: 15-search-listing-page
plan: 05
subsystem: ui
tags: [search, filter, vehicle-type, body-type, nuqs, prisma]

# Dependency graph
requires:
  - phase: 15-01
    provides: search-params.ts, search-query.ts, buildWhereClause
  - phase: 15-03
    provides: search-filters.tsx pill UI, active-filter-chips.tsx
  - phase: 15-04
    provides: vehicle-list-client.tsx infinite scroll with filter passthrough
provides:
  - Vehicle body type lookup map (model name to body type)
  - vehicleType URL param and filter wiring end-to-end
  - Active filter chip for vehicleType
affects: [16-homepage-navigation, 17-admin-refresh-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [model-name-lookup-for-body-type-filtering]

key-files:
  created:
    - src/features/vehicles/lib/vehicle-body-type.ts
  modified:
    - src/features/vehicles/lib/search-params.ts
    - src/features/vehicles/lib/search-query.ts
    - src/features/vehicles/components/search-filters.tsx
    - src/features/vehicles/components/active-filter-chips.tsx
    - src/features/vehicles/components/vehicle-list-client.tsx

key-decisions:
  - "Body type uses model-name lookup map (no DB migration) -- body type is model property, not vehicle property"
  - "vehicleType filter merges with brand/model trimWhere accumulator for composable WHERE clauses"

patterns-established:
  - "Model-name-based lookup: use static map to derive computed properties from model names when DB migration is overkill"

requirements-completed: [SEARCH-01]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 15 Plan 05: Vehicle Type Filter Wiring Summary

**Vehicle type (body type) filter wired end-to-end via model-name lookup map, URL params, WHERE clause, pill buttons, and active filter chips**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T12:34:30Z
- **Completed:** 2026-03-22T12:38:27Z
- **Tasks:** 1
- **Files modified:** 9

## Accomplishments
- Created vehicle-body-type.ts with 24-model lookup map (sedan/SUV coverage for all seeded models)
- Wired vehicleType through full data flow: URL param -> search-params -> search-query WHERE clause -> Prisma query
- Connected pill button onClick handlers to update vehicleType URL param
- Added removable vehicleType chip to active-filter-chips with Korean labels
- Removed placeholder no-op comment from search-filters.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Create body type lookup + wire vehicleType through search-params, search-query, search-filters, and active-filter-chips** - `042a3ff` (feat)

**Plan metadata:** (pending - docs commit below)

## Files Created/Modified
- `src/features/vehicles/lib/vehicle-body-type.ts` - Body type lookup map, BodyType type, getModelNamesByBodyType helper
- `src/features/vehicles/lib/search-params.ts` - Added vehicleType parser
- `src/features/vehicles/lib/search-query.ts` - Added vehicleType to SearchFilters type + WHERE clause via model name lookup
- `src/features/vehicles/components/search-filters.tsx` - Wired pill button onClick, added vehicleType to reset and activeFilterCount
- `src/features/vehicles/components/active-filter-chips.tsx` - Added vehicleType chip with Korean labels, added to clearAll
- `src/features/vehicles/components/vehicle-list-client.tsx` - Added vehicleType to loadMore filter params
- `src/features/vehicles/lib/search-params.test.ts` - Updated key count assertion (27 -> 28)
- `src/features/vehicles/lib/search-query.test.ts` - Added vehicleType to makeFilters helper
- `tests/unit/features/vehicles/search-query.test.ts` - Added vehicleType to emptyFilters helper

## Decisions Made
- Body type uses model-name lookup map instead of DB migration -- body type is inherently a model-level property, and all seeded models are covered
- vehicleType filter composes with existing brand/model/gen filters via trimWhere accumulator pattern (merges generation.carModel constraints)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated vehicle-list-client.tsx to include vehicleType in loadMore params**
- **Found during:** Task 1 (type-check)
- **Issue:** vehicle-list-client.tsx constructs SearchFilters object for loadMore server action but was missing vehicleType field, causing TS2741
- **Fix:** Added `vehicleType: filters.vehicleType || null` to filterParams
- **Files modified:** src/features/vehicles/components/vehicle-list-client.tsx
- **Verification:** type-check passes
- **Committed in:** 042a3ff

**2. [Rule 1 - Bug] Updated test helpers with vehicleType field**
- **Found during:** Task 1 (type-check + test run)
- **Issue:** Two test files had makeFilters/emptyFilters helpers missing vehicleType, causing type errors and potential test failures
- **Fix:** Added vehicleType to both test helpers; updated parser key count assertion from 27 to 28
- **Files modified:** src/features/vehicles/lib/search-params.test.ts, src/features/vehicles/lib/search-query.test.ts, tests/unit/features/vehicles/search-query.test.ts
- **Verification:** 410 tests pass
- **Committed in:** 042a3ff

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes were necessary for type safety and test correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 15 is now fully complete including the gap closure plan
- All 5 plans (15-01 through 15-05) shipped
- Ready for Phase 16 (Homepage & Navigation) or Phase 17 (Admin Refresh & Polish)

---
*Phase: 15-search-listing-page*
*Completed: 2026-03-22*
