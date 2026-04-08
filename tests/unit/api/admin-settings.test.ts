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

const {
  mockGetDefaultSettingsQuery,
  mockUpsertDefaultSettingMutation,
  mockDeleteDefaultSettingMutation,
  mockGetPromoRatesQuery,
  mockUpsertPromoRateMutation,
  mockDeletePromoRateMutation,
} = vi.hoisted(() => ({
  mockGetDefaultSettingsQuery: vi.fn(),
  mockUpsertDefaultSettingMutation: vi.fn(),
  mockDeleteDefaultSettingMutation: vi.fn(),
  mockGetPromoRatesQuery: vi.fn(),
  mockUpsertPromoRateMutation: vi.fn(),
  mockDeletePromoRateMutation: vi.fn(),
}))
vi.mock('@/features/settings/queries/settings', () => ({
  getDefaultSettingsQuery: mockGetDefaultSettingsQuery,
  getPromoRatesQuery: mockGetPromoRatesQuery,
}))
vi.mock('@/features/settings/mutations/settings', () => ({
  upsertDefaultSettingMutation: mockUpsertDefaultSettingMutation,
  deleteDefaultSettingMutation: mockDeleteDefaultSettingMutation,
  upsertPromoRateMutation: mockUpsertPromoRateMutation,
  deletePromoRateMutation: mockDeletePromoRateMutation,
}))

// ── Imports ───────────────────────────────────────────────────────

import { GET as getDefaults, PUT as putDefaults } from '@/app/api/admin/settings/defaults/route'
import { DELETE as deleteDefault } from '@/app/api/admin/settings/defaults/[id]/route'
import { GET as getPromoRates, PUT as putPromoRate } from '@/app/api/admin/settings/promo-rates/route'
import { DELETE as deletePromoRate } from '@/app/api/admin/settings/promo-rates/[id]/route'

const makeParams = () => ({ params: Promise.resolve({ id: 'setting-uuid' }) })

// ── Defaults Tests ────────────────────────────────────────────────

describe('GET /api/admin/settings/defaults', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const res = await getDefaults()
    expect(res.status).toBe(401)
  })

  it('returns 200 with settings for admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGetDefaultSettingsQuery.mockResolvedValue([{ key: 'k', value: 'v' }])
    const res = await getDefaults()
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: [{ key: 'k', value: 'v' }] })
  })
})

describe('PUT /api/admin/settings/defaults', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for non-admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    const req = createJsonRequest('PUT', 'http://localhost/api/admin/settings/defaults', { key: 'k' })
    const res = await putDefaults(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockUpsertDefaultSettingMutation.mockResolvedValue({ id: '1' })
    const req = createJsonRequest('PUT', 'http://localhost/api/admin/settings/defaults', { key: 'k' })
    const res = await putDefaults(req)
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/admin/settings/defaults/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockDeleteDefaultSettingMutation.mockResolvedValue({ success: true })
    const req = new Request('http://localhost/api/admin/settings/defaults/1', { method: 'DELETE' })
    const res = await deleteDefault(req, makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 422 on mutation error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockDeleteDefaultSettingMutation.mockResolvedValue({ error: 'Not found' })
    const req = new Request('http://localhost/api/admin/settings/defaults/1', { method: 'DELETE' })
    const res = await deleteDefault(req, makeParams())
    expect(res.status).toBe(422)
  })
})

// ── Promo Rates Tests ─────────────────────────────────────────────

describe('GET /api/admin/settings/promo-rates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with promo rates for admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGetPromoRatesQuery.mockResolvedValue([{ id: '1', rate: 3.5 }])
    const res = await getPromoRates()
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: [{ id: '1', rate: 3.5 }] })
  })
})

describe('PUT /api/admin/settings/promo-rates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockUpsertPromoRateMutation.mockResolvedValue({ id: '1' })
    const req = createJsonRequest('PUT', 'http://localhost/api/admin/settings/promo-rates', { rate: 3.5 })
    const res = await putPromoRate(req)
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/admin/settings/promo-rates/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockDeletePromoRateMutation.mockResolvedValue({ success: true })
    const req = new Request('http://localhost/api/admin/settings/promo-rates/1', { method: 'DELETE' })
    const res = await deletePromoRate(req, makeParams())
    expect(res.status).toBe(200)
  })
})
