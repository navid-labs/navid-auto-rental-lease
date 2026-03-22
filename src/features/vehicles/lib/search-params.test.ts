import { describe, it, expect } from 'vitest'
import { searchParamsParsers, PAGE_SIZE } from './search-params'

describe('searchParamsParsers', () => {
  it('has all expected keys', () => {
    const keys = Object.keys(searchParamsParsers)
    expect(keys).toContain('brand')
    expect(keys).toContain('model')
    expect(keys).toContain('gen')
    expect(keys).toContain('yearMin')
    expect(keys).toContain('yearMax')
    expect(keys).toContain('priceMin')
    expect(keys).toContain('priceMax')
    expect(keys).toContain('mileMin')
    expect(keys).toContain('mileMax')
    expect(keys).toContain('sort')
    expect(keys).toContain('page')
  })

  it('has 27 parser keys total', () => {
    expect(Object.keys(searchParamsParsers)).toHaveLength(27)
  })

  it('PAGE_SIZE is 12', () => {
    expect(PAGE_SIZE).toBe(12)
  })
})
