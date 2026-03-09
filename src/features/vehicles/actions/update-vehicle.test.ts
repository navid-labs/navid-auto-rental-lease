import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma, mockGetCurrentUser } = vi.hoisted(() => ({
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
  mockGetCurrentUser: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

import { updateVehicle } from './update-vehicle'

describe('updateVehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows dealer to update own vehicle', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      approvalStatus: 'PENDING',
    })
    mockPrisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' })

    const result = await updateVehicle('vehicle-1', { color: '검정색' })

    expect(result).toEqual({ success: true })
  })

  it('rejects dealer updating other dealer vehicle', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      approvalStatus: 'PENDING',
    })

    const result = await updateVehicle('vehicle-1', { color: '검정색' })

    expect(result).toEqual({ error: '이 차량을 수정할 권한이 없습니다.' })
    expect(mockPrisma.vehicle.update).not.toHaveBeenCalled()
  })

  it('allows admin to update any vehicle', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      approvalStatus: 'APPROVED',
    })
    mockPrisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' })

    const result = await updateVehicle('vehicle-1', { color: '검정색' })

    expect(result).toEqual({ success: true })
  })

  it('returns error for non-existent vehicle', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue(null)

    const result = await updateVehicle('nonexistent', { color: '검정색' })

    expect(result).toEqual({ error: '차량을 찾을 수 없습니다.' })
  })

  it('rejects unauthenticated users', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await updateVehicle('vehicle-1', { color: '검정색' })

    expect(result).toEqual({ error: '로그인이 필요합니다.' })
  })

  it('resets approval to PENDING when dealer edits an APPROVED vehicle', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      approvalStatus: 'APPROVED',
    })

    const txMock = {
      vehicle: { update: vi.fn() },
      vehicleApprovalLog: { create: vi.fn() },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(txMock))

    const result = await updateVehicle('vehicle-1', { color: '검정색' })

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
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      approvalStatus: 'APPROVED',
    })
    mockPrisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' })

    const result = await updateVehicle('vehicle-1', { color: '검정색' })

    expect(result).toEqual({ success: true })
    // Should use simple update, not transaction
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: { color: '검정색' },
    })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('does NOT reset approval when dealer edits a PENDING vehicle', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      approvalStatus: 'PENDING',
    })
    mockPrisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' })

    const result = await updateVehicle('vehicle-1', { color: '검정색' })

    expect(result).toEqual({ success: true })
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: { color: '검정색' },
    })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })
})
