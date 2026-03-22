type Badge = {
  label: string
  className: string
}

const CURRENT_YEAR = new Date().getFullYear()

export type BadgeInput = {
  status: string
  year: number
  mileage: number
  monthlyRental?: number | null
  monthlyLease?: number | null
  createdAt: Date | string
  fuelType: string
  inspectionData?: { accidentDiagnosis?: string } | null
  warrantyEndDate?: Date | string | null
}

/** Determine marketing badges based on vehicle data. Max 3 returned. */
export function getVehicleBadges(vehicle: BadgeInput): Badge[] {
  const badges: Badge[] = []

  if (vehicle.status === 'RESERVED') {
    badges.push({ label: '계약중', className: 'bg-badge-danger text-white' })
  }
  if (vehicle.fuelType === 'ELECTRIC') {
    badges.push({ label: '전기차', className: 'bg-badge-success text-white' })
  }
  if (vehicle.year >= CURRENT_YEAR - 1 && vehicle.mileage < 15_000) {
    badges.push({ label: '신차급', className: 'bg-badge-info text-white' })
  }
  if (vehicle.monthlyRental && vehicle.monthlyRental < 500_000) {
    badges.push({ label: '타임딜', className: 'bg-badge-warning text-white' })
  }
  if (vehicle.monthlyLease) {
    badges.push({ label: '할인중', className: 'bg-badge-discount text-white' })
  }

  const daysSinceCreated =
    (Date.now() - new Date(vehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreated <= 7) {
    badges.push({ label: 'NEW', className: 'bg-badge-new text-white' })
  }

  // No accident badge from inspectionData JSONB
  const inspection = vehicle.inspectionData as { accidentDiagnosis?: string } | null
  if (inspection?.accidentDiagnosis === 'none') {
    badges.push({ label: '무사고', className: 'bg-badge-success text-white' })
  }

  // Warranty badge
  if (vehicle.warrantyEndDate && new Date(vehicle.warrantyEndDate) > new Date()) {
    badges.push({ label: '보증포함', className: 'bg-accent text-white' })
  }

  return badges.slice(0, 3)
}
