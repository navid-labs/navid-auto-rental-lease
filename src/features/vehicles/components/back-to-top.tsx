'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const comparison = useVehicleInteractionStore((s) => s.comparison)
  const hasCompareBar = comparison.length > 0

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed right-6 z-30 flex size-10 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-opacity ${
        hasCompareBar ? 'bottom-20' : 'bottom-6'
      }`}
      aria-label="맨 위로"
    >
      <ArrowUp className="size-5 text-foreground" />
    </button>
  )
}
