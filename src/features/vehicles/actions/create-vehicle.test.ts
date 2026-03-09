import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma, mockGetCurrentUser } = vi.hoisted(() => ({
  mockPrisma: {
    vehicle: {
      create: vi.fn(),
    },
  },
  mockGetCurrentUser: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

import { createVehicle } from './create-vehicle'

const validFormData = {
  brandId: '11111111-1111-4111-a111-111111111111',
  modelId: '22222222-2222-4222-a222-222222222222',
  generationId: '33333333-3333-4333-a333-333333333333',
  trimId: '44444444-4444-4444-a444-444444444444',
  year: 2023,
  mileage: 15000,
  color: '흰색',
  price: 25000000,
}

describe('createVehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates vehicle with dealerId set to current user for dealer', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'dealer-1',
      role: 'DEALER',
      email: 'dealer@test.com',
      name: 'Test Dealer',
    })
    mockPrisma.vehicle.create.mockResolvedValue({ id: 'vehicle-1' })

    const result = await createVehicle(validFormData)

    expect(result).toEqual({ success: true, vehicleId: 'vehicle-1' })
    expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dealerId: 'dealer-1',
        trimId: validFormData.trimId,
        year: 2023,
      }),
    })
  })

  it('creates vehicle as admin with optional dealerId', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      email: 'admin@test.com',
      name: 'Admin',
    })
    mockPrisma.vehicle.create.mockResolvedValue({ id: 'vehicle-2' })

    const result = await createVehicle(validFormData, 'other-dealer-id')

    expect(result).toEqual({ success: true, vehicleId: 'vehicle-2' })
    expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dealerId: 'other-dealer-id',
      }),
    })
  })

  it('defaults dealerId to admin id when not specified', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      email: 'admin@test.com',
      name: 'Admin',
    })
    mockPrisma.vehicle.create.mockResolvedValue({ id: 'vehicle-3' })

    const result = await createVehicle(validFormData)

    expect(result).toEqual({ success: true, vehicleId: 'vehicle-3' })
    expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dealerId: 'admin-1',
      }),
    })
  })

  it('rejects unauthenticated users', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await createVehicle(validFormData)

    expect(result).toEqual({ error: '로그인이 필요합니다.' })
    expect(mockPrisma.vehicle.create).not.toHaveBeenCalled()
  })

  it('rejects customers', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'customer-1',
      role: 'CUSTOMER',
      email: 'customer@test.com',
      name: 'Customer',
    })

    const result = await createVehicle(validFormData)

    expect(result).toEqual({ error: '차량 등록 권한이 없습니다.' })
    expect(mockPrisma.vehicle.create).not.toHaveBeenCalled()
  })

  it('rejects invalid form data', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'dealer-1',
      role: 'DEALER',
      email: 'dealer@test.com',
      name: 'Test Dealer',
    })

    const result = await createVehicle({ ...validFormData, price: -100 })

    expect(result).toEqual({ error: expect.stringContaining('가격') })
    expect(mockPrisma.vehicle.create).not.toHaveBeenCalled()
  })
})
