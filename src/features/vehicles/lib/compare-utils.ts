export type CompareDirection = 'lower' | 'higher'

/**
 * Returns the index of the "best" value in the array based on direction.
 * Returns null if: no betterIs specified, fewer than 2 valid numeric values, or all values are equal.
 */
export function getBestIndex(
  values: (string | number | null)[],
  betterIs?: CompareDirection,
): number | null {
  if (!betterIs) return null
  const numericValues = values.map((v) => (typeof v === 'number' ? v : null))
  const validValues = numericValues.filter((v): v is number => v !== null)
  if (validValues.length < 2) return null
  const unique = new Set(validValues)
  if (unique.size <= 1) return null
  const bestValue =
    betterIs === 'lower' ? Math.min(...validValues) : Math.max(...validValues)
  return numericValues.indexOf(bestValue)
}

/**
 * Returns highlight class for a comparison cell.
 * Winner: green background + bold text. Loser (numeric only): red background.
 * Same/null/non-numeric: no highlight.
 */
export function getCompareHighlightClass(
  idx: number,
  bestIdx: number | null,
  value: string | number | null,
): { cell: string; text: string } {
  if (bestIdx === null) return { cell: '', text: '' }
  if (bestIdx === idx) return { cell: 'bg-green-50', text: 'font-semibold text-green-700' }
  if (typeof value === 'number') return { cell: 'bg-red-50', text: 'text-red-600' }
  return { cell: '', text: '' }
}
