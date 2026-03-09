'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompareArrows, X, ImageIcon } from 'lucide-react'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'

export function ComparisonBar() {
  const [mounted, setMounted] = useState(false)
  const { comparison, removeFromComparison, clearComparison } =
    useVehicleInteractionStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || comparison.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          {/* Label */}
          <div className="hidden items-center gap-2 sm:flex">
            <GitCompareArrows className="size-5 text-accent" />
            <span className="text-sm font-semibold">비교</span>
          </div>

          {/* Vehicle slots (max 4) */}
          <div className="flex flex-1 gap-2">
            {comparison.map((vehicle) => (
              <div
                key={vehicle.id}
                className="relative flex items-center gap-2 rounded-lg border bg-muted/50 px-2 py-1.5"
              >
                <div className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
                  {vehicle.thumbnailUrl ? (
                    <Image
                      src={vehicle.thumbnailUrl}
                      alt={`${vehicle.brandName} ${vehicle.modelName}`}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="size-3 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <span className="max-w-20 truncate text-xs font-medium sm:max-w-28">
                  {vehicle.brandName} {vehicle.modelName}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromComparison(vehicle.id)}
                  className="ml-1 rounded-full p-0.5 transition-colors hover:bg-muted"
                >
                  <X className="size-3 text-muted-foreground" />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 2 - comparison.length) }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="hidden items-center justify-center rounded-lg border border-dashed border-border/60 px-4 py-1.5 sm:flex"
                >
                  <span className="text-xs text-muted-foreground">
                    + 차량 추가
                  </span>
                </div>
              )
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearComparison}
              className="rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              초기화
            </button>
            <Link
              href="/vehicles/compare"
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors ${
                comparison.length >= 2
                  ? 'bg-accent hover:bg-accent/90'
                  : 'pointer-events-none bg-accent/40'
              }`}
            >
              비교하기 ({comparison.length}/4)
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
