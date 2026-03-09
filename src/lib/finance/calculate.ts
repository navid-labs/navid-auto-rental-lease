import { pmt } from './pmt'

/** 국산차 기본 공개 UI용 연이율 (간이 계산) */
const DEFAULT_ANNUAL_RATE = 0.084

// ─── Types ──────────────────────────────────────────────

export type RentalResult = {
  monthlyPayment: number
  deposit: number
  totalCost: number
  periodMonths: number
}

export type LeaseResult = {
  monthlyPayment: number
  deposit: number
  residualValue: number
  residualRate: number
  totalCost: number
  periodMonths: number
}

// ─── Rental ─────────────────────────────────────────────

/**
 * 렌탈 월 납입금 (단순 균등 분할)
 * (vehiclePrice - deposit) / periodMonths
 */
export function calculateRental(
  vehiclePrice: number,
  periodMonths: number,
  deposit: number
): RentalResult {
  if (vehiclePrice <= 0 || periodMonths <= 0) {
    return { monthlyPayment: 0, deposit, totalCost: 0, periodMonths }
  }

  const principal = vehiclePrice - deposit
  const monthlyPayment = Math.round(principal / periodMonths)

  return {
    monthlyPayment,
    deposit,
    totalCost: deposit + monthlyPayment * periodMonths,
    periodMonths,
  }
}

// ─── Lease ──────────────────────────────────────────────

/**
 * 리스 월 납입금 (PMT 금융 계산)
 * 잔가를 제외한 원금에 대해 pmt() 적용
 */
export function calculateLease(
  vehiclePrice: number,
  periodMonths: number,
  deposit: number,
  residualRate: number,
  annualRate: number = DEFAULT_ANNUAL_RATE
): LeaseResult {
  if (vehiclePrice <= 0 || periodMonths <= 0) {
    return {
      monthlyPayment: 0,
      deposit,
      residualValue: 0,
      residualRate,
      totalCost: 0,
      periodMonths,
    }
  }

  const residualValue = Math.round(vehiclePrice * residualRate)
  const principal = vehiclePrice - deposit
  const monthlyRate = annualRate / 12

  // pmt returns negative (cash outflow), so negate
  const monthlyPayment = Math.round(
    Math.abs(pmt(monthlyRate, periodMonths, principal, -residualValue))
  )

  return {
    monthlyPayment,
    deposit,
    residualValue,
    residualRate,
    totalCost: deposit + monthlyPayment * periodMonths + residualValue,
    periodMonths,
  }
}

// ─── Estimate (for vehicle cards) ───────────────────────

/**
 * 차량 카드용 월 렌탈 예상가
 * vehiclePrice / defaultPeriod (기본 36개월)
 */
export function estimateMonthlyRental(
  vehiclePrice: number,
  defaultPeriod: number = 36
): number {
  if (vehiclePrice <= 0) return 0
  return Math.round(vehiclePrice / defaultPeriod)
}

// ─── Format ─────────────────────────────────────────────

/**
 * 월 납입금을 "렌탈 월 ~N만원부터" 형식으로 포맷
 */
export function formatEstimate(monthlyAmount: number): string {
  if (monthlyAmount <= 0) return ''
  const man = Math.round(monthlyAmount / 10_000)
  return `렌탈 월 ~${man}만원부터`
}
