import { describe, it, expect } from 'vitest'
import { calcDepositCredit } from './deposit-credit'

describe('calcDepositCredit', () => {
  it('returns 0 for zero deposit', () => {
    expect(calcDepositCredit(100_000_000, 0)).toBe(0)
  })

  it('applies 0.76 rate for 1억+ vehicle (within 40%)', () => {
    // 1억 차량, 보증금 2000만 (20%) → 2000만 × 0.76 = 1520만
    expect(calcDepositCredit(100_000_000, 20_000_000)).toBe(15_200_000)
  })

  it('applies 0.80 rate for 1.5억+ vehicle', () => {
    // 2억 차량, 보증금 4000만 (20%) → 4000만 × 0.80 = 3200만
    expect(calcDepositCredit(200_000_000, 40_000_000)).toBe(32_000_000)
  })

  it('applies 0.72 rate for 5000만~1억 vehicle', () => {
    // 6000만 차량, 보증금 1200만 (20%) → 1200만 × 0.72 = 864만
    expect(calcDepositCredit(60_000_000, 12_000_000)).toBe(8_640_000)
  })

  it('applies 0.70 rate for under 5000만 vehicle', () => {
    // 3000만 차량, 보증금 600만 (20%) → 600만 × 0.70 = 420만
    expect(calcDepositCredit(30_000_000, 6_000_000)).toBe(4_200_000)
  })

  it('applies 100% credit on amount exceeding 40%', () => {
    // 1억 차량, 보증금 6000만 (60%)
    // 40% = 4000만 → 4000만 × 0.76 = 3040만
    // 초과분 2000만 → 100% = 2000만
    // 합계 = 5040만
    expect(calcDepositCredit(100_000_000, 60_000_000)).toBe(50_400_000)
  })
})
