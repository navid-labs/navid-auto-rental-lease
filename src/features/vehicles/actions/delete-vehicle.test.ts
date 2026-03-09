import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockVehicleUpdate, mockStatusLogCreate, mockPrisma, mockGetCurrentUser } = vi.hoisted(() => {
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
    mockGetCurrentUser: vi.fn(),
  }
})

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

import { deleteVehicle } from './delete-vehicle'

describe('deleteVehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('soft deletes by setting HIDDEN status', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      status: 'AVAILABLE',
    })
    mockVehicleUpdate.mockResolvedValue({ id: 'vehicle-1' })
    mockStatusLogCreate.mockResolvedValue({})

    const result = await deleteVehicle('vehicle-1')

    expect(result).toEqual({ success: true })
  })

  it('rejects dealer deleting other dealer vehicle', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      status: 'AVAILABLE',
    })

    const result = await deleteVehicle('vehicle-1')

    expect(result).toEqual({ error: '이 차량을 삭제할 권한이 없습니다.' })
  })

  it('allows admin to delete any vehicle', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      status: 'AVAILABLE',
    })
    mockVehicleUpdate.mockResolvedValue({ id: 'vehicle-1' })
    mockStatusLogCreate.mockResolvedValue({})

    const result = await deleteVehicle('vehicle-1')

    expect(result).toEqual({ success: true })
  })

  it('creates VehicleStatusLog entry', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      status: 'AVAILABLE',
    })
    mockVehicleUpdate.mockResolvedValue({ id: 'vehicle-1' })
    mockStatusLogCreate.mockResolvedValue({})

    await deleteVehicle('vehicle-1')

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
