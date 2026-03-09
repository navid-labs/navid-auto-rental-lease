# Phase 4: Dealer Portal & Approval Workflow - Research

**Researched:** 2026-03-09
**Domain:** Dealer dashboard UI, admin approval queue, Prisma schema extension
**Confidence:** HIGH

## Summary

Phase 4 adds two connected features: (1) a dealer dashboard that consolidates vehicle management with approval status visibility, and (2) an admin approval queue that controls which dealer-registered vehicles become publicly visible. Both features build directly on existing code -- the `VehicleTable` component, `StatusChangeDialog` pattern, `StatusBadge` component, and the `VehicleStatusLog` audit trail model.

The core schema change is adding an `ApprovalStatus` enum and related fields to the `Vehicle` model. The UI work extends existing components rather than creating new ones from scratch. The dealer dashboard merges the existing `/dealer/vehicles` page with a stats sidebar, and the admin approval queue adds a new tab to the existing `/admin/vehicles` page.

**Primary recommendation:** Extend the existing Vehicle model with approval fields via Prisma migration, then layer the dashboard and approval queue UIs on top of existing components. Keep approval status and vehicle status as independent concerns throughout.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dashboard IS the vehicles page -- `/dealer/dashboard` shows vehicle table with stats sidebar, `/dealer/vehicles` redirects to dashboard
- Stats sidebar shows two card groups: approval status breakdown (pending/approved/rejected counts) + vehicle status breakdown (available/reserved/rented counts)
- Desktop: table as main content, stats panel on the side
- Notification dot/count badge on sidebar when approval status changes since last visit
- Contract requests section: UI placeholder with empty state ("Phase 7에서 활성화")
- New "Approval Queue" tab added to existing `/admin/vehicles` page alongside existing status filter tabs
- Reuse and extend existing VehicleTable component for the approval queue view
- Both inline approve/reject (buttons in table row) AND click-through to vehicle detail
- Batch approve: checkbox column on table rows, "Approve Selected" button appears when items selected
- Rejection reason is mandatory with preset quick-select buttons (사진 품질 불량, 정보 불일치, 가격 비현실적) plus free-text option
- Approval confirmation dialog follows existing StatusChangeDialog pattern
- New `ApprovalStatus` enum: PENDING, APPROVED, REJECTED
- Two separate badges per vehicle row: vehicle status badge + approval status badge
- Rejected vehicles: dealer sees rejection reason via tooltip on the badge
- Edit and resubmit flow: dealer edits vehicle -> clicks "Resubmit for Approval" -> status resets to PENDING
- Any edit to an already-approved vehicle resets approval to PENDING
- Admin can revoke approval at any time with a reason
- Admin-registered vehicles are auto-approved on creation
- Dealer-registered vehicles start as PENDING and are NOT publicly visible until APPROVED
- Enforce public visibility filter now (only APPROVED vehicles in public contexts)

### Claude's Discretion
- Mobile stats layout pattern (collapsible, grid, or scroll)
- ApprovalStatus badge colors (suggest: yellow=pending, green=approved, red=rejected)
- Approval log/audit trail implementation details
- Dashboard page transition and loading states
- Batch approve UX details (select all, deselect, confirmation)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VEHI-07 | Admin approval workflow for dealer-registered vehicles | Schema extension (ApprovalStatus enum + fields), approval server actions, approval queue tab in admin vehicles page, visibility filter enforcement |
| DEAL-01 | Dealer dashboard (my vehicles, contract requests, approval status) | Dashboard page with stats sidebar + vehicle table, contract requests placeholder, approval badge on vehicle rows |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15 | App Router, Server Components, Server Actions | Already in project |
| Prisma | 6.x | Schema migration, ORM queries | Already in project |
| Tailwind CSS | 4 | Styling | Already in project |
| shadcn/ui | latest | Dialog, Table, Badge, Card, Tooltip, Checkbox | Already in project |
| class-variance-authority | latest | Badge variant styling | Already used in StatusBadge |
| lucide-react | latest | Icons | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 4.x | Validation for approval actions | Already in project, use for rejection reason validation |

### Alternatives Considered
None -- this phase uses only existing stack. No new dependencies needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/vehicles/
│   ├── actions/
│   │   ├── approve-vehicle.ts          # NEW: approve/reject/revoke actions
│   │   ├── resubmit-vehicle.ts         # NEW: dealer resubmit after rejection
│   │   ├── create-vehicle.ts           # MODIFY: set approvalStatus based on role
│   │   └── update-vehicle.ts           # MODIFY: reset approval on edit
│   ├── components/
│   │   ├── approval-badge.tsx          # NEW: ApprovalStatus badge with tooltip
│   │   ├── approval-dialog.tsx         # NEW: approve/reject dialog (from StatusChangeDialog pattern)
│   │   ├── approval-queue-table.tsx    # NEW: admin approval queue with batch actions
│   │   ├── dealer-stats-sidebar.tsx    # NEW: stats cards for dashboard
│   │   ├── vehicle-table.tsx           # MODIFY: add approval badge column
│   │   └── status-badge.tsx            # NO CHANGE
│   ├── types/
│   │   └── index.ts                    # MODIFY: add ApprovalStatus to VehicleWithDetails
│   └── utils/
│       └── approval-machine.ts         # NEW: approval status transitions
├── app/
│   ├── dealer/
│   │   ├── dashboard/page.tsx          # REWRITE: full dashboard with stats + table
│   │   └── vehicles/page.tsx           # MODIFY: redirect to /dealer/dashboard
│   └── admin/
│       └── vehicles/page.tsx           # MODIFY: add approval queue tab
prisma/
└── schema.prisma                       # MODIFY: add ApprovalStatus enum + fields
```

### Pattern 1: Approval Status as Independent Concern
**What:** ApprovalStatus (PENDING/APPROVED/REJECTED) is separate from VehicleStatus (AVAILABLE/RESERVED/etc.)
**When to use:** Always -- these are orthogonal dimensions
**Example:**
```typescript
// A vehicle can be AVAILABLE (operational) but PENDING (not yet approved for public)
// Two badges side by side in the table row
<StatusBadge status={vehicle.status} />
<ApprovalBadge
  status={vehicle.approvalStatus}
  rejectionReason={vehicle.rejectionReason}
/>
```

### Pattern 2: Role-Based Auto-Approval in Create Action
**What:** Set `approvalStatus` based on the creating user's role
**When to use:** In `createVehicle` server action
**Example:**
```typescript
// In create-vehicle.ts
const vehicle = await prisma.vehicle.create({
  data: {
    ...vehicleData,
    dealerId,
    approvalStatus: user.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
    approvedBy: user.role === 'ADMIN' ? user.id : null,
    approvedAt: user.role === 'ADMIN' ? new Date() : null,
  },
})
```

### Pattern 3: Approval Reset on Edit
**What:** Any edit to an APPROVED vehicle resets approval to PENDING
**When to use:** In `updateVehicle` server action, only for dealer edits
**Example:**
```typescript
// In update-vehicle.ts -- only reset if dealer edits an approved vehicle
const shouldResetApproval =
  user.role === 'DEALER' && vehicle.approvalStatus === 'APPROVED'

await prisma.$transaction(async (tx) => {
  await tx.vehicle.update({
    where: { id: vehicleId },
    data: {
      ...data,
      ...(shouldResetApproval && {
        approvalStatus: 'PENDING',
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
      }),
    },
  })

  if (shouldResetApproval) {
    await tx.approvalLog.create({ ... })
  }
})
```

### Pattern 4: Approval Queue with Batch Actions
**What:** Admin views pending vehicles in a table with checkboxes for batch approve
**When to use:** In admin vehicles page, under "Approval Queue" tab
**Example:**
```typescript
// Separate component that wraps VehicleTable pattern with checkboxes
// State: selectedIds: Set<string>
// Renders "Approve Selected" floating button when selectedIds.size > 0
// Each row has a checkbox + inline approve/reject buttons
```

### Pattern 5: Approval Audit Log (VehicleApprovalLog)
**What:** Dedicated model to track approval status changes (separate from VehicleStatusLog)
**When to use:** Every approval status change gets logged
**Example:**
```typescript
// New model in schema.prisma
model VehicleApprovalLog {
  id             String         @id @default(uuid()) @db.Uuid
  vehicleId      String         @map("vehicle_id") @db.Uuid
  fromStatus     ApprovalStatus @map("from_status")
  toStatus       ApprovalStatus @map("to_status")
  reason         String?
  changedBy      String         @map("changed_by") @db.Uuid
  createdAt      DateTime       @default(now()) @map("created_at")
  // Relations...
}
```

### Anti-Patterns to Avoid
- **Merging approval into VehicleStatus enum:** Keep these as separate enums. VehicleStatus is operational (available/reserved), ApprovalStatus is administrative (pending/approved). Mixing them creates confusing state combinations.
- **Client-side visibility filtering only:** Enforce approval-based visibility at the query/data layer, not just in UI rendering. Use Prisma `where` clauses.
- **Skipping transactions for approval actions:** Approval status change + log creation must be atomic via `$transaction`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Badge with tooltip | Custom hover handler | shadcn Tooltip component | Accessibility, positioning edge cases |
| Confirmation dialogs | Custom modal | Existing Dialog + StatusChangeDialog pattern | Consistency, already battle-tested |
| Batch selection state | Complex reducer | useState with Set<string> | Simple enough, no need for external state |
| Stats aggregation | Client-side counting | Prisma `groupBy` or `count` queries | Server-side is accurate, avoids data transfer |

## Common Pitfalls

### Pitfall 1: Forgetting to Auto-Approve Admin Vehicles
**What goes wrong:** Admin creates vehicle but it shows as PENDING
**Why it happens:** Create action doesn't check user role for initial approval status
**How to avoid:** Set `approvalStatus: user.role === 'ADMIN' ? 'APPROVED' : 'PENDING'` in create action
**Warning signs:** Admin vehicles not appearing in public queries

### Pitfall 2: Approval Reset Race Condition
**What goes wrong:** Dealer edits vehicle while admin is approving -- approval goes through but vehicle content changed
**Why it happens:** No optimistic locking or version check
**How to avoid:** Use `updatedAt` check in approval action -- if vehicle was modified after admin loaded the page, show warning. For v1, acceptable risk since traffic is low.
**Warning signs:** Approved vehicle has different content than what admin reviewed

### Pitfall 3: Missing Public Visibility Filter
**What goes wrong:** PENDING/REJECTED vehicles appear in public search results (Phase 5)
**Why it happens:** Public query doesn't filter by approvalStatus
**How to avoid:** Add `approvalStatus: 'APPROVED'` to every public-facing vehicle query. Even though Phase 5 isn't built yet, the data layer should enforce this NOW.
**Warning signs:** Non-approved vehicles in any public API response

### Pitfall 4: Redirect Loop Between Dashboard and Vehicles
**What goes wrong:** `/dealer/vehicles` redirects to `/dealer/dashboard` which renders the same data
**Why it happens:** Misconfigured redirect
**How to avoid:** Use Next.js `redirect()` in `/dealer/vehicles/page.tsx` to `/dealer/dashboard`. Dashboard renders everything. Simple, no loop possible.
**Warning signs:** Browser shows redirect chain

### Pitfall 5: Stats Sidebar Showing Stale Data
**What goes wrong:** Stats counts don't match table after approval action
**Why it happens:** Stats fetched separately from table data, or not refreshed after action
**How to avoid:** Fetch stats and vehicles in same server component. After approval action, call `router.refresh()` to refetch both.
**Warning signs:** Stats numbers don't add up to total vehicles

## Code Examples

### Schema Migration: ApprovalStatus Enum and Fields
```prisma
enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

model Vehicle {
  // ... existing fields ...
  approvalStatus  ApprovalStatus @default(PENDING) @map("approval_status")
  rejectionReason String?        @map("rejection_reason")
  approvedBy      String?        @map("approved_by") @db.Uuid
  approvedAt      DateTime?      @map("approved_at")
  // Relation for approvedBy
  approver        Profile?       @relation("VehicleApprovers", fields: [approvedBy], references: [id])
}

model VehicleApprovalLog {
  id         String         @id @default(uuid()) @db.Uuid
  vehicleId  String         @map("vehicle_id") @db.Uuid
  fromStatus ApprovalStatus @map("from_status")
  toStatus   ApprovalStatus @map("to_status")
  reason     String?
  changedBy  String         @map("changed_by") @db.Uuid
  createdAt  DateTime       @default(now()) @map("created_at")

  vehicle Vehicle @relation(fields: [vehicleId], references: [id])
  profile Profile @relation(fields: [changedBy], references: [id])

  @@map("vehicle_approval_logs")
}
```

### Approve/Reject Server Action
```typescript
'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import type { ApprovalStatus } from '@prisma/client'

type ApprovalResult = { success: true } | { error: string }

export async function approveVehicle(
  vehicleId: string,
  action: 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<ApprovalResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return { error: '승인 권한이 없습니다.' }

  if (action === 'REJECTED' && !reason?.trim()) {
    return { error: '거절 사유를 입력해주세요.' }
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, approvalStatus: true },
  })
  if (!vehicle) return { error: '차량을 찾을 수 없습니다.' }

  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        approvalStatus: action,
        rejectionReason: action === 'REJECTED' ? reason : null,
        approvedBy: action === 'APPROVED' ? user.id : null,
        approvedAt: action === 'APPROVED' ? new Date() : null,
      },
    })

    await tx.vehicleApprovalLog.create({
      data: {
        vehicleId,
        fromStatus: vehicle.approvalStatus,
        toStatus: action,
        reason: reason ?? null,
        changedBy: user.id,
      },
    })
  })

  return { success: true }
}
```

### Batch Approve Server Action
```typescript
export async function batchApproveVehicles(
  vehicleIds: string[]
): Promise<ApprovalResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return { error: '승인 권한이 없습니다.' }

  await prisma.$transaction(async (tx) => {
    const vehicles = await tx.vehicle.findMany({
      where: { id: { in: vehicleIds }, approvalStatus: 'PENDING' },
      select: { id: true, approvalStatus: true },
    })

    await tx.vehicle.updateMany({
      where: { id: { in: vehicles.map((v) => v.id) } },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: user.id,
        approvedAt: new Date(),
        rejectionReason: null,
      },
    })

    await tx.vehicleApprovalLog.createMany({
      data: vehicles.map((v) => ({
        vehicleId: v.id,
        fromStatus: v.approvalStatus,
        toStatus: 'APPROVED' as ApprovalStatus,
        changedBy: user.id,
      })),
    })
  })

  return { success: true }
}
```

### ApprovalBadge Component
```typescript
import { cva } from 'class-variance-authority'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ApprovalStatus } from '@prisma/client'

const approvalBadgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
  {
    variants: {
      status: {
        PENDING: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700',
      },
    },
  }
)

const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
}

export function ApprovalBadge({
  status,
  rejectionReason,
}: {
  status: ApprovalStatus
  rejectionReason?: string | null
}) {
  const badge = (
    <span className={approvalBadgeVariants({ status })}>
      {APPROVAL_LABELS[status]}
    </span>
  )

  if (status === 'REJECTED' && rejectionReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{rejectionReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}
```

### Stats Sidebar (Dealer Dashboard)
```typescript
// Fetch stats server-side via Prisma groupBy
const [approvalCounts, statusCounts] = await Promise.all([
  prisma.vehicle.groupBy({
    by: ['approvalStatus'],
    where: { dealerId: user.id },
    _count: true,
  }),
  prisma.vehicle.groupBy({
    by: ['status'],
    where: { dealerId: user.id },
    _count: true,
  }),
])
```

### Rejection Presets
```typescript
export const REJECTION_PRESETS = [
  '사진 품질 불량',
  '정보 불일치',
  '가격 비현실적',
] as const

// In rejection dialog: quick-select buttons + free-text textarea
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single status enum for everything | Separate operational + approval enums | Current best practice | Cleaner state management, no invalid combinations |
| Client-side filtering for visibility | Server-side query filter (Prisma where) | Always preferred | Security, data consistency |
| Individual approve API calls | Batch approve with transaction | Common pattern | Admin efficiency for high-volume queues |

## Open Questions

1. **Notification dot persistence**
   - What we know: Badge count on sidebar when approval status changes since last visit
   - What's unclear: How to track "last visit" -- cookie, localStorage, or database field?
   - Recommendation: Use localStorage timestamp. On dashboard load, compare vehicle `updatedAt` against stored timestamp. Simple, no DB change needed.

2. **Existing vehicles migration**
   - What we know: Existing vehicles in DB will get `approvalStatus: PENDING` by default
   - What's unclear: Should existing vehicles be auto-set to APPROVED since they were created before the approval system?
   - Recommendation: Migration should set all existing vehicles to `APPROVED` (they were already visible). Only NEW dealer vehicles start as PENDING.

3. **Tooltip component availability**
   - What we know: CONTEXT.md mentions tooltip for rejection reason
   - What's unclear: Whether shadcn Tooltip is already installed
   - Recommendation: Check during implementation, add via shadcn if missing. Low risk.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (happy-dom) |
| Config file | `vitest.config.mts` |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VEHI-07a | Approve vehicle action sets status to APPROVED | unit | `yarn test src/features/vehicles/actions/approve-vehicle.test.ts -t "approve"` | Wave 0 |
| VEHI-07b | Reject vehicle requires reason | unit | `yarn test src/features/vehicles/actions/approve-vehicle.test.ts -t "reject"` | Wave 0 |
| VEHI-07c | Batch approve sets multiple vehicles to APPROVED | unit | `yarn test src/features/vehicles/actions/approve-vehicle.test.ts -t "batch"` | Wave 0 |
| VEHI-07d | Create vehicle sets PENDING for dealer, APPROVED for admin | unit | `yarn test src/features/vehicles/actions/create-vehicle.test.ts -t "approval"` | existing file, new tests |
| VEHI-07e | Edit approved vehicle resets to PENDING | unit | `yarn test src/features/vehicles/actions/update-vehicle.test.ts -t "approval reset"` | existing file, new tests |
| DEAL-01a | Dealer dashboard renders stats and vehicle table | unit | `yarn test src/app/dealer/dashboard/page.test.tsx` | Wave 0 |
| DEAL-01b | Dealer sees rejection reason on badge | unit | `yarn test src/features/vehicles/components/approval-badge.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test --run`
- **Per wave merge:** `yarn test --run && yarn type-check`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/vehicles/actions/approve-vehicle.test.ts` -- covers VEHI-07a/b/c
- [ ] `src/features/vehicles/components/approval-badge.test.tsx` -- covers DEAL-01b
- [ ] Extend `create-vehicle.test.ts` with approval status tests -- covers VEHI-07d
- [ ] Extend `update-vehicle.test.ts` with approval reset tests -- covers VEHI-07e

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `prisma/schema.prisma`, all files in `src/features/vehicles/`, `src/app/dealer/`, `src/app/admin/`
- Existing patterns: StatusChangeDialog, StatusBadge, VehicleStatusLog, VehicleTable, server actions with $transaction

### Secondary (MEDIUM confidence)
- Prisma enum migration: standard Prisma pattern for adding enums (well-documented, used in this project already)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all existing stack
- Architecture: HIGH - directly extends existing patterns (StatusBadge -> ApprovalBadge, StatusChangeDialog -> ApprovalDialog, VehicleStatusLog -> VehicleApprovalLog)
- Pitfalls: HIGH - all identified from concrete codebase analysis

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- no external dependencies to go stale)
