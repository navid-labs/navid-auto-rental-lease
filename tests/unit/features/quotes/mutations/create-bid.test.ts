import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    quoteRequest: { findUnique: vi.fn(), update: vi.fn() },
    dealerBid: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

import { createDealerBid } from '@/features/quotes/mutations/create-bid'
import type { CreateDealerBidInput } from '@/features/quotes/schemas/quote-request'

const DEALER_ID = 'dealer-11111111-1111-4111-a111-111111111111'
const QUOTE_ID = 'quote-11111111-1111-4111-a111-111111111111'

const validInput: CreateDealerBidInput = {
  quoteRequestId: QUOTE_ID,
  monthlyPayment: 500000,
  deposit: 2000000,
  totalCost: 20000000,
}

const mockOpenQuote = {
  id: QUOTE_ID,
  status: 'OPEN',
  expiresAt: new Date(Date.now() + 86400000), // 1 day from now
}

const mockBiddingQuote = {
  ...mockOpenQuote,
  status: 'BIDDING',
}

describe('createDealerBid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates bid with SUBMITTED status for OPEN quote', async () => {
    mockPrisma.quoteRequest.findUnique.mockResolvedValue(mockOpenQuote)
    mockPrisma.dealerBid.findFirst.mockResolvedValue(null)
    mockPrisma.dealerBid.create.mockResolvedValue({
      id: 'bid-1',
      status: 'SUBMITTED',
    })
    mockPrisma.quoteRequest.update.mockResolvedValue({ ...mockOpenQuote, status: 'BIDDING' })

    const result = await createDealerBid(DEALER_ID, validInput)

    expect(result).toEqual({ success: true, data: { id: 'bid-1', status: 'SUBMITTED' } })
    expect(mockPrisma.dealerBid.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SUBMITTED',
          submittedAt: expect.any(Date),
          dealerId: DEALER_ID,
          quoteRequestId: QUOTE_ID,
        }),
      }),
    )
    // Quote transitions to BIDDING when first bid is placed on OPEN quote
    expect(mockPrisma.quoteRequest.update).toHaveBeenCalledWith({
      where: { id: QUOTE_ID },
      data: { status: 'BIDDING' },
    })
  })

  it('creates bid on BIDDING quote without updating quote status', async () => {
    mockPrisma.quoteRequest.findUnique.mockResolvedValue(mockBiddingQuote)
    mockPrisma.dealerBid.findFirst.mockResolvedValue(null)
    mockPrisma.dealerBid.create.mockResolvedValue({
      id: 'bid-2',
      status: 'SUBMITTED',
    })

    const result = await createDealerBid(DEALER_ID, validInput)

    expect(result).toEqual({ success: true, data: { id: 'bid-2', status: 'SUBMITTED' } })
    // No quote status update needed — already BIDDING
    expect(mockPrisma.quoteRequest.update).not.toHaveBeenCalled()
  })

  it('rejects duplicate bid from same dealer', async () => {
    mockPrisma.quoteRequest.findUnique.mockResolvedValue(mockBiddingQuote)
    mockPrisma.dealerBid.findFirst.mockResolvedValue({
      id: 'existing-bid',
      status: 'SUBMITTED',
    })

    const result = await createDealerBid(DEALER_ID, validInput)

    expect(result).toEqual({ success: false, error: '이미 해당 견적에 입찰하셨습니다' })
    expect(mockPrisma.dealerBid.create).not.toHaveBeenCalled()
  })

  it('rejects when quote does not exist', async () => {
    mockPrisma.quoteRequest.findUnique.mockResolvedValue(null)

    const result = await createDealerBid(DEALER_ID, validInput)

    expect(result).toEqual({ success: false, error: '견적 요청을 찾을 수 없습니다' })
    expect(mockPrisma.dealerBid.create).not.toHaveBeenCalled()
  })

  it('rejects when quote is expired', async () => {
    mockPrisma.quoteRequest.findUnique.mockResolvedValue({
      ...mockOpenQuote,
      expiresAt: new Date(Date.now() - 1000), // 1 second in the past
    })

    const result = await createDealerBid(DEALER_ID, validInput)

    expect(result).toEqual({ success: false, error: '만료된 견적 요청입니다' })
    expect(mockPrisma.dealerBid.create).not.toHaveBeenCalled()
  })

  it('rejects when quote status is not OPEN or BIDDING', async () => {
    mockPrisma.quoteRequest.findUnique.mockResolvedValue({
      ...mockOpenQuote,
      status: 'SELECTED',
    })

    const result = await createDealerBid(DEALER_ID, validInput)

    expect(result).toEqual({ success: false, error: '입찰 가능한 상태가 아닙니다' })
    expect(mockPrisma.dealerBid.create).not.toHaveBeenCalled()
  })
})
