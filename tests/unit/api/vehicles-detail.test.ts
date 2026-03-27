import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MOCK_DEALER,
  MOCK_CUSTOMER,
  createJsonRequest,
  getResponseJson,
} from '../../helpers/api-test-utils'

// ── Mocks (vi.hoisted pattern) ────────────────────────────────────

const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

const { mockUpdateVehicleMutation } = vi.hoisted(() => ({
  mockUpdateVehicleMutation: vi.fn(),
}))
vi.mock('@/features/vehicles/mutations/update', () => ({
  updateVehicleMutation: mockUpdateVehicleMutation,
}))

const { mockDeleteVehicleMutation } = vi.hoisted(() => ({
  mockDeleteVehicleMutation: vi.fn(),
}))
vi.mock('@/features/vehicles/mutations/delete', () => ({
  deleteVehicleMutation: mockDeleteVehicleMutation,
}))

// ── Import handlers after mocks ───────────────────────────────────

import { PATCH, DELETE } from '@/app/api/vehicles/[id]/route'

// ── Helpers ───────────────────────────────────────────────────────

const TEST_ID = 'test-vehicle-uuid'
const makeParams = () => ({ params: Promise.resolve({ id: TEST_ID }) })

// ── Tests ─────────────────────────────────────────────────────────

describe('PATCH /api/vehicles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const req = createJsonRequest('PATCH', 'http://localhost/api/vehicles/1', {
      name: 'Updated',
    })
    const res = await PATCH(req, makeParams())

    expect(res.status).toBe(401)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '인증이 필요합니다' })
  })

  it('returns 403 when user has CUSTOMER role', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)

    const req = createJsonRequest('PATCH', 'http://localhost/api/vehicles/1', {
      name: 'Updated',
    })
    const res = await PATCH(req, makeParams())

    expect(res.status).toBe(403)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '권한이 없습니다' })
  })

  it('returns 200 with DEALER role and valid body', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockUpdateVehicleMutation.mockResolvedValue({ id: TEST_ID, name: 'Updated' })

    const req = createJsonRequest('PATCH', 'http://localhost/api/vehicles/1', {
      name: 'Updated',
    })
    const res = await PATCH(req, makeParams())

    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { id: TEST_ID, name: 'Updated' } })
    expect(mockUpdateVehicleMutation).toHaveBeenCalledWith(
      TEST_ID,
      { name: 'Updated' },
      MOCK_DEALER,
    )
  })

  it('returns 400 when mutation returns error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockUpdateVehicleMutation.mockResolvedValue({ error: 'Invalid data' })

    const req = createJsonRequest('PATCH', 'http://localhost/api/vehicles/1', {
      name: '',
    })
    const res = await PATCH(req, makeParams())

    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: 'Invalid data' })
  })
})

describe('DELETE /api/vehicles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const req = new Request('http://localhost/api/vehicles/1', { method: 'DELETE' })
    const res = await DELETE(req, makeParams())

    expect(res.status).toBe(401)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '인증이 필요합니다' })
  })

  it('returns 200 with DEALER role and valid id', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockDeleteVehicleMutation.mockResolvedValue({ success: true })

    const req = new Request('http://localhost/api/vehicles/1', { method: 'DELETE' })
    const res = await DELETE(req, makeParams())

    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { success: true } })
    expect(mockDeleteVehicleMutation).toHaveBeenCalledWith(TEST_ID, MOCK_DEALER)
  })
})
