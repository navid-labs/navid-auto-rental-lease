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

const { mockChangeUserRoleMutation, mockDeactivateUserMutation } = vi.hoisted(() => ({
  mockChangeUserRoleMutation: vi.fn(),
  mockDeactivateUserMutation: vi.fn(),
}))
vi.mock('@/features/admin/mutations/users', () => ({
  changeUserRoleMutation: mockChangeUserRoleMutation,
  deactivateUserMutation: mockDeactivateUserMutation,
}))

// ── Imports ───────────────────────────────────────────────────────

import { PATCH as changeRole } from '@/app/api/admin/users/[id]/role/route'
import { POST as deactivateUser } from '@/app/api/admin/users/[id]/deactivate/route'

const makeParams = () => ({ params: Promise.resolve({ id: 'user-uuid' }) })

// ── PATCH /api/admin/users/[id]/role ──────────────────────────────

describe('PATCH /api/admin/users/[id]/role', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = createJsonRequest('PATCH', 'http://localhost/api/admin/users/1/role', { role: 'DEALER' })
    const res = await changeRole(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    const req = createJsonRequest('PATCH', 'http://localhost/api/admin/users/1/role', { role: 'DEALER' })
    const res = await changeRole(req, makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 400 when role field is missing', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    const req = createJsonRequest('PATCH', 'http://localhost/api/admin/users/1/role', {})
    const res = await changeRole(req, makeParams())
    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: 'role 필드가 필요합니다' })
  })

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockChangeUserRoleMutation.mockResolvedValue({ id: 'user-uuid', role: 'DEALER' })
    const req = createJsonRequest('PATCH', 'http://localhost/api/admin/users/1/role', { role: 'DEALER' })
    const res = await changeRole(req, makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 422 on mutation error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockChangeUserRoleMutation.mockResolvedValue({ error: 'Cannot change' })
    const req = createJsonRequest('PATCH', 'http://localhost/api/admin/users/1/role', { role: 'ADMIN' })
    const res = await changeRole(req, makeParams())
    expect(res.status).toBe(422)
  })
})

// ── POST /api/admin/users/[id]/deactivate ─────────────────────────

describe('POST /api/admin/users/[id]/deactivate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = new Request('http://localhost/api/admin/users/1/deactivate', { method: 'POST' })
    const res = await deactivateUser(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockDeactivateUserMutation.mockResolvedValue({ success: true })
    const req = new Request('http://localhost/api/admin/users/1/deactivate', { method: 'POST' })
    const res = await deactivateUser(req, makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 422 on mutation error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockDeactivateUserMutation.mockResolvedValue({ error: 'Cannot deactivate self' })
    const req = new Request('http://localhost/api/admin/users/1/deactivate', { method: 'POST' })
    const res = await deactivateUser(req, makeParams())
    expect(res.status).toBe(422)
  })
})
