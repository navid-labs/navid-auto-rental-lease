import { describe, it, expect } from 'vitest'
import {
  canTransition,
  getAvailableTransitions,
  VEHICLE_STATUS_TRANSITIONS,
} from '@/features/vehicles/utils/status-machine'

describe('VEHICLE_STATUS_TRANSITIONS', () => {
  it('defines transitions for all 6 statuses', () => {
    const statuses = Object.keys(VEHICLE_STATUS_TRANSITIONS)
    expect(statuses).toHaveLength(6)
    expect(statuses).toContain('AVAILABLE')
    expect(statuses).toContain('RESERVED')
    expect(statuses).toContain('RENTED')
    expect(statuses).toContain('LEASED')
    expect(statuses).toContain('MAINTENANCE')
    expect(statuses).toContain('HIDDEN')
  })

  it('restricts HIDDEN restore to ADMIN only', () => {
    expect(VEHICLE_STATUS_TRANSITIONS.HIDDEN.roles).toEqual(['ADMIN'])
    expect(VEHICLE_STATUS_TRANSITIONS.HIDDEN.to).toEqual(['AVAILABLE'])
  })
})

describe('canTransition', () => {
  it('returns false for same status', () => {
    expect(canTransition('AVAILABLE', 'AVAILABLE', 'ADMIN')).toBe(false)
    expect(canTransition('RENTED', 'RENTED', 'DEALER')).toBe(false)
  })

  it('allows ADMIN any transition', () => {
    expect(canTransition('AVAILABLE', 'RENTED', 'ADMIN')).toBe(true)
    expect(canTransition('HIDDEN', 'LEASED', 'ADMIN')).toBe(true)
  })

  it('allows DEALER valid transition', () => {
    expect(canTransition('AVAILABLE', 'RESERVED', 'DEALER')).toBe(true)
    expect(canTransition('RESERVED', 'RENTED', 'DEALER')).toBe(true)
    expect(canTransition('RENTED', 'AVAILABLE', 'DEALER')).toBe(true)
  })

  it('denies DEALER invalid transition', () => {
    // HIDDEN -> AVAILABLE is ADMIN-only
    expect(canTransition('HIDDEN', 'AVAILABLE', 'DEALER')).toBe(false)
    // AVAILABLE -> RENTED skips RESERVED
    expect(canTransition('AVAILABLE', 'RENTED', 'DEALER')).toBe(false)
  })
})

describe('getAvailableTransitions', () => {
  it('returns all statuses except current for ADMIN', () => {
    const transitions = getAvailableTransitions('AVAILABLE', 'ADMIN')
    expect(transitions).toHaveLength(5)
    expect(transitions).not.toContain('AVAILABLE')
    expect(transitions).toContain('RESERVED')
    expect(transitions).toContain('HIDDEN')
  })

  it('returns defined transitions for DEALER with valid role', () => {
    const transitions = getAvailableTransitions('AVAILABLE', 'DEALER')
    expect(transitions).toEqual(['RESERVED', 'MAINTENANCE', 'HIDDEN'])
  })

  it('returns empty for DEALER when role not allowed', () => {
    const transitions = getAvailableTransitions('HIDDEN', 'DEALER')
    expect(transitions).toEqual([])
  })
})
