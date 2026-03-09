import { DEPOSIT_CREDIT_RATES } from './constants'

/**
 * 보증금 인정액 계산
 * - 차량가의 40% 이하: 차량가격대별 인정율 적용
 * - 40% 초과분: 100% 인정
 */
export function calcDepositCredit(
  vehiclePrice: number,
  depositAmount: number
): number {
  if (depositAmount <= 0) return 0

  const threshold = vehiclePrice * 0.4
  const withinThreshold = Math.min(depositAmount, threshold)
  const overThreshold = Math.max(0, depositAmount - threshold)

  // 차량가격대별 인정율 찾기
  const tier = DEPOSIT_CREDIT_RATES.find((t) => vehiclePrice >= t.minPrice)
  const creditRate = tier?.rate ?? 0.70

  return Math.round(withinThreshold * creditRate + overThreshold)
}
