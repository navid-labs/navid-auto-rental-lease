# Track 2: Reverse Auction / Comparison Quote System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reverse auction system where customers submit quote requests and dealers bid with competitive offers, creating a comparison marketplace for rental/lease.

**Architecture:** QuoteRequest/DealerBid models with state machines, REST API routes following existing patterns (`apiSuccess`/`apiError`/`parseBody`), Zod validation, step wizard for customer input, dealer portal integration.

**Tech Stack:** Prisma, Zod 4, TypeScript, Next.js App Router, React 19, Tailwind CSS 4, vitest

**Prerequisite:** Track 1 Task 1 (schema enums) must be completed first — `QuoteRequestStatus` and `BidStatus` enums are defined there.

---

## Task 1: QuoteRequest + DealerBid Prisma Models

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `bun run db:generate`

- [ ] **Step 1: Add QuoteRequest model**

Add to `prisma/schema.prisma` after the `EkycVerification` model:

```prisma
// ─── Quote / Auction ─────────────────────────────────────

model QuoteRequest {
  id               String             @id @default(uuid()) @db.Uuid
  customerId       String             @map("customer_id") @db.Uuid
  contractType     ContractType       @map("contract_type")
  preferredBrandId String?            @map("preferred_brand_id") @db.Uuid
  preferredModelId String?            @map("preferred_model_id") @db.Uuid
  yearMin          Int?               @map("year_min")
  yearMax          Int?               @map("year_max")
  budgetMin        Int?               @map("budget_min")
  budgetMax        Int                @map("budget_max")
  contractMonths   Int                @map("contract_months")
  depositMax       Int?               @map("deposit_max")
  mileageLimit     Int?               @map("mileage_limit")
  specialRequests  String?            @map("special_requests")
  status           QuoteRequestStatus @default(OPEN)
  expiresAt        DateTime           @map("expires_at")
  selectedBidId    String?            @unique @map("selected_bid_id") @db.Uuid
  createdAt        DateTime           @default(now()) @map("created_at")
  updatedAt        DateTime           @updatedAt @map("updated_at")

  // Relations
  customer       Profile     @relation("CustomerQuotes", fields: [customerId], references: [id])
  preferredBrand Brand?      @relation(fields: [preferredBrandId], references: [id])
  preferredModel CarModel?   @relation(fields: [preferredModelId], references: [id])
  bids           DealerBid[]
  selectedBid    DealerBid?  @relation("SelectedBid", fields: [selectedBidId], references: [id])

  @@index([customerId, status])
  @@index([status, expiresAt])
  @@map("quote_requests")
}

model DealerBid {
  id             String    @id @default(uuid()) @db.Uuid
  quoteRequestId String    @map("quote_request_id") @db.Uuid
  dealerId       String    @map("dealer_id") @db.Uuid
  vehicleId      String?   @map("vehicle_id") @db.Uuid
  monthlyPayment Int       @map("monthly_payment")
  deposit        Int
  totalCost      Int       @map("total_cost")
  residualValue  Int?      @map("residual_value")
  interestRate   Float?    @map("interest_rate")
  contractTerms  Json?     @map("contract_terms")
  promotionNote  String?   @map("promotion_note")
  status         BidStatus @default(PENDING)
  submittedAt    DateTime? @map("submitted_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  // Relations
  quoteRequest    QuoteRequest  @relation(fields: [quoteRequestId], references: [id])
  dealer          Profile       @relation("DealerBids", fields: [dealerId], references: [id])
  vehicle         Vehicle?      @relation(fields: [vehicleId], references: [id])
  selectedByQuote QuoteRequest? @relation("SelectedBid")

  @@index([quoteRequestId, status])
  @@index([dealerId, status])
  @@map("dealer_bids")
}
```

- [ ] **Step 2: Add missing relations to Profile, Brand, CarModel, Vehicle**

Add to `Profile` model relations:

```prisma
  quoteRequests       QuoteRequest[]      @relation("CustomerQuotes")
  dealerBids          DealerBid[]         @relation("DealerBids")
```

Add to `Brand` model relations:

```prisma
  quoteRequests      QuoteRequest[]
```

Add to `CarModel` model relations:

```prisma
  quoteRequests      QuoteRequest[]
```

Add to `Vehicle` model relations:

```prisma
  dealerBids         DealerBid[]
```

- [ ] **Step 3: Validate schema and generate client**

Run:
```bash
bun run db:generate
```
Expected: Prisma client generated successfully.

- [ ] **Step 4: Create migration**

Run:
```bash
bunx prisma migrate dev --name add-quote-request-dealer-bid
```
Expected: Migration created and applied.

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat(schema): add QuoteRequest and DealerBid models for reverse auction"
```

---

## Task 2: Quote State Machine + Validation Schemas

**Files:**
- Create: `src/features/quotes/lib/quote-state-machine.ts`
- Create: `src/features/quotes/schemas/quote-request.ts`
- Create: `src/features/quotes/schemas/dealer-bid.ts`
- Test: `tests/unit/features/quotes/quote-state-machine.test.ts`
- Test: `tests/unit/features/quotes/schemas.test.ts`

- [ ] **Step 1: Write state machine tests**

Create `tests/unit/features/quotes/quote-state-machine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  canTransitionQuote,
  canTransitionBid,
  getNextQuoteStatuses,
  getNextBidStatuses,
} from '@/features/quotes/lib/quote-state-machine'

describe('Quote state machine', () => {
  it('OPEN → BIDDING is valid', () => {
    expect(canTransitionQuote('OPEN', 'BIDDING')).toBe(true)
  })

  it('OPEN → SELECTED is invalid', () => {
    expect(canTransitionQuote('OPEN', 'SELECTED')).toBe(false)
  })

  it('BIDDING → COMPARING is valid', () => {
    expect(canTransitionQuote('BIDDING', 'COMPARING')).toBe(true)
  })

  it('COMPARING → SELECTED is valid', () => {
    expect(canTransitionQuote('COMPARING', 'SELECTED')).toBe(true)
  })

  it('SELECTED → CONTRACTED is valid', () => {
    expect(canTransitionQuote('SELECTED', 'CONTRACTED')).toBe(true)
  })

  it('OPEN → EXPIRED is valid', () => {
    expect(canTransitionQuote('OPEN', 'EXPIRED')).toBe(true)
  })

  it('CONTRACTED → anything is invalid', () => {
    expect(getNextQuoteStatuses('CONTRACTED')).toEqual([])
  })
})

describe('Bid state machine', () => {
  it('PENDING → SUBMITTED is valid', () => {
    expect(canTransitionBid('PENDING', 'SUBMITTED')).toBe(true)
  })

  it('SUBMITTED → SELECTED is valid', () => {
    expect(canTransitionBid('SUBMITTED', 'SELECTED')).toBe(true)
  })

  it('SUBMITTED → REJECTED is valid', () => {
    expect(canTransitionBid('SUBMITTED', 'REJECTED')).toBe(true)
  })

  it('PENDING → WITHDRAWN is valid', () => {
    expect(canTransitionBid('PENDING', 'WITHDRAWN')).toBe(true)
  })

  it('SELECTED → REJECTED is invalid', () => {
    expect(canTransitionBid('SELECTED', 'REJECTED')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/features/quotes/quote-state-machine.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement state machine**

Create `src/features/quotes/lib/quote-state-machine.ts`:

```typescript
type QuoteStatus = 'OPEN' | 'BIDDING' | 'COMPARING' | 'SELECTED' | 'CONTRACTED' | 'EXPIRED'
type BidStatus = 'PENDING' | 'SUBMITTED' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN'

const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  OPEN: ['BIDDING', 'EXPIRED'],
  BIDDING: ['COMPARING', 'EXPIRED'],
  COMPARING: ['SELECTED'],
  SELECTED: ['CONTRACTED'],
  CONTRACTED: [],
  EXPIRED: [],
}

const BID_TRANSITIONS: Record<BidStatus, BidStatus[]> = {
  PENDING: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
  SELECTED: [],
  REJECTED: [],
  WITHDRAWN: [],
}

export function canTransitionQuote(from: QuoteStatus, to: QuoteStatus): boolean {
  return QUOTE_TRANSITIONS[from]?.includes(to) ?? false
}

export function canTransitionBid(from: BidStatus, to: BidStatus): boolean {
  return BID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextQuoteStatuses(current: QuoteStatus): QuoteStatus[] {
  return QUOTE_TRANSITIONS[current] ?? []
}

export function getNextBidStatuses(current: BidStatus): BidStatus[] {
  return BID_TRANSITIONS[current] ?? []
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test tests/unit/features/quotes/quote-state-machine.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Write schema tests**

Create `tests/unit/features/quotes/schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createQuoteRequestSchema, createDealerBidSchema } from '@/features/quotes/schemas/quote-request'

describe('createQuoteRequestSchema', () => {
  it('validates valid request', () => {
    const result = createQuoteRequestSchema.safeParse({
      contractType: 'RENTAL',
      budgetMax: 500000,
      contractMonths: 36,
      expiresInDays: 3,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid contractMonths', () => {
    const result = createQuoteRequestSchema.safeParse({
      contractType: 'RENTAL',
      budgetMax: 500000,
      contractMonths: 7,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing budgetMax', () => {
    const result = createQuoteRequestSchema.safeParse({
      contractType: 'RENTAL',
      contractMonths: 24,
    })
    expect(result.success).toBe(false)
  })
})

describe('createDealerBidSchema', () => {
  it('validates valid bid', () => {
    const result = createDealerBidSchema.safeParse({
      quoteRequestId: '550e8400-e29b-41d4-a716-446655440000',
      monthlyPayment: 350000,
      deposit: 5000000,
      totalCost: 17600000,
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative monthlyPayment', () => {
    const result = createDealerBidSchema.safeParse({
      quoteRequestId: '550e8400-e29b-41d4-a716-446655440000',
      monthlyPayment: -100,
      deposit: 0,
      totalCost: 0,
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 6: Implement schemas**

Create `src/features/quotes/schemas/quote-request.ts`:

```typescript
import { z } from 'zod'

export const createQuoteRequestSchema = z.object({
  contractType: z.enum(['RENTAL', 'LEASE']),
  preferredBrandId: z.string().uuid().optional(),
  preferredModelId: z.string().uuid().optional(),
  yearMin: z.coerce.number().int().min(2015).optional(),
  yearMax: z.coerce.number().int().max(2027).optional(),
  budgetMin: z.coerce.number().int().min(0).optional(),
  budgetMax: z.coerce.number().int().min(100000),
  contractMonths: z.coerce.number().int().refine(
    (v) => [12, 24, 36, 48].includes(v),
    { message: '계약 기간은 12, 24, 36, 48개월 중 선택하세요' },
  ),
  depositMax: z.coerce.number().int().min(0).optional(),
  mileageLimit: z.coerce.number().int().min(0).optional(),
  specialRequests: z.string().max(500).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(7).default(3),
})

export type CreateQuoteRequestInput = z.infer<typeof createQuoteRequestSchema>

export const createDealerBidSchema = z.object({
  quoteRequestId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  monthlyPayment: z.coerce.number().int().min(0),
  deposit: z.coerce.number().int().min(0),
  totalCost: z.coerce.number().int().min(0),
  residualValue: z.coerce.number().int().min(0).optional(),
  interestRate: z.coerce.number().min(0).max(100).optional(),
  contractTerms: z.record(z.unknown()).optional(),
  promotionNote: z.string().max(300).optional(),
})

export type CreateDealerBidInput = z.infer<typeof createDealerBidSchema>

export const selectBidSchema = z.object({
  bidId: z.string().uuid(),
})
```

- [ ] **Step 7: Run schema tests**

Run: `bun run test tests/unit/features/quotes/schemas.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/features/quotes/ tests/unit/features/quotes/
git commit -m "feat(quotes): add state machine and Zod validation schemas"
```

---

## Task 3: Quote API Routes — Customer Side

**Files:**
- Create: `src/features/quotes/mutations/create-quote.ts`
- Create: `src/features/quotes/queries/quote.ts`
- Create: `src/app/api/quotes/route.ts`
- Create: `src/app/api/quotes/my/route.ts`
- Create: `src/app/api/quotes/[id]/route.ts`
- Create: `src/app/api/quotes/[id]/select/route.ts`
- Test: `tests/unit/features/quotes/mutations/create-quote.test.ts`

- [ ] **Step 1: Write mutation tests**

Create `tests/unit/features/quotes/mutations/create-quote.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    quoteRequest: {
      create: vi.fn().mockResolvedValue({
        id: 'quote-1',
        customerId: 'user-1',
        contractType: 'RENTAL',
        budgetMax: 500000,
        contractMonths: 36,
        status: 'OPEN',
        expiresAt: new Date('2026-04-10'),
      }),
    },
  },
}))

import { createQuoteRequest } from '@/features/quotes/mutations/create-quote'

describe('createQuoteRequest', () => {
  it('creates a quote request with OPEN status', async () => {
    const result = await createQuoteRequest('user-1', {
      contractType: 'RENTAL',
      budgetMax: 500000,
      contractMonths: 36,
      expiresInDays: 3,
    })

    expect(result.status).toBe('OPEN')
    expect(result.customerId).toBe('user-1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/features/quotes/mutations/create-quote.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement create mutation**

Create `src/features/quotes/mutations/create-quote.ts`:

```typescript
import { prisma } from '@/lib/db/prisma'
import type { CreateQuoteRequestInput } from '../schemas/quote-request'

export async function createQuoteRequest(
  customerId: string,
  input: CreateQuoteRequestInput,
) {
  const { expiresInDays, ...data } = input
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  return prisma.quoteRequest.create({
    data: {
      customerId,
      ...data,
      status: 'OPEN',
      expiresAt,
    },
  })
}
```

- [ ] **Step 4: Implement queries**

Create `src/features/quotes/queries/quote.ts`:

```typescript
import { prisma } from '@/lib/db/prisma'

export async function getQuoteRequestById(id: string) {
  return prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      preferredBrand: { select: { id: true, name: true, nameKo: true } },
      preferredModel: { select: { id: true, name: true, nameKo: true } },
      bids: {
        where: { status: { in: ['SUBMITTED', 'SELECTED'] } },
        include: {
          dealer: { select: { id: true, name: true } },
          vehicle: {
            select: {
              id: true, year: true, mileage: true, color: true, price: true,
              images: { where: { isPrimary: true }, take: 1 },
              trim: {
                select: {
                  name: true,
                  generation: {
                    select: {
                      name: true,
                      carModel: { select: { name: true, brand: { select: { name: true } } } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { monthlyPayment: 'asc' },
      },
    },
  })
}

export async function getMyQuoteRequests(customerId: string) {
  return prisma.quoteRequest.findMany({
    where: { customerId },
    include: {
      preferredBrand: { select: { name: true, nameKo: true } },
      preferredModel: { select: { name: true, nameKo: true } },
      _count: { select: { bids: { where: { status: 'SUBMITTED' } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
```

- [ ] **Step 5: Create API routes**

Create `src/app/api/quotes/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'
import { getCurrentUser } from '@/lib/api/auth'
import { createQuoteRequestSchema } from '@/features/quotes/schemas/quote-request'
import { createQuoteRequest } from '@/features/quotes/mutations/create-quote'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return apiError('로그인이 필요합니다', 401)

  const parsed = await parseBody(createQuoteRequestSchema, request)
  if (parsed.error) return parsed.error

  const quote = await createQuoteRequest(user.id, parsed.data)
  return apiSuccess(quote, 201)
}
```

Create `src/app/api/quotes/my/route.ts`:

```typescript
import { apiSuccess, apiError } from '@/lib/api/response'
import { getCurrentUser } from '@/lib/api/auth'
import { getMyQuoteRequests } from '@/features/quotes/queries/quote'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return apiError('로그인이 필요합니다', 401)

  const quotes = await getMyQuoteRequests(user.id)
  return apiSuccess(quotes)
}
```

Create `src/app/api/quotes/[id]/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getQuoteRequestById } from '@/features/quotes/queries/quote'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const quote = await getQuoteRequestById(id)

  if (!quote) return apiError('견적 요청을 찾을 수 없습니다', 404)
  return apiSuccess(quote)
}
```

Create `src/app/api/quotes/[id]/select/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'
import { getCurrentUser } from '@/lib/api/auth'
import { selectBidSchema } from '@/features/quotes/schemas/quote-request'
import { selectBid } from '@/features/quotes/mutations/select-bid'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return apiError('로그인이 필요합니다', 401)

  const { id } = await params
  const parsed = await parseBody(selectBidSchema, request)
  if (parsed.error) return parsed.error

  const result = await selectBid(id, user.id, parsed.data.bidId)
  if (!result.success) return apiError(result.error, 400)

  return apiSuccess(result.data)
}
```

- [ ] **Step 6: Implement select-bid mutation**

Create `src/features/quotes/mutations/select-bid.ts`:

```typescript
import { prisma } from '@/lib/db/prisma'
import { canTransitionQuote, canTransitionBid } from '../lib/quote-state-machine'

type SelectBidResult =
  | { success: true; data: { quoteRequestId: string; selectedBidId: string } }
  | { success: false; error: string }

export async function selectBid(
  quoteRequestId: string,
  customerId: string,
  bidId: string,
): Promise<SelectBidResult> {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteRequestId },
    include: { bids: true },
  })

  if (!quote) return { success: false, error: '견적 요청을 찾을 수 없습니다' }
  if (quote.customerId !== customerId) return { success: false, error: '권한이 없습니다' }
  if (!canTransitionQuote(quote.status, 'SELECTED')) {
    return { success: false, error: `현재 상태(${quote.status})에서는 입찰을 선택할 수 없습니다` }
  }

  const bid = quote.bids.find((b) => b.id === bidId)
  if (!bid) return { success: false, error: '해당 입찰을 찾을 수 없습니다' }
  if (!canTransitionBid(bid.status, 'SELECTED')) {
    return { success: false, error: '해당 입찰은 선택할 수 없는 상태입니다' }
  }

  await prisma.$transaction([
    prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: { status: 'SELECTED', selectedBidId: bidId },
    }),
    prisma.dealerBid.update({
      where: { id: bidId },
      data: { status: 'SELECTED' },
    }),
    prisma.dealerBid.updateMany({
      where: {
        quoteRequestId,
        id: { not: bidId },
        status: 'SUBMITTED',
      },
      data: { status: 'REJECTED' },
    }),
  ])

  return { success: true, data: { quoteRequestId, selectedBidId: bidId } }
}
```

- [ ] **Step 7: Run tests**

Run: `bun run test tests/unit/features/quotes/`
Expected: PASS (all tests)

- [ ] **Step 8: Commit**

```bash
git add src/features/quotes/ src/app/api/quotes/ tests/unit/features/quotes/
git commit -m "feat(quotes): add quote request API routes and mutations"
```

---

## Task 4: Dealer Bid API Routes

**Files:**
- Create: `src/features/quotes/mutations/create-bid.ts`
- Create: `src/features/quotes/queries/dealer-quotes.ts`
- Create: `src/app/api/dealer/quotes/route.ts`
- Create: `src/app/api/dealer/bids/route.ts`
- Create: `src/app/api/dealer/bids/my/route.ts`
- Create: `src/app/api/dealer/bids/[id]/route.ts`
- Test: `tests/unit/features/quotes/mutations/create-bid.test.ts`

- [ ] **Step 1: Write bid mutation tests**

Create `tests/unit/features/quotes/mutations/create-bid.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    quoteRequest: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'quote-1',
        status: 'OPEN',
        expiresAt: new Date(Date.now() + 86400000),
      }),
      update: vi.fn(),
    },
    dealerBid: {
      create: vi.fn().mockResolvedValue({
        id: 'bid-1',
        quoteRequestId: 'quote-1',
        dealerId: 'dealer-1',
        monthlyPayment: 350000,
        status: 'SUBMITTED',
      }),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}))

import { createDealerBid } from '@/features/quotes/mutations/create-bid'

describe('createDealerBid', () => {
  it('creates a bid with SUBMITTED status', async () => {
    const result = await createDealerBid('dealer-1', {
      quoteRequestId: 'quote-1',
      monthlyPayment: 350000,
      deposit: 5000000,
      totalCost: 17600000,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('SUBMITTED')
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/unit/features/quotes/mutations/create-bid.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement create-bid mutation**

Create `src/features/quotes/mutations/create-bid.ts`:

```typescript
import { prisma } from '@/lib/db/prisma'
import type { CreateDealerBidInput } from '../schemas/quote-request'

type CreateBidResult =
  | { success: true; data: { id: string; status: string } }
  | { success: false; error: string }

export async function createDealerBid(
  dealerId: string,
  input: CreateDealerBidInput,
): Promise<CreateBidResult> {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: input.quoteRequestId },
  })

  if (!quote) return { success: false, error: '견적 요청을 찾을 수 없습니다' }

  if (quote.expiresAt < new Date()) {
    return { success: false, error: '입찰 마감 시간이 지났습니다' }
  }

  if (!['OPEN', 'BIDDING'].includes(quote.status)) {
    return { success: false, error: '입찰을 받지 않는 상태입니다' }
  }

  // Check for duplicate bid
  const existingBid = await prisma.dealerBid.findFirst({
    where: {
      quoteRequestId: input.quoteRequestId,
      dealerId,
      status: { in: ['PENDING', 'SUBMITTED'] },
    },
  })

  if (existingBid) {
    return { success: false, error: '이미 입찰한 견적 요청입니다' }
  }

  const { quoteRequestId, ...bidData } = input

  const bid = await prisma.dealerBid.create({
    data: {
      quoteRequestId,
      dealerId,
      ...bidData,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  })

  // Transition quote to BIDDING if first bid
  if (quote.status === 'OPEN') {
    await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: { status: 'BIDDING' },
    })
  }

  return { success: true, data: { id: bid.id, status: bid.status } }
}
```

- [ ] **Step 4: Implement dealer queries**

Create `src/features/quotes/queries/dealer-quotes.ts`:

```typescript
import { prisma } from '@/lib/db/prisma'

export async function getAvailableQuoteRequests() {
  return prisma.quoteRequest.findMany({
    where: {
      status: { in: ['OPEN', 'BIDDING'] },
      expiresAt: { gt: new Date() },
    },
    include: {
      customer: { select: { name: true } },
      preferredBrand: { select: { name: true, nameKo: true } },
      preferredModel: { select: { name: true, nameKo: true } },
      _count: { select: { bids: { where: { status: 'SUBMITTED' } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getMyDealerBids(dealerId: string) {
  return prisma.dealerBid.findMany({
    where: { dealerId },
    include: {
      quoteRequest: {
        include: {
          customer: { select: { name: true } },
          preferredBrand: { select: { name: true, nameKo: true } },
          preferredModel: { select: { name: true, nameKo: true } },
        },
      },
      vehicle: {
        select: {
          id: true, year: true,
          trim: {
            select: {
              name: true,
              generation: {
                select: {
                  name: true,
                  carModel: { select: { name: true, brand: { select: { name: true } } } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
```

- [ ] **Step 5: Create dealer API routes**

Create `src/app/api/dealer/quotes/route.ts`:

```typescript
import { apiSuccess, apiError } from '@/lib/api/response'
import { getCurrentUser } from '@/lib/api/auth'
import { getAvailableQuoteRequests } from '@/features/quotes/queries/dealer-quotes'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'DEALER') return apiError('딜러 권한이 필요합니다', 403)

  const quotes = await getAvailableQuoteRequests()
  return apiSuccess(quotes)
}
```

Create `src/app/api/dealer/bids/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/response'
import { parseBody } from '@/lib/api/validation'
import { getCurrentUser } from '@/lib/api/auth'
import { createDealerBidSchema } from '@/features/quotes/schemas/quote-request'
import { createDealerBid } from '@/features/quotes/mutations/create-bid'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'DEALER') return apiError('딜러 권한이 필요합니다', 403)

  const parsed = await parseBody(createDealerBidSchema, request)
  if (parsed.error) return parsed.error

  const result = await createDealerBid(user.id, parsed.data)
  if (!result.success) return apiError(result.error, 400)

  return apiSuccess(result.data, 201)
}
```

Create `src/app/api/dealer/bids/my/route.ts`:

```typescript
import { apiSuccess, apiError } from '@/lib/api/response'
import { getCurrentUser } from '@/lib/api/auth'
import { getMyDealerBids } from '@/features/quotes/queries/dealer-quotes'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'DEALER') return apiError('딜러 권한이 필요합니다', 403)

  const bids = await getMyDealerBids(user.id)
  return apiSuccess(bids)
}
```

Create `src/app/api/dealer/bids/[id]/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getCurrentUser } from '@/lib/api/auth'
import { prisma } from '@/lib/db/prisma'
import { canTransitionBid } from '@/features/quotes/lib/quote-state-machine'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'DEALER') return apiError('딜러 권한이 필요합니다', 403)

  const { id } = await params
  const bid = await prisma.dealerBid.findUnique({ where: { id } })

  if (!bid) return apiError('입찰을 찾을 수 없습니다', 404)
  if (bid.dealerId !== user.id) return apiError('권한이 없습니다', 403)
  if (!canTransitionBid(bid.status, 'WITHDRAWN')) {
    return apiError('철회할 수 없는 상태입니다', 400)
  }

  await prisma.dealerBid.update({
    where: { id },
    data: { status: 'WITHDRAWN' },
  })

  return apiSuccess({ id, status: 'WITHDRAWN' })
}
```

- [ ] **Step 6: Run tests**

Run: `bun run test tests/unit/features/quotes/`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/quotes/ src/app/api/dealer/quotes/ src/app/api/dealer/bids/
git add tests/unit/features/quotes/mutations/create-bid.test.ts
git commit -m "feat(quotes): add dealer bid API routes, mutations, and queries"
```

---

## Task 5: Customer Quote Request Wizard UI

**Files:**
- Create: `src/features/quotes/components/quote-wizard.tsx`
- Create: `src/features/quotes/components/steps/step-vehicle.tsx`
- Create: `src/features/quotes/components/steps/step-terms.tsx`
- Create: `src/features/quotes/components/steps/step-extras.tsx`
- Create: `src/features/quotes/components/steps/step-confirm.tsx`
- Create: `src/app/(public)/quote/request/page.tsx`

- [ ] **Step 1: Create wizard container**

Create `src/features/quotes/components/quote-wizard.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepVehicle } from './steps/step-vehicle'
import { StepTerms } from './steps/step-terms'
import { StepExtras } from './steps/step-extras'
import { StepConfirm } from './steps/step-confirm'
import type { CreateQuoteRequestInput } from '../schemas/quote-request'

const STEPS = ['차량 조건', '계약 조건', '추가 요청', '확인'] as const

type PartialInput = Partial<CreateQuoteRequestInput>

export function QuoteWizard() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<PartialInput>({})
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  function updateData(partial: PartialInput) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (res.ok) {
        router.push(`/quote/${json.data.id}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Progress */}
      <div className="mb-8 flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            <p className={`mt-1 text-xs ${i <= step ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Steps */}
      {step === 0 && <StepVehicle data={data} onUpdate={updateData} onNext={next} />}
      {step === 1 && <StepTerms data={data} onUpdate={updateData} onNext={next} onBack={back} />}
      {step === 2 && <StepExtras data={data} onUpdate={updateData} onNext={next} onBack={back} />}
      {step === 3 && <StepConfirm data={data} onSubmit={submit} onBack={back} submitting={submitting} />}
    </div>
  )
}
```

- [ ] **Step 2: Create StepVehicle**

Create `src/features/quotes/components/steps/step-vehicle.tsx`:

```tsx
'use client'

import type { CreateQuoteRequestInput } from '../../schemas/quote-request'

type Props = {
  data: Partial<CreateQuoteRequestInput>
  onUpdate: (partial: Partial<CreateQuoteRequestInput>) => void
  onNext: () => void
}

export function StepVehicle({ data, onUpdate, onNext }: Props) {
  const canProceed = !!data.contractType

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">차량 조건</h2>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">계약 유형 *</legend>
        <div className="flex gap-3">
          {(['RENTAL', 'LEASE'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onUpdate({ contractType: type })}
              className={`flex-1 rounded-lg border-2 p-4 text-center transition ${
                data.contractType === type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-lg font-semibold">
                {type === 'RENTAL' ? '렌탈' : '리스'}
              </span>
              <p className="text-muted-foreground mt-1 text-sm">
                {type === 'RENTAL' ? '월 납입 후 반납' : '잔존가 인수 가능'}
              </p>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Brand/Model selectors would use existing cascade-select component */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">최소 연식</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="2020"
            value={data.yearMin ?? ''}
            onChange={(e) => onUpdate({ yearMin: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">최대 연식</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="2026"
            value={data.yearMax ?? ''}
            onChange={(e) => onUpdate({ yearMax: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className="rounded-lg bg-blue-500 px-6 py-2.5 text-white disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create StepTerms**

Create `src/features/quotes/components/steps/step-terms.tsx`:

```tsx
'use client'

import type { CreateQuoteRequestInput } from '../../schemas/quote-request'

type Props = {
  data: Partial<CreateQuoteRequestInput>
  onUpdate: (partial: Partial<CreateQuoteRequestInput>) => void
  onNext: () => void
  onBack: () => void
}

const CONTRACT_MONTHS = [12, 24, 36, 48] as const

export function StepTerms({ data, onUpdate, onNext, onBack }: Props) {
  const canProceed = !!data.contractMonths && !!data.budgetMax

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">계약 조건</h2>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">계약 기간 *</legend>
        <div className="flex gap-2">
          {CONTRACT_MONTHS.map((months) => (
            <button
              key={months}
              type="button"
              onClick={() => onUpdate({ contractMonths: months })}
              className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-center ${
                data.contractMonths === months
                  ? 'border-blue-500 bg-blue-50 font-semibold'
                  : 'border-gray-200'
              }`}
            >
              {months}개월
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="text-sm font-medium">최대 월 예산 (원) *</label>
        <input
          type="number"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="500000"
          value={data.budgetMax ?? ''}
          onChange={(e) => onUpdate({ budgetMax: Number(e.target.value) })}
          step={50000}
        />
        {data.budgetMax && (
          <p className="text-muted-foreground mt-1 text-sm">
            월 {data.budgetMax.toLocaleString()}원 이하
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">최대 보증금 (원)</label>
        <input
          type="number"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="10000000"
          value={data.depositMax ?? ''}
          onChange={(e) => onUpdate({ depositMax: e.target.value ? Number(e.target.value) : undefined })}
          step={1000000}
        />
      </div>

      <div>
        <label className="text-sm font-medium">연간 주행거리 제한 (km)</label>
        <input
          type="number"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="20000"
          value={data.mileageLimit ?? ''}
          onChange={(e) => onUpdate({ mileageLimit: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="rounded-lg border px-6 py-2.5">이전</button>
        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className="rounded-lg bg-blue-500 px-6 py-2.5 text-white disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create StepExtras and StepConfirm**

Create `src/features/quotes/components/steps/step-extras.tsx`:

```tsx
'use client'

import type { CreateQuoteRequestInput } from '../../schemas/quote-request'

type Props = {
  data: Partial<CreateQuoteRequestInput>
  onUpdate: (partial: Partial<CreateQuoteRequestInput>) => void
  onNext: () => void
  onBack: () => void
}

export function StepExtras({ data, onUpdate, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">추가 요청</h2>

      <div>
        <label className="text-sm font-medium">특수 요청사항</label>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={4}
          placeholder="선호하는 옵션이나 조건이 있다면 적어주세요"
          value={data.specialRequests ?? ''}
          onChange={(e) => onUpdate({ specialRequests: e.target.value || undefined })}
          maxLength={500}
        />
        <p className="text-muted-foreground text-right text-xs">
          {(data.specialRequests ?? '').length}/500
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">입찰 마감 (일)</label>
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={data.expiresInDays ?? 3}
          onChange={(e) => onUpdate({ expiresInDays: Number(e.target.value) })}
        >
          <option value={1}>1일</option>
          <option value={2}>2일</option>
          <option value={3}>3일 (기본)</option>
          <option value={5}>5일</option>
          <option value={7}>7일</option>
        </select>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="rounded-lg border px-6 py-2.5">이전</button>
        <button type="button" onClick={onNext} className="rounded-lg bg-blue-500 px-6 py-2.5 text-white">다음</button>
      </div>
    </div>
  )
}
```

Create `src/features/quotes/components/steps/step-confirm.tsx`:

```tsx
'use client'

import type { CreateQuoteRequestInput } from '../../schemas/quote-request'

type Props = {
  data: Partial<CreateQuoteRequestInput>
  onSubmit: () => void
  onBack: () => void
  submitting: boolean
}

export function StepConfirm({ data, onSubmit, onBack, submitting }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">견적 요청 확인</h2>

      <div className="space-y-3 rounded-lg border p-4">
        <Row label="계약 유형" value={data.contractType === 'RENTAL' ? '렌탈' : '리스'} />
        <Row label="계약 기간" value={`${data.contractMonths}개월`} />
        <Row label="최대 월 예산" value={`${data.budgetMax?.toLocaleString()}원`} />
        {data.depositMax && <Row label="최대 보증금" value={`${data.depositMax.toLocaleString()}원`} />}
        {data.mileageLimit && <Row label="연간 주행거리" value={`${data.mileageLimit.toLocaleString()}km`} />}
        {data.specialRequests && <Row label="추가 요청" value={data.specialRequests} />}
        <Row label="입찰 마감" value={`${data.expiresInDays ?? 3}일 후`} />
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="rounded-lg border px-6 py-2.5">이전</button>
        <button
          type="button"
          disabled={submitting}
          onClick={onSubmit}
          className="rounded-lg bg-blue-500 px-8 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {submitting ? '제출 중...' : '견적 요청하기'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? '-'}</span>
    </div>
  )
}
```

- [ ] **Step 5: Create page**

Create `src/app/(public)/quote/request/page.tsx`:

```tsx
import { QuoteWizard } from '@/features/quotes/components/quote-wizard'

export const metadata = { title: '견적 요청 | Navid Auto' }

export default function QuoteRequestPage() {
  return <QuoteWizard />
}
```

- [ ] **Step 6: Run type check**

Run: `bun run type-check`
Expected: No type errors

- [ ] **Step 7: Commit**

```bash
git add src/features/quotes/components/ src/app/\(public\)/quote/
git commit -m "feat(quotes): add customer quote request wizard UI"
```

---

## Task 6: Dealer Bid Portal UI

**Files:**
- Create: `src/features/quotes/components/dealer/quote-list.tsx`
- Create: `src/features/quotes/components/dealer/bid-form.tsx`
- Create: `src/features/quotes/components/dealer/my-bids.tsx`
- Create: `src/app/dealer/bids/page.tsx`
- Create: `src/app/dealer/bids/[quoteId]/new/page.tsx`

- [ ] **Step 1: Create dealer quote list**

Create `src/features/quotes/components/dealer/quote-list.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type QuoteItem = {
  id: string
  contractType: 'RENTAL' | 'LEASE'
  budgetMax: number
  contractMonths: number
  status: string
  expiresAt: string
  customer: { name: string | null }
  preferredBrand: { name: string; nameKo: string | null } | null
  preferredModel: { name: string; nameKo: string | null } | null
  _count: { bids: number }
}

export function DealerQuoteList() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dealer/quotes')
      .then((r) => r.json())
      .then((json) => setQuotes(json.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted-foreground py-8 text-center">로딩 중...</p>
  if (quotes.length === 0) return <p className="text-muted-foreground py-8 text-center">새 견적 요청이 없습니다.</p>

  return (
    <div className="space-y-3">
      {quotes.map((q) => {
        const remaining = Math.max(0, Math.ceil((new Date(q.expiresAt).getTime() - Date.now()) / 86400000))
        return (
          <div key={q.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {q.contractType === 'RENTAL' ? '렌탈' : '리스'}
                </span>
                <span className="text-muted-foreground ml-2 text-sm">{q.contractMonths}개월</span>
                <h3 className="mt-1 font-semibold">
                  {q.preferredBrand?.nameKo ?? q.preferredBrand?.name ?? '브랜드 무관'}
                  {q.preferredModel ? ` ${q.preferredModel.nameKo ?? q.preferredModel.name}` : ''}
                </h3>
                <p className="text-muted-foreground text-sm">
                  월 {q.budgetMax.toLocaleString()}원 이하 · 입찰 {q._count.bids}건 · {remaining}일 남음
                </p>
              </div>
              <Link
                href={`/dealer/bids/${q.id}/new`}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white"
              >
                입찰하기
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create bid form**

Create `src/features/quotes/components/dealer/bid-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { quoteRequestId: string }

export function BidForm({ quoteRequestId }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    monthlyPayment: '',
    deposit: '',
    totalCost: '',
    residualValue: '',
    interestRate: '',
    promotionNote: '',
  })

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/dealer/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteRequestId,
          monthlyPayment: Number(form.monthlyPayment),
          deposit: Number(form.deposit),
          totalCost: Number(form.totalCost),
          residualValue: form.residualValue ? Number(form.residualValue) : undefined,
          interestRate: form.interestRate ? Number(form.interestRate) : undefined,
          promotionNote: form.promotionNote || undefined,
        }),
      })
      if (res.ok) {
        router.push('/dealer/bids')
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">입찰 작성</h2>

      <div>
        <label className="text-sm font-medium">월 납입금 (원) *</label>
        <input type="number" required className="mt-1 w-full rounded-lg border px-3 py-2"
          value={form.monthlyPayment} onChange={(e) => update('monthlyPayment', e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">보증금 (원) *</label>
        <input type="number" required className="mt-1 w-full rounded-lg border px-3 py-2"
          value={form.deposit} onChange={(e) => update('deposit', e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">총 비용 (원) *</label>
        <input type="number" required className="mt-1 w-full rounded-lg border px-3 py-2"
          value={form.totalCost} onChange={(e) => update('totalCost', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">잔존가치 (원)</label>
          <input type="number" className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.residualValue} onChange={(e) => update('residualValue', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">이자율 (%)</label>
          <input type="number" step="0.1" className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.interestRate} onChange={(e) => update('interestRate', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">프로모션 메모</label>
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={2}
          value={form.promotionNote} onChange={(e) => update('promotionNote', e.target.value)}
          maxLength={300} placeholder="특별 프로모션이 있다면 적어주세요" />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="rounded-lg border px-6 py-2.5">취소</button>
        <button type="submit" disabled={submitting}
          className="rounded-lg bg-blue-500 px-6 py-2.5 font-medium text-white disabled:opacity-50">
          {submitting ? '제출 중...' : '입찰 제출'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Create pages**

Create `src/app/dealer/bids/page.tsx`:

```tsx
import { DealerQuoteList } from '@/features/quotes/components/dealer/quote-list'

export default function DealerBidsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">견적 요청 / 입찰</h1>
      <DealerQuoteList />
    </div>
  )
}
```

Create `src/app/dealer/bids/[quoteId]/new/page.tsx`:

```tsx
import { BidForm } from '@/features/quotes/components/dealer/bid-form'

type Props = { params: Promise<{ quoteId: string }> }

export default async function NewBidPage({ params }: Props) {
  const { quoteId } = await params
  return (
    <div className="mx-auto max-w-xl py-8">
      <BidForm quoteRequestId={quoteId} />
    </div>
  )
}
```

- [ ] **Step 4: Run type check**

Run: `bun run type-check`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/features/quotes/components/dealer/ src/app/dealer/bids/
git commit -m "feat(quotes): add dealer bid portal UI — quote list and bid form"
```

---

## Task 7: Comparison View UI + Bid Selection

**Files:**
- Create: `src/features/quotes/components/comparison-view.tsx`
- Create: `src/features/quotes/components/quote-status-banner.tsx`
- Create: `src/app/(public)/quote/[id]/page.tsx`
- Create: `src/app/(public)/quote/[id]/compare/page.tsx`

- [ ] **Step 1: Create quote status page (waiting / redirect to compare)**

Create `src/app/(public)/quote/[id]/page.tsx`:

```tsx
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { QuoteStatusBanner } from '@/features/quotes/components/quote-status-banner'

type Props = { params: Promise<{ id: string }> }

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params
  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
    include: { _count: { select: { bids: { where: { status: 'SUBMITTED' } } } } },
  })

  if (!quote) notFound()

  if (quote.status === 'COMPARING' || quote.status === 'SELECTED') {
    redirect(`/quote/${id}/compare`)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <QuoteStatusBanner
        status={quote.status}
        bidCount={quote._count.bids}
        expiresAt={quote.expiresAt.toISOString()}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create QuoteStatusBanner**

Create `src/features/quotes/components/quote-status-banner.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

type Props = {
  status: string
  bidCount: number
  expiresAt: string
}

export function QuoteStatusBanner({ status, bidCount: initialCount, expiresAt }: Props) {
  const [bidCount, setBidCount] = useState(initialCount)

  // Poll for bid count updates every 30 seconds
  useEffect(() => {
    if (status !== 'OPEN' && status !== 'BIDDING') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(window.location.href)
        if (res.redirected) {
          window.location.href = res.url
        }
      } catch { /* polling failure is non-critical */ }
    }, 30000)
    return () => clearInterval(interval)
  }, [status])

  const remaining = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))

  if (status === 'EXPIRED') {
    return (
      <div className="space-y-4">
        <div className="text-5xl">⏰</div>
        <h2 className="text-xl font-bold">마감되었습니다</h2>
        <p className="text-muted-foreground">입찰 기간이 종료되었습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-5xl">📋</div>
      <h2 className="text-xl font-bold">딜러 입찰을 기다리고 있습니다</h2>
      <div className="mx-auto flex max-w-xs justify-between rounded-lg bg-blue-50 p-4">
        <div>
          <p className="text-2xl font-bold text-blue-600">{bidCount}</p>
          <p className="text-muted-foreground text-sm">입찰</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">{remaining}</p>
          <p className="text-muted-foreground text-sm">일 남음</p>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        30초마다 자동 갱신됩니다. 마감 후 비교 화면으로 이동합니다.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Create comparison view page**

Create `src/app/(public)/quote/[id]/compare/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getQuoteRequestById } from '@/features/quotes/queries/quote'
import { ComparisonView } from '@/features/quotes/components/comparison-view'

type Props = { params: Promise<{ id: string }> }

export default async function QuoteComparePage({ params }: Props) {
  const { id } = await params
  const quote = await getQuoteRequestById(id)
  if (!quote) notFound()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">비교 견적</h1>
      <p className="text-muted-foreground mb-8">
        {quote.contractType === 'RENTAL' ? '렌탈' : '리스'} · {quote.contractMonths}개월 ·
        월 {quote.budgetMax.toLocaleString()}원 이하
      </p>
      <ComparisonView
        quoteId={quote.id}
        bids={quote.bids.map((b) => ({
          id: b.id,
          dealerName: b.dealer.name ?? '딜러',
          monthlyPayment: b.monthlyPayment,
          deposit: b.deposit,
          totalCost: b.totalCost,
          residualValue: b.residualValue,
          interestRate: b.interestRate,
          promotionNote: b.promotionNote,
          status: b.status,
          vehicleName: b.vehicle
            ? `${b.vehicle.trim.generation.carModel.brand.name} ${b.vehicle.trim.generation.carModel.name} ${b.vehicle.year}`
            : null,
          vehicleImageUrl: b.vehicle?.images[0]?.url ?? null,
        }))}
        isSelectable={quote.status === 'COMPARING'}
        selectedBidId={quote.selectedBidId}
      />
    </div>
  )
}
```

- [ ] **Step 4: Create ComparisonView component**

Create `src/features/quotes/components/comparison-view.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type BidCard = {
  id: string
  dealerName: string
  monthlyPayment: number
  deposit: number
  totalCost: number
  residualValue: number | null
  interestRate: number | null
  promotionNote: string | null
  status: string
  vehicleName: string | null
  vehicleImageUrl: string | null
}

type Props = {
  quoteId: string
  bids: BidCard[]
  isSelectable: boolean
  selectedBidId: string | null
}

export function ComparisonView({ quoteId, bids, isSelectable, selectedBidId }: Props) {
  const router = useRouter()
  const [selecting, setSelecting] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'monthlyPayment' | 'totalCost' | 'deposit'>('monthlyPayment')

  const sortedBids = [...bids].sort((a, b) => a[sortBy] - b[sortBy])
  const lowestMonthly = Math.min(...bids.map((b) => b.monthlyPayment))

  async function handleSelect(bidId: string) {
    setSelecting(bidId)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/select`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setSelecting(null)
    }
  }

  if (bids.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">아직 입찰이 없습니다.</p>
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="mb-4 flex gap-2">
        {[
          { key: 'monthlyPayment' as const, label: '월납입금순' },
          { key: 'totalCost' as const, label: '총비용순' },
          { key: 'deposit' as const, label: '보증금순' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`rounded-full px-3 py-1 text-sm ${
              sortBy === key ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bid cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedBids.map((bid) => {
          const isLowest = bid.monthlyPayment === lowestMonthly
          const isSelected = bid.id === selectedBidId

          return (
            <div
              key={bid.id}
              className={`relative rounded-xl border-2 p-5 transition ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : isLowest
                    ? 'border-blue-500'
                    : 'border-gray-200'
              }`}
            >
              {isLowest && !isSelected && (
                <span className="absolute -top-2.5 left-3 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                  최저가
                </span>
              )}
              {isSelected && (
                <span className="absolute -top-2.5 left-3 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                  선택됨
                </span>
              )}

              <p className="font-semibold">{bid.dealerName}</p>
              {bid.vehicleName && (
                <p className="text-muted-foreground text-sm">{bid.vehicleName}</p>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">월 납입금</span>
                  <span className="text-lg font-bold text-blue-600">
                    {bid.monthlyPayment.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">보증금</span>
                  <span>{bid.deposit.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">총 비용</span>
                  <span>{bid.totalCost.toLocaleString()}원</span>
                </div>
                {bid.residualValue && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">잔존가치</span>
                    <span>{bid.residualValue.toLocaleString()}원</span>
                  </div>
                )}
                {bid.interestRate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">이자율</span>
                    <span>{bid.interestRate}%</span>
                  </div>
                )}
              </div>

              {bid.promotionNote && (
                <p className="mt-3 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-800">
                  {bid.promotionNote}
                </p>
              )}

              {isSelectable && !isSelected && (
                <button
                  onClick={() => handleSelect(bid.id)}
                  disabled={selecting !== null}
                  className="mt-4 w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {selecting === bid.id ? '선택 중...' : '이 견적 선택'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run type check**

Run: `bun run type-check`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add src/features/quotes/components/ src/app/\(public\)/quote/
git commit -m "feat(quotes): add comparison view UI with bid selection"
```

---

## Summary

| Task | Description | Depends On |
|------|-------------|-----------|
| 1 | QuoteRequest + DealerBid Prisma models | Track 1 Task 1 (enums) |
| 2 | State machine + Zod schemas | — |
| 3 | Customer quote API routes | Tasks 1, 2 |
| 4 | Dealer bid API routes | Tasks 1, 2 |
| 5 | Customer quote wizard UI | Task 3 |
| 6 | Dealer bid portal UI | Task 4 |
| 7 | Comparison view + bid selection | Tasks 3, 4 |

**Parallelization:** Tasks 3 and 4 can run in parallel. Tasks 5 and 6 can run in parallel.
