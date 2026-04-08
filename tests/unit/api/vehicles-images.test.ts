import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MOCK_DEALER,
  MOCK_CUSTOMER,
  getResponseJson,
} from '../../helpers/api-test-utils'

// ── Mocks ─────────────────────────────────────────────────────────

const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}))
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    vehicleImage: {
      findMany: mockFindMany,
    },
  },
}))

const { mockUploadImageMutation } = vi.hoisted(() => ({
  mockUploadImageMutation: vi.fn(),
}))
vi.mock('@/features/vehicles/mutations/images', () => ({
  uploadImageMutation: mockUploadImageMutation,
}))

// ── Import ────────────────────────────────────────────────────────

import { GET, POST } from '@/app/api/vehicles/[id]/images/route'

const makeParams = () => ({ params: Promise.resolve({ id: 'vehicle-uuid' }) })

// ── GET /api/vehicles/[id]/images ─────────────────────────────────

describe('GET /api/vehicles/[id]/images', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns images array for vehicle', async () => {
    const mockImages = [
      { id: 'img1', url: '/img1.jpg', order: 0 },
      { id: 'img2', url: '/img2.jpg', order: 1 },
    ]
    mockFindMany.mockResolvedValue(mockImages)

    const req = new Request('http://localhost/api/vehicles/1/images')
    const res = await GET(req, makeParams())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ images: mockImages })
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { vehicleId: 'vehicle-uuid' },
      orderBy: { order: 'asc' },
      select: { id: true, url: true, order: true },
    })
  })
})

// ── POST /api/vehicles/[id]/images ────────────────────────────────

describe('POST /api/vehicles/[id]/images', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const formData = new FormData()
    formData.append('file', new Blob(['test']), 'test.jpg')
    const req = new Request('http://localhost/test', { method: 'POST', body: formData })
    const res = await POST(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 for customer', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    const formData = new FormData()
    formData.append('file', new Blob(['test']), 'test.jpg')
    const req = new Request('http://localhost/test', { method: 'POST', body: formData })
    const res = await POST(req, makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 201 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockUploadImageMutation.mockResolvedValue({ id: 'img-new', url: '/img-new.jpg' })
    const formData = new FormData()
    formData.append('file', new Blob(['test']), 'test.jpg')
    const req = new Request('http://localhost/test', { method: 'POST', body: formData })
    const res = await POST(req, makeParams())
    expect(res.status).toBe(201)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { id: 'img-new', url: '/img-new.jpg' } })
  })

  it('returns 400 on mutation error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockUploadImageMutation.mockResolvedValue({ error: 'File too large' })
    const formData = new FormData()
    formData.append('file', new Blob(['test']), 'test.jpg')
    const req = new Request('http://localhost/test', { method: 'POST', body: formData })
    const res = await POST(req, makeParams())
    expect(res.status).toBe(400)
  })
})
