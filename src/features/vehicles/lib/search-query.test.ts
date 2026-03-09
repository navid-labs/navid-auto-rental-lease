import { describe, it, expect } from 'vitest'
import { buildWhereClause, buildOrderBy } from './search-query'

describe('buildWhereClause', () => {
  it('with no filters returns base visibility filter', () => {
    const where = buildWhereClause({
      brand: '',
      model: '',
      gen: '',
      yearMin: null,
      yearMax: null,
      priceMin: null,
      priceMax: null,
      mileMin: null,
      mileMax: null,
    })

    expect(where).toEqual({
      approvalStatus: 'APPROVED',
      status: { not: 'HIDDEN' },
    })
  })

  it('with brand filter returns nested trim relation match', () => {
    const where = buildWhereClause({
      brand: 'brand-id-1',
      model: '',
      gen: '',
      yearMin: null,
      yearMax: null,
      priceMin: null,
      priceMax: null,
      mileMin: null,
      mileMax: null,
    })

    expect(where.trim).toEqual({
      generation: {
        carModel: {
          brandId: 'brand-id-1',
        },
      },
    })
  })

  it('with brand+model returns nested match for both', () => {
    const where = buildWhereClause({
      brand: 'brand-id-1',
      model: 'model-id-1',
      gen: '',
      yearMin: null,
      yearMax: null,
      priceMin: null,
      priceMax: null,
      mileMin: null,
      mileMax: null,
    })

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
    const where = buildWhereClause({
      brand: 'brand-id-1',
      model: 'model-id-1',
      gen: 'gen-id-1',
      yearMin: null,
      yearMax: null,
      priceMin: null,
      priceMax: null,
      mileMin: null,
      mileMax: null,
    })

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
    const where = buildWhereClause({
      brand: '',
      model: '',
      gen: '',
      yearMin: 2020,
      yearMax: 2024,
      priceMin: null,
      priceMax: null,
      mileMin: null,
      mileMax: null,
    })

    expect(where.year).toEqual({ gte: 2020, lte: 2024 })
  })

  it('with priceMin/priceMax returns monthlyRental gte/lte', () => {
    const where = buildWhereClause({
      brand: '',
      model: '',
      gen: '',
      yearMin: null,
      yearMax: null,
      priceMin: 200000,
      priceMax: 500000,
      mileMin: null,
      mileMax: null,
    })

    expect(where.monthlyRental).toEqual({ gte: 200000, lte: 500000 })
  })

  it('with mileageMin/mileageMax returns mileage gte/lte', () => {
    const where = buildWhereClause({
      brand: '',
      model: '',
      gen: '',
      yearMin: null,
      yearMax: null,
      priceMin: null,
      priceMax: null,
      mileMin: 10000,
      mileMax: 50000,
    })

    expect(where.mileage).toEqual({ gte: 10000, lte: 50000 })
  })
})

describe('buildOrderBy', () => {
  it('price-asc returns monthlyRental asc', () => {
    expect(buildOrderBy('price-asc')).toEqual({ monthlyRental: 'asc' })
  })

  it('price-desc returns monthlyRental desc', () => {
    expect(buildOrderBy('price-desc')).toEqual({ monthlyRental: 'desc' })
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

  it('newest returns approvedAt desc', () => {
    expect(buildOrderBy('newest')).toEqual({ approvedAt: 'desc' })
  })

  it('defaults to newest', () => {
    expect(buildOrderBy('unknown')).toEqual({ approvedAt: 'desc' })
    expect(buildOrderBy('')).toEqual({ approvedAt: 'desc' })
  })
})
