---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, tailwind-v4, shadcn-ui, supabase, prisma, rls, pretendard, vitest, korean-locale]

requires:
  - phase: none
    provides: greenfield project

provides:
  - Next.js 15 App Router with Tailwind CSS v4 and Pretendard font
  - shadcn/ui component library (button, sheet, navigation-menu, separator)
  - Three Supabase client factories (browser, server, admin)
  - Prisma schema with 13 models and RLS on all tables
  - Auth token refresh middleware
  - Korean locale formatters (KRW, date, distance, year model)
  - Vitest test framework with happy-dom

affects: [01-02, authentication, vehicles, contracts, all-phases]

tech-stack:
  added: [next@16, react@19, tailwindcss@4, shadcn-ui, supabase-ssr, prisma@6, vitest@4, happy-dom, pretendard]
  patterns: [supabase-three-clients, prisma-singleton, rls-deny-all, intl-api-formatting, css-first-tailwind]

key-files:
  created:
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/admin.ts
    - src/lib/db/prisma.ts
    - src/middleware.ts
    - src/lib/utils/format.ts
    - src/types/index.ts
    - prisma/schema.prisma
    - prisma/migrations/00000000000000_rls_setup/migration.sql
    - vitest.config.mts
  modified:
    - package.json
    - .gitignore
    - components.json

key-decisions:
  - "Used Prisma 6.x instead of 7.x due to Node 21 compatibility"
  - "Switched Yarn to node-modules linker for Turbopack and Vitest ESM compatibility"
  - "Used happy-dom instead of jsdom for better ESM support in test environment"
  - "Used HSL colors (not OKLCH) for dark navy + gold theme per RESEARCH.md spec"
  - "Truncate (not round) distance values in compact man-unit format for consistency"

patterns-established:
  - "Supabase three-client pattern: browser (createBrowserClient), server (createServerClient with cookies), admin (createClient with service_role)"
  - "Prisma globalThis singleton to prevent connection leak in dev"
  - "RLS deny-all with raw SQL migration, allow policies added per phase"
  - "Korean locale formatters using Intl API for zero bundle cost"
  - "CSS-first Tailwind v4 with @theme inline (no tailwind.config.ts)"

requirements-completed: [UIEX-01]

duration: 9min
completed: 2026-03-09
---

# Phase 1 Plan 01: Project Scaffold Summary

**Next.js 15 with Tailwind v4 dark navy/gold theme, Prisma 13-model schema with RLS, three Supabase clients, and TDD Korean locale formatters**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-09T10:25:50Z
- **Completed:** 2026-03-09T10:35:00Z
- **Tasks:** 3 (+ 1 TDD RED commit)
- **Files modified:** 21

## Accomplishments
- Next.js 15 app builds and runs with Tailwind v4 dark navy + gold theme and Pretendard Korean font
- Prisma schema with all 13 core models (Profile, Brand, CarModel, Generation, Trim, Vehicle, VehicleImage, RentalContract, LeaseContract, Payment, Inquiry, ResidualValueRate) validated
- RLS enabled on all 12 tables with deny-all default and auth.users profile sync trigger
- Three Supabase clients (browser, server, admin) with auth token refresh middleware
- Korean locale formatters (formatKRW, formatDate, formatDistance, formatYearModel) with 8 passing tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 with Tailwind v4, shadcn/ui** - `00900d8` (feat)
2. **Task 2: Supabase clients, Prisma schema with RLS, middleware** - `529c18a` (feat)
3. **Task 3 RED: Failing locale formatter tests** - `00331bb` (test)
4. **Task 3 GREEN: Implement locale formatters** - `789624b` (feat)

## Files Created/Modified
- `package.json` - Project config with all scripts (dev, build, test, db commands)
- `src/app/globals.css` - Dark navy + gold theme with Pretendard font, Tailwind v4 @theme inline
- `src/app/layout.tsx` - Root layout with lang=ko and Korean metadata
- `src/app/page.tsx` - Placeholder page confirming theme works
- `src/lib/supabase/client.ts` - Browser Supabase client factory
- `src/lib/supabase/server.ts` - Server Supabase client with cookie handling
- `src/lib/supabase/admin.ts` - Admin Supabase client (service_role, no session)
- `src/lib/db/prisma.ts` - Prisma client singleton
- `src/middleware.ts` - Auth token refresh on every request
- `src/lib/utils/format.ts` - Korean locale formatters (KRW, date, distance, year model)
- `src/lib/utils/format.test.ts` - 8 test cases for all formatters
- `src/types/index.ts` - Re-exports of Prisma-generated types and enums
- `prisma/schema.prisma` - Full database schema with 13 models
- `prisma/migrations/00000000000000_rls_setup/migration.sql` - RLS enable + profile sync trigger
- `vitest.config.mts` - Vitest with happy-dom and path aliases
- `components.json` - shadcn/ui configuration
- `.yarnrc.yml` - Yarn node-modules linker config
- `.gitignore` - Updated for Yarn 4 and project needs

## Decisions Made
- **Prisma 6 over 7:** Node 21.5.0 not supported by Prisma 7 (requires Node 20.19+ or 22.12+). Prisma 6.19.2 works correctly.
- **Yarn node-modules linker:** PnP caused ESM compatibility issues with Turbopack and Vitest/Vite 7. Switched to node-modules linker for full compatibility.
- **happy-dom over jsdom:** jsdom had ESM require() errors with Node 21. happy-dom provides better ESM compatibility.
- **Distance truncation:** formatDistance compact mode truncates to 1 decimal (12500 -> 1.2만) rather than rounding (would give 1.3만), matching expected Korean display convention.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Yarn PnP to node-modules linker**
- **Found during:** Task 1 (build verification)
- **Issue:** Yarn PnP caused Turbopack build failure and Vitest ESM errors
- **Fix:** Created .yarnrc.yml with nodeLinker: node-modules, reinstalled
- **Files modified:** .yarnrc.yml
- **Verification:** yarn build succeeds, yarn test loads config
- **Committed in:** 00900d8

**2. [Rule 3 - Blocking] Prisma 7 to Prisma 6 downgrade**
- **Found during:** Task 2 (Prisma installation)
- **Issue:** Prisma 7 requires Node 20.19+ or 22.12+, project runs Node 21.5.0
- **Fix:** Installed prisma@^6 and @prisma/client@^6
- **Files modified:** package.json, yarn.lock
- **Verification:** npx prisma validate succeeds
- **Committed in:** 529c18a

**3. [Rule 3 - Blocking] jsdom to happy-dom**
- **Found during:** Task 3 (test execution)
- **Issue:** jsdom ESM require() error with Node 21
- **Fix:** Installed happy-dom, updated vitest.config.mts
- **Files modified:** vitest.config.mts, package.json
- **Verification:** yarn test passes all 8 tests
- **Committed in:** 00331bb

**4. [Rule 1 - Bug] Distance compact formatting truncation**
- **Found during:** Task 3 (GREEN phase)
- **Issue:** toFixed(1) rounded 1.25 to 1.3 instead of expected 1.2
- **Fix:** Changed formula to Math.floor(km/1000)/10 for truncation
- **Files modified:** src/lib/utils/format.ts
- **Verification:** All 8 tests pass
- **Committed in:** 789624b

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug)
**Impact on plan:** All fixes necessary for Node 21 compatibility and correctness. No scope creep.

## Issues Encountered
- Next.js 16/Turbopack shows deprecation warning for middleware.ts ("use proxy instead") but still works correctly. No action needed for Phase 1.

## User Setup Required
None - no external service configuration required. Database connection (Supabase) env vars needed when running db:push/migrate but schema validation works without them.

## Next Phase Readiness
- All infrastructure ready for Plan 02 (layout shell with header, footer, sidebar)
- shadcn/ui components (button, sheet, navigation-menu, separator) installed for layout
- Design tokens (dark navy + gold) configured in globals.css
- Database schema ready for Phase 2 auth implementation

---
*Phase: 01-foundation*
*Completed: 2026-03-09*
