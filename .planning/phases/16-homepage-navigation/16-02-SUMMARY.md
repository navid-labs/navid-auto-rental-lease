---
phase: 16-homepage-navigation
plan: 02
subsystem: ui
tags: [react, server-components, prisma, tailwind, vehicle-card, tabs]

# Dependency graph
requires:
  - phase: 15-search-listing-page
    provides: VehicleCard component and vehicleInclude shared query shape
  - phase: 13-component-foundation
    provides: Design tokens, color palette, Lucide icons
provides:
  - RecommendedVehicles Server Component with parallel 3-tab data fetch
  - RecommendedVehiclesTabs Client Component with instant tab switching
  - PromoBanners 3-card service promo grid (home delivery, deals, rent)
  - PartnerLogos centered financial partner logo bar
affects: [16-homepage-navigation, 16-03, 16-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [Server+Client component pair for pre-fetched tabbed data, Promise.all parallel DB queries]

key-files:
  created:
    - src/features/marketing/components/recommended-vehicles.tsx
    - src/features/marketing/components/recommended-vehicles-tabs.tsx
    - src/features/marketing/components/recommended-vehicles.test.tsx
    - src/features/marketing/components/promo-banners.tsx
    - src/features/marketing/components/partner-logos.tsx
  modified: []

key-decisions:
  - "Popular tab uses approvedAt desc (no viewCount in schema)"
  - "Newest tab uses createdAt desc (differentiates from popular per STATE.md decision)"
  - "Deals tab uses price asc for lowest-price-first ordering"
  - "RentSubscription content integrated via deal tab + promo banner rent CTA (not separate section)"
  - "PartnerLogos uses initial-letter placeholders (real logos in v3.0)"

patterns-established:
  - "Server+Client pair: Server fetches all tab data via Promise.all, Client switches instantly"
  - "Tab pills: rounded-full bg-[#1A6DFF] active, bg-[#F0F0F0] inactive"

requirements-completed: [HOME-03]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 16 Plan 02: Recommended Vehicles + Promo/Partner Sections Summary

**3-tab recommended vehicles with parallel data fetch, K Car-style promo banner grid, and partner logo bar replacing v1.0 homepage sections**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T13:21:15Z
- **Completed:** 2026-03-22T13:25:34Z
- **Tasks:** 3
- **Files created:** 5

## Accomplishments
- RecommendedVehicles Server Component fetches 3 tabs (popular/newest/deals) in parallel via Promise.all using shared vehicleInclude
- RecommendedVehiclesTabs Client Component provides instant tab switching with Phase 15's VehicleCard, 2-col mobile / 4-col desktop grid
- PromoBanners renders 3 service promo cards (home delivery, weekly deals, rent) with gradient backgrounds and Lucide icons
- PartnerLogos renders centered 6-partner logo bar with initial-letter placeholders
- 6 unit tests passing for tab rendering, switching, more link, and empty state

## Task Commits

Each task was committed atomically:

1. **Task 0: Test scaffold for recommended vehicles** - `91790bd` (test)
2. **Task 1: Recommended vehicles Server+Client pair with 3 tabs** - `1f0e6c5` (feat)
3. **Task 2: Promo banners grid + partner logo bar** - `62cd23d` (feat)

## Files Created
- `src/features/marketing/components/recommended-vehicles.tsx` - Server Component fetching 3 tabs via Promise.all
- `src/features/marketing/components/recommended-vehicles-tabs.tsx` - Client Component for instant tab switching with VehicleCard
- `src/features/marketing/components/recommended-vehicles.test.tsx` - 6 unit tests for tab behavior
- `src/features/marketing/components/promo-banners.tsx` - 3-card K Car-style service promo grid
- `src/features/marketing/components/partner-logos.tsx` - Centered partner logo bar with 6 financial partners

## Decisions Made
- Popular tab uses `approvedAt desc` since Prisma Vehicle model has no viewCount field
- Newest tab uses `createdAt desc` to differentiate from popular (per prior STATE.md decision)
- Deals tab uses `price asc` for lowest-price-first ordering
- RentSubscription content integrated via recommended vehicles "특가차량" tab and PromoBanners "렌트" card rather than carrying forward as separate section
- PartnerLogos uses initial-letter circle placeholders (real logos deferred to v3.0)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test cleanup causing duplicate DOM elements**
- **Found during:** Task 1 (verifying tests pass)
- **Issue:** Tests using `getByTestId` found multiple elements due to missing cleanup between renders
- **Fix:** Added explicit `afterEach(cleanup)` to test file
- **Files modified:** src/features/marketing/components/recommended-vehicles.test.tsx
- **Verification:** All 6 tests pass green
- **Committed in:** 1f0e6c5 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test environment fix, no scope creep.

## Issues Encountered
- Pre-existing test failures in `quick-links.test.tsx` and `hero-banner.test.tsx` (Wave 0 scaffolds for future plans) -- not caused by this plan, not fixed per scope boundary rules

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 new components ready for homepage assembly in Plan 16-03/16-04
- Old sections (FeaturedVehicles, EventBanners, FinancePartners, RentSubscription) remain untouched for backward compatibility
- Homepage page.tsx will swap old components for new ones during assembly plan

## Self-Check: PASSED

All 5 created files verified on disk. All 3 task commits (91790bd, 1f0e6c5, 62cd23d) verified in git log.

---
*Phase: 16-homepage-navigation*
*Completed: 2026-03-22*
