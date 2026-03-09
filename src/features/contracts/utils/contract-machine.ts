import type { ContractStatus } from '@prisma/client'

type Role = 'CUSTOMER' | 'ADMIN'

type StatusTransition = {
  to: ContractStatus[]
  roles: Role[]
}

/**
 * Allowed contract status transitions.
 * Each entry defines which target statuses are allowed and which roles can perform them.
 * Admin can force ANY transition regardless of this map.
 */
export const CONTRACT_STATUS_TRANSITIONS: Record<ContractStatus, StatusTransition> = {
  DRAFT: {
    to: ['PENDING_EKYC', 'CANCELED'],
    roles: ['CUSTOMER', 'ADMIN'],
  },
  PENDING_EKYC: {
    to: ['PENDING_APPROVAL', 'CANCELED'],
    roles: ['CUSTOMER', 'ADMIN'],
  },
  PENDING_APPROVAL: {
    to: ['APPROVED', 'CANCELED'],
    roles: ['ADMIN'],
  },
  APPROVED: {
    to: ['ACTIVE', 'CANCELED'],
    roles: ['ADMIN'],
  },
  ACTIVE: {
    to: ['COMPLETED'],
    roles: ['ADMIN'],
  },
  COMPLETED: {
    to: [],
    roles: [],
  },
  CANCELED: {
    to: [],
    roles: [],
  },
}

/** Korean labels for contract statuses */
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: '작성 중',
  PENDING_EKYC: '본인인증 대기',
  PENDING_APPROVAL: '승인 대기',
  APPROVED: '승인됨',
  ACTIVE: '계약 진행 중',
  COMPLETED: '완료',
  CANCELED: '취소됨',
}

/** Badge color classes for contract statuses */
export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_EKYC: 'bg-yellow-100 text-yellow-800',
  PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-slate-100 text-slate-800',
  CANCELED: 'bg-red-100 text-red-800',
}

/** All possible contract statuses for admin force-transition */
const ALL_STATUSES: ContractStatus[] = [
  'DRAFT',
  'PENDING_EKYC',
  'PENDING_APPROVAL',
  'APPROVED',
  'ACTIVE',
  'COMPLETED',
  'CANCELED',
]

/**
 * Check if a contract status transition is allowed for the given role.
 * Admin can force any transition (except same-to-same).
 */
export function canTransitionContract(
  from: ContractStatus,
  to: ContractStatus,
  role: Role
): boolean {
  if (from === to) return false
  if (role === 'ADMIN') return true

  const transition = CONTRACT_STATUS_TRANSITIONS[from]
  return transition.to.includes(to) && transition.roles.includes(role)
}

/**
 * Get all available target statuses from the current status for the given role.
 * Admin gets all statuses except the current one.
 */
export function getAvailableContractTransitions(
  from: ContractStatus,
  role: Role
): ContractStatus[] {
  if (role === 'ADMIN') {
    return ALL_STATUSES.filter((s) => s !== from)
  }

  const transition = CONTRACT_STATUS_TRANSITIONS[from]
  if (!transition.roles.includes(role)) return []
  return transition.to
}
