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
  mockGetInventoryItemsQuery,
  mockGetInventoryCountQuery,
  mockGetLastUploadTimeQuery,
  mockLoadInventoryDataMutation,
} = vi.hoisted(() => ({
  mockGetInventoryItemsQuery: vi.fn(),
  mockGetInventoryCountQuery: vi.fn(),
  mockGetLastUploadTimeQuery: vi.fn(),
  mockLoadInventoryDataMutation: vi.fn(),
}))
vi.mock('@/features/inventory/queries/inventory', () => ({
  getInventoryItemsQuery: mockGetInventoryItemsQuery,
  getInventoryCountQuery: mockGetInventoryCountQuery,
  getLastUploadTimeQuery: mockGetLastUploadTimeQuery,
  loadInventoryDataMutation: mockLoadInventoryDataMutation,
}))

const { mockUploadInventoryCsvMutation } = vi.hoisted(() => ({
  mockUploadInventoryCsvMutation: vi.fn(),
}))
vi.mock('@/features/inventory/mutations/upload', () => ({
  uploadInventoryCsvMutation: mockUploadInventoryCsvMutation,
}))

const { mockGenerateQuoteMutation } = vi.hoisted(() => ({
  mockGenerateQuoteMutation: vi.fn(),
}))
vi.mock('@/features/inventory/mutations/quote', () => ({
  generateQuoteMutation: mockGenerateQuoteMutation,
}))

// ── Imports ───────────────────────────────────────────────────────

import { GET as getInventory } from '@/app/api/admin/inventory/route'
import { GET as getCount } from '@/app/api/admin/inventory/count/route'
import { GET as getLastUpload } from '@/app/api/admin/inventory/last-upload/route'
import { POST as loadInventory } from '@/app/api/admin/inventory/load/route'
import { POST as uploadCsv } from '@/app/api/admin/inventory/upload/route'
import { POST as generateQuote } from '@/app/api/admin/inventory/quote/route'

// ── GET /api/admin/inventory ──────────────────────────────────────

describe('GET /api/admin/inventory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = new Request('http://localhost/api/admin/inventory')
    const res = await getInventory(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 200 with inventory items for admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGetInventoryItemsQuery.mockResolvedValue([{ id: '1' }])
    const req = new Request('http://localhost/api/admin/inventory?category=STRATEGIC')
    const res = await getInventory(req as any)
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: [{ id: '1' }] })
  })

  it('parses category filter correctly', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGetInventoryItemsQuery.mockResolvedValue([])
    const req = new Request('http://localhost/api/admin/inventory?category=GENERAL&search=test&brand=hyundai')
    await getInventory(req as any)
    expect(mockGetInventoryItemsQuery).toHaveBeenCalledWith({
      search: 'test',
      category: 'GENERAL',
      brand: 'hyundai',
    })
  })

  it('ignores invalid category', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGetInventoryItemsQuery.mockResolvedValue([])
    const req = new Request('http://localhost/api/admin/inventory?category=INVALID')
    await getInventory(req as any)
    expect(mockGetInventoryItemsQuery).toHaveBeenCalledWith({
      search: undefined,
      category: undefined,
      brand: undefined,
    })
  })
})

// ── GET /api/admin/inventory/count ────────────────────────────────

describe('GET /api/admin/inventory/count', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with count', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGetInventoryCountQuery.mockResolvedValue(42)
    const res = await getCount()
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { count: 42 } })
  })

  it('returns 500 on error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGetInventoryCountQuery.mockRejectedValue(new Error('DB fail'))
    const res = await getCount()
    expect(res.status).toBe(500)
  })
})

// ── GET /api/admin/inventory/last-upload ──────────────────────────

describe('GET /api/admin/inventory/last-upload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with last upload time', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGetLastUploadTimeQuery.mockResolvedValue('2026-03-27T00:00:00Z')
    const res = await getLastUpload()
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: { lastUploadTime: '2026-03-27T00:00:00Z' } })
  })
})

// ── POST /api/admin/inventory/load ────────────────────────────────

describe('POST /api/admin/inventory/load', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockLoadInventoryDataMutation.mockResolvedValue({ loaded: 100 })
    const res = await loadInventory()
    expect(res.status).toBe(200)
  })

  it('returns 403 for non-admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    const res = await loadInventory()
    expect(res.status).toBe(403)
  })
})

// ── POST /api/admin/inventory/upload ──────────────────────────────

describe('POST /api/admin/inventory/upload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockUploadInventoryCsvMutation.mockResolvedValue({ imported: 50 })
    const formData = new FormData()
    formData.append('file', new Blob(['csv data'], { type: 'text/csv' }), 'test.csv')
    const req = new Request('http://localhost/api/admin/inventory/upload', {
      method: 'POST',
      body: formData,
    })
    const res = await uploadCsv(req)
    expect(res.status).toBe(200)
  })

  it('returns 422 when mutation returns error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockUploadInventoryCsvMutation.mockResolvedValue({ error: 'Invalid CSV' })
    const formData = new FormData()
    formData.append('file', new Blob(['bad csv']), 'test.csv')
    const req = new Request('http://localhost/api/admin/inventory/upload', {
      method: 'POST',
      body: formData,
    })
    const res = await uploadCsv(req)
    expect(res.status).toBe(422)
  })
})

// ── POST /api/admin/inventory/quote ───────────────────────────────

describe('POST /api/admin/inventory/quote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGenerateQuoteMutation.mockResolvedValue({ quoteId: 'q1' })
    const req = createJsonRequest('POST', 'http://localhost/api/admin/inventory/quote', {
      vehicles: [{ id: 'v1' }],
      params: { discount: 10 },
    })
    const res = await generateQuote(req)
    expect(res.status).toBe(200)
  })

  it('returns 422 when mutation throws Error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockGenerateQuoteMutation.mockRejectedValue(new Error('Invalid params'))
    const req = createJsonRequest('POST', 'http://localhost/api/admin/inventory/quote', {
      vehicles: [],
      params: {},
    })
    const res = await generateQuote(req)
    expect(res.status).toBe(422)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: 'Invalid params' })
  })
})
