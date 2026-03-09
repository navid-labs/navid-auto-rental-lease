# Phase 4: Dealer Portal & Approval Workflow - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Dealers get a dedicated dashboard to manage their vehicles and see approval status at-a-glance. Admins control which dealer-registered vehicles appear on the platform through an approval queue. Public search/discovery is Phase 5; contract requests are Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Dealer Dashboard Layout
- Dashboard IS the vehicles page — `/dealer/dashboard` shows vehicle table with stats sidebar, `/dealer/vehicles` redirects to dashboard
- Stats sidebar shows two card groups: approval status breakdown (pending/approved/rejected counts) + vehicle status breakdown (available/reserved/rented counts)
- Desktop: table as main content, stats panel on the side
- Mobile stats layout: Claude's discretion — pick the best pattern for stats + table on small screens
- Notification dot/count badge on sidebar when approval status changes since last visit
- Contract requests section: UI placeholder with empty state ("아직 계약 요청이 없습니다" or "Phase 7에서 활성화") — actual contract logic is Phase 7, but the dashboard slot exists now

### Admin Approval Queue
- New "Approval Queue" tab added to existing `/admin/vehicles` page alongside existing status filter tabs (All, Available, Reserved, etc.)
- Reuse and extend existing VehicleTable component for the approval queue view
- Both inline approve/reject (buttons in table row) AND click-through to vehicle detail for closer inspection
- Batch approve: checkbox column on table rows, "Approve Selected" button appears when items selected
- Rejection reason is mandatory with preset quick-select buttons (사진 품질 불량, 정보 불일치, 가격 비현실적) plus free-text option
- Approval confirmation dialog follows existing StatusChangeDialog pattern

### Approval Status & Lifecycle
- New `ApprovalStatus` enum: PENDING, APPROVED, REJECTED
- Two separate badges per vehicle row: vehicle status badge (Available/Reserved/etc.) + approval status badge (Pending/Approved/Rejected)
- Rejected vehicles: dealer sees rejection reason via tooltip on the badge
- Edit and resubmit flow: dealer sees rejection reason → edits vehicle → clicks "Resubmit for Approval" → status resets to PENDING
- Any edit to an already-approved vehicle resets approval to PENDING (prevents bait-and-switch)
- Admin can revoke approval at any time with a reason (vehicle becomes hidden from public)

### Visibility Rules
- Admin-registered vehicles are auto-approved on creation (admin is trusted)
- Dealer-registered vehicles start as PENDING and are NOT publicly visible until APPROVED
- Enforce public visibility filter now (RLS policy or query filter) — only APPROVED vehicles appear in public contexts
- Even though Phase 5 (public search) isn't built yet, the data layer enforces this rule from Phase 4

### Claude's Discretion
- Mobile stats layout pattern (collapsible, grid, or scroll)
- ApprovalStatus badge colors (suggest: yellow=pending, green=approved, red=rejected)
- Approval log/audit trail implementation details
- Dashboard page transition and loading states
- Batch approve UX details (select all, deselect, confirmation)

</decisions>

<specifics>
## Specific Ideas

- Rejection presets should be in Korean: "사진 품질 불량", "정보 불일치", "가격 비현실적" plus free-text
- Two-badge system keeps vehicle operational status and approval status as independent concepts — important because a vehicle can be AVAILABLE but still PENDING approval
- Tooltip on rejected badge keeps the table compact while still surfacing the reason
- Badge count notification is lightweight — no toast, no push, just a visual indicator on sidebar nav

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/vehicles/components/vehicle-table.tsx`: Table with status filtering tabs — extend with Approval Queue tab
- `src/features/vehicles/components/status-change-dialog.tsx`: Dialog pattern for role-aware actions — copy for approve/reject dialogs
- `src/features/vehicles/components/status-badge.tsx`: Color-coded badge — create matching ApprovalBadge component
- `src/features/vehicles/utils/status-machine.ts`: State machine — may extend or create separate approval state machine
- `src/components/ui/dialog.tsx`, `table.tsx`, `badge.tsx`, `card.tsx`, `textarea.tsx`: All shadcn/ui primitives available

### Established Patterns
- Server Actions with `getCurrentUser()` permission checks + `prisma.$transaction()` for atomicity
- `VehicleStatusLog` for audit trail — same pattern for approval logs
- Role-based query filtering: dealer sees own vehicles, admin sees all
- `force-dynamic` export for admin/dealer pages that query DB at request time

### Integration Points
- Prisma schema needs: `ApprovalStatus` enum, `approvalStatus` field on Vehicle, optional `rejectionReason`, `approvedBy`, `approvedAt` fields
- Dealer sidebar nav already has dashboard/vehicles/contracts/profile items
- Admin sidebar needs vehicles page to support the new approval tab
- Existing VehicleTable component accepts `userRole` and `basePath` props — extend for approval actions

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-dealer-portal-approval-workflow*
*Context gathered: 2026-03-09*
