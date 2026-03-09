---
phase: 04-dealer-portal-approval-workflow
plan: 01
subsystem: database, api
tags: [prisma, approval-workflow, server-actions, cva, shadcn, tooltip]

requires:
  - phase: 03-vehicle-data-storage
    provides: Vehicle model, VehicleStatusLog pattern, StatusBadge component
provides:
  - ApprovalStatus enum and fields on Vehicle model
  - VehicleApprovalLog audit trail model
  - approveVehicle, batchApproveVehicles, resubmitVehicle server actions
  - Approval-aware createVehicle and updateVehicle actions
  - ApprovalBadge component with tooltip for rejection reason
  - approval-machine utility (transition validation, labels, presets)
  - shadcn tooltip and checkbox components
affects: [04-02-dealer-dashboard, 04-03-admin-approval-queue, 05-vehicle-search]

tech-stack:
  added: [shadcn/tooltip, shadcn/checkbox]
  patterns: [approval-status-as-independent-concern, role-based-auto-approval, approval-reset-on-edit, transactional-audit-logging]

key-files:
  created:
    - src/features/vehicles/utils/approval-machine.ts
    - src/features/vehicles/actions/approve-vehicle.ts
    - src/features/vehicles/actions/approve-vehicle.test.ts
    - src/features/vehicles/actions/resubmit-vehicle.ts
    - src/features/vehicles/components/approval-badge.tsx
    - src/components/ui/tooltip.tsx
    - src/components/ui/checkbox.tsx
  modified:
    - prisma/schema.prisma
    - src/features/vehicles/types/index.ts
    - src/features/vehicles/actions/create-vehicle.ts
    - src/features/vehicles/actions/create-vehicle.test.ts
    - src/features/vehicles/actions/update-vehicle.ts
    - src/features/vehicles/actions/update-vehicle.test.ts

key-decisions:
  - "ApprovalStatus kept as separate enum from VehicleStatus (independent concerns)"
  - "base-ui Tooltip (not Radix) -- shadcn v4 uses base-ui, no asChild prop needed"
  - "Dealer resubmit allowed for ADMIN role too for operational flexibility"

patterns-established:
  - "Transactional approval actions: vehicle update + audit log in $transaction"
  - "Role-based auto-approval: ADMIN vehicles skip PENDING status"
  - "Approval reset on dealer edit: APPROVED -> PENDING when dealer modifies"

requirements-completed: [VEHI-07]

duration: 5min
completed: 2026-03-09
---

# Phase 4 Plan 01: Approval Data Layer Summary

**ApprovalStatus enum with audit logging, role-based approval server actions, and ApprovalBadge component with rejection tooltip**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-09T13:58:20Z
- **Completed:** 2026-03-09T14:03:49Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- ApprovalStatus enum (PENDING/APPROVED/REJECTED) added to Vehicle model with VehicleApprovalLog audit trail
- Full set of approval server actions: approve, reject, batch approve, revoke, resubmit -- all with transactional audit logging
- createVehicle auto-approves for ADMIN, defaults to PENDING for DEALER
- updateVehicle resets approval to PENDING when dealer edits an approved vehicle (with audit log)
- ApprovalBadge component with CVA variants and base-ui tooltip for rejection reason display
- All 138 tests passing including 20 new approval tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema migration, approval machine, and approval server actions** - `4c24074` (feat)
2. **Task 2: Modify create/update actions, ApprovalBadge, shadcn components** - `2e2d1e8` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added ApprovalStatus enum, approval fields on Vehicle, VehicleApprovalLog model
- `src/features/vehicles/utils/approval-machine.ts` - Transition validation, Korean labels, rejection presets
- `src/features/vehicles/actions/approve-vehicle.ts` - approveVehicle and batchApproveVehicles server actions
- `src/features/vehicles/actions/resubmit-vehicle.ts` - Dealer resubmit for rejected vehicles
- `src/features/vehicles/actions/approve-vehicle.test.ts` - 13 tests for all approval behaviors
- `src/features/vehicles/types/index.ts` - Added ApprovalStatus import
- `src/features/vehicles/actions/create-vehicle.ts` - Role-based approval status on creation
- `src/features/vehicles/actions/create-vehicle.test.ts` - 2 new approval tests
- `src/features/vehicles/actions/update-vehicle.ts` - Approval reset on dealer edit
- `src/features/vehicles/actions/update-vehicle.test.ts` - 3 new approval reset tests
- `src/features/vehicles/components/approval-badge.tsx` - Badge with CVA + tooltip
- `src/components/ui/tooltip.tsx` - shadcn tooltip (base-ui)
- `src/components/ui/checkbox.tsx` - shadcn checkbox (base-ui)

## Decisions Made
- ApprovalStatus kept as separate enum from VehicleStatus -- these are orthogonal dimensions (operational vs administrative)
- shadcn v4 Tooltip uses base-ui (not Radix), so removed `asChild` prop usage
- Dealer resubmit also allowed for ADMIN role for operational flexibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TooltipTrigger asChild prop**
- **Found during:** Task 2 (ApprovalBadge component)
- **Issue:** shadcn v4 Tooltip uses base-ui which doesn't support `asChild` prop (plan examples used Radix API)
- **Fix:** Removed `asChild` prop from TooltipTrigger
- **Files modified:** src/features/vehicles/components/approval-badge.tsx
- **Verification:** yarn type-check passes
- **Committed in:** 2e2d1e8 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor API difference between Radix and base-ui. No scope creep.

## Issues Encountered
- Database push (`yarn db:push`) failed because no .env file with DATABASE_URL exists -- Prisma client generation succeeded, schema will be applied when database credentials are available

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Approval data layer complete, ready for Plan 02 (Dealer Dashboard UI) and Plan 03 (Admin Approval Queue)
- All approval server actions exported and tested
- ApprovalBadge component ready for integration into vehicle tables
- Database migration needs `yarn db:push` when DATABASE_URL is configured

## Self-Check: PASSED

All 11 key files verified present. Both task commits (4c24074, 2e2d1e8) verified in git log.

---
*Phase: 04-dealer-portal-approval-workflow*
*Completed: 2026-03-09*
