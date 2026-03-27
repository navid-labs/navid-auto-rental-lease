import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MOCK_ADMIN,
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

const { mockVerifySettingsPasswordMutation } = vi.hoisted(() => ({
  mockVerifySettingsPasswordMutation: vi.fn(),
}))
vi.mock('@/features/settings/mutations/auth', () => ({
  verifySettingsPasswordMutation: mockVerifySettingsPasswordMutation,
}))

// ── Import handler after mocks ────────────────────────────────────

import { POST } from '@/app/api/admin/settings/verify-password/route'

// ── Tests ─────────────────────────────────────────────────────────

describe('POST /api/admin/settings/verify-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/admin/settings/verify-password',
      { password: 'admin1234' }
    )
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '인증이 필요합니다' })
  })

  it('returns 403 when user role is CUSTOMER', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/admin/settings/verify-password',
      { password: 'admin1234' }
    )
    const res = await POST(req)

    expect(res.status).toBe(403)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '관리자 권한이 필요합니다' })
  })

  it('returns 200 on correct password', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockVerifySettingsPasswordMutation.mockResolvedValue({ success: true })

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/admin/settings/verify-password',
      { password: 'admin1234' }
    )
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { success: true } })
    expect(mockVerifySettingsPasswordMutation).toHaveBeenCalledWith('admin1234')
  })

  it('returns 401 on wrong password', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockVerifySettingsPasswordMutation.mockResolvedValue({
      error: '비밀번호가 일치하지 않습니다.',
    })

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/admin/settings/verify-password',
      { password: 'wrongpass' }
    )
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '비밀번호가 일치하지 않습니다.' })
  })

  it('returns 500 when mutation throws', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockVerifySettingsPasswordMutation.mockRejectedValue(new Error('DB error'))

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/admin/settings/verify-password',
      { password: 'admin1234' }
    )
    const res = await POST(req)

    expect(res.status).toBe(500)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '서버 오류가 발생했습니다' })
  })
})
