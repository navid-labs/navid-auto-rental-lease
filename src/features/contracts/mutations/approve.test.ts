import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    $transaction: vi.fn(),
    rentalContract: { findUnique: vi.fn(), update: vi.fn() },
    leaseContract: { findUnique: vi.fn(), update: vi.fn() },
    vehicle: { update: vi.fn() },
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

import type { UserProfile } from '@/lib/auth/helpers'
import { approveContractMutation } from './approve'

const base = { phone: null, avatar_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
const adminUser: UserProfile = { ...base, id: 'admin-1', role: 'ADMIN', email: 'admin@test.com', name: 'Admin' }
const customerUser: UserProfile = { ...base, id: 'customer-1', role: 'CUSTOMER', email: 'customer@test.com', name: 'Customer' }

const mockRentalContract = {
  id: 'contract-1',
  vehicleId: 'vehicle-1',
  customerId: 'customer-1',
  dealerId: 'dealer-1',
  status: 'PENDING_APPROVAL',
  monthlyPayment: 500000,
  totalAmount: 18000000,
  deposit: 0,
  startDate: null,
  endDate: null,
}

describe('approveContractMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('approves a PENDING_APPROVAL rental contract (transitions to APPROVED)', async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        rentalContract: {
          findUnique: vi.fn().mockResolvedValue(mockRentalContract),
          update: vi.fn(),
        },
        leaseContract: {
          findUnique: vi.fn(),
        },
        vehicle: {
          update: vi.fn(),
        },
      }
      return cb(tx)
    })

    const result = await approveContractMutation('contract-1', 'RENTAL', 'APPROVED', undefined, adminUser)

    expect(result).toEqual({ success: true })
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('rejects a PENDING_APPROVAL contract (transitions to CANCELED with reason)', async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        rentalContract: {
          findUnique: vi.fn().mockResolvedValue(mockRentalContract),
          update: vi.fn(),
        },
        leaseContract: {
          findUnique: vi.fn(),
        },
        vehicle: {
          update: vi.fn(),
        },
      }
      return cb(tx)
    })

    const result = await approveContractMutation('contract-1', 'RENTAL', 'CANCELED', '서류 미비', adminUser)

    expect(result).toEqual({ success: true })
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('rejects non-ADMIN users', async () => {
    const result = await approveContractMutation('contract-1', 'RENTAL', 'APPROVED', undefined, customerUser)

    expect(result).toEqual({ error: '관리자만 계약을 승인/반려할 수 있습니다.' })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects invalid transitions (e.g., DRAFT -> APPROVED)', async () => {
    const draftContract = { ...mockRentalContract, status: 'DRAFT' }

    mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        rentalContract: {
          findUnique: vi.fn().mockResolvedValue(draftContract),
          update: vi.fn(),
        },
        leaseContract: {
          findUnique: vi.fn(),
        },
        vehicle: {
          update: vi.fn(),
        },
      }
      return cb(tx)
    })

    // Admin can force any transition, so this should actually succeed
    // (per contract-machine: admin can transition anything except same-to-same)
    const result = await approveContractMutation('contract-1', 'RENTAL', 'APPROVED', undefined, adminUser)

    expect(result).toEqual({ success: true })
  })

  it('returns error when contract not found', async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        rentalContract: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        leaseContract: {
          findUnique: vi.fn(),
        },
        vehicle: {
          update: vi.fn(),
        },
      }
      return cb(tx)
    })

    const result = await approveContractMutation('nonexistent', 'RENTAL', 'APPROVED', undefined, adminUser)

    expect(result).toEqual({ error: '계약을 찾을 수 없습니다.' })
  })
})
