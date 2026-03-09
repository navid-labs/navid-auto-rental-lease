import type { ResidualMethod } from './types'
import { MAX_RESIDUAL_RATES } from './constants'

/**
 * 잔가금액 계산
 * - 차량가방식: vehiclePrice × rate
 * - 취득원가방식: leasePrincipal × rate (단, 차량가방식 대비 -2%p)
 * - rate는 기간별 상한 이내로 클램핑
 */
export function calcResidualValue(
  vehiclePrice: number,
  leasePrincipal: number,
  method: ResidualMethod,
  rate: number,
  periodMonths: number
): number {
  const maxRate = MAX_RESIDUAL_RATES[periodMonths] ?? 0.30
  const clampedRate = Math.min(rate, maxRate)

  if (method === 'VEHICLE_PRICE') {
    return Math.round(vehiclePrice * clampedRate)
  }

  // 취득원가방식: -2%p 적용
  const adjustedRate = Math.max(0, clampedRate - 0.02)
  return Math.round(leasePrincipal * adjustedRate)
}

/** 기간에 대한 최대 잔가율 반환 */
export function getMaxResidualRate(periodMonths: number): number {
  return MAX_RESIDUAL_RATES[periodMonths] ?? 0.30
}
