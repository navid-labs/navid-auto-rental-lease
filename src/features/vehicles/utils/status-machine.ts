import type { VehicleStatus } from '@prisma/client'

type Role = 'DEALER' | 'ADMIN'

type StatusTransition = {
  to: VehicleStatus[]
  roles: Role[]
}

/**
 * Allowed vehicle status transitions.
 * Each entry defines which target statuses are allowed and which roles can perform them.
 * Admin can force ANY transition regardless of this map.
 */
export const VEHICLE_STATUS_TRANSITIONS: Record<VehicleStatus, StatusTransition> = {
  AVAILABLE: {
    to: ['RESERVED', 'MAINTENANCE', 'HIDDEN'],
    roles: ['DEALER', 'ADMIN'],
  },
  RESERVED: {
    to: ['AVAILABLE', 'RENTED', 'LEASED', 'MAINTENANCE', 'HIDDEN'],
    roles: ['DEALER', 'ADMIN'],
  },
  RENTED: {
    to: ['AVAILABLE', 'MAINTENANCE', 'HIDDEN'],
    roles: ['DEALER', 'ADMIN'],
  },
  LEASED: {
    to: ['AVAILABLE', 'MAINTENANCE', 'HIDDEN'],
    roles: ['DEALER', 'ADMIN'],
  },
  MAINTENANCE: {
    to: ['AVAILABLE', 'HIDDEN'],
    roles: ['DEALER', 'ADMIN'],
  },
  HIDDEN: {
    to: ['AVAILABLE'],
    roles: ['ADMIN'], // Only admin can restore from HIDDEN
  },
}

/** All possible vehicle statuses for admin force-transition */
const ALL_STATUSES: VehicleStatus[] = [
  'AVAILABLE',
  'RESERVED',
  'RENTED',
  'LEASED',
  'MAINTENANCE',
  'HIDDEN',
]

/**
 * Check if a status transition is allowed for the given role.
 * Admin can force any transition.
 */
export function canTransition(
  from: VehicleStatus,
  to: VehicleStatus,
  role: Role
): boolean {
  if (from === to) return false
  if (role === 'ADMIN') return true

  const transition = VEHICLE_STATUS_TRANSITIONS[from]
  return transition.to.includes(to) && transition.roles.includes(role)
}

/**
 * Get all available target statuses from the current status for the given role.
 * Admin gets all statuses except the current one.
 */
export function getAvailableTransitions(
  from: VehicleStatus,
  role: Role
): VehicleStatus[] {
  if (role === 'ADMIN') {
    return ALL_STATUSES.filter((s) => s !== from)
  }

  const transition = VEHICLE_STATUS_TRANSITIONS[from]
  if (!transition.roles.includes(role)) return []
  return transition.to
}
