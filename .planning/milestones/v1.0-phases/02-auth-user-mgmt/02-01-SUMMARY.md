---
phase: 02-auth-user-mgmt
plan: 01
subsystem: auth
tags: [supabase-auth, zod, react-hook-form, rbac, rls, middleware, server-actions]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase client utils, Prisma schema with Profile model, middleware shell, UI primitives
provides:
  - Email/password auth flow (signup, login, logout Server Actions)
  - Zod validation schemas (login, signup, profileUpdate)
  - Role-based middleware route protection
  - getCurrentUser() cached helper
  - Profiles RLS policies and auto-creation trigger
  - Auth page layout with glassmorphism card
  - Korean auth error message mapping
affects: [02-auth-user-mgmt plan 02, 03-vehicle-catalog, 07-contract-engine]

# Tech tracking
tech-stack:
  added: [zod@3.x, react-hook-form@7.x, @hookform/resolvers@3.x]
  patterns: [Server Actions for auth mutations, vi.hoisted() for Vitest mock factories, TDD red-green for all tasks]

key-files:
  created:
    - src/features/auth/schemas/auth.ts
    - src/features/auth/utils/error-messages.ts
    - src/lib/auth/helpers.ts
    - src/features/auth/actions/login.ts
    - src/features/auth/actions/signup.ts
    - src/features/auth/actions/logout.ts
    - src/features/auth/components/login-form.tsx
    - src/features/auth/components/signup-form.tsx
    - src/features/auth/components/logout-button.tsx
    - src/app/(auth)/layout.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/signup/page.tsx
    - prisma/migrations/20260309_profiles_rls/migration.sql
    - tests/helpers/mock-supabase.ts
    - src/middleware.test.ts
    - src/features/auth/schemas/auth.test.ts
    - src/features/auth/actions/signup.test.ts
    - src/features/auth/actions/login.test.ts
    - src/features/auth/actions/logout.test.ts
  modified:
    - src/middleware.ts
    - package.json

key-decisions:
  - "Used vi.hoisted() for Vitest mock factories to avoid hoisting issues with vi.mock"
  - "Zod 3.x chosen over 4.x for @hookform/resolvers compatibility"
  - "shadcn card/label/input components added for auth forms"

patterns-established:
  - "Server Action pattern: 'use server' + Zod safeParse + Supabase client + Korean error return"
  - "vi.hoisted() + vi.mock() pattern for Supabase mocking in Vitest"
  - "Middleware role check: only query profiles table for protected/auth routes"
  - "Auth page layout: glassmorphism centered card with route group (auth)"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-06]

# Metrics
duration: 6min
completed: 2026-03-09
---

# Phase 2 Plan 01: Auth Flow Summary

**Email/password auth with Supabase Server Actions, Zod validation, and middleware role-based route protection**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-09T11:42:48Z
- **Completed:** 2026-03-09T11:49:00Z
- **Tasks:** 3
- **Files modified:** 21

## Accomplishments
- Signup/login/logout Server Actions with Zod validation and Korean error messages
- Login and signup pages at /login and /signup with centered glassmorphism card layout
- Middleware protects /admin (ADMIN only), /dealer (DEALER+ADMIN), /mypage (all authenticated)
- 43 unit tests passing across 6 test files (schemas, actions, middleware)
- Profiles RLS migration SQL ready with auto-creation trigger

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth schemas, helpers, error mapping, RLS migration, test infra** - `900f689` (feat)
2. **Task 2: Auth Server Actions and form pages** - `f2fd01f` (feat)
3. **Task 3: Middleware route protection with role-based access** - `2f3ce4d` (feat)

## Files Created/Modified
- `src/features/auth/schemas/auth.ts` - Zod schemas for login, signup, profile update with Korean messages
- `src/features/auth/utils/error-messages.ts` - Supabase error to Korean message mapping
- `src/lib/auth/helpers.ts` - getCurrentUser() with React.cache() wrapping
- `src/features/auth/actions/login.ts` - Login Server Action with role-based redirect
- `src/features/auth/actions/signup.ts` - Signup Server Action with validation
- `src/features/auth/actions/logout.ts` - Logout Server Action
- `src/features/auth/components/login-form.tsx` - Login form with react-hook-form + zodResolver
- `src/features/auth/components/signup-form.tsx` - Signup form with password match validation
- `src/features/auth/components/logout-button.tsx` - Logout button with pending state
- `src/app/(auth)/layout.tsx` - Glassmorphism centered card auth layout
- `src/app/(auth)/login/page.tsx` - Login page with Korean metadata
- `src/app/(auth)/signup/page.tsx` - Signup page with Korean metadata
- `src/middleware.ts` - Extended with PROTECTED_ROUTES role-based guards
- `prisma/migrations/20260309_profiles_rls/migration.sql` - RLS policies + auto-creation trigger
- `tests/helpers/mock-supabase.ts` - Reusable Supabase mock factory
- `src/components/ui/card.tsx` - shadcn Card component
- `src/components/ui/input.tsx` - shadcn Input component
- `src/components/ui/label.tsx` - shadcn Label component

## Decisions Made
- Used `vi.hoisted()` for Vitest mock factories to resolve hoisting issues with `vi.mock` and top-level variables
- Chose Zod 3.x over 4.x for confirmed @hookform/resolvers compatibility
- Added shadcn card/label/input components for auth forms (not pre-installed)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed vi.mock hoisting issue in test files**
- **Found during:** Task 2 (Action tests)
- **Issue:** `vi.mock` factory references `mockClient` variable which is defined after the hoisted mock call, causing "Cannot access before initialization" error
- **Fix:** Switched to `vi.hoisted()` pattern for all mock factories across all test files
- **Files modified:** signup.test.ts, login.test.ts, logout.test.ts
- **Verification:** All 9 action tests pass
- **Committed in:** f2fd01f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test mock pattern adjusted for Vitest hoisting behavior. No scope creep.

## Issues Encountered
- Next.js 16 deprecation warning for "middleware" convention (recommends "proxy") -- ignored as middleware still works and proxy convention is not yet standard

## User Setup Required
None - no external service configuration required. RLS migration SQL is ready but should be applied to the Supabase project when database access is available.

## Next Phase Readiness
- Auth flow complete, ready for Plan 02 (profile management, admin role change)
- getCurrentUser() helper available for all Server Components needing user context
- Middleware route protection active for all role-gated areas
- Mock Supabase test utility ready for reuse in future action tests

---
*Phase: 02-auth-user-mgmt*
*Completed: 2026-03-09*
