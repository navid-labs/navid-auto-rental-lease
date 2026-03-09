import { describe, it, expect } from 'vitest'
import { calculateQuote } from './quote-calculator'
import type { QuoteInput } from './types'

const BASE_INPUT: QuoteInput = {
  vehiclePrice: 220_000_000,
  vehicleCategory: 'SEDAN',
  fuelType: 'GASOLINE',
  isImport: true,
  brand: 'Mercedes Benz',
  leasePeriodMonths: 36,
  residualMethod: 'VEHICLE_PRICE',
  residualRate: 0.45,
  depositRate: 0.20,
  advancePayment: 0,
  creditGroup: 1,
}

describe('calculateQuote', () => {
  it('calculates a complete quote for Mercedes G63', () => {
    const result = calculateQuote(BASE_INPUT)

    // 취득세: 2.2억 × 7% = 1540만
    expect(result.acquisitionTax).toBe(15_400_000)

    // 리스원금: 2.2억 + 1540만 = 2.354억
    expect(result.leasePrincipal).toBe(235_400_000)

    // 잔가: 2.2억 × 45% = 9900만
    expect(result.residualValue).toBe(99_000_000)

    // 보증금: 2.2억 × 20% = 4400만
    expect(result.depositAmount).toBe(44_000_000)

    // 보증금 인정: 4400만 × 0.80 (1.5억+) = 3520만
    expect(result.depositCredit).toBe(35_200_000)

    // 실 리스원금: 2.354억 - 3520만 - 0 = 2.002억
    expect(result.effectivePrincipal).toBe(200_200_000)

    // 금리: 벤츠 0.04 + 1그룹 0.044 = 0.084
    expect(result.annualRate).toBeCloseTo(0.084, 4)

    // 월 납입금: 양수, 합리적 범위
    expect(result.monthlyPayment).toBeGreaterThan(3_000_000)
    expect(result.monthlyPayment).toBeLessThan(6_000_000)

    // 초기 비용: 보증금만
    expect(result.initialCost).toBe(44_000_000)
  })

  it('calculates for domestic vehicle (Hyundai)', () => {
    const result = calculateQuote({
      ...BASE_INPUT,
      vehiclePrice: 50_000_000,
      isImport: false,
      brand: 'Hyundai',
      depositRate: 0.10,
      residualRate: 0.30,
    })

    // 국산 기본 IRR 0.072 + 1그룹 0.044 = 0.116
    expect(result.annualRate).toBeCloseTo(0.116, 4)

    // 월 납입금이 양수
    expect(result.monthlyPayment).toBeGreaterThan(0)
  })

  it('calculates for electric vehicle (no acquisition tax)', () => {
    const result = calculateQuote({
      ...BASE_INPUT,
      vehiclePrice: 80_000_000,
      fuelType: 'ELECTRIC',
    })

    expect(result.acquisitionTax).toBe(0)
    expect(result.leasePrincipal).toBe(80_000_000)
  })

  it('handles 0 deposit and 0 advance payment', () => {
    const result = calculateQuote({
      ...BASE_INPUT,
      depositRate: 0,
      advancePayment: 0,
    })

    expect(result.depositAmount).toBe(0)
    expect(result.depositCredit).toBe(0)
    expect(result.effectivePrincipal).toBe(result.leasePrincipal)
  })

  it('handles acquisition cost residual method (-2%p)', () => {
    const vehicleResult = calculateQuote({
      ...BASE_INPUT,
      residualMethod: 'VEHICLE_PRICE',
      residualRate: 0.45,
    })

    const acquisitionResult = calculateQuote({
      ...BASE_INPUT,
      residualMethod: 'ACQUISITION_COST',
      residualRate: 0.45,
    })

    // 취득원가방식 잔가가 다름 (기준액과 -2%p 적용)
    expect(acquisitionResult.residualValue).not.toBe(vehicleResult.residualValue)
  })

  it('clamps residual rate to period max', () => {
    // 12개월 최대 65%, but request 70%
    const result = calculateQuote({
      ...BASE_INPUT,
      leasePeriodMonths: 12,
      residualRate: 0.70,
    })

    // 잔가 = 2.2억 × 65% (클램핑됨)
    expect(result.residualValue).toBe(143_000_000)
  })

  it('returns positive totalPayment', () => {
    const result = calculateQuote(BASE_INPUT)
    expect(result.totalPayment).toBe(result.monthlyPayment * 36)
    expect(result.totalPayment).toBeGreaterThan(0)
  })
})
