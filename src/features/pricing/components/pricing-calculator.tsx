'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateRental, calculateLease } from '@/lib/finance/calculate'
import { formatKRW } from '@/lib/utils/format'
import { PeriodSlider } from './period-slider'
import { DepositSlider } from './deposit-slider'
import { ComparisonColumns } from './comparison-columns'
import { Calculator } from 'lucide-react'

const DEFAULT_RESIDUAL_RATE = 0.40

type VehicleInfo = {
  id: string
  price: number
  brandName: string
  modelName: string
  year: number
}

type PricingCalculatorProps = {
  vehicle?: VehicleInfo
  residualRate?: number | null
}

export function PricingCalculator({ vehicle, residualRate }: PricingCalculatorProps) {
  const [periodMonths, setPeriodMonths] = useState(36)
  const [deposit, setDeposit] = useState(0)
  const [manualPrice, setManualPrice] = useState('')

  const effectivePrice = vehicle?.price ?? (Number(manualPrice) * 10_000 || 0)
  const effectiveResidualRate = residualRate ?? DEFAULT_RESIDUAL_RATE
  const isDefaultRate = residualRate == null
  const maxDeposit = Math.min(effectivePrice * 0.5, 10_000_000)

  // Reset deposit if it exceeds new max
  const clampedDeposit = Math.min(deposit, maxDeposit)

  const rental = useMemo(
    () => calculateRental(effectivePrice, periodMonths, clampedDeposit),
    [effectivePrice, periodMonths, clampedDeposit]
  )

  const lease = useMemo(
    () => calculateLease(effectivePrice, periodMonths, clampedDeposit, effectiveResidualRate),
    [effectivePrice, periodMonths, clampedDeposit, effectiveResidualRate]
  )

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="size-5 text-accent" />
          월 납입금 계산기
        </CardTitle>
        {vehicle && (
          <p className="text-sm text-muted-foreground">
            {vehicle.brandName} {vehicle.modelName} {vehicle.year}년식 &middot; 차량가{' '}
            {formatKRW(vehicle.price)}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual Price Input (standalone mode) */}
        {!vehicle && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              차량 가격 (만원)
            </label>
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: '2,000만원', value: '2000' },
                { label: '3,000만원', value: '3000' },
                { label: '5,000만원', value: '5000' },
                { label: '8,000만원', value: '8000' },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setManualPrice(value)
                    setDeposit(0)
                  }}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    manualPrice === value
                      ? 'border-accent bg-accent text-white'
                      : 'border-border bg-white text-foreground hover:border-accent/60 hover:bg-accent/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="직접 입력 (예: 3000)"
                value={manualPrice}
                onChange={(e) => {
                  setManualPrice(e.target.value)
                  setDeposit(0) // reset deposit on price change
                }}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
              <span className="shrink-0 text-sm text-muted-foreground">만원</span>
            </div>
            {effectivePrice > 0 && (
              <p className="text-xs font-medium text-accent">
                = {formatKRW(effectivePrice)}
              </p>
            )}
          </div>
        )}

        {effectivePrice <= 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {vehicle
              ? '차량 가격 정보가 없습니다.'
              : '차량 가격을 입력하면 렌탈/리스 비용을 비교할 수 있습니다.'}
          </div>
        ) : (
          <>
            {/* Sliders */}
            <div className="space-y-5">
              <PeriodSlider value={periodMonths} onChange={setPeriodMonths} />
              <DepositSlider
                value={clampedDeposit}
                maxDeposit={maxDeposit}
                onChange={setDeposit}
              />
            </div>

            {/* Default Rate Note */}
            {isDefaultRate && (
              <p className="text-xs text-muted-foreground">
                (기본 잔존가치율 {Math.round(DEFAULT_RESIDUAL_RATE * 100)}% 적용)
              </p>
            )}

            {/* Comparison */}
            <ComparisonColumns rental={rental} lease={lease} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
