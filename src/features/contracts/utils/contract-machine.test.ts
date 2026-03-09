import { describe, it, expect } from 'vitest'
import {
  canTransitionContract,
  getAvailableContractTransitions,
  CONTRACT_STATUS_TRANSITIONS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
} from './contract-machine'

describe('Contract State Machine', () => {
  describe('CONTRACT_STATUS_TRANSITIONS', () => {
    it('defines transitions for all 7 statuses', () => {
      const statuses = Object.keys(CONTRACT_STATUS_TRANSITIONS)
      expect(statuses).toHaveLength(7)
      expect(statuses).toContain('DRAFT')
      expect(statuses).toContain('PENDING_EKYC')
      expect(statuses).toContain('PENDING_APPROVAL')
      expect(statuses).toContain('APPROVED')
      expect(statuses).toContain('ACTIVE')
      expect(statuses).toContain('COMPLETED')
      expect(statuses).toContain('CANCELED')
    })
  })

  describe('CONTRACT_STATUS_LABELS', () => {
    it('maps all 7 statuses to Korean labels', () => {
      expect(CONTRACT_STATUS_LABELS.DRAFT).toBe('작성 중')
      expect(CONTRACT_STATUS_LABELS.PENDING_EKYC).toBe('본인인증 대기')
      expect(CONTRACT_STATUS_LABELS.PENDING_APPROVAL).toBe('승인 대기')
      expect(CONTRACT_STATUS_LABELS.APPROVED).toBe('승인됨')
      expect(CONTRACT_STATUS_LABELS.ACTIVE).toBe('계약 진행 중')
      expect(CONTRACT_STATUS_LABELS.COMPLETED).toBe('완료')
      expect(CONTRACT_STATUS_LABELS.CANCELED).toBe('취소됨')
    })
  })

  describe('CONTRACT_STATUS_COLORS', () => {
    it('maps all 7 statuses to color strings', () => {
      const statuses = Object.keys(CONTRACT_STATUS_COLORS)
      expect(statuses).toHaveLength(7)
    })
  })

  describe('canTransitionContract', () => {
    // Happy path - customer transitions
    it('allows DRAFT -> PENDING_EKYC for CUSTOMER', () => {
      expect(canTransitionContract('DRAFT', 'PENDING_EKYC', 'CUSTOMER')).toBe(true)
    })

    it('allows DRAFT -> CANCELED for CUSTOMER', () => {
      expect(canTransitionContract('DRAFT', 'CANCELED', 'CUSTOMER')).toBe(true)
    })

    it('allows PENDING_EKYC -> PENDING_APPROVAL for CUSTOMER', () => {
      expect(canTransitionContract('PENDING_EKYC', 'PENDING_APPROVAL', 'CUSTOMER')).toBe(true)
    })

    it('allows PENDING_EKYC -> CANCELED for CUSTOMER', () => {
      expect(canTransitionContract('PENDING_EKYC', 'CANCELED', 'CUSTOMER')).toBe(true)
    })

    // Admin transitions
    it('allows PENDING_APPROVAL -> APPROVED for ADMIN', () => {
      expect(canTransitionContract('PENDING_APPROVAL', 'APPROVED', 'ADMIN')).toBe(true)
    })

    it('allows APPROVED -> ACTIVE for ADMIN', () => {
      expect(canTransitionContract('APPROVED', 'ACTIVE', 'ADMIN')).toBe(true)
    })

    it('allows ACTIVE -> COMPLETED for ADMIN', () => {
      expect(canTransitionContract('ACTIVE', 'COMPLETED', 'ADMIN')).toBe(true)
    })

    // Invalid transitions
    it('rejects DRAFT -> APPROVED for CUSTOMER (skip states)', () => {
      expect(canTransitionContract('DRAFT', 'APPROVED', 'CUSTOMER')).toBe(false)
    })

    it('rejects same status transition', () => {
      expect(canTransitionContract('DRAFT', 'DRAFT', 'ADMIN')).toBe(false)
    })

    // Terminal states
    it('rejects any transition from COMPLETED for CUSTOMER', () => {
      expect(canTransitionContract('COMPLETED', 'DRAFT', 'CUSTOMER')).toBe(false)
      expect(canTransitionContract('COMPLETED', 'ACTIVE', 'CUSTOMER')).toBe(false)
    })

    it('rejects any transition from CANCELED for CUSTOMER', () => {
      expect(canTransitionContract('CANCELED', 'DRAFT', 'CUSTOMER')).toBe(false)
      expect(canTransitionContract('CANCELED', 'ACTIVE', 'CUSTOMER')).toBe(false)
    })

    // Admin force any non-same transition
    it('allows admin to force any non-same transition', () => {
      expect(canTransitionContract('COMPLETED', 'DRAFT', 'ADMIN')).toBe(true)
      expect(canTransitionContract('CANCELED', 'ACTIVE', 'ADMIN')).toBe(true)
      expect(canTransitionContract('DRAFT', 'COMPLETED', 'ADMIN')).toBe(true)
    })

    // Customer cannot access admin-only transitions
    it('rejects PENDING_APPROVAL -> APPROVED for CUSTOMER', () => {
      expect(canTransitionContract('PENDING_APPROVAL', 'APPROVED', 'CUSTOMER')).toBe(false)
    })
  })

  describe('getAvailableContractTransitions', () => {
    it('returns [PENDING_EKYC, CANCELED] for DRAFT CUSTOMER', () => {
      const result = getAvailableContractTransitions('DRAFT', 'CUSTOMER')
      expect(result).toEqual(['PENDING_EKYC', 'CANCELED'])
    })

    it('returns empty array for COMPLETED CUSTOMER (terminal)', () => {
      expect(getAvailableContractTransitions('COMPLETED', 'CUSTOMER')).toEqual([])
    })

    it('returns empty array for CANCELED CUSTOMER (terminal)', () => {
      expect(getAvailableContractTransitions('CANCELED', 'CUSTOMER')).toEqual([])
    })

    it('returns all other statuses for ADMIN from any state', () => {
      const result = getAvailableContractTransitions('DRAFT', 'ADMIN')
      expect(result).toHaveLength(6) // all except DRAFT
      expect(result).not.toContain('DRAFT')
    })

    it('returns empty for CUSTOMER on admin-only statuses', () => {
      expect(getAvailableContractTransitions('PENDING_APPROVAL', 'CUSTOMER')).toEqual([])
    })
  })
})
