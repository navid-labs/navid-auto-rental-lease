import { describe, it, expect } from 'vitest'
import {
  kotsaBasicInfoSchema,
  kotsaSpecSchema,
  kotsaMaintenanceHistorySchema,
  kotsaInspectionSchema,
  kotsaVehicleDataSchema,
  kotsaPanelConditionSchema,
  kotsaInspectionDetailSchema,
} from '@/lib/kotsa/schemas'
import { createMockKotsaVehicleData } from '@/lib/kotsa/adapters/mock-adapter'

describe('kotsaBasicInfoSchema', () => {
  it('mock basicInfo passes validation', () => {
    const data = createMockKotsaVehicleData()
    const result = kotsaBasicInfoSchema.safeParse(data.basicInfo)
    expect(result.success).toBe(true)
  })

  it('rejects missing required field', () => {
    const { vin: _vin, ...withoutVin } = createMockKotsaVehicleData().basicInfo
    const result = kotsaBasicInfoSchema.safeParse(withoutVin)
    expect(result.success).toBe(false)
  })

  it('rejects wrong type for modelYear', () => {
    const result = kotsaBasicInfoSchema.safeParse({
      ...createMockKotsaVehicleData().basicInfo,
      modelYear: '2023',
    })
    expect(result.success).toBe(false)
  })

  it('accepts null for nullable fields', () => {
    const result = kotsaBasicInfoSchema.safeParse({
      ...createMockKotsaVehicleData().basicInfo,
      insuranceExpiryDate: null,
      inspectionExpiryDate: null,
      cancelDate: null,
      exportDate: null,
      scrappedDate: null,
      remarks: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects undefined for nullable fields (must be explicitly null)', () => {
    const result = kotsaBasicInfoSchema.safeParse({
      ...createMockKotsaVehicleData().basicInfo,
      insuranceExpiryDate: undefined,
    })
    // Zod treats undefined as missing key → fails
    expect(result.success).toBe(false)
  })
})

describe('kotsaSpecSchema', () => {
  it('mock spec passes validation', () => {
    const result = kotsaSpecSchema.safeParse(createMockKotsaVehicleData().spec)
    expect(result.success).toBe(true)
  })

  it('rejects missing engine sub-object', () => {
    const { engine: _engine, ...withoutEngine } = createMockKotsaVehicleData().spec
    const result = kotsaSpecSchema.safeParse(withoutEngine)
    expect(result.success).toBe(false)
  })

  it('accepts null for nullable engine fields (evRange, batteryCapacity etc.)', () => {
    const spec = createMockKotsaVehicleData().spec
    const result = kotsaSpecSchema.safeParse({
      ...spec,
      engine: {
        ...spec.engine,
        hybridType: null,
        evRange: null,
        batteryCapacity: null,
        chargingType: null,
        hydrogenTankCapacity: null,
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-number for turningRadius', () => {
    const spec = createMockKotsaVehicleData().spec
    const result = kotsaSpecSchema.safeParse({
      ...spec,
      steering: { ...spec.steering, turningRadius: '5.3' },
    })
    expect(result.success).toBe(false)
  })
})

describe('kotsaMaintenanceHistorySchema', () => {
  it('mock maintenance history passes validation', () => {
    const result = kotsaMaintenanceHistorySchema.safeParse(
      createMockKotsaVehicleData().maintenance
    )
    expect(result.success).toBe(true)
  })

  it('accepts empty records array', () => {
    const result = kotsaMaintenanceHistorySchema.safeParse({
      totalRecords: 0,
      records: [],
      lastMaintenanceDate: null,
      lastMaintenanceMileage: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects record with missing date field', () => {
    const maintenance = createMockKotsaVehicleData().maintenance
    const { date: _date, ...recordWithoutDate } = maintenance.records[0]
    const result = kotsaMaintenanceHistorySchema.safeParse({
      ...maintenance,
      records: [recordWithoutDate],
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-array parts', () => {
    const maintenance = createMockKotsaVehicleData().maintenance
    const result = kotsaMaintenanceHistorySchema.safeParse({
      ...maintenance,
      records: [{ ...maintenance.records[0], parts: 'none' }],
    })
    expect(result.success).toBe(false)
  })
})

describe('kotsaInspectionSchema', () => {
  it('mock inspection passes validation', () => {
    const result = kotsaInspectionSchema.safeParse(
      createMockKotsaVehicleData().inspection
    )
    expect(result.success).toBe(true)
  })

  it('rejects invalid panel status', () => {
    const inspection = createMockKotsaVehicleData().inspection
    const result = kotsaInspectionSchema.safeParse({
      ...inspection,
      exterior: {
        ...inspection.exterior,
        hood: { status: 'dented', detail: null },
      },
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid panel status values', () => {
    const statuses = ['normal', 'repainted', 'replaced', 'damaged'] as const
    for (const status of statuses) {
      const result = kotsaPanelConditionSchema.safeParse({ status, detail: null })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid overallGrade', () => {
    const inspection = createMockKotsaVehicleData().inspection
    const result = kotsaInspectionSchema.safeParse({
      ...inspection,
      detail: { ...inspection.detail, overallGrade: 'S' },
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid overallGrade values', () => {
    const grades = ['A_PLUS', 'A', 'B_PLUS', 'B', 'C'] as const
    for (const grade of grades) {
      const result = kotsaInspectionDetailSchema.safeParse({
        ...createMockKotsaVehicleData().inspection.detail,
        overallGrade: grade,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects non-array tireTreadDepth', () => {
    const inspection = createMockKotsaVehicleData().inspection
    const result = kotsaInspectionSchema.safeParse({
      ...inspection,
      mechanical: { ...inspection.mechanical, tireTreadDepth: 7.0 },
    })
    expect(result.success).toBe(false)
  })
})

describe('kotsaVehicleDataSchema (composite)', () => {
  it('full mock data passes combined schema', () => {
    const result = kotsaVehicleDataSchema.safeParse(createMockKotsaVehicleData())
    expect(result.success).toBe(true)
  })

  it('rejects data with missing top-level domain', () => {
    const { inspection: _inspection, ...withoutInspection } =
      createMockKotsaVehicleData()
    const result = kotsaVehicleDataSchema.safeParse(withoutInspection)
    expect(result.success).toBe(false)
  })

  it('parse() returns typed object matching input', () => {
    const input = createMockKotsaVehicleData()
    const parsed = kotsaVehicleDataSchema.parse(input)
    expect(parsed.basicInfo.manufacturer).toBe('현대')
    expect(parsed.spec.engine.displacement).toBe(1598)
    expect(parsed.maintenance.totalRecords).toBe(3)
    expect(parsed.inspection.detail.overallGrade).toBe('A')
  })
})
