import { describe, it, expect } from 'vitest'
import { calcAcquisitionTax } from './acquisition-tax'

describe('calcAcquisitionTax', () => {
  it('calculates 7% for sedan', () => {
    expect(calcAcquisitionTax(100_000_000, 'SEDAN', 'GASOLINE')).toBe(7_000_000)
  })

  it('calculates 5% for multi-passenger', () => {
    expect(calcAcquisitionTax(100_000_000, 'MULTI', 'DIESEL')).toBe(5_000_000)
  })

  it('calculates 4% for compact', () => {
    expect(calcAcquisitionTax(20_000_000, 'COMPACT', 'GASOLINE')).toBe(800_000)
  })

  it('exempts electric vehicles', () => {
    expect(calcAcquisitionTax(80_000_000, 'SEDAN', 'ELECTRIC')).toBe(0)
  })

  it('exempts hydrogen vehicles', () => {
    expect(calcAcquisitionTax(80_000_000, 'SEDAN', 'HYDROGEN')).toBe(0)
  })

  it('reduces hybrid tax by 1.4M', () => {
    // 5000만 승용 7% = 350만 - 140만 감면 = 210만
    expect(calcAcquisitionTax(50_000_000, 'SEDAN', 'HYBRID')).toBe(2_100_000)
  })

  it('hybrid reduction does not go below 0', () => {
    // 1000만 승용 7% = 70만 - 140만 감면 → 0
    expect(calcAcquisitionTax(10_000_000, 'SEDAN', 'HYBRID')).toBe(0)
  })
})
