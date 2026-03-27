import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getResponseJson } from '../../helpers/api-test-utils'

// ── Mocks (vi.hoisted pattern) ────────────────────────────────────

const { mockSearchVehicles } = vi.hoisted(() => ({
  mockSearchVehicles: vi.fn(),
}))
vi.mock('@/features/vehicles/queries/search', () => ({
  searchVehicles: mockSearchVehicles,
}))

// ── Import handler after mocks ────────────────────────────────────

import { GET } from '@/app/api/vehicles/route'

// ── Tests ─────────────────────────────────────────────────────────

describe('GET /api/vehicles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with default filters when no params given', async () => {
    const mockResult = { items: [], total: 0, offset: 0, limit: 20 }
    mockSearchVehicles.mockResolvedValue(mockResult)

    const req = new Request('http://localhost/api/vehicles')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: mockResult })
    expect(mockSearchVehicles).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: null,
        model: null,
        gen: null,
        yearMin: null,
        yearMax: null,
      }),
      'recommended',
      0,
      20,
    )
  })

  it('passes brandId and sort params to searchVehicles', async () => {
    const mockResult = { items: [{ id: '1' }], total: 1, offset: 0, limit: 10 }
    mockSearchVehicles.mockResolvedValue(mockResult)

    const req = new Request(
      'http://localhost/api/vehicles?brandId=hyundai&sort=priceAsc&offset=10&limit=10',
    )
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(mockSearchVehicles).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: 'hyundai',
        model: null,
      }),
      'priceAsc',
      10,
      10,
    )
  })

  it('returns 500 when searchVehicles throws', async () => {
    mockSearchVehicles.mockRejectedValue(new Error('DB error'))

    const req = new Request('http://localhost/api/vehicles')
    const res = await GET(req)

    expect(res.status).toBe(500)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '서버 오류가 발생했습니다' })
  })
})
