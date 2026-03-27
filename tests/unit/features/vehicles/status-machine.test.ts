import { describe, it, expect } from 'vitest'
import {
  canTransition,
  getAvailableTransitions,
  VEHICLE_STATUS_TRANSITIONS,
} from '@/features/vehicles/utils/status-machine'

describe('canTransition', () => {
  it('allows AVAILABLE → RESERVED for DEALER', () => {
    expect(canTransition('AVAILABLE', 'RESERVED', 'DEALER')).toBe(true)
  })

  it('denies same-status transition', () => {
    expect(canTransition('AVAILABLE', 'AVAILABLE', 'ADMIN')).toBe(false)
  })

  it('denies HIDDEN → AVAILABLE for DEALER', () => {
    expect(canTransition('HIDDEN', 'AVAILABLE', 'DEALER')).toBe(false)
  })

  it('allows ADMIN to force any transition', () => {
    expect(canTransition('HIDDEN', 'AVAILABLE', 'ADMIN')).toBe(true)
    expect(canTransition('AVAILABLE', 'LEASED', 'ADMIN')).toBe(true)
    expect(canTransition('MAINTENANCE', 'RENTED', 'ADMIN')).toBe(true)
  })

  it('denies DEALER invalid transitions', () => {
    expect(canTransition('AVAILABLE', 'RENTED', 'DEALER')).toBe(false)
    expect(canTransition('AVAILABLE', 'LEASED', 'DEALER')).toBe(false)
  })

  it('allows RESERVED → RENTED for DEALER', () => {
    expect(canTransition('RESERVED', 'RENTED', 'DEALER')).toBe(true)
  })

  it('allows RESERVED → LEASED for DEALER', () => {
    expect(canTransition('RESERVED', 'LEASED', 'DEALER')).toBe(true)
  })

  it('allows RENTED → AVAILABLE for DEALER', () => {
    expect(canTransition('RENTED', 'AVAILABLE', 'DEALER')).toBe(true)
  })
})

describe('getAvailableTransitions', () => {
  it('returns all except current for ADMIN', () => {
    const transitions = getAvailableTransitions('AVAILABLE', 'ADMIN')
    expect(transitions).toHaveLength(5)
    expect(transitions).not.toContain('AVAILABLE')
    expect(transitions).toContain('RESERVED')
    expect(transitions).toContain('HIDDEN')
  })

  it('returns allowed targets for DEALER from AVAILABLE', () => {
    const transitions = getAvailableTransitions('AVAILABLE', 'DEALER')
    expect(transitions).toEqual(['RESERVED', 'MAINTENANCE', 'HIDDEN'])
  })

  it('returns empty for DEALER from HIDDEN', () => {
    const transitions = getAvailableTransitions('HIDDEN', 'DEALER')
    expect(transitions).toEqual([])
  })

  it('returns full list for DEALER from RESERVED', () => {
    const transitions = getAvailableTransitions('RESERVED', 'DEALER')
    expect(transitions).toEqual(['AVAILABLE', 'RENTED', 'LEASED', 'MAINTENANCE', 'HIDDEN'])
  })
})

describe('VEHICLE_STATUS_TRANSITIONS', () => {
  it('has entries for all statuses', () => {
    const statuses = ['AVAILABLE', 'RESERVED', 'RENTED', 'LEASED', 'MAINTENANCE', 'HIDDEN']
    for (const status of statuses) {
      expect(VEHICLE_STATUS_TRANSITIONS).toHaveProperty(status)
    }
  })

  it('HIDDEN can only go to AVAILABLE', () => {
    expect(VEHICLE_STATUS_TRANSITIONS.HIDDEN.to).toEqual(['AVAILABLE'])
  })

  it('HIDDEN is admin-only', () => {
    expect(VEHICLE_STATUS_TRANSITIONS.HIDDEN.roles).toEqual(['ADMIN'])
  })
})
