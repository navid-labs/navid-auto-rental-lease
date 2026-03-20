import { z } from 'zod'

const ownershipRecordSchema = z.object({
  ownerNumber: z.number(),
  usageType: z.enum(['personal', 'commercial', 'rental', 'lease']),
  startDate: z.string(),
  endDate: z.string().nullable(),
})

const insuranceClaimSchema = z.object({
  date: z.string(),
  type: z.enum(['myDamage', 'otherDamage']),
  amount: z.number(),
  description: z.string().nullable(),
})

export const historyDataSchema = z.object({
  accidentCount: z.number().default(0),
  myDamageCount: z.number().default(0),
  myDamageAmount: z.number().default(0),
  otherDamageCount: z.number().default(0),
  otherDamageAmount: z.number().default(0),
  ownerCount: z.number().default(1),
  ownershipHistory: z.array(ownershipRecordSchema).default([]),
  insuranceClaims: z.array(insuranceClaimSchema).default([]),
  warnings: z.object({
    flood: z.boolean().default(false),
    theft: z.boolean().default(false),
    totalLoss: z.boolean().default(false),
  }).default({ flood: false, theft: false, totalLoss: false }),
})

export type HistoryData = z.infer<typeof historyDataSchema>
