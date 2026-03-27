import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MOCK_CUSTOMER,
  createFormDataRequest,
  getResponseJson,
} from '../../helpers/api-test-utils'

// ── Mocks (vi.hoisted pattern) ────────────────────────────────────

const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

const { mockUpdateProfileMutation } = vi.hoisted(() => ({
  mockUpdateProfileMutation: vi.fn(),
}))
vi.mock('@/features/auth/mutations/profile', () => ({
  updateProfileMutation: mockUpdateProfileMutation,
}))

// Mock next/cache revalidatePath (imported by mutation module)
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// ── Import handler after mocks ────────────────────────────────────

import { PATCH } from '@/app/api/auth/profile/route'

// ── Tests ─────────────────────────────────────────────────────────

describe('PATCH /api/auth/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const req = createFormDataRequest('http://localhost/api/auth/profile', {
      name: 'New Name',
    })
    const res = await PATCH(req)

    expect(res.status).toBe(401)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '인증이 필요합니다' })
  })

  it('returns 200 with data on successful update', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockUpdateProfileMutation.mockResolvedValue({ success: true })

    const req = createFormDataRequest('http://localhost/api/auth/profile', {
      name: 'Updated Name',
      phone: '010-9999-9999',
    })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { success: true } })
    expect(mockUpdateProfileMutation).toHaveBeenCalledOnce()
  })

  it('returns 422 when mutation returns error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockUpdateProfileMutation.mockResolvedValue({
      error: '입력 정보를 확인해주세요.',
    })

    const req = createFormDataRequest('http://localhost/api/auth/profile', {
      name: '',
    })
    const res = await PATCH(req)

    expect(res.status).toBe(422)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '입력 정보를 확인해주세요.' })
  })

  it('returns 500 when mutation throws', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockUpdateProfileMutation.mockRejectedValue(new Error('DB error'))

    const req = createFormDataRequest('http://localhost/api/auth/profile', {
      name: 'Test',
    })
    const res = await PATCH(req)

    expect(res.status).toBe(500)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '서버 오류가 발생했습니다' })
  })
})
