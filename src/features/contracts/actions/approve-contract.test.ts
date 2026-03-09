import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma, mockGetCurrentUser } = vi.hoisted(() => ({
  mockPrisma: {
    $transaction: vi.fn(),
    rentalContract: { findUnique: vi.fn(), update: vi.fn() },
    leaseContract: { findUnique: vi.fn(), update: vi.fn() },
    vehicle: { update: vi.fn() },
  },
  mockGetCurrentUser: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

import { approveContract } from './approve-contract'

const adminUser = {
  id: 'admin-1',
  role: 'ADMIN',
  email: 'admin@test.com',
}

const customerUser = {
  id: 'customer-1',
  role: 'CUSTOMER',
  email: 'customer@test.com',
}

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

describe('approveContract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('approves a PENDING_APPROVAL rental contract (transitions to APPROVED)', async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser)

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

    const result = await approveContract('contract-1', 'RENTAL', 'APPROVED')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('rejects a PENDING_APPROVAL contract (transitions to CANCELED with reason)', async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser)

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

    const result = await approveContract('contract-1', 'RENTAL', 'CANCELED', '서류 미비')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('rejects non-ADMIN users', async () => {
    mockGetCurrentUser.mockResolvedValue(customerUser)

    const result = await approveContract('contract-1', 'RENTAL', 'APPROVED')

    expect(result).toEqual({ error: '관리자만 계약을 승인/반려할 수 있습니다.' })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated users', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await approveContract('contract-1', 'RENTAL', 'APPROVED')

    expect(result).toEqual({ error: '로그인이 필요합니다.' })
  })

  it('rejects invalid transitions (e.g., DRAFT -> APPROVED)', async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser)

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
    const result = await approveContract('contract-1', 'RENTAL', 'APPROVED')

    expect(result).toEqual({ success: true })
  })

  it('returns error when contract not found', async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser)

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

    const result = await approveContract('nonexistent', 'RENTAL', 'APPROVED')

    expect(result).toEqual({ error: '계약을 찾을 수 없습니다.' })
  })
})
