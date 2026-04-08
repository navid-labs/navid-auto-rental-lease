import { describe, it, expect } from 'vitest'
import {
  getBestIndex,
  getCompareHighlightClass,
} from '@/features/vehicles/lib/compare-utils'

describe('getBestIndex', () => {
  it('returns null when no betterIs specified', () => {
    expect(getBestIndex([1, 2, 3])).toBeNull()
  })

  it('returns null when fewer than 2 valid numeric values', () => {
    expect(getBestIndex([1, null], 'lower')).toBeNull()
    expect(getBestIndex(['a', 'b'], 'lower')).toBeNull()
  })

  it('returns null when all values are equal', () => {
    expect(getBestIndex([5, 5, 5], 'lower')).toBeNull()
  })

  it('returns index of lowest value for lower direction', () => {
    expect(getBestIndex([10, 5, 20], 'lower')).toBe(1)
    expect(getBestIndex([3, 7], 'lower')).toBe(0)
  })

  it('returns index of highest value for higher direction', () => {
    expect(getBestIndex([10, 5, 20], 'higher')).toBe(2)
    expect(getBestIndex([3, 7], 'higher')).toBe(1)
  })

  it('handles mixed string and number values', () => {
    expect(getBestIndex([10, 'N/A', 5], 'lower')).toBe(2)
  })
})

describe('getCompareHighlightClass', () => {
  it('returns empty classes when bestIdx is null', () => {
    expect(getCompareHighlightClass(0, null, 10)).toEqual({ cell: '', text: '' })
  })

  it('returns green highlight for winner', () => {
    const result = getCompareHighlightClass(0, 0, 10)
    expect(result.cell).toBe('bg-green-50')
    expect(result.text).toContain('font-semibold')
  })

  it('returns red highlight for loser with numeric value', () => {
    const result = getCompareHighlightClass(1, 0, 20)
    expect(result.cell).toBe('bg-red-50')
    expect(result.text).toContain('text-red')
  })

  it('returns empty for loser with non-numeric value', () => {
    const result = getCompareHighlightClass(1, 0, 'N/A')
    expect(result.cell).toBe('')
    expect(result.text).toBe('')
  })

  it('returns empty for loser with null value', () => {
    const result = getCompareHighlightClass(1, 0, null)
    expect(result.cell).toBe('')
    expect(result.text).toBe('')
  })
})
