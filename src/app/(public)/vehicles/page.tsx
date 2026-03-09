import { Suspense } from 'react'
import { prisma } from '@/lib/db/prisma'
import { searchParamsCache, PAGE_SIZE } from '@/features/vehicles/lib/search-params'
import { buildWhereClause, buildOrderBy } from '@/features/vehicles/lib/search-query'
import { SearchFilters } from '@/features/vehicles/components/search-filters'
import { SearchSort } from '@/features/vehicles/components/search-sort'
import { PopularSearches } from '@/features/vehicles/components/popular-searches'
import { VehicleGrid } from '@/features/vehicles/components/vehicle-grid'
import { Pagination } from '@/features/vehicles/components/pagination'
import { VehicleSearchBar } from '@/features/vehicles/components/vehicle-search-bar'
import type { Metadata } from 'next'
import type { VehicleWithDetails } from '@/features/vehicles/types/index'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '차량 검색 | Navid Auto',
  description: '렌탈, 리스 차량을 검색하고 비교해 보세요',
}

const vehicleInclude = {
  trim: {
    include: {
      generation: {
        include: {
          carModel: {
            include: {
              brand: true,
            },
          },
        },
      },
    },
  },
  images: true,
  dealer: {
    select: { id: true, name: true, email: true, phone: true },
  },
} as const

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const params = searchParamsCache.parse(await searchParams)
  const where = buildWhereClause(params)
  const orderBy = buildOrderBy(params.sort)

  const [vehicles, totalCount] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: vehicleInclude,
    }),
    prisma.vehicle.count({ where }),
  ])

  return (
    <div className="min-h-screen bg-white">
      {/* Search bar section */}
      <VehicleSearchBar />

      {/* Sort bar */}
      <div className="border-b border-[#E4E4E7] bg-white px-4 py-3 lg:px-[120px]">
        <Suspense fallback={null}>
          <SearchSort totalCount={totalCount} />
        </Suspense>
      </div>

      {/* Main content: sidebar + grid */}
      <div className="px-4 py-6 lg:px-[120px]">
        <div className="flex gap-6">
          {/* Filter sidebar */}
          <Suspense fallback={null}>
            <SearchFilters />
          </Suspense>

          {/* Grid area */}
          <div className="min-w-0 flex-1">
            {/* Mobile filter button row */}
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <Suspense fallback={null}>
                <SearchSort totalCount={totalCount} />
              </Suspense>
            </div>

            <div className="mb-4">
              <PopularSearches />
            </div>

            <VehicleGrid vehicles={vehicles as unknown as VehicleWithDetails[]} />

            <Suspense fallback={null}>
              <Pagination totalCount={totalCount} pageSize={PAGE_SIZE} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
