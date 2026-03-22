import { describe, it, expect } from 'vitest'
import { buildWhereClause, buildOrderBy } from './search-query'
import type { SearchFilters } from './search-query'

// Helper to create a full SearchFilters with defaults
function makeFilters(overrides: Partial<SearchFilters> = {}): SearchFilters {
  return {
    brand: '',
    model: '',
    gen: '',
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
  it('with no filters returns base visibility filter', () => {
    const where = buildWhereClause(makeFilters())

    expect(where).toEqual({
      approvalStatus: 'APPROVED',
      status: { not: 'HIDDEN' },
    })
  })

  it('with brand filter returns nested trim relation match', () => {
    const where = buildWhereClause(makeFilters({ brand: 'brand-id-1' }))

    expect(where.trim).toEqual({
      generation: {
        carModel: {
          brandId: 'brand-id-1',
        },
      },
    })
  })

  it('with brand+model returns nested match for both', () => {
    const where = buildWhereClause(
      makeFilters({ brand: 'brand-id-1', model: 'model-id-1' }),
    )

    expect(where.trim).toEqual({
      generation: {
        carModel: {
          brandId: 'brand-id-1',
          id: 'model-id-1',
        },
      },
    })
  })

  it('with brand+model+generation returns full nested match', () => {
    const where = buildWhereClause(
      makeFilters({ brand: 'brand-id-1', model: 'model-id-1', gen: 'gen-id-1' }),
    )

    expect(where.trim).toEqual({
      generation: {
        carModel: {
          brandId: 'brand-id-1',
          id: 'model-id-1',
        },
        id: 'gen-id-1',
      },
    })
  })

  it('with yearMin/yearMax returns year gte/lte', () => {
    const where = buildWhereClause(makeFilters({ yearMin: 2020, yearMax: 2024 }))

    expect(where.year).toEqual({ gte: 2020, lte: 2024 })
  })

  it('with priceMin/priceMax returns price gte/lte', () => {
    const where = buildWhereClause(
      makeFilters({ priceMin: 200000, priceMax: 500000 }),
    )

    expect(where.price).toEqual({ gte: 200000, lte: 500000 })
  })

  it('with mileageMin/mileageMax returns mileage gte/lte', () => {
    const where = buildWhereClause(
      makeFilters({ mileMin: 10000, mileMax: 50000 }),
    )

    expect(where.mileage).toEqual({ gte: 10000, lte: 50000 })
  })
})

describe('buildOrderBy', () => {
  it('price-asc returns price asc', () => {
    expect(buildOrderBy('price-asc')).toEqual({ price: 'asc' })
  })

  it('price-desc returns price desc', () => {
    expect(buildOrderBy('price-desc')).toEqual({ price: 'desc' })
  })

  it('year-desc returns year desc', () => {
    expect(buildOrderBy('year-desc')).toEqual({ year: 'desc' })
  })

  it('year-asc returns year asc', () => {
    expect(buildOrderBy('year-asc')).toEqual({ year: 'asc' })
  })

  it('mileage-asc returns mileage asc', () => {
    expect(buildOrderBy('mileage-asc')).toEqual({ mileage: 'asc' })
  })

  it('newest returns createdAt desc', () => {
    expect(buildOrderBy('newest')).toEqual({ createdAt: 'desc' })
  })

  it('defaults to recommended (approvedAt desc)', () => {
    expect(buildOrderBy('unknown')).toEqual({ approvedAt: 'desc' })
    expect(buildOrderBy('')).toEqual({ approvedAt: 'desc' })
  })
})
