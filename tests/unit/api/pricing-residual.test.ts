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

const { mockGetResidualRateQuery, mockGetResidualRatesQuery } = vi.hoisted(() => ({
  mockGetResidualRateQuery: vi.fn(),
  mockGetResidualRatesQuery: vi.fn(),
}))
vi.mock('@/features/pricing/queries/residual-rates', () => ({
  getResidualRateQuery: mockGetResidualRateQuery,
  getResidualRatesQuery: mockGetResidualRatesQuery,
}))

const { mockUpsertResidualRateMutation, mockDeleteResidualRateMutation } = vi.hoisted(() => ({
  mockUpsertResidualRateMutation: vi.fn(),
  mockDeleteResidualRateMutation: vi.fn(),
}))
vi.mock('@/features/pricing/mutations/residual-rates', () => ({
  upsertResidualRateMutation: mockUpsertResidualRateMutation,
  deleteResidualRateMutation: mockDeleteResidualRateMutation,
}))

// ── Imports ───────────────────────────────────────────────────────

import { GET as getResidualRate } from '@/app/api/pricing/residual-rate/route'
import { GET as getResidualRates, PUT as putResidualRate } from '@/app/api/pricing/residual-rates/route'
import { DELETE as deleteResidualRate } from '@/app/api/pricing/residual-rates/[id]/route'

const makeParams = () => ({ params: Promise.resolve({ id: 'rate-uuid' }) })

// ── GET /api/pricing/residual-rate ────────────────────────────────

describe('GET /api/pricing/residual-rate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when required params are missing', async () => {
    const req = new Request('http://localhost/api/pricing/residual-rate')
    const res = await getResidualRate(req as any)
    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: 'brandId, carModelId, year 파라미터가 필요합니다' })
  })

  it('returns 400 when year is not a number', async () => {
    const req = new Request('http://localhost/api/pricing/residual-rate?brandId=b1&carModelId=m1&year=abc')
    const res = await getResidualRate(req as any)
    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: 'year는 숫자여야 합니다' })
  })

  it('returns 200 with rate for valid params', async () => {
    mockGetResidualRateQuery.mockResolvedValue(0.65)
    const req = new Request('http://localhost/api/pricing/residual-rate?brandId=b1&carModelId=m1&year=2024')
    const res = await getResidualRate(req as any)
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { rate: 0.65 } })
  })

  it('returns 500 when query throws', async () => {
    mockGetResidualRateQuery.mockRejectedValue(new Error('DB error'))
    const req = new Request('http://localhost/api/pricing/residual-rate?brandId=b1&carModelId=m1&year=2024')
    const res = await getResidualRate(req as any)
    expect(res.status).toBe(500)
  })
})

// ── GET /api/pricing/residual-rates ───────────────────────────────

describe('GET /api/pricing/residual-rates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with rates', async () => {
    mockGetResidualRatesQuery.mockResolvedValue([{ id: '1', rate: 0.5 }])
    const req = new Request('http://localhost/api/pricing/residual-rates')
    const res = await getResidualRates(req as any)
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: [{ id: '1', rate: 0.5 }] })
  })

  it('passes brandId filter', async () => {
    mockGetResidualRatesQuery.mockResolvedValue([])
    const req = new Request('http://localhost/api/pricing/residual-rates?brandId=hyundai')
    await getResidualRates(req as any)
    expect(mockGetResidualRatesQuery).toHaveBeenCalledWith('hyundai')
  })
})

// ── PUT /api/pricing/residual-rates ───────────────────────────────

describe('PUT /api/pricing/residual-rates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for non-admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    const req = createJsonRequest('PUT', 'http://localhost/api/pricing/residual-rates', { rate: 0.5 })
    const res = await putResidualRate(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockUpsertResidualRateMutation.mockResolvedValue({ id: '1' })
    const req = createJsonRequest('PUT', 'http://localhost/api/pricing/residual-rates', { rate: 0.5 })
    const res = await putResidualRate(req)
    expect(res.status).toBe(200)
  })
})

// ── DELETE /api/pricing/residual-rates/[id] ───────────────────────

describe('DELETE /api/pricing/residual-rates/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockDeleteResidualRateMutation.mockResolvedValue({ success: true })
    const req = new Request('http://localhost/test', { method: 'DELETE' })
    const res = await deleteResidualRate(req, makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 422 on mutation error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockDeleteResidualRateMutation.mockResolvedValue({ error: 'Not found' })
    const req = new Request('http://localhost/test', { method: 'DELETE' })
    const res = await deleteResidualRate(req, makeParams())
    expect(res.status).toBe(422)
  })
})
