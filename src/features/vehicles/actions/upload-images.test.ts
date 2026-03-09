import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma, mockGetCurrentUser, mockStorageUpload, mockStorageRemove, mockGetPublicUrl } = vi.hoisted(() => {
  const mockGetPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: 'https://storage.test/vehicle-images/vehicles/v1/123.webp' },
  })
  const mockStorageUpload = vi.fn().mockResolvedValue({ error: null })
  const mockStorageRemove = vi.fn().mockResolvedValue({ error: null })

  return {
    mockPrisma: {
      vehicleImage: {
        count: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      vehicle: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    },
    mockGetCurrentUser: vi.fn(),
    mockStorageUpload,
    mockStorageRemove,
    mockGetPublicUrl,
  }
})

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload: mockStorageUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockStorageRemove,
      }),
    },
  }),
}))

import { uploadVehicleImage } from './upload-images'
import { deleteVehicleImage } from './delete-image'
import { reorderVehicleImages } from './reorder-images'

function createMockFormData(filename = 'photo.jpg', type = 'image/jpeg', size = 1024) {
  const file = new File(['x'.repeat(size)], filename, { type })
  const fd = new FormData()
  fd.set('file', file)
  return fd
}

describe('uploadVehicleImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated users', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await uploadVehicleImage('v1', createMockFormData())

    expect(result).toEqual({ error: expect.stringContaining('로그인') })
  })

  it('rejects CUSTOMER role', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'customer-1',
      role: 'CUSTOMER',
    })

    const result = await uploadVehicleImage('v1', createMockFormData())

    expect(result).toEqual({ error: expect.stringContaining('권한') })
  })

  it('rejects dealer uploading to another dealers vehicle', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({ dealerId: 'dealer-2' })

    const result = await uploadVehicleImage('v1', createMockFormData())

    expect(result).toEqual({ error: expect.stringContaining('본인') })
  })

  it('rejects when vehicle already has 10 images', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({ dealerId: 'dealer-1' })
    mockPrisma.vehicleImage.count.mockResolvedValue(10)

    const result = await uploadVehicleImage('v1', createMockFormData())

    expect(result).toEqual({ error: expect.stringContaining('10') })
  })

  it('successfully uploads and creates VehicleImage record', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({ dealerId: 'dealer-1' })
    mockPrisma.vehicleImage.count.mockResolvedValue(0)
    mockPrisma.vehicleImage.create.mockResolvedValue({
      id: 'img-1',
      url: 'https://storage.test/vehicle-images/vehicles/v1/123.webp',
      order: 0,
    })

    const result = await uploadVehicleImage('v1', createMockFormData())

    expect(result).toEqual({
      success: true,
      image: { id: 'img-1', url: expect.stringContaining('storage.test'), order: 0 },
    })
    expect(mockStorageUpload).toHaveBeenCalled()
    expect(mockPrisma.vehicleImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        vehicleId: 'v1',
        isPrimary: true,
        order: 0,
      }),
    })
  })

  it('sets isPrimary false for non-first images', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mockPrisma.vehicleImage.count.mockResolvedValue(3)
    mockPrisma.vehicleImage.create.mockResolvedValue({
      id: 'img-4',
      url: 'https://storage.test/vehicle-images/vehicles/v1/456.webp',
      order: 3,
    })

    const result = await uploadVehicleImage('v1', createMockFormData())

    expect(result).toHaveProperty('success', true)
    expect(mockPrisma.vehicleImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isPrimary: false,
        order: 3,
      }),
    })
  })
})

describe('deleteVehicleImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated users', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await deleteVehicleImage('img-1')

    expect(result).toEqual({ error: expect.stringContaining('로그인') })
  })

  it('rejects dealer deleting other dealers image', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicleImage.findUnique.mockResolvedValue({
      id: 'img-1',
      url: 'https://storage.test/vehicle-images/vehicles/v1/123.webp',
      isPrimary: false,
      vehicle: { dealerId: 'dealer-2' },
    })

    const result = await deleteVehicleImage('img-1')

    expect(result).toEqual({ error: expect.stringContaining('본인') })
  })

  it('deletes image and promotes next to primary if needed', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicleImage.findUnique.mockResolvedValue({
      id: 'img-1',
      vehicleId: 'v1',
      url: 'https://storage.test/vehicle-images/vehicles/v1/123.webp',
      isPrimary: true,
      vehicle: { dealerId: 'dealer-1' },
    })
    mockPrisma.vehicleImage.delete.mockResolvedValue({})
    mockPrisma.vehicleImage.findFirst.mockResolvedValue({ id: 'img-2' })
    mockPrisma.vehicleImage.update.mockResolvedValue({})

    const result = await deleteVehicleImage('img-1')

    expect(result).toEqual({ success: true })
    expect(mockStorageRemove).toHaveBeenCalled()
    expect(mockPrisma.vehicleImage.delete).toHaveBeenCalledWith({ where: { id: 'img-1' } })
    expect(mockPrisma.vehicleImage.update).toHaveBeenCalledWith({
      where: { id: 'img-2' },
      data: { isPrimary: true },
    })
  })
})

describe('reorderVehicleImages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated users', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await reorderVehicleImages('v1', ['img-1', 'img-2'])

    expect(result).toEqual({ error: expect.stringContaining('로그인') })
  })

  it('updates order and isPrimary via transaction', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'dealer-1', role: 'DEALER' })
    mockPrisma.vehicle.findUnique.mockResolvedValue({ dealerId: 'dealer-1' })
    mockPrisma.$transaction.mockResolvedValue([])

    const result = await reorderVehicleImages('v1', ['img-2', 'img-1', 'img-3'])

    expect(result).toEqual({ success: true })
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.anything(), // update for img-2 (order 0, isPrimary true)
        expect.anything(), // update for img-1 (order 1, isPrimary false)
        expect.anything(), // update for img-3 (order 2, isPrimary false)
      ])
    )
  })
})
