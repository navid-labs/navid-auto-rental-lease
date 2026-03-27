import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createJsonRequest, getResponseJson } from '../../helpers/api-test-utils'

// ── Mocks (vi.hoisted pattern) ────────────────────────────────────

const { mockCreateGeneralInquiryMutation } = vi.hoisted(() => ({
  mockCreateGeneralInquiryMutation: vi.fn(),
}))
vi.mock('@/features/inquiry/mutations/create', () => ({
  createGeneralInquiryMutation: mockCreateGeneralInquiryMutation,
}))

// ── Import handler after mocks ────────────────────────────────────

import { POST } from '@/app/api/inquiry/route'

// ── Tests ─────────────────────────────────────────────────────────

describe('POST /api/inquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 201 with valid body', async () => {
    const inquiryData = {
      name: 'Test User',
      phone: '010-1234-5678',
      message: 'I want to lease a car',
    }
    const mockResult = { id: 'inq-001', ...inquiryData }
    mockCreateGeneralInquiryMutation.mockResolvedValue(mockResult)

    const req = createJsonRequest('POST', 'http://localhost/api/inquiry', inquiryData)
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: mockResult })
    expect(mockCreateGeneralInquiryMutation).toHaveBeenCalledWith(inquiryData)
  })

  it('returns 422 when mutation returns error', async () => {
    mockCreateGeneralInquiryMutation.mockResolvedValue({
      error: '필수 정보를 입력해주세요',
    })

    const req = createJsonRequest('POST', 'http://localhost/api/inquiry', {
      name: '',
    })
    const res = await POST(req)

    expect(res.status).toBe(422)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '필수 정보를 입력해주세요' })
  })

  it('returns 500 when mutation throws non-Zod error', async () => {
    mockCreateGeneralInquiryMutation.mockRejectedValue(new Error('DB error'))

    const req = createJsonRequest('POST', 'http://localhost/api/inquiry', {
      name: 'Test',
    })
    const res = await POST(req)

    expect(res.status).toBe(500)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '서버 오류가 발생했습니다' })
  })

  it('returns 422 when mutation throws ZodError', async () => {
    const zodError = new Error('Validation failed')
    zodError.name = 'ZodError'
    mockCreateGeneralInquiryMutation.mockRejectedValue(zodError)

    const req = createJsonRequest('POST', 'http://localhost/api/inquiry', {
      name: 'Test',
    })
    const res = await POST(req)

    expect(res.status).toBe(422)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '입력값을 확인해주세요' })
  })
})
