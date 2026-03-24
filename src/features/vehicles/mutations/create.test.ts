import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    vehicle: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

import type { UserProfile } from '@/lib/auth/helpers'
import { createVehicleMutation } from './create'

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

const base = { phone: null, avatar_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }

const dealerUser: UserProfile = { ...base, id: 'dealer-1', role: 'DEALER', email: 'dealer@test.com', name: 'Test Dealer' }
const adminUser: UserProfile = { ...base, id: 'admin-1', role: 'ADMIN', email: 'admin@test.com', name: 'Admin' }
const customerUser: UserProfile = { ...base, id: 'customer-1', role: 'CUSTOMER', email: 'customer@test.com', name: 'Customer' }

describe('createVehicleMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates vehicle with dealerId set to current user for dealer', async () => {
    mockPrisma.vehicle.create.mockResolvedValue({ id: 'vehicle-1' })

    const result = await createVehicleMutation(validFormData, dealerUser)

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
    mockPrisma.vehicle.create.mockResolvedValue({ id: 'vehicle-2' })

    const result = await createVehicleMutation(validFormData, adminUser, 'other-dealer-id')

    expect(result).toEqual({ success: true, vehicleId: 'vehicle-2' })
    expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dealerId: 'other-dealer-id',
      }),
    })
  })

  it('defaults dealerId to admin id when not specified', async () => {
    mockPrisma.vehicle.create.mockResolvedValue({ id: 'vehicle-3' })

    const result = await createVehicleMutation(validFormData, adminUser)

    expect(result).toEqual({ success: true, vehicleId: 'vehicle-3' })
    expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dealerId: 'admin-1',
      }),
    })
  })

  it('rejects customers', async () => {
    const result = await createVehicleMutation(validFormData, customerUser)

    expect(result).toEqual({ error: '차량 등록 권한이 없습니다.' })
    expect(mockPrisma.vehicle.create).not.toHaveBeenCalled()
  })

  it('sets approvalStatus to APPROVED when admin creates vehicle', async () => {
    mockPrisma.vehicle.create.mockResolvedValue({ id: 'vehicle-4' })

    await createVehicleMutation(validFormData, adminUser)

    expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        approvalStatus: 'APPROVED',
        approvedBy: 'admin-1',
      }),
    })
    // approvedAt should be a Date
    const callData = mockPrisma.vehicle.create.mock.calls[0][0].data
    expect(callData.approvedAt).toBeInstanceOf(Date)
  })

  it('sets approvalStatus to PENDING when dealer creates vehicle', async () => {
    mockPrisma.vehicle.create.mockResolvedValue({ id: 'vehicle-5' })

    await createVehicleMutation(validFormData, dealerUser)

    expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        approvalStatus: 'PENDING',
        approvedBy: null,
        approvedAt: null,
      }),
    })
  })

  it('rejects invalid form data', async () => {
    const result = await createVehicleMutation({ ...validFormData, price: -100 }, dealerUser)

    expect(result).toEqual({ error: expect.stringContaining('가격') })
    expect(mockPrisma.vehicle.create).not.toHaveBeenCalled()
  })
})
