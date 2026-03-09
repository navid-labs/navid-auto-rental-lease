import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma, mockGetCurrentUser } = vi.hoisted(() => ({
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
  mockGetCurrentUser: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

import { approveVehicle, batchApproveVehicles } from './approve-vehicle'
import { resubmitVehicle } from './resubmit-vehicle'

describe('approveVehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('approves a PENDING vehicle and sets approvedBy/approvedAt', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      approvalStatus: 'PENDING',
    })
    const txMock = {
      vehicle: { update: vi.fn() },
      vehicleApprovalLog: { create: vi.fn() },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock))

    const result = await approveVehicle('vehicle-1', 'APPROVED')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('rejects a vehicle with a reason and sets rejectionReason', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      approvalStatus: 'PENDING',
    })
    const txMock = {
      vehicle: { update: vi.fn() },
      vehicleApprovalLog: { create: vi.fn() },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock))

    const result = await approveVehicle('vehicle-1', 'REJECTED', '사진 품질 불량')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('requires non-empty reason for rejection', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })

    const result = await approveVehicle('vehicle-1', 'REJECTED')

    expect(result).toEqual({ error: '거절 사유를 입력해주세요.' })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects empty string reason for rejection', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })

    const result = await approveVehicle('vehicle-1', 'REJECTED', '  ')

    expect(result).toEqual({ error: '거절 사유를 입력해주세요.' })
  })

  it('rejects if user is not ADMIN', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })

    const result = await approveVehicle('vehicle-1', 'APPROVED')

    expect(result).toEqual({ error: '승인 권한이 없습니다.' })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('creates VehicleApprovalLog entry', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      approvalStatus: 'PENDING',
    })

    const txMock = {
      vehicle: { update: vi.fn() },
      vehicleApprovalLog: { create: vi.fn() },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock))

    await approveVehicle('vehicle-1', 'APPROVED')

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
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mockPrisma.vehicle.findUnique.mockResolvedValue(null)

    const result = await approveVehicle('nonexistent', 'APPROVED')

    expect(result).toEqual({ error: '차량을 찾을 수 없습니다.' })
  })
})

describe('batchApproveVehicles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('approves multiple PENDING vehicles atomically', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })

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

    const result = await batchApproveVehicles(['v1', 'v2', 'v3'])

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
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })

    const result = await batchApproveVehicles(['v1'])

    expect(result).toEqual({ error: '승인 권한이 없습니다.' })
  })
})

describe('resubmitVehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets REJECTED vehicle back to PENDING and clears rejectionReason', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
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

    const result = await resubmitVehicle('vehicle-1')

    expect(result).toEqual({ success: true })
    expect(txMock.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: expect.objectContaining({
        approvalStatus: 'PENDING',
        rejectionReason: null,
      }),
    })
  })

  it('rejects if user is not DEALER', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'customer-1', role: 'CUSTOMER' })

    const result = await resubmitVehicle('vehicle-1')

    expect(result).toEqual({ error: '재승인 요청 권한이 없습니다.' })
  })

  it('rejects if dealer is not the vehicle owner', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
      approvalStatus: 'REJECTED',
    })

    const result = await resubmitVehicle('vehicle-1')

    expect(result).toEqual({ error: '이 차량의 재승인을 요청할 권한이 없습니다.' })
  })

  it('rejects if vehicle is not REJECTED', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-1',
      approvalStatus: 'APPROVED',
    })

    const result = await resubmitVehicle('vehicle-1')

    expect(result).toEqual({ error: '거절된 차량만 재승인을 요청할 수 있습니다.' })
  })
})
