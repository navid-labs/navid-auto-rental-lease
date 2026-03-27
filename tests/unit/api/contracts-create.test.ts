import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MOCK_CUSTOMER,
  MOCK_DEALER,
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

const { mockCreateContractMutation } = vi.hoisted(() => ({
  mockCreateContractMutation: vi.fn(),
}))
vi.mock('@/features/contracts/mutations/create', () => ({
  createContractMutation: mockCreateContractMutation,
}))

// ── Import handler after mocks ────────────────────────────────────

import { POST } from '@/app/api/contracts/route'

// ── Tests ─────────────────────────────────────────────────────────

const VALID_BODY = {
  vehicleId: 'vehicle-uuid-001',
  contractType: 'RENTAL',
  periodMonths: 24,
  deposit: 3000000,
}

describe('POST /api/contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/contracts',
      VALID_BODY
    )
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '인증이 필요합니다' })
  })

  it('returns 403 when user role is DEALER', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/contracts',
      VALID_BODY
    )
    const res = await POST(req)

    expect(res.status).toBe(403)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '권한이 없습니다' })
  })

  it('returns 201 with contract data on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockCreateContractMutation.mockResolvedValue({
      contractId: 'contract-001',
      contractType: 'RENTAL',
    })

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/contracts',
      VALID_BODY
    )
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await getResponseJson(res)
    expect(body).toEqual({
      data: { contractId: 'contract-001', contractType: 'RENTAL' },
    })
    expect(mockCreateContractMutation).toHaveBeenCalledWith(
      VALID_BODY,
      MOCK_CUSTOMER
    )
  })

  it('returns 400 when mutation returns error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockCreateContractMutation.mockResolvedValue({
      error: '차량을 찾을 수 없습니다.',
    })

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/contracts',
      VALID_BODY
    )
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '차량을 찾을 수 없습니다.' })
  })

  it('returns 500 when mutation throws', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockCreateContractMutation.mockRejectedValue(new Error('DB down'))

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/contracts',
      VALID_BODY
    )
    const res = await POST(req)

    expect(res.status).toBe(500)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '서버 오류가 발생했습니다' })
  })
})
