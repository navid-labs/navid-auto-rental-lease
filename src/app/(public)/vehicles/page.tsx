import { Suspense } from 'react'
import { prisma } from '@/lib/db/prisma'
import { searchParamsCache, PAGE_SIZE } from '@/features/vehicles/lib/search-params'
import { buildWhereClause, buildOrderBy } from '@/features/vehicles/lib/search-query'
import { vehicleInclude } from '@/features/vehicles/lib/vehicle-include'
import { VehicleListClient } from '@/features/vehicles/components/vehicle-list-client'
import { SearchFilters } from '@/features/vehicles/components/search-filters'
import { VehicleSearchBar } from '@/features/vehicles/components/vehicle-search-bar'
import type { Metadata } from 'next'
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav'
import type { VehicleWithDetails } from '@/features/vehicles/types/index'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '차량 검색 | Navid Auto',
  description: '렌탈, 리스 차량을 검색하고 비교해 보세요',
}

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
      skip: 0, // Always first page -- infinite scroll offset is client-only
      take: PAGE_SIZE,
      include: vehicleInclude,
    }),
    prisma.vehicle.count({ where }),
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* Search bar section */}
      <VehicleSearchBar />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8 xl:px-[120px]">
        <BreadcrumbNav items={[{ label: '내차사기' }]} />
      </div>

      {/* Main content: sidebar + grid */}
      <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8 xl:px-[120px]">
        <div className="flex gap-8">
          {/* Filter sidebar (desktop) + Sheet (mobile via SearchFilters) */}
          <Suspense fallback={null}>
            <SearchFilters totalCount={totalCount} />
          </Suspense>

          {/* Grid area */}
          <div className="min-w-0 flex-1">
            <VehicleListClient
              initialVehicles={vehicles as unknown as VehicleWithDetails[]}
              totalCount={totalCount}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
