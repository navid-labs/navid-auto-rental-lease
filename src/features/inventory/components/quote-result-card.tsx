'use client'

import type { VehicleQuoteResult } from '../types/quote'

const fmt = new Intl.NumberFormat('ko-KR')
function won(n: number) {
  return `${fmt.format(n)}원`
}
function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

type Props = {
  result: VehicleQuoteResult
}

export function QuoteResultCard({ result }: Props) {
  const { vehicle, leaseResult, rentalEstimate, effectivePrice } = result
  const priceChanged = effectivePrice !== vehicle.vehiclePrice

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Vehicle info */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-gray-900">
            {vehicle.vehicleName}
          </h3>
          {vehicle.year && (
            <span className="text-xs text-gray-500">{vehicle.year}년</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
          {vehicle.exteriorColor && <span>{vehicle.exteriorColor}</span>}
          {vehicle.options && <span>{vehicle.options}</span>}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            {won(effectivePrice)}
          </span>
          {priceChanged && (
            <span className="text-sm text-gray-400 line-through">
              {won(vehicle.vehiclePrice)}
            </span>
          )}
        </div>
      </div>

      {/* Lease section */}
      <div className="border-b border-gray-100 px-4 py-3">
        <h4 className="mb-2 text-sm font-medium text-blue-700">리스</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <Row label="월 납입금" value={won(leaseResult.monthlyPayment)} highlight />
          <Row label="보증금" value={won(leaseResult.depositAmount)} />
          <Row label="잔존가치" value={won(leaseResult.residualValue)} />
          <Row label="총 납입금" value={won(leaseResult.totalPayment)} />
          <Row label="연 금리" value={pct(leaseResult.annualRate)} />
          <Row label="초기 비용" value={won(leaseResult.initialCost)} />
        </div>
      </div>

      {/* Rental section */}
      <div className="px-4 py-3">
        <h4 className="mb-2 text-sm font-medium text-green-700">렌탈 (추정)</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <Row label="월 납입금" value={won(rentalEstimate.monthlyPayment)} highlight />
          <Row label="총 납입금" value={won(rentalEstimate.totalPayment)} />
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <>
      <span className="text-gray-500">{label}</span>
      <span
        className={
          highlight ? 'font-semibold text-gray-900' : 'text-gray-700'
        }
      >
        {value}
      </span>
    </>
  )
}
