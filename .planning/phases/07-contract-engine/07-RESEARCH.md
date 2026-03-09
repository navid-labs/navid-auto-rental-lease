# Phase 7: Contract Engine - Research

**Researched:** 2026-03-10
**Domain:** Multi-step contract application, eKYC verification, state machine, Supabase Realtime
**Confidence:** HIGH

## Summary

Phase 7 builds the core contract application flow -- a multi-step wizard that takes a customer from vehicle selection through terms configuration, identity verification (mock eKYC), review, and submission. The phase also introduces Supabase Realtime for the first time in the project to push contract/vehicle status updates to connected clients, and builds a contract state machine following the established status-machine pattern from Phase 3.

The existing codebase provides strong foundations: the VehicleWizard component (3-step wizard with progress bar, useTransition, server actions), status-machine.ts/approval-machine.ts (state transition patterns), finance calculation library (calculateRental/calculateLease/calculateQuote), and PricingCalculator component (slider-based terms selection). The Prisma schema already defines `RentalContract`, `LeaseContract`, `ContractStatus` enum (DRAFT through CANCELED), `ContractType`, and `Payment` models. No contract feature code exists yet -- this is a greenfield build on existing schema.

**Primary recommendation:** Build a 4-step contract wizard (vehicle confirm, terms, eKYC, review+submit) as a client component under `src/features/contracts/`, using server actions for mutations, the existing finance library for calculations, and a new contract-machine.ts following the status-machine.ts pattern. Add Supabase Realtime subscriptions on the browser client for live status badges. Prevent double-booking with a Prisma `$transaction` check at contract creation time.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation decisions for this phase are at Claude's discretion. The user trusts the builder to make UX and technical decisions based on:
- Existing codebase patterns (vehicle wizard, status machine, finance library)
- CONT-01 through CONT-07 requirements as hard constraints
- Korean rental/lease industry conventions
- Demo/investor-ready quality level
- Consistency with Phase 5/6 UI patterns

### Claude's Discretion
- **Application Flow UX**: Wizard step structure, entry point, draft persistence, post-submit experience
- **eKYC Verification UI**: Mock approach, skip option, ID types, verification persistence
- **Real-time Status Updates**: Display pattern, scope, concurrency handling, fallback
- **Contract Terms Selection**: Terms UI, start date, mileage limits, review step layout

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | Multi-step contract application form (vehicle, terms, eKYC, review, submit) | 4-step wizard following VehicleWizard pattern; concept image confirms layout |
| CONT-02 | Mock eKYC flow with ID verification UI (real API in v2) | Korean PASS-style phone verification form per concept image; mock provider pattern (like MockPlateProvider) |
| CONT-05 | Real-time vehicle/contract status updates via Supabase Realtime | Supabase postgres_changes subscription on contract tables; browser client hook |
| CONT-06 | Contract state machine with explicit transitions | contract-machine.ts following status-machine.ts pattern; ContractStatus enum already in schema |
| CONT-07 | Admin approval step after contract submission | Admin approval page at /admin/contracts; transition PENDING_APPROVAL to APPROVED/REJECTED |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.98.0 | Realtime subscriptions (postgres_changes) | Already installed; official Supabase client |
| react-hook-form | ^7.71.2 | Contract wizard form state per step | Already used across auth, vehicles, inquiry |
| zod | ^4.3.6 | Contract form validation schemas | Already used project-wide |
| @hookform/resolvers | ^5.2.2 | Zod-to-RHF bridge | Already used project-wide |
| Prisma | ^6 | Contract CRUD, $transaction for atomicity | Already used project-wide |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nuqs | ^2.8.9 | URL state for contract list filters | Admin contract list filtering |
| lucide-react | ^0.577.0 | Icons for wizard steps, status badges | Already used project-wide |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Realtime | Polling | Polling is simpler but wastes bandwidth; Realtime already available via @supabase/supabase-js |
| Custom state machine | XState/Zustand | Overkill; project already has a working pattern in status-machine.ts |

**Installation:**
No new packages needed. All required libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/features/contracts/
├── actions/              # Server actions
│   ├── create-contract.ts
│   ├── update-contract.ts
│   ├── submit-contract.ts
│   ├── approve-contract.ts
│   └── cancel-contract.ts
├── components/
│   ├── contract-wizard.tsx          # Main wizard orchestrator
│   ├── step-vehicle-confirm.tsx     # Step 1: Vehicle summary + confirm
│   ├── step-terms.tsx               # Step 2: Period/deposit/type selection
│   ├── step-ekyc.tsx                # Step 3: Mock identity verification
│   ├── step-review.tsx              # Step 4: Summary + submit
│   ├── contract-status-badge.tsx    # Realtime-aware status badge
│   ├── contract-sidebar-summary.tsx # Sticky sidebar with vehicle + terms
│   └── admin-contract-list.tsx      # Admin approval queue
├── hooks/
│   ├── use-contract-realtime.ts     # Supabase Realtime subscription hook
│   └── use-ekyc-timer.ts            # Verification code countdown timer
├── schemas/
│   └── contract.ts                  # Zod schemas for each wizard step
├── utils/
│   └── contract-machine.ts          # ContractStatus state machine
└── types/
    └── index.ts                     # Contract-related types

src/app/
├── (public)/vehicles/[id]/contract/
│   └── page.tsx                     # Contract wizard page (entry from vehicle detail)
├── (protected)/contracts/
│   ├── page.tsx                     # Customer contract list (minimal, Phase 8 expands)
│   └── [id]/page.tsx                # Contract status tracking page
└── admin/contracts/
    ├── page.tsx                     # Admin contract approval queue
    └── [id]/page.tsx                # Admin contract detail + approve/reject
```

### Pattern 1: Contract Wizard (following VehicleWizard)
**What:** 4-step client component with progress bar, per-step validation, useTransition for server action calls
**When to use:** Multi-step form with server-side persistence
**Example:**
```typescript
// Source: existing vehicle-wizard.tsx pattern
'use client'

const STEPS = [
  { label: '차량확인', number: 1 },
  { label: '조건설정', number: 2 },
  { label: '본인인증', number: 3 },
  { label: '검토·서명', number: 4 },
]

export function ContractWizard({ vehicle, residualRate }: Props) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [contractId, setContractId] = useState<string | null>(null)
  // Contract created at step 2 (terms), similar to vehicle creation at step 2
  // Steps 3-4 update existing contract record
}
```

### Pattern 2: Contract State Machine (following status-machine.ts)
**What:** Type-safe transition map with canTransition() and getAvailableTransitions()
**When to use:** Enforcing valid ContractStatus transitions
**Example:**
```typescript
// Source: existing status-machine.ts + approval-machine.ts patterns
import type { ContractStatus } from '@prisma/client'

export const CONTRACT_STATUS_TRANSITIONS: Record<ContractStatus, { to: ContractStatus[]; roles: Role[] }> = {
  DRAFT:             { to: ['PENDING_EKYC', 'CANCELED'], roles: ['CUSTOMER'] },
  PENDING_EKYC:      { to: ['PENDING_APPROVAL', 'CANCELED'], roles: ['CUSTOMER'] },
  PENDING_APPROVAL:  { to: ['APPROVED', 'CANCELED'], roles: ['ADMIN'] },
  APPROVED:          { to: ['ACTIVE', 'CANCELED'], roles: ['ADMIN'] },
  ACTIVE:            { to: ['COMPLETED'], roles: ['ADMIN'] },
  COMPLETED:         { to: [], roles: [] },
  CANCELED:          { to: [], roles: [] },
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: '작성 중',
  PENDING_EKYC: '본인인증 대기',
  PENDING_APPROVAL: '승인 대기',
  APPROVED: '승인됨',
  ACTIVE: '계약 진행 중',
  COMPLETED: '완료',
  CANCELED: '취소됨',
}
```

### Pattern 3: Supabase Realtime Hook
**What:** Custom React hook that subscribes to postgres_changes on contract tables
**When to use:** Live status updates on contract tracking page and admin queue
**Example:**
```typescript
// Source: Supabase official docs (postgres-changes)
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useContractRealtime(
  contractId: string,
  onUpdate: (payload: { new: Record<string, unknown> }) => void
) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`contract-${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rental_contracts',  // or lease_contracts
          filter: `id=eq.${contractId}`,
        },
        onUpdate
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [contractId, onUpdate])
}
```

### Pattern 4: Double-Booking Prevention
**What:** Prisma $transaction with optimistic locking at contract creation
**When to use:** When customer starts a contract application for a vehicle
**Example:**
```typescript
// Source: existing Prisma $transaction pattern
const contract = await prisma.$transaction(async (tx) => {
  // 1. Check vehicle is AVAILABLE and not locked by another contract
  const vehicle = await tx.vehicle.findUnique({
    where: { id: vehicleId },
    select: { status: true },
  })
  if (!vehicle || vehicle.status !== 'AVAILABLE') {
    throw new Error('이 차량은 현재 계약 신청이 불가합니다.')
  }

  // 2. Check no other active contracts exist for this vehicle
  const existingRental = await tx.rentalContract.findFirst({
    where: {
      vehicleId,
      status: { notIn: ['CANCELED', 'COMPLETED'] },
    },
  })
  const existingLease = await tx.leaseContract.findFirst({
    where: {
      vehicleId,
      status: { notIn: ['CANCELED', 'COMPLETED'] },
    },
  })
  if (existingRental || existingLease) {
    throw new Error('이 차량에 대한 진행 중인 계약이 있습니다.')
  }

  // 3. Reserve vehicle + create contract atomically
  await tx.vehicle.update({
    where: { id: vehicleId },
    data: { status: 'RESERVED' },
  })

  return tx.rentalContract.create({ data: { ... } })
})
```

### Pattern 5: Mock eKYC Provider (following MockPlateProvider)
**What:** Pluggable mock identity verification with delay simulation
**When to use:** v1 demo; real API (PASS/CLOVA) integration in v2
**Example:**
```typescript
// Source: concept image analysis + Korean PASS verification pattern
type EkycResult = {
  verified: boolean
  name: string
  phone: string
  birthDate: string
  carrier: 'SKT' | 'KT' | 'LGU'
  verifiedAt: Date
}

// Mock provider simulates 3-second verification delay
export async function mockVerifyIdentity(
  code: string,
  _expectedCode: string = '123456'
): Promise<EkycResult> {
  await new Promise((r) => setTimeout(r, 1500))
  if (code !== _expectedCode) throw new Error('인증번호가 일치하지 않습니다.')
  return { verified: true, ... }
}
```

### Anti-Patterns to Avoid
- **Separate RentalContractWizard / LeaseContractWizard:** Use ONE wizard component with contractType prop; the steps are identical except terms calculation
- **Storing wizard state only in-memory:** Create contract as DRAFT in DB after step 2 (terms) to enable resume and prevent data loss
- **Polling for status updates:** Use Supabase Realtime; only add polling as fallback for reconnection
- **Client-side status transition validation only:** Always validate transitions server-side in the server action; client-side is UX only

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment calculation | Custom monthly payment formula | `calculateRental()` / `calculateLease()` from `src/lib/finance/calculate.ts` | Already tested, handles edge cases |
| Form validation | Manual validation logic | Zod schemas + react-hook-form + zodResolver | Established project pattern |
| Date formatting | Manual date string manipulation | `formatDate()` from `src/lib/utils/format.ts` | Already exists |
| Currency display | Template literals with toLocaleString | `formatKRW()` from `src/lib/utils/format.ts` | Consistent formatting |
| Realtime transport | WebSocket from scratch | Supabase `channel.on('postgres_changes')` | Built into @supabase/supabase-js |
| Status labels/transitions | Inline switch statements | `contract-machine.ts` module | Centralized, testable, follows existing pattern |

**Key insight:** The finance library and format utilities already solve the hard calculation and display problems. The contract wizard's job is orchestration and UX, not reimplementing business logic.

## Common Pitfalls

### Pitfall 1: Supabase Realtime Requires Publication Setup
**What goes wrong:** Subscriptions silently fail; no updates received
**Why it happens:** Tables must be added to the `supabase_realtime` publication in Postgres
**How to avoid:** Run `ALTER PUBLICATION supabase_realtime ADD TABLE rental_contracts, lease_contracts;` as a migration or via Supabase dashboard
**Warning signs:** Channel subscribes successfully but callback never fires

### Pitfall 2: Realtime RLS Policy on DELETE Events
**What goes wrong:** DELETE events bypass RLS policies
**Why it happens:** Postgres cannot verify access on already-deleted rows
**How to avoid:** For contract deletion, use soft-delete (CANCELED status) rather than hard DELETE; RLS works normally on UPDATE events
**Warning signs:** Unauthorized users receiving delete notifications

### Pitfall 3: Race Condition in Contract Creation
**What goes wrong:** Two users both see a vehicle as AVAILABLE and create contracts simultaneously
**Why it happens:** Read-then-write without transactional isolation
**How to avoid:** Use Prisma `$transaction` with serializable isolation or check-and-reserve atomically (Pattern 4 above)
**Warning signs:** Multiple DRAFT/PENDING contracts for the same vehicle

### Pitfall 4: Wizard State Loss on Navigation
**What goes wrong:** User navigates away (back button, accidental link click) and loses all wizard progress
**Why it happens:** Wizard state stored only in React state
**How to avoid:** Persist contract as DRAFT in DB after step 2 (terms selection); use contractId in URL for resume capability
**Warning signs:** User complaints about having to re-enter information

### Pitfall 5: Contract Type Mismatch Between Models
**What goes wrong:** Creating a RentalContract when user selected LEASE or vice versa
**Why it happens:** Schema has separate `rental_contracts` and `lease_contracts` tables
**How to avoid:** Use `contractType` enum throughout the wizard; server action creates the correct table record; helper functions abstract the difference
**Warning signs:** Wrong calculation applied, residualValue null for lease contracts

### Pitfall 6: Supabase Realtime Channel Cleanup
**What goes wrong:** Memory leaks or stale subscriptions after component unmount
**Why it happens:** Missing cleanup in useEffect return
**How to avoid:** Always call `supabase.removeChannel(channel)` in the useEffect cleanup function
**Warning signs:** Console warnings about duplicate channel names, increasing memory usage

## Code Examples

### eKYC Form Fields (from concept image analysis)
```typescript
// Source: concept image contract-ekyc-desktop.png
// Korean PASS-style identity verification form
const ekycSchema = z.object({
  name: z.string().min(2, '이름을 입력해주세요'),
  phone: z.string().regex(/^01[016789]\d{7,8}$/, '유효한 휴대폰 번호를 입력해주세요'),
  carrier: z.enum(['SKT', 'KT', 'LGU']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일을 입력해주세요'),
  gender: z.enum(['M', 'F']),
  verificationCode: z.string().length(6, '인증번호 6자리를 입력해주세요'),
})
```

### Contract Terms Step (reusing PricingCalculator pattern)
```typescript
// Source: existing pricing-calculator.tsx pattern
// Simplified inline version for contract wizard step 2
const termsSchema = z.object({
  contractType: z.enum(['RENTAL', 'LEASE']),
  periodMonths: z.number().min(12).max(60),
  deposit: z.number().min(0),
  // For lease only:
  residualRate: z.number().min(0).max(1).optional(),
})
```

### Admin Contract Approval Action
```typescript
// Source: existing approve-vehicle.ts pattern
'use server'

export async function approveContract(
  contractId: string,
  contractType: 'RENTAL' | 'LEASE',
  action: 'APPROVED' | 'CANCELED',
  reason?: string
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: '권한이 없습니다.' }
  }

  const table = contractType === 'RENTAL' ? 'rentalContract' : 'leaseContract'

  // Validate transition
  const contract = await prisma[table].findUnique({ where: { id: contractId } })
  if (!contract || !canTransitionContract(contract.status, action, 'ADMIN')) {
    return { error: '상태 변경이 불가합니다.' }
  }

  await prisma[table].update({
    where: { id: contractId },
    data: { status: action },
  })

  return { success: true }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling for status updates | Supabase Realtime (postgres_changes) | Available since Supabase v2 | Instant updates, less bandwidth |
| XState for state machines | Simple transition map (project pattern) | Project convention since Phase 3 | Less boilerplate, sufficient for linear flows |
| Multi-page form with URL params | Single-page wizard with React state + DB draft | Modern React pattern | Better UX, resumable |

**Deprecated/outdated:**
- Supabase Realtime v1 API (channel.on('*')) -- use v2 postgres_changes event type
- @supabase/realtime-js standalone -- use built-in from @supabase/supabase-js v2

## Schema Considerations

### Existing Schema (sufficient for core flow)
The current `RentalContract` and `LeaseContract` models cover the basic contract fields. However, eKYC verification data needs to be persisted.

### Schema Extension Needed
Add an eKYC verification record to track verification per contract:

```prisma
model EkycVerification {
  id           String   @id @default(uuid()) @db.Uuid
  profileId    String   @map("profile_id") @db.Uuid
  name         String
  phone        String
  carrier      String
  birthDate    String   @map("birth_date")
  gender       String
  verified     Boolean  @default(false)
  verifiedAt   DateTime? @map("verified_at")
  createdAt    DateTime @default(now()) @map("created_at")

  profile      Profile  @relation(fields: [profileId], references: [id])
  @@map("ekyc_verifications")
}
```

Also add `ekycVerificationId` foreign key to both `RentalContract` and `LeaseContract`, and a relation from `Profile` to `EkycVerification`.

### Realtime Publication
Must enable Realtime on contract tables:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE rental_contracts, lease_contracts;
```

## Open Questions

1. **Vehicle reservation timeout**
   - What we know: When a user starts a contract, the vehicle should be RESERVED to prevent double-booking
   - What's unclear: Should RESERVED status auto-expire after a timeout (e.g., 30 min) if the user abandons the wizard?
   - Recommendation: For v1, do NOT implement auto-expiration. Admin can manually cancel stale contracts. Auto-expiration is a v2 concern requiring background jobs.

2. **eKYC per-user vs per-contract**
   - What we know: Concept image shows eKYC as step 3 in every contract
   - What's unclear: Should a verified user skip eKYC on subsequent contracts?
   - Recommendation: Per-contract for v1 (simpler, more secure for demo). Store verification record but require it each time.

3. **Contract start date**
   - What we know: Schema has `startDate` and `endDate` on contracts
   - What's unclear: Does user pick start date or is it auto-set after admin approval?
   - Recommendation: Auto-set to approval date. User selects period (months), endDate calculated from startDate.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + happy-dom |
| Config file | vitest.config.mts |
| Quick run command | `yarn test --reporter=verbose` |
| Full suite command | `yarn test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Contract wizard form validation (each step schema) | unit | `yarn test src/features/contracts/schemas/contract.test.ts -t "contract schema"` | Wave 0 |
| CONT-02 | Mock eKYC verification logic | unit | `yarn test src/features/contracts/utils/mock-ekyc.test.ts` | Wave 0 |
| CONT-05 | Realtime hook setup/cleanup | unit | `yarn test src/features/contracts/hooks/use-contract-realtime.test.ts` | Wave 0 |
| CONT-06 | Contract state machine transitions | unit | `yarn test src/features/contracts/utils/contract-machine.test.ts` | Wave 0 |
| CONT-06 | Server action enforces valid transitions | unit | `yarn test src/features/contracts/actions/update-contract.test.ts` | Wave 0 |
| CONT-07 | Admin approve/reject contract action | unit | `yarn test src/features/contracts/actions/approve-contract.test.ts` | Wave 0 |
| CONT-01 | Create contract server action with double-booking check | unit | `yarn test src/features/contracts/actions/create-contract.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test src/features/contracts/ --reporter=verbose`
- **Per wave merge:** `yarn test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/contracts/utils/contract-machine.test.ts` -- covers CONT-06 state transitions
- [ ] `src/features/contracts/schemas/contract.test.ts` -- covers CONT-01 form validation
- [ ] `src/features/contracts/utils/mock-ekyc.test.ts` -- covers CONT-02 mock verification
- [ ] `src/features/contracts/actions/create-contract.test.ts` -- covers CONT-01 creation + double-booking
- [ ] `src/features/contracts/actions/approve-contract.test.ts` -- covers CONT-07 admin approval

## Sources

### Primary (HIGH confidence)
- Existing codebase: `prisma/schema.prisma` -- ContractStatus enum, RentalContract, LeaseContract models
- Existing codebase: `src/features/vehicles/utils/status-machine.ts` -- state machine pattern template
- Existing codebase: `src/features/vehicles/components/vehicle-wizard.tsx` -- wizard UI pattern template
- Existing codebase: `src/lib/finance/calculate.ts` -- rental/lease calculation functions
- Existing codebase: `src/lib/supabase/client.ts` -- browser Supabase client for Realtime
- Concept image: `contract-ekyc-desktop.png` -- 4-step wizard layout, eKYC form fields
- [Supabase Postgres Changes docs](https://supabase.com/docs/guides/realtime/postgres-changes) -- subscription API, event types, RLS notes
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) -- Next.js integration patterns

### Secondary (MEDIUM confidence)
- [Supabase Realtime features page](https://supabase.com/features/realtime-postgres-changes) -- capability overview
- [Building Real-time with Supabase in Next.js 15](https://dev.to/lra8dev/building-real-time-magic-supabase-subscriptions-in-nextjs-15-2kmp) -- community implementation pattern

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in the project
- Architecture: HIGH -- patterns directly derived from existing codebase (vehicle wizard, status machine)
- Pitfalls: HIGH -- Supabase Realtime gotchas from official docs; race condition prevention from Prisma docs
- eKYC UI: HIGH -- concept image provides exact field layout and flow

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable -- existing stack, no new dependencies)
