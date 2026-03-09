/**
 * Format currency in Korean Won
 * formatKRW(450000) => "450,000원"
 * formatKRW(450000, { monthly: true }) => "월 450,000원"
 */
export function formatKRW(
  amount: number,
  options?: { monthly?: boolean }
): string {
  const formatted = new Intl.NumberFormat('ko-KR').format(amount)
  const suffix = `${formatted}원`
  return options?.monthly ? `월 ${suffix}` : suffix
}

/**
 * Format date in Korean formal format
 * formatDate(new Date()) => "2026년 3월 9일"
 * formatDate(new Date(), { short: true }) => "2026.03.09"
 */
export function formatDate(
  date: Date | string,
  options?: { short?: boolean }
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (options?.short) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}.${m}.${day}`
  }
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Format distance in km
 * formatDistance(12500) => "12,500km"
 * formatDistance(12500, { compact: true }) => "1.2만 km"
 */
export function formatDistance(
  km: number,
  options?: { compact?: boolean }
): string {
  if (options?.compact && km >= 10000) {
    // Truncate to 1 decimal place (not round) for consistent display
    const man = Math.floor(km / 1000) / 10
    const formatted = man % 1 === 0 ? man.toString() : man.toFixed(1)
    return `${formatted}만 km`
  }
  return `${new Intl.NumberFormat('ko-KR').format(km)}km`
}

/**
 * Format year model
 * formatYearModel(2026) => "2026년식"
 */
export function formatYearModel(year: number): string {
  return `${year}년식`
}
