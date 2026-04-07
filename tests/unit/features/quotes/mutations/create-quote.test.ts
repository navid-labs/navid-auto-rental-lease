import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks (vi.hoisted pattern) ────────────────────────────────────

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    quoteRequest: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

// ── Import after mocks ────────────────────────────────────────────

import { createQuoteRequest } from '@/features/quotes/mutations/create-quote'

// ── Tests ─────────────────────────────────────────────────────────

const CUSTOMER_ID = 'customer-uuid-001'

const VALID_INPUT = {
  contractType: 'RENTAL' as const,
  budgetMax: 500000,
  contractMonths: 24,
  expiresInDays: 3,
}

describe('createQuoteRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls prisma.quoteRequest.create with status OPEN', async () => {
    const mockResult = { id: 'quote-uuid-001', status: 'OPEN' }
    mockPrisma.quoteRequest.create.mockResolvedValue(mockResult)

    const result = await createQuoteRequest(CUSTOMER_ID, VALID_INPUT)

    expect(result).toEqual(mockResult)
    expect(mockPrisma.quoteRequest.create).toHaveBeenCalledOnce()

    const callArg = mockPrisma.quoteRequest.create.mock.calls[0][0]
    expect(callArg.data.customerId).toBe(CUSTOMER_ID)
    expect(callArg.data.status).toBe('OPEN')
    expect(callArg.data.contractType).toBe('RENTAL')
    expect(callArg.data.budgetMax).toBe(500000)
    expect(callArg.data.contractMonths).toBe(24)
    // expiresInDays must be stripped; expiresAt must be a Date
    expect(callArg.data).not.toHaveProperty('expiresInDays')
    expect(callArg.data.expiresAt).toBeInstanceOf(Date)
  })

  it('sets expiresAt to today + expiresInDays days', async () => {
    mockPrisma.quoteRequest.create.mockResolvedValue({})

    const before = new Date()
    await createQuoteRequest(CUSTOMER_ID, { ...VALID_INPUT, expiresInDays: 5 })
    const after = new Date()

    const callArg = mockPrisma.quoteRequest.create.mock.calls[0][0]
    const expiresAt: Date = callArg.data.expiresAt

    const expectedMin = new Date(before)
    expectedMin.setDate(expectedMin.getDate() + 5)
    const expectedMax = new Date(after)
    expectedMax.setDate(expectedMax.getDate() + 5)

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime())
    expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime())
  })

  it('passes optional fields through when provided', async () => {
    mockPrisma.quoteRequest.create.mockResolvedValue({})

    await createQuoteRequest(CUSTOMER_ID, {
      ...VALID_INPUT,
      preferredBrandId: 'brand-uuid-001',
      specialRequests: '흰색 선호',
    })

    const callArg = mockPrisma.quoteRequest.create.mock.calls[0][0]
    expect(callArg.data.preferredBrandId).toBe('brand-uuid-001')
    expect(callArg.data.specialRequests).toBe('흰색 선호')
  })
})
