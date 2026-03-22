---
phase: 15-search-listing-page
plan: 02
subsystem: ui
tags: [vehicle-card, preview-dialog, skeleton, badges, tags, tdd, k-car]

# Dependency graph
requires:
  - phase: 15-search-listing-page
    provides: badge-discount CSS token, SearchFilters type, comparison store MAX=3
  - phase: 13-component-foundation
    provides: design tokens (badge-success, badge-warning, badge-info, badge-new, badge-danger, text-price)
provides:
  - K Car-style grid card with rental/lease parallel display and preview popup
  - Horizontal list view card (VehicleCardList)
  - Skeleton loading cards for grid and list modes (VehicleCardSkeleton)
  - Card preview Dialog with specs grid, monthly boxes, 3 CTAs
  - Extracted getVehicleBadges utility (8 badge types, max 3)
  - Extracted getVehicleTags utility (JSONB-based tag extraction)
  - getFuelLabel exported for shared use
affects: [15-03, 15-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [BadgeInput type for decoupled badge logic, TagInput for JSONB tag extraction, preview dialog on card click instead of Link navigation]

key-files:
  created:
    - src/features/vehicles/lib/vehicle-badges.ts
    - src/features/vehicles/lib/vehicle-tags.ts
    - src/features/vehicles/components/vehicle-card-list.tsx
    - src/features/vehicles/components/vehicle-card-skeleton.tsx
    - src/features/vehicles/components/card-preview-dialog.tsx
    - tests/unit/features/vehicles/vehicle-badges.test.ts
    - tests/unit/features/vehicles/vehicle-tags.test.ts
  modified:
    - src/features/vehicles/components/vehicle-card.tsx

key-decisions:
  - "Preview Dialog replaces Link wrapper -- card click opens popup, not direct navigation"
  - "getFuelLabel exported from vehicle-card.tsx for reuse in list card and preview dialog"
  - "Spec grid in preview uses engineCC (배기량) instead of seatingCapacity (인승) since Trim model lacks seatingCapacity"
  - "Badge logic extracted into pure function with BadgeInput type -- decoupled from VehicleWithDetails for testability"

patterns-established:
  - "BadgeInput type: narrow input type for badge logic, independent of Prisma model shape"
  - "TagInput type: narrow input type for tag extraction from JSONB fields"
  - "Preview popup pattern: card click opens Dialog instead of navigating away"

requirements-completed: [SEARCH-02, SEARCH-04]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 15 Plan 02: Vehicle Card Redesign Summary

**K Car-style vehicle card with rental/lease parallel display, preview Dialog popup, list view variant, skeleton cards, and 15 TDD-tested badge/tag utilities**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T12:04:47Z
- **Completed:** 2026-03-22T12:09:20Z
- **Tasks:** 2 (Task 1: TDD RED/GREEN, Task 2: component rewrite)
- **Files modified:** 8

## Accomplishments
- Extracted badge logic into pure testable function with 8 badge types (including new no-accident and warranty badges), max 3 display limit
- Extracted tag logic into pure testable function for JSONB data (inspection/history/warranty)
- Rewrote vehicle-card.tsx: removed Link wrapper, added preview Dialog, rental/lease parallel display, warranty bar, tags
- Created VehicleCardList horizontal layout with 200px image left and info right
- Created VehicleCardSkeleton with grid/list modes and pulse animation
- Created CardPreviewDialog with image, spec grid, monthly price boxes, and 3 CTAs (detail/compare/wishlist)
- 15 unit tests pass for badge and tag utilities

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract badge and tag logic into testable modules** - `dd60cc3` (feat, TDD)
2. **Task 2: Rewrite vehicle card, list, skeleton, preview dialog** - `47b0b5e` (feat)

## Files Created/Modified
- `src/features/vehicles/lib/vehicle-badges.ts` - NEW: getVehicleBadges with 8 badge types, max 3
- `src/features/vehicles/lib/vehicle-tags.ts` - NEW: getVehicleTags from JSONB inspection/history data
- `src/features/vehicles/components/vehicle-card.tsx` - REWRITE: K Car style with preview dialog, no Link wrapper
- `src/features/vehicles/components/vehicle-card-list.tsx` - NEW: horizontal list view card
- `src/features/vehicles/components/vehicle-card-skeleton.tsx` - NEW: skeleton cards for grid/list
- `src/features/vehicles/components/card-preview-dialog.tsx` - NEW: preview popup with specs and CTAs
- `tests/unit/features/vehicles/vehicle-badges.test.ts` - NEW: 10 tests for badge logic
- `tests/unit/features/vehicles/vehicle-tags.test.ts` - NEW: 5 tests for tag extraction

## Decisions Made
- **Preview Dialog replaces Link wrapper**: Card click opens a Dialog popup instead of navigating to `/vehicles/[id]`. Users access detail via "상세보기" button in the popup. Preserves search context.
- **getFuelLabel exported**: Shared between grid card, list card, and preview dialog to avoid duplication.
- **engineCC instead of seatingCapacity in preview spec grid**: Trim model lacks seatingCapacity field. Substituted with engineCC (배기량) which exists on the Trim model.
- **BadgeInput narrow type**: Decoupled from VehicleWithDetails for testability. Accepts plain object with only needed fields.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] seatingCapacity replaced with engineCC in preview dialog spec grid**
- **Found during:** Task 2 (card-preview-dialog.tsx)
- **Issue:** Plan specified `trim.seatingCapacity` for the spec grid, but Prisma `Trim` model has no `seatingCapacity` field (only `fuelType`, `engineCC`, `transmission`)
- **Fix:** Replaced with `trim.engineCC` (배기량) displayed as formatted cc value
- **Files modified:** src/features/vehicles/components/card-preview-dialog.tsx
- **Verification:** `yarn type-check` passes, `yarn build` succeeds
- **Committed in:** 47b0b5e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix for non-existent field)
**Impact on plan:** Necessary fix -- plan referenced a field that doesn't exist on the Prisma model. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All card components (grid, list, skeleton) ready for Plan 03 page assembly
- CardPreviewDialog ready for integration with vehicle grid
- Badge/tag utilities available for any component that needs them
- getFuelLabel exported for shared use across card variants

## Self-Check: PASSED

All 8 created/modified files exist. Both commits verified (dd60cc3, 47b0b5e).

---
*Phase: 15-search-listing-page*
*Completed: 2026-03-22*
