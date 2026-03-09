import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    vehicle: {
      findFirst: vi.fn(),
    },
    inquiry: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

import { createInquiry } from './create-inquiry'

const validData = {
  vehicleId: '11111111-1111-4111-a111-111111111111',
  name: '홍길동',
  phone: '010-1234-5678',
  message: '이 차량에 대해 상담 받고 싶습니다. 연락 부탁드립니다.',
}

describe('createInquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for non-existent vehicle', async () => {
    mockPrisma.vehicle.findFirst.mockResolvedValue(null)

    const result = await createInquiry(validData)

    expect(result).toEqual({ error: expect.stringContaining('찾을 수 없') })
    expect(mockPrisma.inquiry.create).not.toHaveBeenCalled()
  })

  it('creates inquiry with valid data', async () => {
    mockPrisma.vehicle.findFirst.mockResolvedValue({ id: validData.vehicleId })
    mockPrisma.inquiry.create.mockResolvedValue({ id: 'inquiry-1' })

    const result = await createInquiry(validData)

    expect(result).toEqual({ success: true })
    expect(mockPrisma.inquiry.create).toHaveBeenCalledWith({
      data: {
        vehicleId: validData.vehicleId,
        name: validData.name,
        phone: validData.phone,
        message: validData.message,
        status: 'NEW',
      },
    })
  })

  it('rejects invalid phone number', async () => {
    await expect(
      createInquiry({ ...validData, phone: '123-456' })
    ).rejects.toThrow()
  })

  it('rejects short name', async () => {
    await expect(
      createInquiry({ ...validData, name: '홍' })
    ).rejects.toThrow()
  })

  it('rejects short message', async () => {
    await expect(
      createInquiry({ ...validData, message: '짧은' })
    ).rejects.toThrow()
  })

  it('accepts phone without dashes', async () => {
    mockPrisma.vehicle.findFirst.mockResolvedValue({ id: validData.vehicleId })
    mockPrisma.inquiry.create.mockResolvedValue({ id: 'inquiry-2' })

    const result = await createInquiry({ ...validData, phone: '01012345678' })

    expect(result).toEqual({ success: true })
  })
})
