import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getVehicleTags } from '@/features/vehicles/lib/vehicle-tags'

describe('getVehicleTags', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-22T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('accidentDiagnosis "none" returns "#무사고" tag', () => {
    const tags = getVehicleTags({
      inspectionData: { accidentDiagnosis: 'none' },
      historyData: null,
      warrantyEndDate: null,
    })
    expect(tags).toContain('#무사고')
  })

  it('ownerCount === 1 returns "#1인소유" tag', () => {
    const tags = getVehicleTags({
      inspectionData: null,
      historyData: { ownerCount: 1 },
      warrantyEndDate: null,
    })
    expect(tags).toContain('#1인소유')
  })

  it('accidentDiagnosis "none" AND warrantyEndDate future returns "#무사고+보증" tag', () => {
    const tags = getVehicleTags({
      inspectionData: { accidentDiagnosis: 'none' },
      historyData: null,
      warrantyEndDate: '2027-06-01T00:00:00Z',
    })
    expect(tags).toContain('#무사고+보증')
    // Should NOT also have plain #무사고 (it's combined)
    expect(tags).not.toContain('#무사고')
  })

  it('null inspectionData returns empty array', () => {
    const tags = getVehicleTags({
      inspectionData: null,
      historyData: null,
      warrantyEndDate: null,
    })
    expect(tags).toEqual([])
  })

  it('null historyData returns empty array (when no inspectionData either)', () => {
    const tags = getVehicleTags({
      inspectionData: null,
      historyData: null,
      warrantyEndDate: null,
    })
    expect(tags).toEqual([])
  })
})
