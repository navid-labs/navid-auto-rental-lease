import { describe, it, expect } from 'vitest'
import { MockKotsaAdapter, createMockKotsaVehicleData } from '@/lib/kotsa/adapters/mock-adapter'
import { kotsaVehicleDataSchema } from '@/lib/kotsa/schemas'

const VALID_REG = '23가1234'
const VALID_CI = 'ci-abc123def456'

describe('createMockKotsaVehicleData', () => {
  it('returns base fixture when called with no arguments', () => {
    const data = createMockKotsaVehicleData()
    expect(data.basicInfo.manufacturer).toBe('현대')
    expect(data.basicInfo.modelName).toBe('아반떼 CN7')
    expect(data.basicInfo.modelYear).toBe(2023)
    expect(data.spec.engine.displacement).toBe(1598)
    expect(data.maintenance.totalRecords).toBe(3)
    expect(data.maintenance.records).toHaveLength(3)
    expect(data.inspection.detail.overallGrade).toBe('A')
  })

  it('applies top-level basicInfo overrides', () => {
    const data = createMockKotsaVehicleData({
      basicInfo: { ownerName: '이철수', mileage: 50000 },
    })
    expect(data.basicInfo.ownerName).toBe('이철수')
    expect(data.basicInfo.mileage).toBe(50000)
    // Non-overridden fields remain unchanged
    expect(data.basicInfo.manufacturer).toBe('현대')
  })

  it('applies nested spec overrides', () => {
    const data = createMockKotsaVehicleData({
      spec: { engine: { displacement: 1999 } },
    })
    expect(data.spec.engine.displacement).toBe(1999)
    // Sibling fields in engine remain intact
    expect(data.spec.engine.fuelType).toBe('가솔린')
    // Sibling spec sections remain intact
    expect(data.spec.transmission.type).toBe('IVT(무단변속기)')
  })

  it('applies inspection detail overrides', () => {
    const data = createMockKotsaVehicleData({
      inspection: { detail: { overallGrade: 'B', overallScore: 72 } },
    })
    expect(data.inspection.detail.overallGrade).toBe('B')
    expect(data.inspection.detail.overallScore).toBe(72)
    // Other inspection sections remain intact
    expect(data.inspection.accidentHistory.hasAccident).toBe(false)
  })

  it('overrides array fields when provided', () => {
    const data = createMockKotsaVehicleData({
      maintenance: { records: [], totalRecords: 0 },
    })
    expect(data.maintenance.records).toHaveLength(0)
    expect(data.maintenance.totalRecords).toBe(0)
  })

  it('base fixture passes Zod schema validation', () => {
    const result = kotsaVehicleDataSchema.safeParse(createMockKotsaVehicleData())
    expect(result.success).toBe(true)
  })

  it('overridden fixture still passes Zod schema validation', () => {
    const data = createMockKotsaVehicleData({
      basicInfo: { hasSeizure: true, hasMortgage: true },
      inspection: { detail: { overallGrade: 'C', overallScore: 55 } },
    })
    const result = kotsaVehicleDataSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})

describe('MockKotsaAdapter', () => {
  it('fetchVehicleInfo returns valid KotsaVehicleData', async () => {
    const adapter = new MockKotsaAdapter()
    const data = await adapter.fetchVehicleInfo(VALID_REG, VALID_CI)
    expect(data).toBeDefined()
    expect(data.basicInfo).toBeDefined()
    expect(data.spec).toBeDefined()
    expect(data.maintenance).toBeDefined()
    expect(data.inspection).toBeDefined()
  })

  it('returned data passes Zod schema validation', async () => {
    const adapter = new MockKotsaAdapter()
    const data = await adapter.fetchVehicleInfo(VALID_REG, VALID_CI)
    const result = kotsaVehicleDataSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('reflects queried registrationNumber in response', async () => {
    const adapter = new MockKotsaAdapter()
    const reg = '99나9999'
    const data = await adapter.fetchVehicleInfo(reg, VALID_CI)
    expect(data.basicInfo.registrationNumber).toBe(reg)
  })

  it('throws when registrationNumber is empty string', async () => {
    const adapter = new MockKotsaAdapter()
    await expect(adapter.fetchVehicleInfo('', VALID_CI)).rejects.toThrow(
      '등록번호가 비어 있습니다.'
    )
  })

  it('ci parameter is accepted without affecting fixture data', async () => {
    const adapter = new MockKotsaAdapter()
    const data = await adapter.fetchVehicleInfo(VALID_REG, 'any-ci-value')
    expect(data.basicInfo.manufacturer).toBe('현대')
  })

  it('constructor overrides are applied to returned data', async () => {
    const adapter = new MockKotsaAdapter({
      basicInfo: { color: '검정' },
      inspection: { detail: { overallGrade: 'B_PLUS' } },
    })
    const data = await adapter.fetchVehicleInfo(VALID_REG, VALID_CI)
    expect(data.basicInfo.color).toBe('검정')
    expect(data.inspection.detail.overallGrade).toBe('B_PLUS')
    // Other fields unaffected
    expect(data.basicInfo.modelName).toBe('아반떼 CN7')
  })

  it('constructor-overridden data passes Zod schema validation', async () => {
    const adapter = new MockKotsaAdapter({
      inspection: { accidentHistory: { hasAccident: true, accidentCount: 1 } },
    })
    const data = await adapter.fetchVehicleInfo(VALID_REG, VALID_CI)
    const result = kotsaVehicleDataSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('two adapters with same overrides return equivalent data', async () => {
    const overrides = { basicInfo: { mileage: 99999 } }
    const a1 = new MockKotsaAdapter(overrides)
    const a2 = new MockKotsaAdapter(overrides)
    const [d1, d2] = await Promise.all([
      a1.fetchVehicleInfo(VALID_REG, VALID_CI),
      a2.fetchVehicleInfo(VALID_REG, VALID_CI),
    ])
    expect(d1.basicInfo.mileage).toBe(d2.basicInfo.mileage)
  })
})
