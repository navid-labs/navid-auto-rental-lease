import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MOCK_DEALER,
  MOCK_CUSTOMER,
  createJsonRequest,
  getResponseJson,
} from '../../helpers/api-test-utils'

// ── Mocks ─────────────────────────────────────────────────────────

const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

const { mockSearchVehicles } = vi.hoisted(() => ({
  mockSearchVehicles: vi.fn(),
}))
vi.mock('@/features/vehicles/queries/search', () => ({
  searchVehicles: mockSearchVehicles,
}))

const { mockCreateVehicleMutation } = vi.hoisted(() => ({
  mockCreateVehicleMutation: vi.fn(),
}))
vi.mock('@/features/vehicles/mutations/create', () => ({
  createVehicleMutation: mockCreateVehicleMutation,
}))

// ── Import ────────────────────────────────────────────────────────

import { POST } from '@/app/api/vehicles/route'

// ── Tests ─────────────────────────────────────────────────────────

describe('POST /api/vehicles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = createJsonRequest('POST', 'http://localhost/api/vehicles', { name: 'Car' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for customer role', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    const req = createJsonRequest('POST', 'http://localhost/api/vehicles', { name: 'Car' })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 201 on successful creation', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockCreateVehicleMutation.mockResolvedValue({ id: 'new-v', name: 'Sonata' })
    const req = createJsonRequest('POST', 'http://localhost/api/vehicles', { name: 'Sonata', trimId: 't1' })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { id: 'new-v', name: 'Sonata' } })
  })

  it('returns 400 when mutation returns error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockCreateVehicleMutation.mockResolvedValue({ error: 'Invalid trim' })
    const req = createJsonRequest('POST', 'http://localhost/api/vehicles', { name: 'Car' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 when mutation throws', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockCreateVehicleMutation.mockRejectedValue(new Error('DB error'))
    const req = createJsonRequest('POST', 'http://localhost/api/vehicles', { name: 'Car' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
