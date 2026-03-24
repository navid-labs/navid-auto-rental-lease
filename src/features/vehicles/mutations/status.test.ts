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
import { updateVehicleStatusMutation } from './status'

const base = { phone: null, avatar_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
const dealerUser: UserProfile = { ...base, id: 'dealer-1', role: 'DEALER', email: 'dealer@test.com', name: 'Dealer' }
const adminUser: UserProfile = { ...base, id: 'admin-1', role: 'ADMIN', email: 'admin@test.com', name: 'Admin' }

describe('updateVehicleStatusMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows valid transition for dealer', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'AVAILABLE',
      dealerId: 'dealer-1',
    })
    mockVehicleUpdate.mockResolvedValue({ id: 'vehicle-1' })
    mockStatusLogCreate.mockResolvedValue({})

    const result = await updateVehicleStatusMutation('vehicle-1', 'RESERVED', '고객 예약', dealerUser)

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
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'AVAILABLE',
      dealerId: 'dealer-1',
    })

    // AVAILABLE -> RENTED is not a valid direct transition for dealer
    const result = await updateVehicleStatusMutation('vehicle-1', 'RENTED', undefined, dealerUser)

    expect(result).toEqual({ error: '상태를 변경할 수 없습니다.' })
  })

  it('allows admin to force any transition', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'AVAILABLE',
      dealerId: 'dealer-1',
    })
    mockVehicleUpdate.mockResolvedValue({ id: 'vehicle-1' })
    mockStatusLogCreate.mockResolvedValue({})

    const result = await updateVehicleStatusMutation('vehicle-1', 'RENTED', undefined, adminUser)

    expect(result).toEqual({ success: true })
  })

  it('rejects dealer updating other dealer vehicle status', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'AVAILABLE',
      dealerId: 'dealer-2',
    })

    const result = await updateVehicleStatusMutation('vehicle-1', 'RESERVED', undefined, dealerUser)

    expect(result).toEqual({ error: '이 차량의 상태를 변경할 권한이 없습니다.' })
  })

  it('rejects same-status transition', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'AVAILABLE',
      dealerId: 'dealer-1',
    })

    const result = await updateVehicleStatusMutation('vehicle-1', 'AVAILABLE', undefined, adminUser)

    expect(result).toEqual({ error: '상태를 변경할 수 없습니다.' })
  })
})
