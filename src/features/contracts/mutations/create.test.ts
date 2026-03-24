import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    $transaction: vi.fn(),
    rentalContract: { count: vi.fn() },
    leaseContract: { count: vi.fn() },
    vehicle: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

import type { UserProfile } from '@/lib/auth/helpers'
import { createContractMutation } from './create'

const validInput = {
  vehicleId: '11111111-1111-4111-a111-111111111111',
  contractType: 'RENTAL' as const,
  periodMonths: 36,
  deposit: 5000000,
}

const mockVehicle = {
  id: validInput.vehicleId,
  price: 25000000,
  status: 'AVAILABLE',
  dealerId: 'dealer-1',
  year: 2023,
  trim: {
    generation: {
      carModel: {
        id: 'model-1',
        brand: { id: 'brand-1' },
      },
    },
  },
  images: [],
}

const base = { phone: null, avatar_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
const customerUser: UserProfile = { ...base, id: 'customer-1', role: 'CUSTOMER', email: 'customer@test.com', name: 'Customer' }
const dealerUser: UserProfile = { ...base, id: 'dealer-1', role: 'DEALER', email: 'dealer@test.com', name: 'Dealer' }

describe('createContractMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates contract and returns contractId', async () => {
    // Mock the $transaction to execute the callback with a mock tx
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        vehicle: {
          findUnique: vi.fn().mockResolvedValue(mockVehicle),
          update: vi.fn(),
        },
        rentalContract: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({ id: 'contract-1' }),
        },
        leaseContract: {
          count: vi.fn().mockResolvedValue(0),
        },
        residualValueRate: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      }
      return cb(tx)
    })

    const result = await createContractMutation(validInput, customerUser)

    expect(result).toEqual({
      contractId: 'contract-1',
      contractType: 'RENTAL',
    })
  })

  it('rejects when vehicle is not AVAILABLE', async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        vehicle: {
          findUnique: vi.fn().mockResolvedValue({
            ...mockVehicle,
            status: 'RESERVED',
          }),
        },
      }
      return cb(tx)
    })

    const result = await createContractMutation(validInput, customerUser)

    expect(result).toEqual({ error: '이 차량은 현재 계약 신청이 불가합니다.' })
  })

  it('rejects when existing active contract exists (double-booking)', async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        vehicle: {
          findUnique: vi.fn().mockResolvedValue(mockVehicle),
          update: vi.fn(),
        },
        rentalContract: {
          count: vi.fn().mockResolvedValue(1), // existing active rental
        },
        leaseContract: {
          count: vi.fn().mockResolvedValue(0),
        },
      }
      return cb(tx)
    })

    const result = await createContractMutation(validInput, customerUser)

    expect(result).toEqual({ error: '이 차량에 대한 진행 중인 계약이 있습니다.' })
  })

  it('rejects non-customer roles', async () => {
    const result = await createContractMutation(validInput, dealerUser)

    expect(result).toEqual({ error: '고객만 계약 신청이 가능합니다.' })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('creates lease contract with residual rate from DB', async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        vehicle: {
          findUnique: vi.fn().mockResolvedValue(mockVehicle),
          update: vi.fn(),
        },
        rentalContract: {
          count: vi.fn().mockResolvedValue(0),
        },
        leaseContract: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({ id: 'lease-1' }),
        },
        residualValueRate: {
          findUnique: vi.fn().mockResolvedValue({ rate: { toNumber: () => 0.35 } }),
        },
      }
      return cb(tx)
    })

    const result = await createContractMutation(
      { ...validInput, contractType: 'LEASE' },
      customerUser
    )

    expect(result).toEqual({
      contractId: 'lease-1',
      contractType: 'LEASE',
    })
  })
})
