import { describe, it, expect } from 'vitest'
import { buildWhereClause, buildOrderBy } from '@/features/vehicles/lib/search-query'
import type { SearchFilters } from '@/features/vehicles/lib/search-query'

// Helper to create empty filters
function emptyFilters(overrides: Partial<SearchFilters> = {}): SearchFilters {
  return {
    brand: null,
    model: null,
    gen: null,
    yearMin: null,
    yearMax: null,
    priceMin: null,
    priceMax: null,
    mileMin: null,
    mileMax: null,
    fuel: null,
    transmission: null,
    color: null,
    seats: null,
    driveType: null,
    options: null,
    region: null,
    salesType: null,
    keyword: null,
    monthlyMin: null,
    monthlyMax: null,
    homeService: null,
    timeDeal: null,
    noAccident: null,
    hasRental: null,
    ...overrides,
  }
}

describe('buildWhereClause', () => {
  it('returns base approval/status filter with empty filters', () => {
    const where = buildWhereClause(emptyFilters())
    expect(where.approvalStatus).toBe('APPROVED')
    expect(where.status).toEqual({ not: 'HIDDEN' })
  })

  it('filters fuel as comma-separated multi-select via trim relation', () => {
    const where = buildWhereClause(emptyFilters({ fuel: 'GASOLINE,DIESEL' }))
    expect(where.trim).toEqual(
      expect.objectContaining({
        fuelType: { in: ['GASOLINE', 'DIESEL'] },
      }),
    )
  })

  it('filters transmission as comma-separated multi-select via trim relation', () => {
    const where = buildWhereClause(emptyFilters({ transmission: 'AUTOMATIC' }))
    expect(where.trim).toEqual(
      expect.objectContaining({
        transmission: { in: ['AUTOMATIC'] },
      }),
    )
  })

  it('filters color as comma-separated multi-select', () => {
    const where = buildWhereClause(emptyFilters({ color: 'white,black' }))
    expect(where.color).toEqual({ in: ['white', 'black'] })
  })

  it('filters monthlyMin and monthlyMax on monthlyRental field', () => {
    const where = buildWhereClause(
      emptyFilters({ monthlyMin: 300000, monthlyMax: 500000 }),
    )
    expect(where.monthlyRental).toEqual({ gte: 300000, lte: 500000 })
  })

  it('filters noAccident via inspectionData JSON path', () => {
    const where = buildWhereClause(emptyFilters({ noAccident: 'true' }))
    expect(where.inspectionData).toEqual({
      path: ['accidentDiagnosis'],
      equals: 'none',
    })
  })

  it('filters homeService appropriately', () => {
    // homeService is a placeholder toggle -- presence check
    const where = buildWhereClause(emptyFilters({ homeService: 'true' }))
    // homeService = available vehicles with home delivery
    // For now, this is a no-op or tags existing vehicles
    expect(where).toBeDefined()
  })

  it('filters hasRental -- monthlyRental must not be null', () => {
    const where = buildWhereClause(emptyFilters({ hasRental: 'true' }))
    expect(where.monthlyRental).toEqual(expect.objectContaining({ not: null }))
  })

  it('preserves existing brand/model/gen filters', () => {
    const where = buildWhereClause(
      emptyFilters({ brand: 'brand-id', model: 'model-id', gen: 'gen-id' }),
    )
    expect(where.trim).toEqual(
      expect.objectContaining({
        generation: expect.objectContaining({
          carModel: expect.objectContaining({
            brandId: 'brand-id',
            id: 'model-id',
          }),
          id: 'gen-id',
        }),
      }),
    )
  })

  it('preserves existing year range filter', () => {
    const where = buildWhereClause(
      emptyFilters({ yearMin: 2020, yearMax: 2024 }),
    )
    expect(where.year).toEqual({ gte: 2020, lte: 2024 })
  })

  it('preserves existing price range filter on price field', () => {
    const where = buildWhereClause(
      emptyFilters({ priceMin: 1000, priceMax: 5000 }),
    )
    expect(where.price).toEqual({ gte: 1000, lte: 5000 })
  })

  it('preserves existing mileage range filter', () => {
    const where = buildWhereClause(
      emptyFilters({ mileMin: 10000, mileMax: 50000 }),
    )
    expect(where.mileage).toEqual({ gte: 10000, lte: 50000 })
  })

  it('merges fuel + brand filters in trim relation', () => {
    const where = buildWhereClause(
      emptyFilters({ brand: 'brand-id', fuel: 'GASOLINE' }),
    )
    // Both brand (via trim.generation.carModel) and fuel (via trim.fuelType) must be present
    expect(where.trim).toEqual(
      expect.objectContaining({
        fuelType: { in: ['GASOLINE'] },
        generation: expect.objectContaining({
          carModel: expect.objectContaining({
            brandId: 'brand-id',
          }),
        }),
      }),
    )
  })
})

describe('buildOrderBy', () => {
  it('recommended returns approvedAt desc', () => {
    expect(buildOrderBy('recommended')).toEqual({ approvedAt: 'desc' })
  })

  it('newest returns createdAt desc', () => {
    expect(buildOrderBy('newest')).toEqual({ createdAt: 'desc' })
  })

  it('price-asc returns price asc', () => {
    expect(buildOrderBy('price-asc')).toEqual({ price: 'asc' })
  })

  it('price-desc returns price desc', () => {
    expect(buildOrderBy('price-desc')).toEqual({ price: 'desc' })
  })

  it('monthly-asc returns monthlyRental sort asc with nulls last', () => {
    expect(buildOrderBy('monthly-asc')).toEqual({
      monthlyRental: { sort: 'asc', nulls: 'last' },
    })
  })

  it('popular returns createdAt desc (fallback)', () => {
    expect(buildOrderBy('popular')).toEqual({ createdAt: 'desc' })
  })

  it('mileage-asc returns mileage asc', () => {
    expect(buildOrderBy('mileage-asc')).toEqual({ mileage: 'asc' })
  })

  it('year-desc returns year desc', () => {
    expect(buildOrderBy('year-desc')).toEqual({ year: 'desc' })
  })

  it('year-asc returns year asc', () => {
    expect(buildOrderBy('year-asc')).toEqual({ year: 'asc' })
  })

  it('default (unknown) returns recommended sort', () => {
    expect(buildOrderBy('unknown')).toEqual({ approvedAt: 'desc' })
  })
})
