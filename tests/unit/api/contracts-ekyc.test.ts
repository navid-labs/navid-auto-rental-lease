import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
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

const { mockSendVerificationCodeMutation } = vi.hoisted(() => ({
  mockSendVerificationCodeMutation: vi.fn(),
}))
vi.mock('@/features/contracts/mutations/ekyc', () => ({
  sendVerificationCodeMutation: mockSendVerificationCodeMutation,
}))

// ── Import handler after mocks ────────────────────────────────────

import { POST } from '@/app/api/contracts/ekyc/send-code/route'

// ── Tests ─────────────────────────────────────────────────────────

describe('POST /api/contracts/ekyc/send-code', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/contracts/ekyc/send-code',
      { phone: '010-1234-5678' }
    )
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '인증이 필요합니다' })
  })

  it('returns 400 when phone is missing', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/contracts/ekyc/send-code',
      { phone: '' }
    )
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: 'phone은 필수입니다' })
  })

  it('returns 400 when phone field is absent', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/contracts/ekyc/send-code',
      {}
    )
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: 'phone은 필수입니다' })
  })

  it('returns 200 on successful verification code send', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockSendVerificationCodeMutation.mockResolvedValue({ sent: true })

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/contracts/ekyc/send-code',
      { phone: '010-1234-5678' }
    )
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { sent: true } })
    expect(mockSendVerificationCodeMutation).toHaveBeenCalledWith(
      '010-1234-5678'
    )
  })

  it('returns 400 when mutation returns error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockSendVerificationCodeMutation.mockResolvedValue({
      error: '인증번호 발송에 실패했습니다.',
    })

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/contracts/ekyc/send-code',
      { phone: '010-1234-5678' }
    )
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '인증번호 발송에 실패했습니다.' })
  })
})
