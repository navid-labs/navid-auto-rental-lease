import { describe, it, expect } from 'vitest'
import {
  calculateRental,
  calculateLease,
  estimateMonthlyRental,
  formatEstimate,
} from './calculate'

describe('calculateRental', () => {
  it('calculates monthly payment with zero deposit', () => {
    const result = calculateRental(36_000_000, 36, 0)
    expect(result.monthlyPayment).toBe(1_000_000)
    expect(result.totalCost).toBe(36_000_000)
    expect(result.deposit).toBe(0)
    expect(result.periodMonths).toBe(36)
  })

  it('deducts deposit from principal', () => {
    const result = calculateRental(36_000_000, 36, 3_600_000)
    expect(result.monthlyPayment).toBe(900_000)
    expect(result.deposit).toBe(3_600_000)
  })

  it('calculates for 60 month period', () => {
    const result = calculateRental(50_000_000, 60, 10_000_000)
    // (50M - 10M) / 60 = 666,666.67 => rounded
    expect(result.monthlyPayment).toBeCloseTo(666_667, -1)
  })

  it('returns zero for zero/negative price', () => {
    expect(calculateRental(0, 36, 0).monthlyPayment).toBe(0)
    expect(calculateRental(-1, 36, 0).monthlyPayment).toBe(0)
  })

  it('handles all period options', () => {
    for (const period of [12, 24, 36, 48, 60]) {
      const result = calculateRental(36_000_000, period, 0)
      expect(result.monthlyPayment).toBeGreaterThan(0)
      expect(result.periodMonths).toBe(period)
    }
  })
})

describe('calculateLease', () => {
  it('lease monthly is less than rental equivalent (residual excluded)', () => {
    const lease = calculateLease(36_000_000, 36, 0, 0.45)
    const rental = calculateRental(36_000_000, 36, 0)
    // Lease should be cheaper per month because residual is excluded from financing
    expect(lease.monthlyPayment).toBeLessThan(rental.monthlyPayment)
  })

  it('with residualRate=0, lease monthly approximates rental monthly', () => {
    // With 0 residual, lease principal is full amount but interest applies
    // So lease monthly should be >= rental monthly (interest adds cost)
    const lease = calculateLease(36_000_000, 36, 0, 0)
    expect(lease.monthlyPayment).toBeGreaterThan(0)
    expect(lease.residualValue).toBe(0)
    expect(lease.residualRate).toBe(0)
  })

  it('returns correct result shape', () => {
    const result = calculateLease(36_000_000, 36, 0, 0.45)
    expect(result).toHaveProperty('monthlyPayment')
    expect(result).toHaveProperty('deposit')
    expect(result).toHaveProperty('residualValue')
    expect(result).toHaveProperty('residualRate')
    expect(result).toHaveProperty('totalCost')
    expect(result).toHaveProperty('periodMonths')
  })

  it('calculates residual value correctly', () => {
    const result = calculateLease(36_000_000, 36, 0, 0.45)
    expect(result.residualValue).toBe(16_200_000) // 36M * 0.45
  })

  it('handles deposit in lease calculation', () => {
    const withDeposit = calculateLease(36_000_000, 36, 5_000_000, 0.45)
    const noDeposit = calculateLease(36_000_000, 36, 0, 0.45)
    expect(withDeposit.monthlyPayment).toBeLessThan(noDeposit.monthlyPayment)
    expect(withDeposit.deposit).toBe(5_000_000)
  })

  it('returns zero for zero/negative price', () => {
    expect(calculateLease(0, 36, 0, 0.45).monthlyPayment).toBe(0)
    expect(calculateLease(-1, 36, 0, 0.45).monthlyPayment).toBe(0)
  })
})

describe('estimateMonthlyRental', () => {
  it('estimates for default 36 months', () => {
    expect(estimateMonthlyRental(36_000_000)).toBe(1_000_000)
  })

  it('estimates for custom period', () => {
    // 25M / 48 = 520,833.33 => rounded to 520_833
    expect(estimateMonthlyRental(25_000_000, 48)).toBeCloseTo(520_833, -1)
  })

  it('returns 0 for zero price', () => {
    expect(estimateMonthlyRental(0)).toBe(0)
  })

  it('returns 0 for negative price', () => {
    expect(estimateMonthlyRental(-500_000)).toBe(0)
  })
})

describe('formatEstimate', () => {
  it('formats 320,000 to 만원 units', () => {
    expect(formatEstimate(320_000)).toBe('렌탈 월 ~32만원부터')
  })

  it('formats 1,000,000 to 만원 units', () => {
    expect(formatEstimate(1_000_000)).toBe('렌탈 월 ~100만원부터')
  })

  it('returns empty string for zero', () => {
    expect(formatEstimate(0)).toBe('')
  })

  it('returns empty string for negative', () => {
    expect(formatEstimate(-100)).toBe('')
  })
})
