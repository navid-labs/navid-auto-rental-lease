'use client'

import { Slider } from '@/components/ui/slider'

const PERIOD_OPTIONS = [12, 24, 36, 48, 60]
const MIN_PERIOD = PERIOD_OPTIONS[0]
const MAX_PERIOD = PERIOD_OPTIONS[PERIOD_OPTIONS.length - 1]

type PeriodSliderProps = {
  value: number
  onChange: (months: number) => void
}

function snapToNearest(val: number): number {
  let closest = PERIOD_OPTIONS[0]
  let minDiff = Math.abs(val - closest)
  for (const opt of PERIOD_OPTIONS) {
    const diff = Math.abs(val - opt)
    if (diff < minDiff) {
      minDiff = diff
      closest = opt
    }
  }
  return closest
}

export function PeriodSlider({ value, onChange }: PeriodSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">계약 기간</label>
        <span className="text-sm font-semibold text-accent">{value}개월</span>
      </div>
      <Slider
        value={[value]}
        min={MIN_PERIOD}
        max={MAX_PERIOD}
        step={1}
        onValueChange={(val) => {
          const v = Array.isArray(val) ? val[0] : val
          onChange(snapToNearest(v))
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        {PERIOD_OPTIONS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`rounded px-1 py-0.5 transition-colors ${
              m === value ? 'font-semibold text-accent' : 'hover:text-foreground'
            }`}
          >
            {m}개월
          </button>
        ))}
      </div>
    </div>
  )
}
