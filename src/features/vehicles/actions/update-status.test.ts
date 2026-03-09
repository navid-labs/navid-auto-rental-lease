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

import { updateStatus } from './update-status'

describe('updateStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows valid transition for dealer', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'AVAILABLE',
      dealerId: 'dealer-1',
    })
    mockVehicleUpdate.mockResolvedValue({ id: 'vehicle-1' })
    mockStatusLogCreate.mockResolvedValue({})

    const result = await updateStatus('vehicle-1', 'RESERVED', '고객 예약')

    expect(result).toEqual({ success: true })
    expect(mockStatusLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromStatus: 'AVAILABLE',
        toStatus: 'RESERVED',
        note: '고객 예약',
      }),
    })
  })

  it('rejects invalid transition for dealer', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'AVAILABLE',
      dealerId: 'dealer-1',
    })

    // AVAILABLE -> RENTED is not a valid direct transition for dealer
    const result = await updateStatus('vehicle-1', 'RENTED')

    expect(result).toEqual({ error: '상태를 변경할 수 없습니다.' })
  })

  it('allows admin to force any transition', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'AVAILABLE',
      dealerId: 'dealer-1',
    })
    mockVehicleUpdate.mockResolvedValue({ id: 'vehicle-1' })
    mockStatusLogCreate.mockResolvedValue({})

    const result = await updateStatus('vehicle-1', 'RENTED')

    expect(result).toEqual({ success: true })
  })

  it('rejects dealer updating other dealer vehicle status', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'AVAILABLE',
      dealerId: 'dealer-2',
    })

    const result = await updateStatus('vehicle-1', 'RESERVED')

    expect(result).toEqual({ error: '이 차량의 상태를 변경할 권한이 없습니다.' })
  })

  it('rejects same-status transition', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'AVAILABLE',
      dealerId: 'dealer-1',
    })

    const result = await updateStatus('vehicle-1', 'AVAILABLE')

    expect(result).toEqual({ error: '상태를 변경할 수 없습니다.' })
  })
})
