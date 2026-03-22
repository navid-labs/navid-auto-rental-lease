'use server'

import { prisma } from '@/lib/db/prisma'
import { buildWhereClause, buildOrderBy } from '../lib/search-query'
import type { SearchFilters } from '../lib/search-query'

export const vehicleInclude = {
  trim: {
    include: {
      generation: {
        include: {
          carModel: {
            include: { brand: true },
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

export async function loadMoreVehicles(
  filters: SearchFilters,
  sort: string,
  offset: number,
  limit: number,
) {
  const where = buildWhereClause(filters)
  const orderBy = buildOrderBy(sort)

  return prisma.vehicle.findMany({
    where,
    orderBy,
    skip: offset,
    take: limit,
    include: vehicleInclude,
  })
}
