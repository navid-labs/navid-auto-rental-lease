import { z } from 'zod'

/**
 * KotsaBasicInfo Zod 스키마
 * KotsaBasicInfo 타입과 1:1 대응
 */
export const kotsaBasicInfoSchema = z.object({
  vin: z.string(),
  registrationNumber: z.string(),
  ownerName: z.string(),
  registrationDate: z.string(),
  firstRegistrationDate: z.string(),
  vehicleType: z.string(),
  vehicleUse: z.string(),
  manufacturer: z.string(),
  modelName: z.string(),
  modelYear: z.number(),
  color: z.string(),
  displacement: z.number(),
  fuelType: z.string(),
  maxPower: z.string(),
  transmissionType: z.string(),
  numberOfSeats: z.number(),
  totalWeight: z.number(),
  curbWeight: z.number(),
  numberOfOwnerChanges: z.number(),
  hasSeizure: z.boolean(),
  hasMortgage: z.boolean(),
  insuranceExpiryDate: z.string().nullable(),
  inspectionExpiryDate: z.string().nullable(),
  mileage: z.number(),
  mileageDate: z.string(),
  isCommercial: z.boolean(),
  isPenalized: z.boolean(),
  registrationStatus: z.string(),
  cancelDate: z.string().nullable(),
  exportDate: z.string().nullable(),
  scrappedDate: z.string().nullable(),
  remarks: z.string().nullable(),
  lastUpdated: z.string(),
  dataSource: z.string(),
  responseCode: z.string(),
})

export type KotsaBasicInfoSchema = z.infer<typeof kotsaBasicInfoSchema>
