'use client'

import { useState, useEffect, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { useQueryStates } from 'nuqs'
import { LayoutGrid, List } from 'lucide-react'
import { searchParamsParsers, PAGE_SIZE } from '../lib/search-params'
import { loadMoreVehicles } from '../actions/load-more-vehicles'
import { VehicleGrid } from './vehicle-grid'
import { VehicleCardSkeleton } from './vehicle-card-skeleton'
import { QuickFilterBadges } from './quick-filter-badges'
import { ActiveFilterChips } from './active-filter-chips'
import { SearchSort } from './search-sort'
import { CompareFloatingBar } from './compare-floating-bar'
import { CompareDialog } from './compare-dialog'
import { BackToTop } from './back-to-top'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { VehicleWithDetails } from '../types'
import type { SearchFilters } from '../lib/search-query'

type Props = {
  initialVehicles: VehicleWithDetails[]
  totalCount: number
}

export function VehicleListClient({ initialVehicles, totalCount }: Props) {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [offset, setOffset] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(initialVehicles.length < totalCount)
  const [isLoading, setIsLoading] = useState(false)

  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    shallow: false,
  })

  // Sentinel for infinite scroll
  const { ref: sentinelRef, inView } = useInView({ threshold: 0 })

  // PITFALL 1 FIX: Reset when initialVehicles changes (filter change triggers server re-render)
  useEffect(() => {
    setVehicles(initialVehicles)
    setOffset(PAGE_SIZE)
    setHasMore(initialVehicles.length < totalCount)
  }, [initialVehicles, totalCount])

  // Load more when sentinel enters viewport
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)

    try {
      // PITFALL 3 FIX: Pass filter state explicitly (server actions can't read URL)
      const filterParams: SearchFilters = {
        brand: filters.brand || null,
        model: filters.model || null,
        gen: filters.gen || null,
        yearMin: filters.yearMin ?? null,
        yearMax: filters.yearMax ?? null,
        priceMin: filters.priceMin ?? null,
        priceMax: filters.priceMax ?? null,
        mileMin: filters.mileMin ?? null,
        mileMax: filters.mileMax ?? null,
        fuel: filters.fuel || null,
        transmission: filters.transmission || null,
        color: filters.color || null,
        seats: filters.seats ?? null,
        driveType: filters.driveType || null,
        options: filters.options || null,
        region: filters.region || null,
        salesType: filters.salesType || null,
        keyword: filters.keyword || null,
        monthlyMin: filters.monthlyMin ?? null,
        monthlyMax: filters.monthlyMax ?? null,
        homeService: filters.homeService || null,
        timeDeal: filters.timeDeal || null,
        noAccident: filters.noAccident || null,
        hasRental: filters.hasRental || null,
        vehicleType: filters.vehicleType || null,
      }

      const newVehicles = await loadMoreVehicles(
        filterParams,
        filters.sort,
        offset,
        PAGE_SIZE,
      )

      // PITFALL 6 FIX: Deduplicate by ID
      setVehicles((prev) => {
        const existingIds = new Set(prev.map((v) => v.id))
        const unique = (newVehicles as VehicleWithDetails[]).filter(
          (v) => !existingIds.has(v.id),
        )
        return [...prev, ...unique]
      })
      setOffset((prev) => prev + PAGE_SIZE)
      if (newVehicles.length < PAGE_SIZE) setHasMore(false)
    } catch (error) {
      console.error('Failed to load more vehicles:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, offset, filters])

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore()
    }
  }, [inView, hasMore, isLoading, loadMore])

  const viewMode = (filters.view || 'grid') as 'grid' | 'list'

  return (
    <>
      {/* Top bar: Sort + View Toggle */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <SearchSort totalCount={totalCount} />
        <ViewToggle
          value={viewMode}
          onChange={(v) => setFilters({ view: v })}
        />
      </div>

      {/* Quick filter badges */}
      <QuickFilterBadges />

      {/* Active filter chips */}
      <ActiveFilterChips />

      {/* Vehicle grid/list */}
      <VehicleGrid vehicles={vehicles} viewMode={viewMode} />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-5">
          <VehicleCardSkeleton count={PAGE_SIZE} mode={viewMode} />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="h-px w-full"
          aria-label="추가 차량 로딩 중"
        />
      )}

      {/* End of results */}
      {!hasMore && vehicles.length > 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          모든 차량을 불러왔습니다
        </p>
      )}

      {/* Compare floating bar */}
      <CompareFloatingBar />

      {/* Compare dialog */}
      <CompareDialog />

      {/* Back to top */}
      <BackToTop />
    </>
  )
}

// ─── View Toggle ────────────────────────────────────────────────────────────

function ViewToggle({
  value,
  onChange,
}: {
  value: 'grid' | 'list'
  onChange: (value: 'grid' | 'list') => void
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(groupValue) => {
        // base-ui: groupValue is string[], pick first
        if (groupValue.length > 0) {
          onChange(groupValue[0] as 'grid' | 'list')
        }
      }}
      className="gap-0"
    >
      <ToggleGroupItem
        value="grid"
        className="px-2.5"
        aria-label="그리드 보기"
      >
        <LayoutGrid className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="list"
        className="px-2.5"
        aria-label="리스트 보기"
      >
        <List className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
