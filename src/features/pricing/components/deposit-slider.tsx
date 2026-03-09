'use client'

import { Slider } from '@/components/ui/slider'
import { formatKRW } from '@/lib/utils/format'

type DepositSliderProps = {
  value: number
  maxDeposit: number
  onChange: (deposit: number) => void
}

export function DepositSlider({ value, maxDeposit, onChange }: DepositSliderProps) {
  const manWon = Math.round(value / 10_000)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">보증금</label>
        <span className="text-sm font-semibold text-accent">
          {value === 0 ? '없음' : `${manWon.toLocaleString()}만원`}
        </span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={maxDeposit}
        step={1_000_000}
        onValueChange={(val) => {
          const v = Array.isArray(val) ? val[0] : val
          onChange(v)
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>없음</span>
        <span>{formatKRW(maxDeposit)}</span>
      </div>
    </div>
  )
}
