import type { Prisma } from '@prisma/client'

type SearchFilters = {
  brand: string | null
  model: string | null
  gen: string | null
  yearMin: number | null
  yearMax: number | null
  priceMin: number | null
  priceMax: number | null
  mileMin: number | null
  mileMax: number | null
}

export function buildWhereClause(filters: SearchFilters): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {
    approvalStatus: 'APPROVED',
    status: { not: 'HIDDEN' },
  }

  // Brand/Model/Generation filters via nested relations
  if (filters.brand) {
    where.trim = {
      generation: {
        carModel: {
          brandId: filters.brand,
          ...(filters.model ? { id: filters.model } : {}),
        },
        ...(filters.gen ? { id: filters.gen } : {}),
      },
    }
  }

  // Year range
  if (filters.yearMin || filters.yearMax) {
    where.year = {
      ...(filters.yearMin ? { gte: filters.yearMin } : {}),
      ...(filters.yearMax ? { lte: filters.yearMax } : {}),
    }
  }

  // Price range (monthly rental)
  if (filters.priceMin || filters.priceMax) {
    where.monthlyRental = {
      ...(filters.priceMin ? { gte: filters.priceMin } : {}),
      ...(filters.priceMax ? { lte: filters.priceMax } : {}),
    }
  }

  // Mileage range
  if (filters.mileMin || filters.mileMax) {
    where.mileage = {
      ...(filters.mileMin ? { gte: filters.mileMin } : {}),
      ...(filters.mileMax ? { lte: filters.mileMax } : {}),
    }
  }

  return where
}

export function buildOrderBy(sort: string): Prisma.VehicleOrderByWithRelationInput {
  switch (sort) {
    case 'price-asc':
      return { monthlyRental: 'asc' }
    case 'price-desc':
      return { monthlyRental: 'desc' }
    case 'year-desc':
      return { year: 'desc' }
    case 'year-asc':
      return { year: 'asc' }
    case 'mileage-asc':
      return { mileage: 'asc' }
    case 'newest':
    default:
      return { approvedAt: 'desc' }
  }
}
