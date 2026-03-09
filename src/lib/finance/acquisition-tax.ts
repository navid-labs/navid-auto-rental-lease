import type { VehicleCategory, FuelType } from './types'
import {
  ACQUISITION_TAX_RATES,
  HYBRID_TAX_REDUCTION,
  TAX_EXEMPT_FUEL_TYPES,
} from './constants'

/**
 * 취득세 계산
 * - 전기차/수소차: 면제
 * - 하이브리드: 기본세율 - 140만원 감면
 * - 기타: 차량구분별 세율 적용
 */
export function calcAcquisitionTax(
  vehiclePrice: number,
  category: VehicleCategory,
  fuelType: FuelType
): number {
  if (TAX_EXEMPT_FUEL_TYPES.includes(fuelType)) return 0

  const baseTax = Math.round(vehiclePrice * ACQUISITION_TAX_RATES[category])

  if (fuelType === 'HYBRID') {
    return Math.max(0, baseTax - HYBRID_TAX_REDUCTION)
  }

  return baseTax
}
