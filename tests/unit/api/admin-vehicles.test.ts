import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MOCK_ADMIN,
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

const { mockUpdateVehicleAdminMutation, mockSoftDeleteVehicleMutation } = vi.hoisted(() => ({
  mockUpdateVehicleAdminMutation: vi.fn(),
  mockSoftDeleteVehicleMutation: vi.fn(),
}))
vi.mock('@/features/admin/mutations/vehicles', () => ({
  updateVehicleAdminMutation: mockUpdateVehicleAdminMutation,
  softDeleteVehicleMutation: mockSoftDeleteVehicleMutation,
}))

// ── Import ────────────────────────────────────────────────────────

import { PATCH, DELETE } from '@/app/api/admin/vehicles/[id]/route'

const makeParams = () => ({ params: Promise.resolve({ id: 'v-uuid' }) })

// ── Tests ─────────────────────────────────────────────────────────

describe('PATCH /api/admin/vehicles/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = createJsonRequest('PATCH', 'http://localhost/api/admin/vehicles/1', { name: 'X' })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    const req = createJsonRequest('PATCH', 'http://localhost/api/admin/vehicles/1', { name: 'X' })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockUpdateVehicleAdminMutation.mockResolvedValue({ id: 'v-uuid' })
    const req = createJsonRequest('PATCH', 'http://localhost/api/admin/vehicles/1', { name: 'X' })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { id: 'v-uuid' } })
  })

  it('returns 422 when mutation returns error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockUpdateVehicleAdminMutation.mockResolvedValue({ error: 'bad data' })
    const req = createJsonRequest('PATCH', 'http://localhost/api/admin/vehicles/1', {})
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(422)
  })
})

describe('DELETE /api/admin/vehicles/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = new Request('http://localhost/api/admin/vehicles/1', { method: 'DELETE' })
    const res = await DELETE(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockSoftDeleteVehicleMutation.mockResolvedValue({ success: true })
    const req = new Request('http://localhost/api/admin/vehicles/1', { method: 'DELETE' })
    const res = await DELETE(req, makeParams())
    expect(res.status).toBe(200)
  })
})
