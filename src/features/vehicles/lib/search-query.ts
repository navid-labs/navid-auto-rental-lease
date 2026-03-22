import type { Prisma } from '@prisma/client'
import { getModelNamesByBodyType } from './vehicle-body-type'
import type { BodyType } from './vehicle-body-type'

export type SearchFilters = {
  brand: string | null
  model: string | null
  gen: string | null
  yearMin: number | null
  yearMax: number | null
  priceMin: number | null
  priceMax: number | null
  mileMin: number | null
  mileMax: number | null
  fuel: string | null
  transmission: string | null
  color: string | null
  seats: number | null
  driveType: string | null
  options: string | null
  region: string | null
  salesType: string | null
  keyword: string | null
  monthlyMin: number | null
  monthlyMax: number | null
  homeService: string | null
  timeDeal: string | null
  noAccident: string | null
  hasRental: string | null
  vehicleType: string | null
}

export function buildWhereClause(filters: SearchFilters): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {
    approvalStatus: 'APPROVED',
    status: { not: 'HIDDEN' },
  }

  // Accumulate trim conditions to merge brand/model/gen with fuel/transmission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trimWhere: Record<string, any> = {}

  // Brand/Model/Generation filters via nested relations
  if (filters.brand) {
    const carModelWhere: Record<string, unknown> = { brandId: filters.brand }
    if (filters.model) {
      carModelWhere.id = filters.model
    }

    const generationWhere: Record<string, unknown> = { carModel: carModelWhere }
    if (filters.gen) {
      generationWhere.id = filters.gen
    }

    trimWhere.generation = generationWhere
  }

  // Vehicle type (body type) - filter by model names matching the body type
  if (filters.vehicleType) {
    const bodyType = filters.vehicleType as BodyType
    const modelNames = getModelNamesByBodyType(bodyType)
    if (modelNames.length > 0) {
      if (!trimWhere.generation) {
        trimWhere.generation = {
          carModel: { name: { in: modelNames } },
        }
      } else {
        // Brand/model filter already set -- add model name constraint
        const existingGenWhere = trimWhere.generation as Record<string, unknown>
        const existingCarModelWhere = (existingGenWhere.carModel ?? {}) as Record<string, unknown>
        existingCarModelWhere.name = { in: modelNames }
        existingGenWhere.carModel = existingCarModelWhere
      }
    }
  }

  // Fuel type (multi-select, comma-separated)
  if (filters.fuel) {
    trimWhere.fuelType = { in: filters.fuel.split(',') }
  }

  // Transmission (multi-select, comma-separated)
  if (filters.transmission) {
    trimWhere.transmission = { in: filters.transmission.split(',') }
  }

  // Apply accumulated trim conditions
  if (Object.keys(trimWhere).length > 0) {
    where.trim = trimWhere
  }

  // Year range
  if (filters.yearMin || filters.yearMax) {
    where.year = {
      ...(filters.yearMin ? { gte: filters.yearMin } : {}),
      ...(filters.yearMax ? { lte: filters.yearMax } : {}),
    }
  }

  // Price range (on vehicle price field, not monthlyRental)
  if (filters.priceMin || filters.priceMax) {
    where.price = {
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

  // Color (multi-select, comma-separated)
  if (filters.color) {
    where.color = { in: filters.color.split(',') }
  }

  // Monthly payment range
  if (filters.monthlyMin || filters.monthlyMax) {
    where.monthlyRental = {
      ...(filters.monthlyMin ? { gte: filters.monthlyMin } : {}),
      ...(filters.monthlyMax ? { lte: filters.monthlyMax } : {}),
    }
  }

  // No accident (inspectionData JSONB path)
  if (filters.noAccident === 'true') {
    where.inspectionData = {
      path: ['accidentDiagnosis'],
      equals: 'none',
    }
  }

  // Time deal (low monthly rental vehicles)
  if (filters.timeDeal === 'true') {
    where.monthlyRental = {
      ...(where.monthlyRental as object ?? {}),
      lt: 500000,
      not: null,
    }
  }

  // Has rental (monthlyRental is not null)
  if (filters.hasRental === 'true') {
    where.monthlyRental = {
      ...(where.monthlyRental as object ?? {}),
      not: null,
    }
  }

  // Sales type (rental/lease presence)
  if (filters.salesType) {
    const types = filters.salesType.split(',')
    const conditions: Prisma.VehicleWhereInput[] = []
    if (types.includes('rental')) {
      conditions.push({ monthlyRental: { not: null } })
    }
    if (types.includes('lease')) {
      conditions.push({ monthlyLease: { not: null } })
    }
    if (conditions.length > 0) {
      where.OR = conditions
    }
  }

  return where
}

export function buildOrderBy(sort: string): Prisma.VehicleOrderByWithRelationInput {
  switch (sort) {
    case 'recommended':
      return { approvedAt: 'desc' }
    case 'newest':
      return { createdAt: 'desc' }
    case 'price-asc':
      return { price: 'asc' }
    case 'price-desc':
      return { price: 'desc' }
    case 'monthly-asc':
      return { monthlyRental: { sort: 'asc', nulls: 'last' } }
    case 'popular':
      return { createdAt: 'desc' }
    case 'year-desc':
      return { year: 'desc' }
    case 'year-asc':
      return { year: 'asc' }
    case 'mileage-asc':
      return { mileage: 'asc' }
    default:
      return { approvedAt: 'desc' }
  }
}
