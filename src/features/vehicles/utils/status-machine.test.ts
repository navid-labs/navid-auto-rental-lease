import { describe, it, expect } from 'vitest'
import { canTransition, getAvailableTransitions } from './status-machine'

describe('canTransition', () => {
  describe('dealer transitions', () => {
    it('allows AVAILABLE -> RESERVED for dealer', () => {
      expect(canTransition('AVAILABLE', 'RESERVED', 'DEALER')).toBe(true)
    })

    it('allows AVAILABLE -> MAINTENANCE for dealer', () => {
      expect(canTransition('AVAILABLE', 'MAINTENANCE', 'DEALER')).toBe(true)
    })

    it('allows AVAILABLE -> HIDDEN for dealer', () => {
      expect(canTransition('AVAILABLE', 'HIDDEN', 'DEALER')).toBe(true)
    })

    it('blocks AVAILABLE -> RENTED for dealer (must go through RESERVED)', () => {
      expect(canTransition('AVAILABLE', 'RENTED', 'DEALER')).toBe(false)
    })

    it('allows RESERVED -> RENTED for dealer', () => {
      expect(canTransition('RESERVED', 'RENTED', 'DEALER')).toBe(true)
    })

    it('allows RESERVED -> LEASED for dealer', () => {
      expect(canTransition('RESERVED', 'LEASED', 'DEALER')).toBe(true)
    })

    it('blocks HIDDEN -> AVAILABLE for dealer (admin only)', () => {
      expect(canTransition('HIDDEN', 'AVAILABLE', 'DEALER')).toBe(false)
    })

    it('allows RENTED -> AVAILABLE for dealer', () => {
      expect(canTransition('RENTED', 'AVAILABLE', 'DEALER')).toBe(true)
    })

    it('allows MAINTENANCE -> AVAILABLE for dealer', () => {
      expect(canTransition('MAINTENANCE', 'AVAILABLE', 'DEALER')).toBe(true)
    })
  })

  describe('admin transitions', () => {
    it('allows HIDDEN -> AVAILABLE for admin', () => {
      expect(canTransition('HIDDEN', 'AVAILABLE', 'ADMIN')).toBe(true)
    })

    it('allows any transition for admin (force)', () => {
      expect(canTransition('AVAILABLE', 'RENTED', 'ADMIN')).toBe(true)
      expect(canTransition('HIDDEN', 'LEASED', 'ADMIN')).toBe(true)
      expect(canTransition('MAINTENANCE', 'RESERVED', 'ADMIN')).toBe(true)
    })
  })
})

describe('getAvailableTransitions', () => {
  it('returns correct transitions for AVAILABLE + DEALER', () => {
    const transitions = getAvailableTransitions('AVAILABLE', 'DEALER')
    expect(transitions).toContain('RESERVED')
    expect(transitions).toContain('MAINTENANCE')
    expect(transitions).toContain('HIDDEN')
    expect(transitions).not.toContain('RENTED')
    expect(transitions).not.toContain('LEASED')
  })

  it('returns all statuses for admin from any status', () => {
    const transitions = getAvailableTransitions('HIDDEN', 'ADMIN')
    expect(transitions.length).toBeGreaterThan(1)
    expect(transitions).toContain('AVAILABLE')
  })

  it('returns empty for dealer from HIDDEN', () => {
    const transitions = getAvailableTransitions('HIDDEN', 'DEALER')
    expect(transitions).toHaveLength(0)
  })
})
