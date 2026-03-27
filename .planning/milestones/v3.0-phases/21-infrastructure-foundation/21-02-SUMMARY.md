---
phase: 21-infrastructure-foundation
plan: 02
subsystem: ui
tags: [css, fonts, pretendard, design-tokens, tailwind, cdn]

# Dependency graph
requires:
  - phase: none
    provides: existing globals.css with shadcn + K Car tokens
provides:
  - Pretendard Variable CDN dynamic subset font loading (<300KB per page)
  - 9 brand CSS custom property tokens in :root, .dark, and @theme inline
  - Tailwind utility class access via --color-brand-* mappings
affects: [23-design-system-migration, 24-performance-optimization]

# Tech tracking
tech-stack:
  added: [pretendard-cdn-dynamic-subset]
  patterns: [css-custom-property-brand-tokens, cdn-font-loading]

key-files:
  created: []
  modified:
    - src/app/globals.css
    - package.json

key-decisions:
  - "Used jsDelivr CDN with Pretendard Variable dynamic subset for Korean glyph coverage"
  - "Defined 9 brand tokens matching hex audit clusters for Phase 23 migration"

patterns-established:
  - "Brand tokens: --brand-* in :root, --color-brand-* in @theme inline for Tailwind"
  - "CDN font: dynamic subset for CJK glyphs instead of npm package with Latin-only subsets"

requirements-completed: [PERF-01, DS-02]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 21 Plan 02: Font & Token Foundation Summary

**Pretendard CDN dynamic subset replacing broken @fontsource (3MB to <300KB) and 9 brand CSS tokens for Phase 23 migration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T05:03:31Z
- **Completed:** 2026-03-27T05:06:27Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced @fontsource/pretendard (3MB Latin-only subsets, zero Korean glyphs) with jsDelivr CDN dynamic subset (<300KB with full Korean coverage)
- Defined 9 brand CSS custom property tokens (brand-blue, brand-navy, brand-bg, brand-text, text-tertiary, accent-muted, surface-hover, border-subtle, text-caption) in :root, .dark, and @theme inline
- All 425 tests pass, production build succeeds with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace @fontsource/pretendard with Pretendard CDN dynamic subset** - `a8aec44` (feat)
2. **Task 2: Define brand CSS custom property tokens** - `e8a8cb1` (feat)

## Files Created/Modified
- `src/app/globals.css` - CDN font import, "Pretendard Variable" font-family, 9 brand tokens in :root/.dark/@theme inline
- `package.json` - Removed @fontsource/pretendard dependency

## Decisions Made
- Used jsDelivr CDN with pinned version v1.3.9 for Pretendard Variable dynamic subset -- provides Korean glyph coverage that @fontsource Latin-only subsets lacked
- Added "Pretendard Variable" as primary font-family with "Pretendard" fallback for local installations
- Defined 9 brand tokens covering all major color clusters from hex audit -- definition only, migration to Phase 23

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Brand CSS tokens defined and ready for Phase 23 design system migration
- Pretendard font now properly loads Korean glyphs via CDN dynamic subset
- All existing tests and build pass without regressions

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 21-infrastructure-foundation*
*Completed: 2026-03-27*
