import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma, mockGetCurrentUser } = vi.hoisted(() => ({
  mockPrisma: {
    vehicle: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
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
    })
    mockPrisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' })

    const result = await updateVehicle('vehicle-1', { color: '검정색' })

    expect(result).toEqual({ success: true })
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: expect.objectContaining({ color: '검정색' }),
    })
  })

  it('rejects dealer updating other dealer vehicle', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      dealerId: 'dealer-2',
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
    })
    mockPrisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' })

    const result = await updateVehicle('vehicle-1', { color: '검정색' })

    expect(result).toEqual({ success: true })
    expect(mockPrisma.vehicle.update).toHaveBeenCalled()
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
})
