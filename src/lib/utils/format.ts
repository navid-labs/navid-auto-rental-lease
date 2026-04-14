/**
 * Format currency in compact Korean units (억/만원)
 * formatKRWCompact(150000000) => "1억 5,000만원"
 * formatKRWCompact(5000000)   => "500만원"
 * formatKRWCompact(9000)      => "9,000원"
 */
export function formatKRWCompact(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000);
    const man = Math.round((amount % 100_000_000) / 10_000);
    return man > 0 ? `${eok}억 ${man.toLocaleString("ko-KR")}만원` : `${eok}억원`;
  }
  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString("ko-KR")}만원`;
  }
  return `${amount.toLocaleString("ko-KR")}원`;
}

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

/**
 * Input type for getKoreanVehicleName - matches Prisma Vehicle with nested relations
 * Vehicle -> trim (Trim) -> generation (Generation) -> carModel (CarModel) -> brand (Brand)
 */
type VehicleNameInput = {
  year: number
  trim: {
    name: string
    generation: {
      carModel: {
        name: string
        nameKo: string | null
        brand: {
          name: string
          nameKo: string | null
        }
      }
    }
  }
}

export type { VehicleNameInput }

/**
 * Build Korean display name for a vehicle from its nested relations.
 * Pattern: "현대 쏘나타 프리미엄 2024" (brand model trim year)
 * Fallback: Uses English name if nameKo is null
 */
export function getKoreanVehicleName(
  vehicle: VehicleNameInput,
  options?: { includeTrim?: boolean; includeYear?: boolean }
): string {
  const { includeTrim = true, includeYear = true } = options ?? {}
  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const parts = [
    brand.nameKo || brand.name,
    model.nameKo || model.name,
  ]
  if (includeTrim) parts.push(vehicle.trim.name)
  if (includeYear) parts.push(String(vehicle.year))
  return parts.join(' ')
}

/**
 * Format date in Korean formal format.
 * Alias for formatDate() -- existing function already outputs Korean format.
 * Exported for API consistency with COMP-04 requirement.
 */
export const formatKoreanDate = formatDate
