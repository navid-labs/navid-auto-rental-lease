import { z } from 'zod'

/** Step 1: Vehicle confirmation */
export const vehicleConfirmSchema = z.object({
  vehicleId: z.string().uuid(),
})

/** Step 2: Contract terms */
export const termsSchema = z.object({
  contractType: z.enum(['RENTAL', 'LEASE']),
  periodMonths: z.coerce.number().min(12).max(60),
  deposit: z.coerce.number().min(0),
})

/** Step 3: eKYC verification */
export const ekycSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^01[016789]\d{7,8}$/),
  carrier: z.enum(['SKT', 'KT', 'LGU']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['M', 'F']),
  verificationCode: z.string().length(6),
})

/** Step 4: Review (no new input) */
export const reviewSchema = z.object({})

/** Inferred types from schemas */
export type VehicleConfirmData = z.infer<typeof vehicleConfirmSchema>
export type TermsData = z.infer<typeof termsSchema>
export type EkycData = z.infer<typeof ekycSchema>
export type ReviewData = z.infer<typeof reviewSchema>
