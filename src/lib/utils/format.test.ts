import { describe, it, expect } from 'vitest'
import { formatKRW, formatDate, formatDistance, formatYearModel } from './format'

describe('formatKRW', () => {
  it('formats basic KRW amount', () => {
    expect(formatKRW(450000)).toBe('450,000원')
  })

  it('formats monthly KRW amount', () => {
    expect(formatKRW(450000, { monthly: true })).toBe('월 450,000원')
  })
})

describe('formatDate', () => {
  it('formats date in Korean formal format', () => {
    expect(formatDate(new Date('2026-03-09'))).toBe('2026년 3월 9일')
  })

  it('formats date in short format', () => {
    expect(formatDate(new Date('2026-03-09'), { short: true })).toBe('2026.03.09')
  })
})

describe('formatDistance', () => {
  it('formats distance in km', () => {
    expect(formatDistance(12500)).toBe('12,500km')
  })

  it('formats distance in compact man-unit (decimal)', () => {
    expect(formatDistance(12500, { compact: true })).toBe('1.2만 km')
  })

  it('formats distance in compact man-unit (whole)', () => {
    expect(formatDistance(50000, { compact: true })).toBe('5만 km')
  })
})

describe('formatYearModel', () => {
  it('formats year model', () => {
    expect(formatYearModel(2026)).toBe('2026년식')
  })
})
