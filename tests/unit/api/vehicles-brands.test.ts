import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getResponseJson } from '../../helpers/api-test-utils'

// ── Mocks (vi.hoisted pattern) ────────────────────────────────────

const { mockGetBrands } = vi.hoisted(() => ({
  mockGetBrands: vi.fn(),
}))
vi.mock('@/features/vehicles/queries/cascade', () => ({
  getBrands: mockGetBrands,
}))

// ── Import handler after mocks ────────────────────────────────────

import { GET } from '@/app/api/vehicles/brands/route'

// ── Tests ─────────────────────────────────────────────────────────

describe('GET /api/vehicles/brands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with brands array', async () => {
    const mockBrands = [
      { id: '1', name: 'Hyundai', slug: 'hyundai' },
      { id: '2', name: 'Kia', slug: 'kia' },
    ]
    mockGetBrands.mockResolvedValue(mockBrands)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: mockBrands })
    expect(mockGetBrands).toHaveBeenCalledOnce()
  })

  it('returns 500 when getBrands throws', async () => {
    mockGetBrands.mockRejectedValue(new Error('DB error'))

    const res = await GET()

    expect(res.status).toBe(500)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '서버 오류가 발생했습니다' })
  })
})
