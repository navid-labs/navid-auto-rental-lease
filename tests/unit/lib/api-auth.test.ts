import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MOCK_ADMIN, MOCK_DEALER, MOCK_CUSTOMER } from '../../helpers/api-test-utils'

// ── Mocks (vi.hoisted pattern) ────────────────────────────────────

const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

// ── Import after mocks ────────────────────────────────────────────

import { requireAuth, requireAdmin, requireRole } from '@/lib/api/auth'

// ── Tests ─────────────────────────────────────────────────────────

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 error when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await requireAuth()

    expect(result.error).toBeDefined()
    expect(result.error!.status).toBe(401)
    expect(result.user).toBeUndefined()
    const body = await result.error!.json()
    expect(body.error).toBe('인증이 필요합니다')
  })

  it('returns user when authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)

    const result = await requireAuth()

    expect(result.user).toEqual(MOCK_CUSTOMER)
    expect(result.error).toBeUndefined()
  })
})

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 error when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await requireAdmin()

    expect(result.error).toBeDefined()
    expect(result.error!.status).toBe(401)
  })

  it('returns 403 error when user is CUSTOMER', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)

    const result = await requireAdmin()

    expect(result.error).toBeDefined()
    expect(result.error!.status).toBe(403)
    const body = await result.error!.json()
    expect(body.error).toBe('관리자 권한이 필요합니다')
  })

  it('returns 403 error when user is DEALER', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)

    const result = await requireAdmin()

    expect(result.error).toBeDefined()
    expect(result.error!.status).toBe(403)
  })

  it('returns user when user is ADMIN', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)

    const result = await requireAdmin()

    expect(result.user).toEqual(MOCK_ADMIN)
    expect(result.error).toBeUndefined()
  })
})

describe('requireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 error when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await requireRole('DEALER')

    expect(result.error).toBeDefined()
    expect(result.error!.status).toBe(401)
  })

  it('returns 403 error when user role not in allowed list', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)

    const result = await requireRole('DEALER', 'ADMIN')

    expect(result.error).toBeDefined()
    expect(result.error!.status).toBe(403)
    const body = await result.error!.json()
    expect(body.error).toBe('권한이 없습니다')
  })

  it('returns user when role matches one of allowed roles', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)

    const result = await requireRole('DEALER', 'ADMIN')

    expect(result.user).toEqual(MOCK_DEALER)
    expect(result.error).toBeUndefined()
  })

  it('returns user when ADMIN role matches', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)

    const result = await requireRole('DEALER', 'ADMIN')

    expect(result.user).toEqual(MOCK_ADMIN)
    expect(result.error).toBeUndefined()
  })
})
