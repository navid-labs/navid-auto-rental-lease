import { describe, it, expect } from 'vitest'
import {
  getKoreanVehicleName,
  formatKoreanDate,
  formatKRW,
  formatDate,
} from '@/lib/utils/format'

describe('getKoreanVehicleName', () => {
  const makeVehicle = (overrides?: {
    brandNameKo?: string | null
    modelNameKo?: string | null
    trimName?: string
    year?: number
  }) => ({
    year: overrides?.year ?? 2024,
    trim: {
      name: overrides?.trimName ?? '\uD504\uB9AC\uBBF8\uC5C4',
      generation: {
        carModel: {
          name: 'Sonata',
          nameKo: overrides?.modelNameKo !== undefined ? overrides.modelNameKo : '\uC3D8\uB098\uD0C0',
          brand: {
            name: 'Hyundai',
            nameKo: overrides?.brandNameKo !== undefined ? overrides.brandNameKo : '\uD604\uB300',
          },
        },
      },
    },
  })

  it('formats full Korean name', () => {
    expect(getKoreanVehicleName(makeVehicle())).toBe('\uD604\uB300 \uC3D8\uB098\uD0C0 \uD504\uB9AC\uBBF8\uC5C4 2024')
  })

  it('falls back to English when nameKo is null', () => {
    expect(getKoreanVehicleName(makeVehicle({ brandNameKo: null, modelNameKo: null }))).toBe('Hyundai Sonata \uD504\uB9AC\uBBF8\uC5C4 2024')
  })

  it('handles mixed Korean/English names', () => {
    expect(getKoreanVehicleName(makeVehicle({ modelNameKo: null }))).toBe('\uD604\uB300 Sonata \uD504\uB9AC\uBBF8\uC5C4 2024')
  })

  it('excludes trim when includeTrim=false', () => {
    expect(getKoreanVehicleName(makeVehicle(), { includeTrim: false })).toBe('\uD604\uB300 \uC3D8\uB098\uD0C0 2024')
  })

  it('excludes year when includeYear=false', () => {
    expect(getKoreanVehicleName(makeVehicle(), { includeYear: false })).toBe('\uD604\uB300 \uC3D8\uB098\uD0C0 \uD504\uB9AC\uBBF8\uC5C4')
  })

  it('returns brand + model only when both options false', () => {
    expect(getKoreanVehicleName(makeVehicle(), { includeTrim: false, includeYear: false })).toBe('\uD604\uB300 \uC3D8\uB098\uD0C0')
  })
})

describe('formatKoreanDate', () => {
  it('is an alias for formatDate', () => {
    expect(formatKoreanDate).toBe(formatDate)
  })

  it('formats date in Korean', () => {
    expect(formatKoreanDate('2026-03-19')).toBe('2026\uB144 3\uC6D4 19\uC77C')
  })
})

describe('existing functions (regression)', () => {
  it('formatKRW still works', () => {
    expect(formatKRW(450000)).toBe('450,000\uC6D0')
  })

  it('formatDate still works', () => {
    expect(formatDate('2026-03-09', { short: true })).toBe('2026.03.09')
  })
})
