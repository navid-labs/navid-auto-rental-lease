'use client'

import { useState } from 'react'
import Link from 'next/link'
import { VehicleCard } from '@/features/vehicles/components/vehicle-card'
import type { VehicleWithDetails } from '@/features/vehicles/types/index'

type TabId = 'popular' | 'newest' | 'deals'

const TABS: { id: TabId; label: string; moreHref: string }[] = [
  { id: 'popular', label: '인기차량', moreHref: '/vehicles' },
  { id: 'newest', label: '신규입고', moreHref: '/vehicles?sort=newest' },
  { id: 'deals', label: '특가차량', moreHref: '/vehicles?sort=price_asc' },
]

type Props = {
  popular: VehicleWithDetails[]
  newest: VehicleWithDetails[]
  deals: VehicleWithDetails[]
}

export function RecommendedVehiclesTabs({ popular, newest, deals }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('popular')
  const tabData: Record<TabId, VehicleWithDetails[]> = { popular, newest, deals }
  const vehicles = tabData[activeTab]
  const activeTabConfig = TABS.find((t) => t.id === activeTab)!

  return (
    <>
      {/* Header: title + tabs + more link */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-[24px] font-bold text-[#0D0D0D]">추천 차량</h2>
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#1A6DFF] text-white'
                    : 'bg-[#F0F0F0] text-[#555555] hover:bg-[#E5E5E5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <Link
          href={activeTabConfig.moreHref}
          className="text-sm font-medium text-[#1A6DFF] transition-opacity hover:opacity-70"
        >
          더보기 &rarr;
        </Link>
      </div>

      {/* Vehicle grid: 4-col desktop, 2-col mobile */}
      {vehicles.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-[#7A7A7A]">
          등록된 차량이 없습니다
        </div>
      )}
    </>
  )
}
