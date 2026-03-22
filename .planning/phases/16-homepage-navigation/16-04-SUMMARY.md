---
phase: 16-homepage-navigation
plan: 04
subsystem: ui
tags: [footer, breadcrumb, homepage, navigation, sns, awards, shadcn]

# Dependency graph
requires:
  - phase: 16-01
    provides: HeroBanner, HeroSearchBox, QuickLinks components
  - phase: 16-02
    provides: RecommendedVehicles, PromoBanners, PartnerLogos components
  - phase: 16-03
    provides: Header mega menu and mobile nav redesign
provides:
  - Enhanced footer with SNS icons, awards badges, and app download placeholders
  - Reusable BreadcrumbNav component using shadcn Breadcrumb primitives
  - Breadcrumb integration on all 7 public pages (8 minus redirect page)
  - Redesigned homepage composing all Plan 01-03 sections in K Car order
affects: [17-admin-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BreadcrumbNav wrapper: explicit per-page items, not layout-level auto-derived"
    - "Footer additive extension: SNS/awards/app download sections without restructuring"
    - "Homepage composition: Server + Client sections with Suspense for async data"

key-files:
  created:
    - src/components/layout/breadcrumb-nav.tsx
    - src/components/layout/footer.test.tsx
    - src/components/layout/breadcrumb-nav.test.tsx
  modified:
    - src/components/layout/footer.tsx
    - src/app/(public)/page.tsx
    - src/app/(public)/vehicles/page.tsx
    - src/app/(public)/vehicles/compare/page.tsx
    - src/app/(public)/vehicles/[id]/contract/page.tsx
    - src/app/(public)/calculator/page.tsx
    - src/app/(public)/inquiry/page.tsx
    - src/app/(public)/sell/page.tsx
    - src/features/vehicles/components/public-vehicle-detail.tsx

key-decisions:
  - "BreadcrumbNav uses explicit per-page items (not auto-derived from pathname) -- most flexible, no magic"
  - "Skip /rental-lease breadcrumb -- redirect-only page never renders UI, breadcrumb would be dead code"
  - "Footer SNS uses Lucide icons (Instagram, Youtube, PenLine, MessageCircle) -- consistent with project icon library"
  - "Privacy link gets bold style in footer (K Car pattern: 개인정보처리방침 is visually emphasized)"
  - "Homepage SectionSkeleton updated to match recommended vehicles layout (tabs + 8-card grid)"
  - "Old marketing components not deleted (may be referenced by tests or other pages)"

patterns-established:
  - "BreadcrumbNav pattern: import component, pass items array, last item has no href (renders as current page)"
  - "Test cleanup pattern: afterEach(cleanup) required in happy-dom to prevent DOM accumulation between tests"

requirements-completed: [HOME-05, HOME-06]

# Metrics
duration: 6min
completed: 2026-03-22
---

# Phase 16 Plan 04: Footer, Breadcrumb, Homepage Assembly Summary

**Enhanced footer with SNS/awards/app-download trust signals, BreadcrumbNav on all public pages, and K Car-style homepage assembly composing 6 new sections from Plans 01-03**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-22T13:29:54Z
- **Completed:** 2026-03-22T13:36:34Z
- **Tasks:** 4
- **Files modified:** 12

## Accomplishments
- Footer enhanced with 4 SNS icon links, 2 award badges, 2 app download placeholders while preserving existing structure
- Reusable BreadcrumbNav component created and integrated on 7 public pages with correct path hierarchies
- Homepage fully redesigned with K Car section order: HeroBanner, HeroSearchBox, QuickLinks, RecommendedVehicles, PromoBanners, PartnerLogos
- 10 unit tests passing (6 footer + 4 breadcrumb)

## Task Commits

Each task was committed atomically:

1. **Task 0: Create test scaffolds** - `4451dc3` (test)
2. **Task 1: Enhance footer with SNS, awards, app download** - `e5ddd39` (feat)
3. **Task 2: Create BreadcrumbNav and integrate on all pages** - `725336b` (feat)
4. **Task 3: Assemble redesigned homepage** - `92cf01f` (feat)

## Files Created/Modified
- `src/components/layout/breadcrumb-nav.tsx` - Reusable breadcrumb wrapper using shadcn primitives
- `src/components/layout/breadcrumb-nav.test.tsx` - 4 tests for breadcrumb rendering
- `src/components/layout/footer.tsx` - Enhanced with SNS links, awards, app download sections
- `src/components/layout/footer.test.tsx` - 6 tests for footer enhancements
- `src/app/(public)/page.tsx` - Redesigned homepage with K Car section composition
- `src/app/(public)/vehicles/page.tsx` - Added breadcrumb: 홈 > 내차사기
- `src/features/vehicles/components/public-vehicle-detail.tsx` - Replaced inline breadcrumb with BreadcrumbNav
- `src/app/(public)/vehicles/compare/page.tsx` - Added breadcrumb: 홈 > 내차사기 > 비교하기
- `src/app/(public)/vehicles/[id]/contract/page.tsx` - Added breadcrumb: 홈 > 내차사기 > 계약 신청
- `src/app/(public)/calculator/page.tsx` - Added breadcrumb: 홈 > 금융계산기
- `src/app/(public)/inquiry/page.tsx` - Added breadcrumb: 홈 > 문의하기
- `src/app/(public)/sell/page.tsx` - Added breadcrumb: 홈 > 내차팔기

## Decisions Made
- BreadcrumbNav uses explicit per-page items (Option A from RESEARCH.md) -- most flexible, avoids brittle pathname parsing
- Skipped /rental-lease breadcrumb since page is redirect-only (never renders UI)
- Used Lucide icons for footer SNS (Instagram, Youtube, PenLine for blog, MessageCircle for Kakao) -- consistent with project
- Privacy link in footer gets bold style per K Car pattern
- Old marketing components (hero-section, quick-menu, etc.) not deleted from codebase -- may be referenced elsewhere

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test DOM accumulation between renders**
- **Found during:** Task 0/1 (test scaffolds + footer enhancement)
- **Issue:** happy-dom test environment does not auto-cleanup between test cases, causing "Found multiple elements" errors
- **Fix:** Added `afterEach(() => { cleanup() })` to both test files
- **Files modified:** footer.test.tsx, breadcrumb-nav.test.tsx
- **Verification:** All 10 tests pass green
- **Committed in:** e5ddd39 (Task 1), 725336b (Task 2)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test cleanup fix was necessary for correct test execution. No scope creep.

## Issues Encountered
None - all components from Plans 01-03 existed and exported correctly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 16 (Homepage & Navigation) complete -- all 4 plans executed
- All 6 homepage requirements (HOME-01 through HOME-06) satisfied
- Ready for Phase 17 (Admin Refresh & Polish)
- Build succeeds, type-check clean, 10 new tests passing

## Self-Check: PASSED

All 5 key files verified on disk. All 4 task commits verified in git log.

---
*Phase: 16-homepage-navigation*
*Completed: 2026-03-22*
