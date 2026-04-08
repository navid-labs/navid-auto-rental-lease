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

const { mockApproveContractMutation } = vi.hoisted(() => ({
  mockApproveContractMutation: vi.fn(),
}))
vi.mock('@/features/contracts/mutations/approve', () => ({
  approveContractMutation: mockApproveContractMutation,
}))

const { mockSubmitEkycMutation } = vi.hoisted(() => ({
  mockSubmitEkycMutation: vi.fn(),
}))
vi.mock('@/features/contracts/mutations/ekyc', () => ({
  submitEkycMutation: mockSubmitEkycMutation,
}))

const { mockGetMyContractsQuery } = vi.hoisted(() => ({
  mockGetMyContractsQuery: vi.fn(),
}))
vi.mock('@/features/contracts/queries/my-contracts', () => ({
  getMyContractsQuery: mockGetMyContractsQuery,
}))

// ── Imports ───────────────────────────────────────────────────────

import { POST as approveContract } from '@/app/api/contracts/[id]/approve/route'
import { POST as submitEkyc } from '@/app/api/contracts/[id]/ekyc/route'
import { GET as getMyContracts } from '@/app/api/contracts/my/route'

const makeParams = () => ({ params: Promise.resolve({ id: 'contract-uuid' }) })

// ── POST /api/contracts/[id]/approve ──────────────────────────────

describe('POST /api/contracts/[id]/approve', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = createJsonRequest('POST', 'http://localhost/api/contracts/1/approve', {
      contractType: 'RENTAL',
      action: 'APPROVED',
    })
    const res = await approveContract(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    const req = createJsonRequest('POST', 'http://localhost/api/contracts/1/approve', {
      contractType: 'RENTAL',
      action: 'APPROVED',
    })
    const res = await approveContract(req, makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 200 on approval success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockApproveContractMutation.mockResolvedValue({ id: 'contract-uuid', status: 'APPROVED' })
    const req = createJsonRequest('POST', 'http://localhost/api/contracts/1/approve', {
      contractType: 'RENTAL',
      action: 'APPROVED',
    })
    const res = await approveContract(req, makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 400 on mutation error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockApproveContractMutation.mockResolvedValue({ error: 'Invalid transition' })
    const req = createJsonRequest('POST', 'http://localhost/api/contracts/1/approve', {
      contractType: 'RENTAL',
      action: 'CANCELED',
    })
    const res = await approveContract(req, makeParams())
    expect(res.status).toBe(400)
  })
})

// ── POST /api/contracts/[id]/ekyc ─────────────────────────────────

describe('POST /api/contracts/[id]/ekyc', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = createJsonRequest('POST', 'http://localhost/api/contracts/1/ekyc', {
      contractType: 'RENTAL',
      ekycData: {},
    })
    const res = await submitEkyc(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockSubmitEkycMutation.mockResolvedValue({ verified: true })
    const req = createJsonRequest('POST', 'http://localhost/api/contracts/1/ekyc', {
      contractType: 'RENTAL',
      ekycData: { name: 'Test', ssn: '000000-0000000' },
    })
    const res = await submitEkyc(req, makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 400 on mutation error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockSubmitEkycMutation.mockResolvedValue({ error: 'Verification failed' })
    const req = createJsonRequest('POST', 'http://localhost/api/contracts/1/ekyc', {
      contractType: 'RENTAL',
      ekycData: {},
    })
    const res = await submitEkyc(req, makeParams())
    expect(res.status).toBe(400)
  })
})

// ── GET /api/contracts/my ─────────────────────────────────────────

describe('GET /api/contracts/my', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const res = await getMyContracts()
    expect(res.status).toBe(401)
  })

  it('returns 200 with contracts for authenticated user', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockGetMyContractsQuery.mockResolvedValue([{ id: 'c1' }])
    const res = await getMyContracts()
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: [{ id: 'c1' }] })
  })
})
