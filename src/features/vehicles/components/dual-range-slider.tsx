'use client'

import { useState, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'

type DualRangeSliderProps = {
  min: number
  max: number
  step: number
  value: [number, number]
  onValueCommit: (value: [number, number]) => void
  formatLabel: (value: number) => string
}

export function DualRangeSlider({
  min,
  max,
  step,
  value,
  onValueCommit,
  formatLabel,
}: DualRangeSliderProps) {
  const [localRange, setLocalRange] = useState<[number, number]>(value)

  // Sync when external value changes (e.g., filter reset)
  useEffect(() => {
    setLocalRange(value)
  }, [value[0], value[1]])

  return (
    <div>
      <Slider
        value={localRange}
        min={min}
        max={max}
        step={step}
        onValueChange={(newValue) => {
          // Update display during drag (no URL update)
          setLocalRange(newValue as [number, number])
        }}
        onValueCommitted={(newValue) => {
          // Commit to URL only on pointerup
          onValueCommit(newValue as [number, number])
        }}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatLabel(localRange[0])}</span>
        <span>{formatLabel(localRange[1])}</span>
      </div>
    </div>
  )
}
