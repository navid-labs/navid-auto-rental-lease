---
phase: 24-performance-optimization
plan: 01
subsystem: performance
tags: [next-dynamic, framer-motion, code-splitting, bundle-optimization, turbopack]

# Dependency graph
requires:
  - phase: 23-design-system-migration
    provides: Public layout with framer-motion layout components
provides:
  - Dynamic import pattern for framer-motion layout components via DynamicOverlays wrapper
  - framer-motion removed from initial shared JS bundle for all public pages
affects: [24-02-PLAN, performance-optimization]

# Tech tracking
tech-stack:
  added: []
  patterns: [client wrapper for next/dynamic ssr:false in Server Components]

key-files:
  created:
    - src/components/layout/dynamic-overlays.tsx
  modified:
    - src/app/(public)/layout.tsx

key-decisions:
  - "Client wrapper pattern (DynamicOverlays) for next/dynamic ssr:false -- Next.js 16 does not allow ssr:false in Server Components"

patterns-established:
  - "DynamicOverlays wrapper: Use a 'use client' intermediary component when Server Component layouts need ssr:false dynamic imports"

requirements-completed: [PERF-02]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 24 Plan 01: Dynamic Import Layout Components Summary

**framer-motion (~124KB) removed from initial shared JS bundle by dynamically importing FloatingCTA, RecentlyViewedDrawer, and ComparisonBar via a client-side DynamicOverlays wrapper**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T07:23:32Z
- **Completed:** 2026-03-27T07:28:45Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- Created `DynamicOverlays` client wrapper component that dynamically imports all 3 framer-motion layout components with `ssr: false`
- Replaced 3 static imports in public layout with single `DynamicOverlays` component
- framer-motion no longer appears in homepage client reference manifest -- loaded lazily only when overlay components mount
- Build succeeds (Next.js 16.1.6 Turbopack), all 448 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Dynamic import framer-motion layout components** - `1cb5caa` (perf)
2. **Task 2: Verify bundle improvement** - No file changes (verification only, results documented below)

## Bundle Analysis Results

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| framer-motion in homepage manifest | Yes | No | Removed from critical path |
| framer-motion chunk (production) | `d976f28a3ec81b69.js` (124KB) | `757bca98bcc10868.js` (138KB, lazy) | Deferred to lazy load |
| Build time | 4.4s | 4.4s | No change |
| Test suite | 448 passed | 448 passed | No regressions |

Note: Next.js 16 with Turbopack does not display per-route size columns in build output, so exact route-level First Load JS comparison is not available. The key improvement is verified through manifest analysis: framer-motion chunks are no longer referenced in server manifests and will only load when the DynamicOverlays client component mounts.

## Files Created/Modified
- `src/components/layout/dynamic-overlays.tsx` - Client wrapper that dynamically imports FloatingCTA, RecentlyViewedDrawer, ComparisonBar with ssr:false
- `src/app/(public)/layout.tsx` - Replaced 3 static imports with single DynamicOverlays import

## Decisions Made
- **Client wrapper pattern for ssr:false**: Next.js 16 disallows `ssr: false` in `next/dynamic` within Server Components. Created a `'use client'` intermediary component (`DynamicOverlays`) that houses all 3 dynamic imports. This is functionally equivalent to the plan's approach but compatible with the Server Component constraint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created DynamicOverlays client wrapper for ssr:false compatibility**
- **Found during:** Task 1 (Dynamic import implementation)
- **Issue:** Plan specified placing `next/dynamic` with `ssr: false` directly in the Server Component layout. Next.js 16 does not allow `ssr: false` in Server Components, causing build failure.
- **Fix:** Created `src/components/layout/dynamic-overlays.tsx` as a `'use client'` wrapper that contains all 3 dynamic imports. The layout imports this single component instead.
- **Files modified:** src/components/layout/dynamic-overlays.tsx (created), src/app/(public)/layout.tsx
- **Verification:** `bun run build` succeeds, `bun run test` passes all 448 tests
- **Committed in:** 1cb5caa (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The client wrapper achieves the same bundle optimization goal. No scope creep -- the deviation is a necessary adaptation to Next.js 16 Server Component constraints.

## Issues Encountered
- Next.js 16 Turbopack does not show per-route size columns in `bun run build` output, making before/after size comparison at route level impossible. Verification was done through manifest analysis instead.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dynamic import pattern established for layout components
- Ready for Plan 24-02 (additional performance optimizations)
- No blockers

## Self-Check: PASSED

- [x] `src/components/layout/dynamic-overlays.tsx` exists
- [x] `src/app/(public)/layout.tsx` imports `DynamicOverlays` (no static framer-motion imports)
- [x] Commit `1cb5caa` exists
- [x] `bun run build` succeeds
- [x] All 448 tests pass

---
*Phase: 24-performance-optimization*
*Completed: 2026-03-27*
