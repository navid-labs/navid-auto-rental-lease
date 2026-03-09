import type { VehicleCategory, FuelType } from './types'

/** 취득세율 */
export const ACQUISITION_TAX_RATES: Record<VehicleCategory, number> = {
  SEDAN: 0.07,
  MULTI: 0.05,
  VAN: 0.05,
  COMPACT: 0.04,
}

/** 하이브리드 취득세 감면 한도 (원) */
export const HYBRID_TAX_REDUCTION = 1_400_000

/** 전기차/수소차 취득세 면제 유종 */
export const TAX_EXEMPT_FUEL_TYPES: FuelType[] = ['ELECTRIC', 'HYDROGEN']

/** 기간별 잔가 상한 (운용리스) */
export const MAX_RESIDUAL_RATES: Record<number, number> = {
  12: 0.65,
  24: 0.55,
  36: 0.45,
  42: 0.40,
  48: 0.35,
  60: 0.30,
}

/** 브랜드별 IRR (수입차) */
export const IMPORT_BRAND_IRR: Record<string, number> = {
  BMW: 0.04,
  'Mercedes Benz': 0.04,
  Audi: 0.04,
  Volkswagen: 0.042,
  Volvo: 0.046,
  Porsche: 0.04,
  Toyota: 0.045,
  Lexus: 0.042,
  Ford: 0.042,
}

/** 국산차 기본 IRR */
export const DOMESTIC_BASE_IRR = 0.072

/** 수입차 기본 IRR (브랜드 매칭 실패 시) */
export const IMPORT_DEFAULT_IRR = 0.045

/** 신용등급별 가산 금리 */
export const CREDIT_GROUP_SURCHARGE: Record<number, number> = {
  1: 0.044,
  2: 0.045,
  3: 0.048,
}

/** 보증금 인정율 (40% 이하 구간) */
export const DEPOSIT_CREDIT_RATES: Array<{ minPrice: number; rate: number }> = [
  { minPrice: 150_000_000, rate: 0.80 },
  { minPrice: 120_000_000, rate: 0.76 },
  { minPrice: 100_000_000, rate: 0.76 },
  { minPrice: 50_000_000, rate: 0.72 },
  { minPrice: 0, rate: 0.70 },
]

/** 리스 기간 옵션 (개월) */
export const LEASE_PERIOD_OPTIONS = [12, 24, 36, 42, 48, 60] as const
