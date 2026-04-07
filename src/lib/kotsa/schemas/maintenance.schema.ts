import { z } from 'zod'

/**
 * KotsaMaintenanceHistory 관련 Zod 스키마
 * KotsaMaintenancePart, KotsaMaintenanceRecord, KotsaMaintenanceHistory 타입과 1:1 대응
 */

export const kotsaMaintenancePartSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
})

export const kotsaMaintenanceRecordSchema = z.object({
  date: z.string(),
  mileage: z.number(),
  shopName: z.string(),
  shopType: z.string(),
  category: z.string(),
  description: z.string(),
  parts: z.array(kotsaMaintenancePartSchema),
  laborCost: z.number(),
  totalCost: z.number(),
  nextMaintenanceDate: z.string().nullable(),
  nextMaintenanceMileage: z.number().nullable(),
  warranty: z.boolean(),
  recallRelated: z.boolean(),
  technicianId: z.string(),
  reportNumber: z.string(),
})

export const kotsaMaintenanceHistorySchema = z.object({
  totalRecords: z.number(),
  records: z.array(kotsaMaintenanceRecordSchema),
  lastMaintenanceDate: z.string().nullable(),
  lastMaintenanceMileage: z.number().nullable(),
})
