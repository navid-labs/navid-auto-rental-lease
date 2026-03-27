import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MOCK_ADMIN,
  MOCK_CUSTOMER,
  getResponseJson,
} from '../../helpers/api-test-utils'

// ── Mocks (vi.hoisted pattern) ────────────────────────────────────

const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

const { mockGetDashboardStatsQuery } = vi.hoisted(() => ({
  mockGetDashboardStatsQuery: vi.fn(),
}))
vi.mock('@/features/admin/queries/dashboard', () => ({
  getDashboardStatsQuery: mockGetDashboardStatsQuery,
}))

// ── Import handler after mocks ────────────────────────────────────

import { GET } from '@/app/api/admin/dashboard/stats/route'

// ── Tests ─────────────────────────────────────────────────────────

describe('GET /api/admin/dashboard/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '인증이 필요합니다' })
  })

  it('returns 403 when user is not admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)

    const res = await GET()

    expect(res.status).toBe(403)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '관리자 권한이 필요합니다' })
  })

  it('returns 200 with stats for admin user', async () => {
    const mockStats = {
      totalVehicles: 150,
      totalContracts: 42,
      totalRevenue: 5000000,
      pendingInquiries: 8,
    }
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGetDashboardStatsQuery.mockResolvedValue(mockStats)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: mockStats })
    expect(mockGetDashboardStatsQuery).toHaveBeenCalledOnce()
  })

  it('returns 500 when query throws', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGetDashboardStatsQuery.mockRejectedValue(new Error('DB error'))

    const res = await GET()

    expect(res.status).toBe(500)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '서버 오류가 발생했습니다' })
  })
})
