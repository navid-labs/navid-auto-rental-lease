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
  contractTerms: z.record(z.string(), z.unknown()).optional(),
  promotionNote: z.string().max(300).optional(),
})

export type CreateDealerBidInput = z.infer<typeof createDealerBidSchema>

export const selectBidSchema = z.object({
  bidId: z.string().uuid(),
})

export type SelectBidInput = z.infer<typeof selectBidSchema>
