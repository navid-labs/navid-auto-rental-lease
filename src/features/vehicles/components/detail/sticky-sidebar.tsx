'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { Heart, GitCompareArrows, Share2 } from 'lucide-react'
import { formatKRW } from '@/lib/utils/format'
import { pmt } from '@/lib/finance/pmt'
import {
  useVehicleInteractionStore,
  useStoreHydration,
} from '@/lib/stores/vehicle-interaction-store'
import type { VehicleSummary } from '@/lib/stores/vehicle-interaction-store'
import type { VehicleDetailData } from '@/features/vehicles/types'

type StickySidebarProps = {
  vehicle: VehicleDetailData
  vehicleName: string
}

function buildSummary(vehicle: VehicleDetailData): VehicleSummary {
  return {
    id: vehicle.id,
    brandName:
      vehicle.trim.generation.carModel.brand.nameKo ||
      vehicle.trim.generation.carModel.brand.name,
    modelName:
      vehicle.trim.generation.carModel.nameKo ||
      vehicle.trim.generation.carModel.name,
    year: vehicle.year,
    mileage: vehicle.mileage,
    price: vehicle.price,
    monthlyRental: vehicle.monthlyRental,
    monthlyLease: vehicle.monthlyLease,
    thumbnailUrl: vehicle.images[0]?.url ?? null,
  }
}

export function StickySidebar({ vehicle, vehicleName }: StickySidebarProps) {
  useStoreHydration()

  const summary = buildSummary(vehicle)
  const monthlyPayment = Math.abs(pmt(0.059 / 12, 60, vehicle.price))
  const registrationTax = Math.floor(vehicle.price * 0.07)
  const insuranceEstimate = Math.floor(vehicle.price * 0.03)
  const totalCost = vehicle.price + Math.floor(vehicle.price * 0.1)

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-[8rem]">
          <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
            {/* Vehicle name */}
            <h2 className="text-lg font-semibold text-foreground">
              {vehicleName}
            </h2>

            {/* Price */}
            <div>
              <p className="text-xl font-bold tabular-nums text-foreground">
                {Math.floor(vehicle.price / 10000)}만원
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                월 {formatKRW(Math.round(monthlyPayment))} / 60개월
              </p>
            </div>

            {/* Cost breakdown */}
            <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">취등록세</span>
                <span className="tabular-nums">{formatKRW(registrationTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">보험료(예상)</span>
                <span className="tabular-nums">{formatKRW(insuranceEstimate)}</span>
              </div>
              <div className="my-2 border-t" />
              <div className="flex justify-between font-semibold">
                <span>총 구매비용</span>
                <span className="tabular-nums">{formatKRW(totalCost)}</span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="space-y-2">
              <Link
                href={`/vehicles/${vehicle.id}/contract`}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-accent text-base font-semibold text-white transition-colors hover:bg-accent/90"
              >
                구매하기
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('home-service')
                  if (el)
                    window.scrollTo({
                      top: el.offsetTop - 128,
                      behavior: 'smooth',
                    })
                }}
                className="flex h-10 w-full items-center justify-center rounded-lg border border-input bg-background text-sm font-medium transition-colors hover:bg-muted"
              >
                방문예약
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('price')
                  if (el)
                    window.scrollTo({
                      top: el.offsetTop - 128,
                      behavior: 'smooth',
                    })
                }}
                className="flex h-10 w-full items-center justify-center rounded-lg border border-input bg-background text-sm font-medium transition-colors hover:bg-muted"
              >
                할부계산
              </button>
            </div>

            {/* Icon buttons row */}
            <div className="flex justify-center gap-2 border-t pt-4">
              <WishlistIconButton summary={summary} />
              <CompareIconButton summary={summary} />
              <ShareIconButton vehicleName={vehicleName} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center gap-2 border-t bg-white px-4 shadow-lg lg:hidden">
        <Link
          href={`/vehicles/${vehicle.id}/contract`}
          className="flex h-11 flex-1 items-center justify-center rounded-lg bg-accent font-semibold text-white transition-colors hover:bg-accent/90"
        >
          구매하기
        </Link>
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('home-service')
            if (el)
              window.scrollTo({
                top: el.offsetTop - 128,
                behavior: 'smooth',
              })
          }}
          className="flex h-11 flex-1 items-center justify-center rounded-lg border border-input bg-background font-medium transition-colors hover:bg-muted"
        >
          방문예약
        </button>
      </div>
    </>
  )
}

function WishlistIconButton({ summary }: { summary: VehicleSummary }) {
  const { wishlist, toggleWishlist } = useVehicleInteractionStore()
  const isWishlisted = wishlist.some((v) => v.id === summary.id)

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(summary)}
      className="flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-muted"
      aria-label={isWishlisted ? '찜 해제' : '찜하기'}
    >
      <Heart
        className={`size-5 ${
          isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
        }`}
      />
      <span className="text-[11px] text-muted-foreground">찜</span>
    </button>
  )
}

function CompareIconButton({ summary }: { summary: VehicleSummary }) {
  const { comparison, toggleComparison } = useVehicleInteractionStore()
  const isComparing = comparison.some((v) => v.id === summary.id)

  return (
    <button
      type="button"
      onClick={() => toggleComparison(summary)}
      className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-muted ${
        isComparing ? 'text-accent' : ''
      }`}
      aria-label={isComparing ? '비교 해제' : '비교하기'}
    >
      <GitCompareArrows
        className={`size-5 ${
          isComparing ? 'text-accent' : 'text-muted-foreground'
        }`}
      />
      <span className="text-[11px] text-muted-foreground">비교</span>
    </button>
  )
}

function ShareIconButton({ vehicleName }: { vehicleName: string }) {
  const handleShare = useCallback(async () => {
    const shareData = {
      title: vehicleName,
      text: `${vehicleName} - Navid Auto`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }, [vehicleName])

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-muted"
      aria-label="공유하기"
    >
      <Share2 className="size-5 text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground">공유</span>
    </button>
  )
}
