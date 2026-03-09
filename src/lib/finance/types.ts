/** 차량 구분 */
export type VehicleCategory = 'SEDAN' | 'MULTI' | 'VAN' | 'COMPACT'

/** 유종 */
export type FuelType =
  | 'GASOLINE'
  | 'PREMIUM'
  | 'DIESEL'
  | 'LPG'
  | 'ELECTRIC'
  | 'HYBRID'
  | 'HYDROGEN'

/** 잔가 산정 방식 */
export type ResidualMethod = 'VEHICLE_PRICE' | 'ACQUISITION_COST'

/** 견적 입력 */
export type QuoteInput = {
  vehiclePrice: number
  vehicleCategory: VehicleCategory
  fuelType: FuelType
  isImport: boolean
  brand?: string

  leasePeriodMonths: number
  residualMethod: ResidualMethod
  residualRate: number // 0~1
  depositRate: number // 0~1
  advancePayment: number
  creditGroup: 1 | 2 | 3
}

/** 견적 결과 */
export type QuoteResult = {
  acquisitionTax: number
  leasePrincipal: number
  residualValue: number
  depositAmount: number
  depositCredit: number
  effectivePrincipal: number
  annualRate: number
  monthlyPayment: number
  totalPayment: number
  initialCost: number
}
