'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, X, ChevronRight, ImageIcon } from 'lucide-react'
import { useVehicleInteractionStore } from '@/lib/stores/vehicle-interaction-store'
import { formatKRW } from '@/lib/utils/format'

export function RecentlyViewedDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { recentlyViewed } = useVehicleInteractionStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || recentlyViewed.length === 0) return null

  return (
    <>
      {/* Toggle tab - fixed on right edge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-1 rounded-l-lg bg-primary px-2 py-3 text-xs font-medium text-white shadow-lg transition-all hover:px-3 lg:flex"
        style={{ writingMode: 'vertical-lr' }}
      >
        <Clock className="mb-1 size-3.5 rotate-90" />
        최근 본 차량 ({recentlyViewed.length})
      </button>

      {/* Mobile floating pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 left-4 z-40 flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-medium text-white shadow-lg lg:hidden"
      >
        <Clock className="size-3.5" />
        최근 본 {recentlyViewed.length}
      </button>

      {/* Drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-80 overflow-y-auto border-l border-border bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <h3 className="font-semibold">최근 본 차량</h3>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    {recentlyViewed.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 transition-colors hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Vehicle list */}
              <div className="divide-y">
                {recentlyViewed.slice(0, 10).map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/vehicles/${vehicle.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {vehicle.thumbnailUrl ? (
                        <Image
                          src={vehicle.thumbnailUrl}
                          alt={`${vehicle.brandName} ${vehicle.modelName}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="size-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {vehicle.brandName} {vehicle.modelName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.year}년식
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-accent">
                        {vehicle.monthlyRental
                          ? formatKRW(vehicle.monthlyRental, { monthly: true })
                          : formatKRW(vehicle.price)}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t p-4">
                <Link
                  href="/vehicles"
                  onClick={() => setIsOpen(false)}
                  className="block w-full rounded-xl bg-accent py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent/90"
                >
                  전체 차량 보기
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
