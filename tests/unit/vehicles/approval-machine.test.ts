import { describe, it, expect } from 'vitest'
import {
  canTransitionApproval,
  APPROVAL_LABELS,
  REJECTION_PRESETS,
} from '@/features/vehicles/utils/approval-machine'

describe('APPROVAL_LABELS', () => {
  it('has labels for all statuses', () => {
    expect(APPROVAL_LABELS.PENDING).toBe('승인 대기')
    expect(APPROVAL_LABELS.APPROVED).toBe('승인됨')
    expect(APPROVAL_LABELS.REJECTED).toBe('거절됨')
  })
})

describe('REJECTION_PRESETS', () => {
  it('contains preset rejection reasons', () => {
    expect(REJECTION_PRESETS).toContain('사진 품질 불량')
    expect(REJECTION_PRESETS).toContain('정보 불일치')
    expect(REJECTION_PRESETS).toContain('가격 비현실적')
    expect(REJECTION_PRESETS.length).toBe(3)
  })
})

describe('canTransitionApproval', () => {
  it('returns false for same status transition', () => {
    expect(canTransitionApproval('PENDING', 'PENDING', 'ADMIN')).toBe(false)
    expect(canTransitionApproval('APPROVED', 'APPROVED', 'ADMIN')).toBe(false)
  })

  it('allows any transition for ADMIN', () => {
    expect(canTransitionApproval('PENDING', 'APPROVED', 'ADMIN')).toBe(true)
    expect(canTransitionApproval('PENDING', 'REJECTED', 'ADMIN')).toBe(true)
    expect(canTransitionApproval('APPROVED', 'REJECTED', 'ADMIN')).toBe(true)
    expect(canTransitionApproval('REJECTED', 'PENDING', 'ADMIN')).toBe(true)
  })

  it('allows DEALER only REJECTED -> PENDING (resubmit)', () => {
    expect(canTransitionApproval('REJECTED', 'PENDING', 'DEALER')).toBe(true)
  })

  it('denies DEALER other transitions', () => {
    expect(canTransitionApproval('PENDING', 'APPROVED', 'DEALER')).toBe(false)
    expect(canTransitionApproval('PENDING', 'REJECTED', 'DEALER')).toBe(false)
    expect(canTransitionApproval('APPROVED', 'REJECTED', 'DEALER')).toBe(false)
  })

  it('denies CUSTOMER all transitions', () => {
    expect(canTransitionApproval('PENDING', 'APPROVED', 'CUSTOMER')).toBe(false)
    expect(canTransitionApproval('REJECTED', 'PENDING', 'CUSTOMER')).toBe(false)
  })
})
