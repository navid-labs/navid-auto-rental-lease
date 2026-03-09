import { describe, it, expect } from 'vitest'
import { pmt } from './pmt'

describe('pmt', () => {
  it('returns 0 for 0 periods', () => {
    expect(pmt(0.01, 0, 1000000)).toBe(0)
  })

  it('calculates correctly with 0% interest', () => {
    // 1000만원 / 12개월 = 약 833,333원
    const result = pmt(0, 12, 10_000_000)
    expect(result).toBeCloseTo(-833333.33, 0)
  })

  it('calculates correctly with 0% interest and residual', () => {
    // (1000만 - 300만) / 12 = 583,333
    const result = pmt(0, 12, 10_000_000, -3_000_000)
    expect(result).toBeCloseTo(-583333.33, 0)
  })

  it('calculates monthly payment with interest (no residual)', () => {
    // 1억원, 연 8.4% (월 0.7%), 36개월
    const monthly = pmt(0.084 / 12, 36, 100_000_000)
    // Excel PMT(0.007, 36, 100000000) ≈ -3,145,521
    expect(Math.round(Math.abs(monthly))).toBeGreaterThan(3_000_000)
    expect(Math.round(Math.abs(monthly))).toBeLessThan(3_300_000)
  })

  it('calculates with interest and residual value', () => {
    // 2억원, 연 8.4%, 36개월, 잔가 9000만
    const monthly = pmt(0.084 / 12, 36, 200_000_000, -90_000_000)
    // 잔가가 있으면 월 납입금이 줄어야 함
    const noResidual = pmt(0.084 / 12, 36, 200_000_000, 0)
    expect(Math.abs(monthly)).toBeLessThan(Math.abs(noResidual))
    expect(Math.abs(monthly)).toBeGreaterThan(0)
  })

  it('returns negative value (cash outflow)', () => {
    const result = pmt(0.005, 36, 50_000_000)
    expect(result).toBeLessThan(0)
  })
})
