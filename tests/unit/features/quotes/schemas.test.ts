import { describe, it, expect } from 'vitest'
import {
  createQuoteRequestSchema,
  createDealerBidSchema,
  selectBidSchema,
} from '@/features/quotes/schemas/quote-request'

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'

describe('createQuoteRequestSchema', () => {
  const validInput = {
    contractType: 'RENTAL',
    budgetMax: 500000,
    contractMonths: 24,
  }

  it('parses a minimal valid input', () => {
    const result = createQuoteRequestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('applies default expiresInDays of 3', () => {
    const result = createQuoteRequestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.expiresInDays).toBe(3)
    }
  })

  it('parses a fully populated valid input', () => {
    const result = createQuoteRequestSchema.safeParse({
      contractType: 'LEASE',
      preferredBrandId: VALID_UUID,
      preferredModelId: VALID_UUID,
      yearMin: 2020,
      yearMax: 2025,
      budgetMin: 200000,
      budgetMax: 800000,
      contractMonths: 36,
      depositMax: 5000000,
      mileageLimit: 20000,
      specialRequests: '흰색 차량 선호',
      expiresInDays: 5,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing contractType', () => {
    const result = createQuoteRequestSchema.safeParse({
      budgetMax: 500000,
      contractMonths: 24,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid contractType', () => {
    const result = createQuoteRequestSchema.safeParse({
      ...validInput,
      contractType: 'PURCHASE',
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

  it('rejects budgetMax below 100000', () => {
    const result = createQuoteRequestSchema.safeParse({
      ...validInput,
      budgetMax: 50000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid contractMonths (e.g. 18)', () => {
    const result = createQuoteRequestSchema.safeParse({
      ...validInput,
      contractMonths: 18,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('계약 기간은 12, 24, 36, 48개월 중 선택하세요')
    }
  })

  it('accepts all valid contractMonths values', () => {
    for (const months of [12, 24, 36, 48]) {
      const result = createQuoteRequestSchema.safeParse({
        ...validInput,
        contractMonths: months,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects expiresInDays below 1', () => {
    const result = createQuoteRequestSchema.safeParse({
      ...validInput,
      expiresInDays: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects expiresInDays above 7', () => {
    const result = createQuoteRequestSchema.safeParse({
      ...validInput,
      expiresInDays: 8,
    })
    expect(result.success).toBe(false)
  })

  it('rejects specialRequests exceeding 500 characters', () => {
    const result = createQuoteRequestSchema.safeParse({
      ...validInput,
      specialRequests: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid UUID for preferredBrandId', () => {
    const result = createQuoteRequestSchema.safeParse({
      ...validInput,
      preferredBrandId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('coerces string numbers to integers', () => {
    const result = createQuoteRequestSchema.safeParse({
      contractType: 'RENTAL',
      budgetMax: '500000',
      contractMonths: '24',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.budgetMax).toBe(500000)
      expect(result.data.contractMonths).toBe(24)
    }
  })
})

describe('createDealerBidSchema', () => {
  const validInput = {
    quoteRequestId: VALID_UUID,
    monthlyPayment: 300000,
    deposit: 1000000,
    totalCost: 8200000,
  }

  it('parses a minimal valid input', () => {
    const result = createDealerBidSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('parses a fully populated valid input', () => {
    const result = createDealerBidSchema.safeParse({
      quoteRequestId: VALID_UUID,
      vehicleId: VALID_UUID,
      monthlyPayment: 350000,
      deposit: 2000000,
      totalCost: 10400000,
      residualValue: 15000000,
      interestRate: 3.5,
      contractTerms: { insuranceIncluded: true },
      promotionNote: '이번 달 특별 프로모션',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing quoteRequestId', () => {
    const result = createDealerBidSchema.safeParse({
      monthlyPayment: 300000,
      deposit: 1000000,
      totalCost: 8200000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid UUID for quoteRequestId', () => {
    const result = createDealerBidSchema.safeParse({
      ...validInput,
      quoteRequestId: 'invalid-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative monthlyPayment', () => {
    const result = createDealerBidSchema.safeParse({
      ...validInput,
      monthlyPayment: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative deposit', () => {
    const result = createDealerBidSchema.safeParse({
      ...validInput,
      deposit: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects interestRate above 100', () => {
    const result = createDealerBidSchema.safeParse({
      ...validInput,
      interestRate: 101,
    })
    expect(result.success).toBe(false)
  })

  it('rejects interestRate below 0', () => {
    const result = createDealerBidSchema.safeParse({
      ...validInput,
      interestRate: -0.1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects promotionNote exceeding 300 characters', () => {
    const result = createDealerBidSchema.safeParse({
      ...validInput,
      promotionNote: 'a'.repeat(301),
    })
    expect(result.success).toBe(false)
  })

  it('accepts promotionNote of exactly 300 characters', () => {
    const result = createDealerBidSchema.safeParse({
      ...validInput,
      promotionNote: 'a'.repeat(300),
    })
    expect(result.success).toBe(true)
  })

  it('accepts zero values for payment fields', () => {
    const result = createDealerBidSchema.safeParse({
      ...validInput,
      monthlyPayment: 0,
      deposit: 0,
      totalCost: 0,
    })
    expect(result.success).toBe(true)
  })
})

describe('selectBidSchema', () => {
  it('parses a valid bidId UUID', () => {
    const result = selectBidSchema.safeParse({ bidId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it('rejects missing bidId', () => {
    const result = selectBidSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects invalid UUID for bidId', () => {
    const result = selectBidSchema.safeParse({ bidId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})
