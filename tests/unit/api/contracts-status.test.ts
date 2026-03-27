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

const { mockUpdateContractStatusMutation } = vi.hoisted(() => ({
  mockUpdateContractStatusMutation: vi.fn(),
}))
vi.mock('@/features/contracts/mutations/status', () => ({
  updateContractStatusMutation: mockUpdateContractStatusMutation,
}))

// ── Import handler after mocks ────────────────────────────────────

import { PATCH } from '@/app/api/contracts/[id]/status/route'

// ── Tests ─────────────────────────────────────────────────────────

const CONTRACT_ID = 'contract-uuid-001'
const VALID_BODY = {
  contractType: 'RENTAL',
  newStatus: 'CANCELED',
}

function callPatch(body: unknown) {
  const req = createJsonRequest(
    'PATCH',
    `http://localhost/api/contracts/${CONTRACT_ID}/status`,
    body
  )
  return PATCH(req, { params: Promise.resolve({ id: CONTRACT_ID }) })
}

describe('PATCH /api/contracts/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const res = await callPatch(VALID_BODY)

    expect(res.status).toBe(401)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '인증이 필요합니다' })
  })

  it('returns 200 with success on valid status update', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockUpdateContractStatusMutation.mockResolvedValue({ success: true })

    const res = await callPatch(VALID_BODY)

    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { success: true } })
    expect(mockUpdateContractStatusMutation).toHaveBeenCalledWith(
      CONTRACT_ID,
      'RENTAL',
      'CANCELED',
      MOCK_CUSTOMER
    )
  })

  it('returns 400 when mutation returns error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockUpdateContractStatusMutation.mockResolvedValue({
      error: '해당 상태로 변경할 수 없습니다.',
    })

    const res = await callPatch(VALID_BODY)

    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '해당 상태로 변경할 수 없습니다.' })
  })

  it('returns 500 when mutation throws', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockUpdateContractStatusMutation.mockRejectedValue(new Error('DB error'))

    const res = await callPatch(VALID_BODY)

    expect(res.status).toBe(500)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '서버 오류가 발생했습니다' })
  })
})
