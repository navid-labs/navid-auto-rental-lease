# Phase 7: Contract Engine - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can apply for rental/lease contracts through a complete multi-step wizard with mock identity verification and real-time status tracking. Covers: contract application flow (CONT-01), mock eKYC (CONT-02), contract state machine (CONT-06), real-time status updates via Supabase Realtime (CONT-05), admin approval gate (CONT-07), and concurrent application prevention. Contract PDF generation and My Page are Phase 8. Full admin dashboard is Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Application Flow UX
- Wizard step structure: Claude's discretion (5-step matching CONT-01 flow or optimized variant)
- Entry point: Claude's discretion (vehicle detail page CTA, standalone page, or both)
- Draft persistence: Claude's discretion (auto-save to DB per step or in-memory only)
- Post-submit experience: Claude's discretion (status tracker page or simple confirmation)

### eKYC Verification UI
- Mock eKYC approach: Claude's discretion (realistic ID scan simulation or form-based verification)
- Skip option: Claude's discretion (dev-only skip or always required)
- ID types supported: Claude's discretion (주민등록증 + 운전면허증 or single type)
- Verification persistence: Claude's discretion (per-user reuse or per-contract)

### Real-time Status Updates
- Display pattern: Claude's discretion (toast + auto-refresh or live badge update)
- Realtime scope: Claude's discretion (contract status only or + vehicle availability)
- Concurrency handling: Claude's discretion (DB-level lock at start or optimistic lock at submit)
- Fallback behavior: Claude's discretion (polling fallback or reconnection banner)

### Contract Terms Selection
- Terms UI: Claude's discretion (reuse Phase 6 calculator inline or simplified selector)
- Start date: Claude's discretion (user picks or auto-set after approval)
- Mileage limits for lease: Claude's discretion (include standard tiers or skip for v1)
- Review step layout: Claude's discretion (summary card or contract preview)

### Claude's Discretion
All implementation decisions for this phase are at Claude's discretion. The user trusts the builder to make UX and technical decisions based on:
- Existing codebase patterns (vehicle wizard, status machine, finance library)
- CONT-01 through CONT-07 requirements as hard constraints
- Korean rental/lease industry conventions
- Demo/investor-ready quality level
- Consistency with Phase 5/6 UI patterns

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User deferred all decisions to Claude's best judgment based on codebase patterns and requirements.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/vehicles/components/vehicle-wizard.tsx`: 3-step wizard with progress bar, step validation, useTransition — extend to contract wizard
- `src/features/vehicles/utils/status-machine.ts`: Status transition map + canTransition() helper — template for contract state machine
- `src/features/vehicles/utils/approval-machine.ts`: Approval workflow transitions — reuse pattern for contract approval
- `src/lib/finance/calculate.ts`: calculateRental(), calculateLease() — populate contract payment fields
- `src/lib/finance/quote-calculator.ts`: calculateQuote() — full breakdown with taxes for contract review
- `src/lib/utils/format.ts`: formatKRW(), formatDate() — contract display formatting
- `src/components/ui/`: Button, Card, Dialog, Input, Label, Badge, Slider, Table — all available
- `src/features/pricing/components/pricing-calculator.tsx`: Interactive rental/lease comparison — potential reuse in terms step

### Established Patterns
- Server Actions for form mutations (auth, vehicles, pricing) — use for contract CRUD
- Zod + react-hook-form + zodResolver pattern for validation
- Server Components by default, 'use client' only for interactive components
- force-dynamic for admin pages with DB queries
- Prisma $transaction for atomic multi-model updates
- vi.hoisted() pattern for vitest mocks
- Admin force override for any status transition (operational flexibility)

### Integration Points
- Prisma `RentalContract` / `LeaseContract` / `Payment` models already in schema
- Prisma `ContractStatus` enum: DRAFT, PENDING_EKYC, PENDING_APPROVAL, APPROVED, ACTIVE, COMPLETED, CANCELED
- Vehicle detail page (`src/features/vehicles/components/public-vehicle-detail.tsx`): Add contract CTA
- Admin sidebar (`src/components/layout/admin-sidebar.tsx`): Add contract approval menu item
- Supabase client (`src/lib/supabase/client.ts`): Add Realtime subscription (first usage in project)
- `src/lib/auth/helpers.ts`: getCurrentUser() for ownership/permission checks

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-contract-engine*
*Context gathered: 2026-03-10*
