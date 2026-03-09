import { z } from 'zod'
import { LEASE_PERIOD_OPTIONS } from '@/lib/finance'

export const quoteParamsSchema = z.object({
  leasePeriodMonths: z
    .number()
    .refine(
      (v) => (LEASE_PERIOD_OPTIONS as readonly number[]).includes(v),
      { message: '유효한 리스 기간을 선택해주세요' }
    ),
  residualMethod: z.enum(['VEHICLE_PRICE', 'ACQUISITION_COST']),
  residualRate: z.number().min(0, '0 이상').max(1, '100% 이하'),
  depositRate: z.number().min(0, '0 이상').max(0.4, '40% 이하'),
  advancePayment: z.number().min(0, '0 이상'),
  creditGroup: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

export type QuoteParamsSchema = z.infer<typeof quoteParamsSchema>
