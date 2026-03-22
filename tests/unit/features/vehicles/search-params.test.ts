import { describe, it, expect } from 'vitest'
import { searchParamsParsers, PAGE_SIZE } from '@/features/vehicles/lib/search-params'

describe('searchParamsParsers', () => {
  it('has all 15+ filter parameter keys', () => {
    const keys = Object.keys(searchParamsParsers)
    const expected = [
      // Existing
      'brand', 'model', 'gen', 'yearMin', 'yearMax',
      'priceMin', 'priceMax', 'mileMin', 'mileMax',
      'sort', 'page',
      // New filters
      'fuel', 'transmission', 'color', 'seats', 'driveType',
      'options', 'region', 'salesType', 'keyword',
      'monthlyMin', 'monthlyMax',
      // Quick filters
      'homeService', 'timeDeal', 'noAccident', 'hasRental',
      // View mode
      'view',
    ]
    for (const key of expected) {
      expect(keys, `missing key: ${key}`).toContain(key)
    }
  })

  it('PAGE_SIZE equals 12', () => {
    expect(PAGE_SIZE).toBe(12)
  })

  it('sort default is "recommended"', () => {
    // nuqs parsers with withDefault have a defaultValue property
    const sortParser = searchParamsParsers.sort
    expect(sortParser.defaultValue).toBe('recommended')
  })

  it('view default is "grid"', () => {
    const viewParser = searchParamsParsers.view
    expect(viewParser.defaultValue).toBe('grid')
  })
})
