---
phase: 14-vehicle-detail-page
plan: 02
subsystem: ui
tags: [embla-carousel, yarl-lightbox, svg, body-diagram, react-memo]

requires:
  - phase: 14-01
    provides: types.ts with PANEL_COLORS/PANEL_LABELS, VehicleDetailData type, InspectionData schema
provides:
  - SectionGallery component with Embla dual-instance carousel + YARL lightbox
  - BodyDiagramSvg memoized SVG renderer with 5-direction views
  - SectionBodyDiagram section with tooltip interaction and empty state
  - body-diagram-paths.ts SVG path constants for sedan silhouette
affects: [14-05-page-orchestrator]

tech-stack:
  added: []
  patterns: [embla-dual-instance-sync, yarl-lightbox-plugins, react-memo-svg, svg-path-constants-separation]

key-files:
  created:
    - src/features/vehicles/components/detail/section-gallery.tsx
    - src/features/vehicles/components/detail/body-diagram-paths.ts
    - src/features/vehicles/components/detail/body-diagram-svg.tsx
    - src/features/vehicles/components/detail/section-body-diagram.tsx
  modified: []

key-decisions:
  - "Raw useEmblaCarousel over shadcn Carousel wrapper for dual-instance sync"
  - "SVG path data separated into pure data file for maintainability"
  - "React.memo on BodyDiagramSvg to prevent expensive SVG re-renders"
  - "Category tabs use key-based Embla remount instead of scroll reset"

patterns-established:
  - "Embla dual-instance: main + thumbnail with select event sync"
  - "SVG constants file: pure data with PanelPath type, no JSX"
  - "Controlled tooltip: base-ui tooltip with open state for SVG panel hover"

requirements-completed: [DETAIL-01, DETAIL-04]

duration: 3min
completed: 2026-03-20
---

# Phase 14 Plan 02: Complex UI Primitives Summary

**Embla dual-instance image gallery with YARL lightbox and 5-direction SVG body diagram with color-coded panel tooltips**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T02:04:42Z
- **Completed:** 2026-03-20T02:07:39Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Image gallery with main carousel + synchronized thumbnail strip using two Embla instances
- YARL fullscreen lightbox with Thumbnails, Zoom, and Counter plugins
- Category filtering (전체/외관/내부/엔진룸) with Embla key-based remount
- SVG sedan silhouette with 5 view directions (15 panels total)
- Panel color coding (정상/판금/교환) with hover/tap tooltips
- Mobile responsive: dot indicators instead of thumbnails, tap-to-show tooltip

## Task Commits

Each task was committed atomically:

1. **Task 1: Image gallery with Embla dual-instance + YARL lightbox** - `52005fc` (feat)
2. **Task 2: SVG path data + body diagram + tooltip interaction** - `f8021b2` (feat)

## Files Created/Modified
- `src/features/vehicles/components/detail/section-gallery.tsx` - Image gallery with Embla dual-instance sync + YARL lightbox
- `src/features/vehicles/components/detail/body-diagram-paths.ts` - SVG path constants for 5 view directions
- `src/features/vehicles/components/detail/body-diagram-svg.tsx` - Memoized SVG renderer with panel color coding
- `src/features/vehicles/components/detail/section-body-diagram.tsx` - Body diagram section with view selector, tooltip, legend

## Decisions Made
- Used raw `useEmblaCarousel` instead of shadcn Carousel wrapper because dual-instance sync requires direct API access
- SVG paths separated into pure data file (body-diagram-paths.ts) to keep component files focused on rendering logic
- React.memo on BodyDiagramSvg to avoid expensive SVG re-renders when only tooltip state changes
- Category tabs trigger Embla remount via React key (per RESEARCH.md Pitfall 4) rather than trying to reset scroll position

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SectionGallery and SectionBodyDiagram ready to be wired into page orchestrator in Plan 05
- Both components handle empty/null states
- All acceptance criteria verified via type-check and build

## Self-Check: PASSED
- All 4 created files verified on disk
- Commits 52005fc and f8021b2 verified in git log

---
*Phase: 14-vehicle-detail-page*
*Completed: 2026-03-20*
