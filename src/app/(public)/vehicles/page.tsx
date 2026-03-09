import { Suspense } from 'react'
import { prisma } from '@/lib/db/prisma'
import { searchParamsCache, PAGE_SIZE } from '@/features/vehicles/lib/search-params'
import { buildWhereClause, buildOrderBy } from '@/features/vehicles/lib/search-query'
import { SearchFilters } from '@/features/vehicles/components/search-filters'
import { SearchSort } from '@/features/vehicles/components/search-sort'
import { VehicleGrid } from '@/features/vehicles/components/vehicle-grid'
import { Pagination } from '@/features/vehicles/components/pagination'
import type { Metadata } from 'next'
import type { VehicleWithDetails } from '@/features/vehicles/types'

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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">차량 검색</h1>

      <div className="flex gap-8">
        {/* Filters - desktop sidebar + mobile sheet */}
        <Suspense fallback={null}>
          <SearchFilters />
        </Suspense>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <Suspense fallback={null}>
            <SearchSort totalCount={totalCount} />
          </Suspense>

          <VehicleGrid vehicles={vehicles as unknown as VehicleWithDetails[]} />

          <Suspense fallback={null}>
            <Pagination totalCount={totalCount} pageSize={PAGE_SIZE} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
