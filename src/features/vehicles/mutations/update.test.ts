import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    vehicle: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    vehicleApprovalLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

import type { UserProfile } from '@/lib/auth/helpers'
import { updateVehicleMutation } from './update'

const base = { phone: null, avatar_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
const dealerUser: UserProfile = { ...base, id: 'dealer-1', role: 'DEALER', email: 'dealer@test.com', name: 'Dealer' }
const adminUser: UserProfile = { ...base, id: 'admin-1', role: 'ADMIN', email: 'admin@test.com', name: 'Admin' }

describe('updateVehicleMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows dealer to update own vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      approvalStatus: 'PENDING',
    })
    mockPrisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' })

    const result = await updateVehicleMutation('vehicle-1', { color: '검정색' }, dealerUser)

    expect(result).toEqual({ success: true })
  })

  it('rejects dealer updating other dealer vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      approvalStatus: 'PENDING',
    })

    const result = await updateVehicleMutation('vehicle-1', { color: '검정색' }, dealerUser)

    expect(result).toEqual({ error: '이 차량을 수정할 권한이 없습니다.' })
    expect(mockPrisma.vehicle.update).not.toHaveBeenCalled()
  })

  it('allows admin to update any vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      approvalStatus: 'APPROVED',
    })
    mockPrisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' })

    const result = await updateVehicleMutation('vehicle-1', { color: '검정색' }, adminUser)

    expect(result).toEqual({ success: true })
  })

  it('returns error for non-existent vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(null)

    const result = await updateVehicleMutation('nonexistent', { color: '검정색' }, dealerUser)

    expect(result).toEqual({ error: '차량을 찾을 수 없습니다.' })
  })

  it('resets approval to PENDING when dealer edits an APPROVED vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      approvalStatus: 'APPROVED',
    })

    const txMock = {
      vehicle: { update: vi.fn() },
      vehicleApprovalLog: { create: vi.fn() },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock))

    const result = await updateVehicleMutation('vehicle-1', { color: '검정색' }, dealerUser)

    expect(result).toEqual({ success: true })
    expect(txMock.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: expect.objectContaining({
        color: '검정색',
        approvalStatus: 'PENDING',
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
      }),
    })
    expect(txMock.vehicleApprovalLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        vehicleId: 'vehicle-1',
        fromStatus: 'APPROVED',
        toStatus: 'PENDING',
        changedBy: 'dealer-1',
      }),
    })
  })

  it('does NOT reset approval when admin edits a vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      approvalStatus: 'APPROVED',
    })
    mockPrisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' })

    const result = await updateVehicleMutation('vehicle-1', { color: '검정색' }, adminUser)

    expect(result).toEqual({ success: true })
    // Should use simple update, not transaction
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: { color: '검정색' },
    })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('does NOT reset approval when dealer edits a PENDING vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      approvalStatus: 'PENDING',
    })
    mockPrisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' })

    const result = await updateVehicleMutation('vehicle-1', { color: '검정색' }, dealerUser)

    expect(result).toEqual({ success: true })
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: { color: '검정색' },
    })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })
})
