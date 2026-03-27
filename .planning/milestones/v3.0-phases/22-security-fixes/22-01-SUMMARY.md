---
phase: 22-security-fixes
plan: 01
subsystem: security
tags: [auth, argon2id, bun, password-hashing, api-guards]

requires:
  - phase: 21-infrastructure
    provides: API auth helpers (requireAuth, requireAdmin) in src/lib/api/auth.ts
provides:
  - Auth guard on /api/admin/inventory/quote-pdf (requireAdmin)
  - Auth guard on /api/contracts/ekyc/send-code (requireAuth)
  - Argon2id password verification via Bun.password in settings auth
  - Backwards-compatible plaintext password support during migration
affects: [settings, contracts, inventory, admin]

tech-stack:
  added: ["@types/bun"]
  patterns: ["argon2id hash detection via $argon2 prefix", "Bun.password.verify for hashed passwords"]

key-files:
  created:
    - tests/unit/features/settings/verify-password.test.ts
  modified:
    - src/app/api/admin/inventory/quote-pdf/route.ts
    - src/app/api/contracts/ekyc/send-code/route.ts
    - src/features/settings/mutations/auth.ts
    - package.json

key-decisions:
  - "Argon2id detection by $argon2 prefix in stored value, plaintext fallback for backwards compat"
  - "requireAuth (not requireAdmin) for ekyc/send-code -- any authenticated user can request verification codes"
  - "Installed @types/bun for Bun.password type definitions"

patterns-established:
  - "Argon2 migration pattern: check $argon2 prefix to distinguish hashed vs plaintext passwords"
  - "Global Bun mock pattern: set globalThis.Bun in vitest tests for Bun-specific APIs"

requirements-completed: [SEC-02, SEC-03]

duration: 6min
completed: 2026-03-27
---

# Phase 22 Plan 01: Auth Guards + Argon2id Password Hashing Summary

**Auth guards added to 2 unprotected endpoints (quote-pdf, ekyc) and password verification migrated from plaintext to argon2id via Bun.password**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T05:36:35Z
- **Completed:** 2026-03-27T05:43:24Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 5

## Accomplishments
- POST /api/admin/inventory/quote-pdf now requires admin authentication (401/403 without)
- POST /api/contracts/ekyc/send-code now requires user authentication (401 without)
- Password verification uses Bun.password.verify for argon2id hashed passwords
- Backwards compatibility maintained: plaintext stored passwords still work during migration
- 7 unit tests covering empty, wrong, correct, plaintext compat, argon2 verification, default fallback

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Add failing tests for argon2id password verification** - `ce69c55` (test)
2. **Task 1 (GREEN): Implement auth guards and argon2id verification** - `4111194` (feat)

_TDD task with RED and GREEN commits._

## Files Created/Modified
- `tests/unit/features/settings/verify-password.test.ts` - 7 tests for password verification with argon2id, plaintext compat, and edge cases
- `src/app/api/admin/inventory/quote-pdf/route.ts` - Added requireAdmin auth guard
- `src/app/api/contracts/ekyc/send-code/route.ts` - Added requireAuth auth guard
- `src/features/settings/mutations/auth.ts` - Argon2id hash verification via Bun.password.verify with plaintext fallback
- `package.json` - Added @types/bun devDependency

## Decisions Made
- Used `requireAuth()` (not `requireAdmin()`) for ekyc/send-code endpoint since any authenticated user should be able to request verification codes
- Detect argon2 hashes by checking `$argon2` prefix in stored value, enabling gradual migration
- Keep `DEFAULT_PASSWORD = 'admin1234'` as plaintext fallback when no DB record exists

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed @types/bun for TypeScript compilation**
- **Found during:** Task 1 GREEN phase
- **Issue:** `Bun.password.verify` caused TS2867: "Cannot find name 'Bun'. Do you need to install type definitions for Bun?"
- **Fix:** Ran `bun add -D @types/bun` to install type definitions
- **Files modified:** package.json, bun.lock
- **Verification:** `bun run type-check` passes clean
- **Committed in:** 4111194 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for TypeScript compilation. No scope creep.

## Issues Encountered
- vitest runs in happy-dom environment where `Bun` global is not available. Solved by mocking `globalThis.Bun` with `vi.fn()` mock for `Bun.password.verify` in the test file.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth guards pattern established for all admin and user endpoints
- Password hashing migration path in place (detect $argon2 prefix for new hashes, plaintext for old)
- Ready for Plan 22-02 (image upload validation)

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 22-security-fixes*
*Completed: 2026-03-27*
