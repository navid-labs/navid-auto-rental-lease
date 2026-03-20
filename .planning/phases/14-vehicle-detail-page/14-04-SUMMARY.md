---
phase: 14-vehicle-detail-page
plan: 04
subsystem: ui
tags: [react, embla-carousel, accordion, tabs, progress, warranty, faq]

requires:
  - phase: 14-01
    provides: VehicleDetailData type, InspectionData schema with evaluator field
  - phase: 13
    provides: shadcn components (Progress, Accordion, Tabs, Card, Badge, Dialog)
provides:
  - SectionWarranty component with dual progress bars for manufacturer/extended warranty
  - SectionHomeService component with 4-step flow indicator and visit reservation dialog
  - SectionReviewsFaq component with Embla review carousel and 4-tab FAQ accordion
  - SectionEvaluator component with profile card and quotation-style recommendation
affects: [14-05-page-orchestrator]

tech-stack:
  added: []
  patterns: [embla-carousel-for-reviews, base-ui-progress-with-spans, faq-tabs-accordion-combo]

key-files:
  created:
    - src/features/vehicles/components/detail/section-warranty.tsx
    - src/features/vehicles/components/detail/section-home-service.tsx
    - src/features/vehicles/components/detail/section-reviews-faq.tsx
    - src/features/vehicles/components/detail/section-evaluator.tsx
  modified: []

key-decisions:
  - "Used plain spans instead of ProgressValue for date range text due to base-ui render prop API constraint"
  - "Mock review data embedded in component as default prop for initial launch"

patterns-established:
  - "FAQ pattern: Tabs + Accordion combo for categorized Q&A content"
  - "Review carousel: Embla with prev/next nav buttons on desktop, swipe on mobile"

requirements-completed: [DETAIL-07, DETAIL-08, DETAIL-09, DETAIL-11]

duration: 4min
completed: 2026-03-20
---

# Phase 14 Plan 04: Remaining Detail Sections Summary

**4 section components (Warranty, Home Service, Reviews/FAQ, Evaluator) completing the 10-section K Car detail page layout**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T02:05:10Z
- **Completed:** 2026-03-20T02:08:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Warranty section with dual progress bars showing manufacturer (5yr/100Kkm) and extended warranty timelines
- Home Service section with 4-step purchase flow (order, payment, delivery, 3-day refund) and Dialog-based visit reservation
- Reviews section with Embla horizontal carousel of star-rated review cards (5 mock reviews)
- FAQ section with 4-category Tabs (purchase, delivery, refund, warranty) and Accordion with 12 Q&As
- Evaluator section with profile card avatar and quotation-style recommendation display
- All sections handle null/empty states with appropriate Korean copy

## Task Commits

Each task was committed atomically:

1. **Task 1: Warranty + Home Service sections** - `1f041c0` (feat)
2. **Task 2: Reviews/FAQ + Evaluator sections** - `0ed16a7` (feat)

## Files Created/Modified
- `src/features/vehicles/components/detail/section-warranty.tsx` - Dual warranty progress bars with remaining period/mileage calculation
- `src/features/vehicles/components/detail/section-home-service.tsx` - 4-step flow indicator with Dialog visit reservation
- `src/features/vehicles/components/detail/section-reviews-faq.tsx` - Embla review carousel + Tabs/Accordion FAQ
- `src/features/vehicles/components/detail/section-evaluator.tsx` - Evaluator profile card with quote-style recommendation

## Decisions Made
- Used plain `<span>` elements instead of `ProgressValue` component for warranty date ranges, because base-ui ProgressValue uses a render prop pattern that expects a single child function
- Embedded mock review data as default prop value rather than requiring external data source initially

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ProgressValue render prop incompatibility**
- **Found during:** Task 1 (Warranty section)
- **Issue:** base-ui `ProgressValue` expects a render prop `(formattedValue, value) => ReactNode` as children, not text nodes
- **Fix:** Replaced `ProgressValue` with plain `<span>` elements matching the same styling
- **Files modified:** src/features/vehicles/components/detail/section-warranty.tsx
- **Verification:** `yarn type-check` passes
- **Committed in:** 1f041c0 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor API adaptation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 10 section components now exist for the K Car detail page layout
- Ready for Plan 05 (page orchestrator) to wire sections together with scroll-spy navigation

---
*Phase: 14-vehicle-detail-page*
*Completed: 2026-03-20*
