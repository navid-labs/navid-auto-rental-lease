import { z } from "zod"

/**
 * 차용 Listing 입력 검증 — 3상품 디스크리미네이티드 유니온.
 *
 * Prisma enum이 런타임 import 가능할 때까지 로컬 리터럴 유니온으로 표현.
 * API route (POST/PUT), Admin 폼, SELL 위자드에서 단일 진입 검증.
 */

const fuelType = z.enum(["GASOLINE", "DIESEL", "HYBRID", "PHEV", "EV", "HYDROGEN", "LPG"])
const transmission = z.enum(["AUTO", "MANUAL", "CVT", "DCT"])
const bodyType = z.enum(["SEDAN", "SUV", "HATCH", "COUPE", "WAGON", "VAN", "TRUCK", "CONVERTIBLE"])
const drivetrain = z.enum(["FF", "FR", "AWD", "FOURWD"])
const plateType = z.enum(["PRIVATE", "COMMERCIAL"])
const grade = z.enum(["A", "B", "C"])

const baseListing = z.object({
  brand: z.string().min(1, "brand is required"),
  model: z.string().min(1, "model is required"),
  year: z.number().int().min(1990).max(2100),
  mileage: z.number().int().nonnegative().optional(),
  vin: z.string().length(17).optional().nullable(),
  plateNumber: z.string().optional().nullable(),
  fuelType: fuelType.optional().nullable(),
  transmission: transmission.optional().nullable(),
  displacement: z.number().int().positive().optional().nullable(),
  bodyType: bodyType.optional().nullable(),
  drivetrain: drivetrain.optional().nullable(),
  plateType: plateType.optional().nullable(),
  color: z.string().optional().nullable(),
  seatingCapacity: z.number().int().positive().optional().nullable(),
  trim: z.string().optional().nullable(),

  options: z.array(z.string()).default([]),

  accidentCount: z.number().int().min(0).max(99).default(0),
  ownerCount: z.number().int().min(0).max(99).optional().nullable(),
  exteriorGrade: grade.optional().nullable(),
  interiorGrade: grade.optional().nullable(),
  mileageVerified: z.boolean().default(false),
  registrationRegion: z.string().optional().nullable(),
  inspectionReportKey: z.string().optional().nullable(),
  inspectionDate: z.coerce.date().optional().nullable(),

  monthlyPayment: z.number().int().nonnegative(),
  remainingMonths: z.number().int().positive(),
  totalPrice: z.number().int().nonnegative().optional().nullable(),
  remainingBalance: z.number().int().nonnegative().optional().nullable(),
  initialCost: z.number().int().nonnegative().default(0),
  capitalCompany: z.string().optional().nullable(),

  description: z.string().optional().nullable(),
})

export const transferListingSchema = baseListing.extend({
  type: z.literal("TRANSFER"),
  carryoverPremium: z.number().int().nonnegative(),
  transferFee: z.number().int().nonnegative().default(0),
})

export const leaseListingSchema = baseListing.extend({
  type: z.literal("USED_LEASE"),
  deposit: z.number().int().nonnegative(),
  terminationFee: z.number().int().nonnegative(),
  mileageLimit: z.number().int().positive().nullable().optional(),
})

export const rentalListingSchema = baseListing.extend({
  type: z.literal("USED_RENTAL"),
  deposit: z.number().int().nonnegative(),
  terminationFee: z.number().int().nonnegative(),
  mileageLimit: z.number().int().positive().nullable().optional(),
})

export const listingInputSchema = z.discriminatedUnion("type", [
  transferListingSchema,
  leaseListingSchema,
  rentalListingSchema,
])

export type ListingInput = z.infer<typeof listingInputSchema>
export type TransferListingInput = z.infer<typeof transferListingSchema>
export type LeaseListingInput = z.infer<typeof leaseListingSchema>
export type RentalListingInput = z.infer<typeof rentalListingSchema>
