import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getVehicleBadges } from '@/features/vehicles/lib/vehicle-badges'

describe('getVehicleBadges', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-22T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const baseBadgeInput = {
    status: 'APPROVED',
    year: 2020,
    mileage: 80_000,
    monthlyRental: null as number | null,
    monthlyLease: null as number | null,
    createdAt: '2026-01-01T00:00:00Z',
    fuelType: 'GASOLINE',
    inspectionData: null as { accidentDiagnosis?: string } | null,
    warrantyEndDate: null as string | null,
  }

  it('RESERVED vehicle returns badge with label "계약중" and className containing "bg-badge-danger"', () => {
    const badges = getVehicleBadges({ ...baseBadgeInput, status: 'RESERVED' })
    expect(badges).toContainEqual(
      expect.objectContaining({ label: '계약중', className: expect.stringContaining('bg-badge-danger') })
    )
  })

  it('ELECTRIC fuelType returns badge "전기차" with "bg-badge-success"', () => {
    const badges = getVehicleBadges({ ...baseBadgeInput, fuelType: 'ELECTRIC' })
    expect(badges).toContainEqual(
      expect.objectContaining({ label: '전기차', className: expect.stringContaining('bg-badge-success') })
    )
  })

  it('year=CURRENT_YEAR, mileage=10000 returns "신차급" with "bg-badge-info"', () => {
    const badges = getVehicleBadges({ ...baseBadgeInput, year: 2026, mileage: 10_000 })
    expect(badges).toContainEqual(
      expect.objectContaining({ label: '신차급', className: expect.stringContaining('bg-badge-info') })
    )
  })

  it('monthlyRental=400000 returns "타임딜" with "bg-badge-warning"', () => {
    const badges = getVehicleBadges({ ...baseBadgeInput, monthlyRental: 400_000 })
    expect(badges).toContainEqual(
      expect.objectContaining({ label: '타임딜', className: expect.stringContaining('bg-badge-warning') })
    )
  })

  it('monthlyLease set returns "할인중" with "bg-badge-discount"', () => {
    const badges = getVehicleBadges({ ...baseBadgeInput, monthlyLease: 350_000 })
    expect(badges).toContainEqual(
      expect.objectContaining({ label: '할인중', className: expect.stringContaining('bg-badge-discount') })
    )
  })

  it('createdAt within 7 days returns "NEW" with "bg-badge-new"', () => {
    const badges = getVehicleBadges({ ...baseBadgeInput, createdAt: '2026-03-20T00:00:00Z' })
    expect(badges).toContainEqual(
      expect.objectContaining({ label: 'NEW', className: expect.stringContaining('bg-badge-new') })
    )
  })

  it('inspectionData.accidentDiagnosis === "none" returns "무사고" with "bg-badge-success"', () => {
    const badges = getVehicleBadges({
      ...baseBadgeInput,
      inspectionData: { accidentDiagnosis: 'none' },
    })
    expect(badges).toContainEqual(
      expect.objectContaining({ label: '무사고', className: expect.stringContaining('bg-badge-success') })
    )
  })

  it('warrantyEndDate in future returns "보증포함" with "bg-accent"', () => {
    const badges = getVehicleBadges({
      ...baseBadgeInput,
      warrantyEndDate: '2027-06-01T00:00:00Z',
    })
    expect(badges).toContainEqual(
      expect.objectContaining({ label: '보증포함', className: expect.stringContaining('bg-accent') })
    )
  })

  it('max 3 badges returned (slice(0, 3))', () => {
    // Trigger many badge conditions at once
    const badges = getVehicleBadges({
      status: 'RESERVED',
      year: 2026,
      mileage: 5_000,
      monthlyRental: 400_000,
      monthlyLease: 350_000,
      createdAt: '2026-03-21T00:00:00Z',
      fuelType: 'ELECTRIC',
      inspectionData: { accidentDiagnosis: 'none' },
      warrantyEndDate: '2027-06-01T00:00:00Z',
    })
    expect(badges.length).toBeLessThanOrEqual(3)
  })

  it('function accepts input with absent inspectionData and warrantyEndDate', () => {
    const badges = getVehicleBadges({
      ...baseBadgeInput,
      inspectionData: null,
      warrantyEndDate: null,
    })
    // Should not throw, and not include 무사고 or 보증포함
    expect(badges.every((b) => b.label !== '무사고')).toBe(true)
    expect(badges.every((b) => b.label !== '보증포함')).toBe(true)
  })
})
