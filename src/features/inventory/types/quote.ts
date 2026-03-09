import type {
  VehicleCategory,
  FuelType,
  ResidualMethod,
  QuoteResult,
} from '@/lib/finance'

/** Phase 10 InventoryItem에서 견적에 필요한 필드만 추출 */
export type InventoryVehicleForQuote = {
  id: string
  vehicleName: string
  vehiclePrice: number
  brand: string
  isImport: boolean
  vehicleCategory: VehicleCategory
  fuelType: FuelType
  promotionRate?: number
  subsidyAmount?: number
  options?: string
  exteriorColor?: string
  year?: number
}

/** 견적 파라미터 (사용자 입력) */
export type QuoteParams = {
  leasePeriodMonths: number
  residualMethod: ResidualMethod
  residualRate: number
  depositRate: number
  advancePayment: number
  creditGroup: 1 | 2 | 3
}

/** 개별 차량 견적 결과 */
export type VehicleQuoteResult = {
  vehicle: InventoryVehicleForQuote
  leaseResult: QuoteResult
  rentalEstimate: {
    monthlyPayment: number
    totalPayment: number
  }
  effectivePrice: number
}

/** 전체 견적 생성 결과 */
export type QuoteGenerationResult = {
  params: QuoteParams
  vehicles: VehicleQuoteResult[]
  generatedAt: Date
}
