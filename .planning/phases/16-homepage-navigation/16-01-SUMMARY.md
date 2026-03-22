---
phase: 16-homepage-navigation
plan: 01
subsystem: ui
tags: [embla-carousel, autoplay, hero-banner, quick-links, search-box, lucide-react]

# Dependency graph
requires:
  - phase: 13-component-foundation
    provides: Embla Carousel + autoplay plugin installation, design tokens
provides:
  - HeroBanner component with Embla autoplay carousel (3 slides, dot indicators)
  - HeroSearchBox standalone tabbed search (brand/model, budget, body type)
  - QuickLinks K Car-style circular icon bar (8 items, mobile horizontal scroll)
affects: [16-homepage-navigation, homepage-assembly]

# Tech tracking
tech-stack:
  added: []
  patterns: [embla-autoplay-carousel-with-dots, server-action-cascade-search, circular-icon-bar-horizontal-scroll]

key-files:
  created:
    - src/features/marketing/components/hero-banner.tsx
    - src/features/marketing/components/hero-banner.test.tsx
    - src/features/marketing/components/hero-search-box.tsx
    - src/features/marketing/components/quick-links.tsx
    - src/features/marketing/components/quick-links.test.tsx
  modified: []

key-decisions:
  - "Used shadcn Carousel wrapper (not raw useEmblaCarousel) for hero banner -- simpler API for single-instance use"
  - "Dot indicators use api.selectedScrollSnap() callback for sync with carousel state"
  - "HeroSearchBox extracted as direct logic copy from hero-section.tsx -- no removal of old file yet (Plan 04 wires homepage)"
  - "QuickLinks is Server Component (no 'use client') since it has no interactivity"
  - "Test assertions use container.querySelector instead of screen global to avoid cross-test DOM leakage"

patterns-established:
  - "Embla autoplay carousel with dot indicator sync via selectedScrollSnap"
  - "Search box extraction pattern: copy logic, new visual wrapper, original untouched until assembly plan"

requirements-completed: [HOME-01, HOME-02]

# Metrics
duration: 6min
completed: 2026-03-22
---

# Phase 16 Plan 01: Hero Banner & Quick Links Summary

**Embla autoplay hero carousel with 3 promo banners, standalone tabbed search box, and K Car circular icon bar with mobile horizontal scroll**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-22T13:21:21Z
- **Completed:** 2026-03-22T13:27:06Z
- **Tasks:** 4
- **Files created:** 5

## Accomplishments
- HeroBanner with 3 gradient placeholder slides, 4s autoplay, loop, arrows, and synced dot indicators
- HeroSearchBox with complete brand/model cascade, budget, and body type search tabs navigating to /vehicles
- QuickLinks with 8 K Car-style circular icon items, per-icon color theming, mobile horizontal scroll

## Task Commits

Each task was committed atomically:

1. **Task 0: Create test scaffolds** - `a23b37d` (test)
2. **Task 1: Hero banner carousel with Embla autoplay** - `477b82d` (feat)
3. **Task 2: Extract tabbed search box** - `52d71c5` (feat)
4. **Task 3: Quick links icon bar** - `c76f1ff` (feat)

## Files Created/Modified
- `src/features/marketing/components/hero-banner.tsx` - Embla autoplay carousel with 3 banner slides and dot indicators
- `src/features/marketing/components/hero-banner.test.tsx` - 4 tests: slide rendering, navigation arrows, dot indicators, autoplay import
- `src/features/marketing/components/hero-search-box.tsx` - Standalone tabbed search (brand/model cascade, budget, body type)
- `src/features/marketing/components/quick-links.tsx` - 8 K Car circular icon links with mobile horizontal scroll
- `src/features/marketing/components/quick-links.test.tsx` - 3 tests: item rendering, href correctness, circular containers

## Decisions Made
- Used shadcn Carousel wrapper over raw useEmblaCarousel for hero banner (simpler API sufficient for single-instance use)
- Dot indicators sync via `api.selectedScrollSnap()` in `select` event callback
- HeroSearchBox is a direct extraction from hero-section.tsx; old file left intact until Plan 04 homepage assembly
- QuickLinks kept as Server Component since all content is static links (no 'use client' needed)
- Test mocks use `container.querySelector` instead of `screen` global to prevent cross-test DOM accumulation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test assertion method for navigation arrows**
- **Found during:** Task 1 (hero banner)
- **Issue:** `screen.getByTestId()` found multiple elements due to cross-test DOM accumulation in global screen
- **Fix:** Switched to `container.querySelector('[data-testid="..."]')` for scoped queries
- **Files modified:** src/features/marketing/components/hero-banner.test.tsx
- **Verification:** All 4 hero-banner tests pass
- **Committed in:** 477b82d (Task 1 commit)

**2. [Rule 1 - Bug] Fixed quick-links href count assertion**
- **Found during:** Task 3 (quick links)
- **Issue:** `screen.getAllByRole('link')` returned 16 links (accumulated from prior render) instead of 8
- **Fix:** Changed to `container.querySelectorAll('a')` for scoped count
- **Files modified:** src/features/marketing/components/quick-links.test.tsx
- **Verification:** All 3 quick-links tests pass
- **Committed in:** c76f1ff (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes in test assertions)
**Impact on plan:** Both fixes resolved test infrastructure issues. No scope creep.

## Issues Encountered
None beyond the test assertion fixes documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 new components ready for homepage assembly (Plan 04)
- Old hero-section.tsx and quick-menu.tsx remain untouched and functional
- HeroBanner, HeroSearchBox, and QuickLinks can be composed in page.tsx as: HeroBanner -> HeroSearchBox -> QuickLinks

## Self-Check: PASSED

- All 5 created files verified present on disk
- All 4 task commits verified in git history (a23b37d, 477b82d, 52d71c5, c76f1ff)
- 7/7 tests passing (4 hero-banner + 3 quick-links)
- TypeScript compilation clean for all new files

---
*Phase: 16-homepage-navigation*
*Completed: 2026-03-22*
