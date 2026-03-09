import type { QuoteInput, QuoteResult } from './types'
import { pmt } from './pmt'
import { calcAcquisitionTax } from './acquisition-tax'
import { calcDepositCredit } from './deposit-credit'
import { calcResidualValue } from './residual-value'
import {
  IMPORT_BRAND_IRR,
  IMPORT_DEFAULT_IRR,
  DOMESTIC_BASE_IRR,
  CREDIT_GROUP_SURCHARGE,
} from './constants'

/**
 * 연 이자율 산출
 * - 수입차: 브랜드별 IRR + 신용등급 가산
 * - 국산차: 기본 IRR + 신용등급 가산
 */
function calcAnnualRate(
  isImport: boolean,
  brand: string | undefined,
  creditGroup: 1 | 2 | 3
): number {
  const brandIrr = brand ? IMPORT_BRAND_IRR[brand] : undefined
  const baseIrr = isImport
    ? (brandIrr ?? IMPORT_DEFAULT_IRR)
    : DOMESTIC_BASE_IRR

  return baseIrr + CREDIT_GROUP_SURCHARGE[creditGroup]
}

/**
 * 통합 견적 계산기
 * 입력 → 비용 분해 → PMT → 결과
 */
export function calculateQuote(input: QuoteInput): QuoteResult {
  const {
    vehiclePrice,
    vehicleCategory,
    fuelType,
    isImport,
    brand,
    leasePeriodMonths,
    residualMethod,
    residualRate,
    depositRate,
    advancePayment,
    creditGroup,
  } = input

  // 1. 취득세
  const acquisitionTax = calcAcquisitionTax(
    vehiclePrice,
    vehicleCategory,
    fuelType
  )

  // 2. 리스원금 (공채/부대비용/탁송료는 v1에서 0으로 단순화)
  const leasePrincipal = vehiclePrice + acquisitionTax

  // 3. 잔가
  const residualValue = calcResidualValue(
    vehiclePrice,
    leasePrincipal,
    residualMethod,
    residualRate,
    leasePeriodMonths
  )

  // 4. 보증금
  const depositAmount = Math.round(vehiclePrice * depositRate)
  const depositCredit = calcDepositCredit(vehiclePrice, depositAmount)

  // 5. 실 리스원금
  const effectivePrincipal = leasePrincipal - depositCredit - advancePayment

  // 6. 금리
  const annualRate = calcAnnualRate(isImport, brand, creditGroup)
  const monthlyRate = annualRate / 12

  // 7. 월 납입금
  const rawMonthly = pmt(
    monthlyRate,
    leasePeriodMonths,
    effectivePrincipal,
    -residualValue
  )
  const monthlyPayment = Math.round(Math.abs(rawMonthly))

  // 8. 총 납입금
  const totalPayment = monthlyPayment * leasePeriodMonths

  // 9. 초기 소요비용 (보증금 + 선납금)
  const initialCost = depositAmount + advancePayment

  return {
    acquisitionTax,
    leasePrincipal,
    residualValue,
    depositAmount,
    depositCredit,
    effectivePrincipal,
    annualRate,
    monthlyPayment,
    totalPayment,
    initialCost,
  }
}
