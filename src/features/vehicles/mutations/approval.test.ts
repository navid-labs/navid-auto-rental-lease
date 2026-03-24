import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    vehicle: {
      findUnique: vi.fn(),
    },
    vehicleApprovalLog: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

import type { UserProfile } from '@/lib/auth/helpers'
import { approveVehicleMutation, batchApproveVehiclesMutation } from './approval'
import { resubmitVehicleMutation } from './misc'

const base = { phone: null, avatar_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
const adminUser: UserProfile = { ...base, id: 'admin-1', role: 'ADMIN', email: 'admin@test.com', name: 'Admin' }
const dealerUser: UserProfile = { ...base, id: 'dealer-1', role: 'DEALER', email: 'dealer@test.com', name: 'Dealer' }

describe('approveVehicleMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('approves a PENDING vehicle and sets approvedBy/approvedAt', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      approvalStatus: 'PENDING',
    })
    const txMock = {
      vehicle: { update: vi.fn() },
      vehicleApprovalLog: { create: vi.fn() },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock))

    const result = await approveVehicleMutation('vehicle-1', 'APPROVED', undefined, adminUser)

    expect(result).toEqual({ success: true })
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('rejects a vehicle with a reason and sets rejectionReason', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      approvalStatus: 'PENDING',
    })
    const txMock = {
      vehicle: { update: vi.fn() },
      vehicleApprovalLog: { create: vi.fn() },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock))

    const result = await approveVehicleMutation('vehicle-1', 'REJECTED', '사진 품질 불량', adminUser)

    expect(result).toEqual({ success: true })
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('requires non-empty reason for rejection', async () => {
    const result = await approveVehicleMutation('vehicle-1', 'REJECTED', undefined, adminUser)

    expect(result).toEqual({ error: '거절 사유를 입력해주세요.' })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects empty string reason for rejection', async () => {
    const result = await approveVehicleMutation('vehicle-1', 'REJECTED', '  ', adminUser)

    expect(result).toEqual({ error: '거절 사유를 입력해주세요.' })
  })

  it('rejects if user is not ADMIN', async () => {
    const result = await approveVehicleMutation('vehicle-1', 'APPROVED', undefined, dealerUser)

    expect(result).toEqual({ error: '승인 권한이 없습니다.' })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('creates VehicleApprovalLog entry', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      approvalStatus: 'PENDING',
    })

    const txMock = {
      vehicle: { update: vi.fn() },
      vehicleApprovalLog: { create: vi.fn() },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock))

    await approveVehicleMutation('vehicle-1', 'APPROVED', undefined, adminUser)

    expect(txMock.vehicleApprovalLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        vehicleId: 'vehicle-1',
        fromStatus: 'PENDING',
        toStatus: 'APPROVED',
        changedBy: 'admin-1',
      }),
    })
  })

  it('returns error for non-existent vehicle', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(null)

    const result = await approveVehicleMutation('nonexistent', 'APPROVED', undefined, adminUser)

    expect(result).toEqual({ error: '차량을 찾을 수 없습니다.' })
  })
})

describe('batchApproveVehiclesMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('approves multiple PENDING vehicles atomically', async () => {
    const txMock = {
      vehicle: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'v1', approvalStatus: 'PENDING' },
          { id: 'v2', approvalStatus: 'PENDING' },
        ]),
        updateMany: vi.fn(),
      },
      vehicleApprovalLog: { createMany: vi.fn() },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock))

    const result = await batchApproveVehiclesMutation(['v1', 'v2', 'v3'], adminUser)

    expect(result).toEqual({ success: true })
    // Should only update PENDING vehicles (v1, v2), skipping v3 (not found/not PENDING)
    expect(txMock.vehicle.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['v1', 'v2'] } },
      })
    )
    expect(txMock.vehicleApprovalLog.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ vehicleId: 'v1', toStatus: 'APPROVED' }),
        expect.objectContaining({ vehicleId: 'v2', toStatus: 'APPROVED' }),
      ]),
    })
  })

  it('rejects if user is not ADMIN', async () => {
    const result = await batchApproveVehiclesMutation(['v1'], dealerUser)

    expect(result).toEqual({ error: '승인 권한이 없습니다.' })
  })
})

describe('resubmitVehicleMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets REJECTED vehicle back to PENDING and clears rejectionReason', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      approvalStatus: 'REJECTED',
      rejectionReason: '사진 품질 불량',
    })

    const txMock = {
      vehicle: { update: vi.fn() },
      vehicleApprovalLog: { create: vi.fn() },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock))

    const result = await resubmitVehicleMutation('vehicle-1', dealerUser)

    expect(result).toEqual({ success: true })
    expect(txMock.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: expect.objectContaining({
        approvalStatus: 'PENDING',
        rejectionReason: null,
      }),
    })
  })

  it('rejects if user is not DEALER or ADMIN', async () => {
    const customerUser: UserProfile = { ...base, id: 'customer-1', role: 'CUSTOMER', email: 'c@test.com', name: 'C' }

    const result = await resubmitVehicleMutation('vehicle-1', customerUser)

    expect(result).toEqual({ error: '재승인 요청 권한이 없습니다.' })
  })

  it('rejects if dealer is not the vehicle owner', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      approvalStatus: 'REJECTED',
    })

    const result = await resubmitVehicleMutation('vehicle-1', dealerUser)

    expect(result).toEqual({ error: '이 차량의 재승인을 요청할 권한이 없습니다.' })
  })

  it('rejects if vehicle is not REJECTED', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      approvalStatus: 'APPROVED',
    })

    const result = await resubmitVehicleMutation('vehicle-1', dealerUser)

    expect(result).toEqual({ error: '거절된 차량만 재승인을 요청할 수 있습니다.' })
  })
})
