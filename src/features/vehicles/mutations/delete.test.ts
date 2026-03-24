import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockVehicleUpdate, mockStatusLogCreate, mockPrisma } = vi.hoisted(() => {
  const mockVehicleUpdate = vi.fn()
  const mockStatusLogCreate = vi.fn()
  return {
    mockVehicleUpdate,
    mockStatusLogCreate,
    mockPrisma: {
      vehicle: {
        findUnique: vi.fn(),
        update: mockVehicleUpdate,
      },
      vehicleStatusLog: {
        create: mockStatusLogCreate,
      },
      $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          vehicle: { update: mockVehicleUpdate },
          vehicleStatusLog: { create: mockStatusLogCreate },
        })
      ),
    },
  }
})

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

import type { UserProfile } from '@/lib/auth/helpers'
import { deleteVehicleMutation } from './delete'

const base = { phone: null, avatar_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
const dealerUser: UserProfile = { ...base, id: 'dealer-1', role: 'DEALER', email: 'dealer@test.com', name: 'Dealer' }
const adminUser: UserProfile = { ...base, id: 'admin-1', role: 'ADMIN', email: 'admin@test.com', name: 'Admin' }

describe('deleteVehicleMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('soft deletes by setting HIDDEN status', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      status: 'AVAILABLE',
    })
    mockVehicleUpdate.mockResolvedValue({ id: 'vehicle-1' })
    mockStatusLogCreate.mockResolvedValue({})

    const result = await deleteVehicleMutation('vehicle-1', dealerUser)

    expect(result).toEqual({ success: true })
  })

  it('rejects dealer deleting other dealer vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      status: 'AVAILABLE',
    })

    const result = await deleteVehicleMutation('vehicle-1', dealerUser)

    expect(result).toEqual({ error: '이 차량을 삭제할 권한이 없습니다.' })
  })

  it('allows admin to delete any vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      status: 'AVAILABLE',
    })
    mockVehicleUpdate.mockResolvedValue({ id: 'vehicle-1' })
    mockStatusLogCreate.mockResolvedValue({})

    const result = await deleteVehicleMutation('vehicle-1', adminUser)

    expect(result).toEqual({ success: true })
  })

  it('creates VehicleStatusLog entry', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      status: 'AVAILABLE',
    })
    mockVehicleUpdate.mockResolvedValue({ id: 'vehicle-1' })
    mockStatusLogCreate.mockResolvedValue({})

    await deleteVehicleMutation('vehicle-1', dealerUser)

    expect(mockStatusLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        vehicleId: 'vehicle-1',
        fromStatus: 'AVAILABLE',
        toStatus: 'HIDDEN',
        changedBy: 'dealer-1',
      }),
    })
  })
})
