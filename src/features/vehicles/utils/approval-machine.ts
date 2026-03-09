import type { ApprovalStatus } from '@prisma/client'
import type { UserRole } from '@prisma/client'

/** Korean labels for each approval status */
export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
}

/** Preset rejection reasons for quick selection */
export const REJECTION_PRESETS = [
  '사진 품질 불량',
  '정보 불일치',
  '가격 비현실적',
] as const

/**
 * Validates whether a given approval status transition is allowed for a role.
 * - Admin: any transition allowed
 * - Dealer: only REJECTED -> PENDING (resubmit)
 */
export function canTransitionApproval(
  from: ApprovalStatus,
  to: ApprovalStatus,
  role: UserRole
): boolean {
  if (from === to) return false

  if (role === 'ADMIN') return true

  // Dealer can only resubmit: REJECTED -> PENDING
  if (role === 'DEALER' && from === 'REJECTED' && to === 'PENDING') return true

  return false
}
