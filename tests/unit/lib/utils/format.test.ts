import { describe, it, expect } from 'vitest'
import {
  formatKRW,
  formatDate,
  formatDistance,
  formatYearModel,
  getKoreanVehicleName,
} from '@/lib/utils/format'

describe('formatKRW', () => {
  it('formats basic currency', () => {
    expect(formatKRW(450000)).toBe('450,000원')
  })

  it('formats with monthly prefix', () => {
    expect(formatKRW(450000, { monthly: true })).toBe('월 450,000원')
  })

  it('formats zero', () => {
    expect(formatKRW(0)).toBe('0원')
  })

  it('formats large numbers', () => {
    expect(formatKRW(50000000)).toBe('50,000,000원')
  })
})

describe('formatDate', () => {
  it('formats in Korean formal', () => {
    const result = formatDate(new Date('2026-03-09'))
    expect(result).toContain('2026')
    expect(result).toContain('3')
    expect(result).toContain('9')
  })

  it('formats in short format', () => {
    expect(formatDate(new Date('2026-03-09'), { short: true })).toBe('2026.03.09')
  })

  it('accepts string input', () => {
    const result = formatDate('2026-03-09', { short: true })
    expect(result).toBe('2026.03.09')
  })
})

describe('formatDistance', () => {
  it('formats basic distance', () => {
    expect(formatDistance(12500)).toBe('12,500km')
  })

  it('formats compact for large distances', () => {
    expect(formatDistance(12500, { compact: true })).toBe('1.2만 km')
  })

  it('formats compact with round number', () => {
    expect(formatDistance(50000, { compact: true })).toBe('5만 km')
  })

  it('does not use compact for small distances', () => {
    expect(formatDistance(5000, { compact: true })).toBe('5,000km')
  })
})

describe('formatYearModel', () => {
  it('formats year model', () => {
    expect(formatYearModel(2026)).toBe('2026년식')
  })
})

describe('getKoreanVehicleName', () => {
  const vehicle = {
    year: 2024,
    trim: {
      name: '프리미엄',
      generation: {
        carModel: {
          name: 'Sonata',
          nameKo: '쏘나타',
          brand: {
            name: 'Hyundai',
            nameKo: '현대',
          },
        },
      },
    },
  }

  it('formats full name', () => {
    expect(getKoreanVehicleName(vehicle)).toBe('현대 쏘나타 프리미엄 2024')
  })

  it('excludes trim', () => {
    expect(getKoreanVehicleName(vehicle, { includeTrim: false })).toBe('현대 쏘나타 2024')
  })

  it('excludes year', () => {
    expect(getKoreanVehicleName(vehicle, { includeYear: false })).toBe('현대 쏘나타 프리미엄')
  })

  it('falls back to English names', () => {
    const englishVehicle = {
      year: 2024,
      trim: {
        name: 'Premium',
        generation: {
          carModel: {
            name: 'Model 3',
            nameKo: null,
            brand: { name: 'Tesla', nameKo: null },
          },
        },
      },
    }
    expect(getKoreanVehicleName(englishVehicle)).toBe('Tesla Model 3 Premium 2024')
  })
})
