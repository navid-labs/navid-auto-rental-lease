import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MOCK_ADMIN,
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

const { mockRenderToBuffer } = vi.hoisted(() => ({
  mockRenderToBuffer: vi.fn(),
}))
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: mockRenderToBuffer,
  Document: vi.fn(),
  Page: vi.fn(),
  Text: vi.fn(),
  View: vi.fn(),
  StyleSheet: { create: vi.fn((s: unknown) => s) },
  Font: { register: vi.fn() },
}))

vi.mock('@/features/inventory/components/quote-pdf', () => ({
  QuotePDF: vi.fn(),
}))

vi.mock('@/lib/pdf/fonts', () => ({}))

// ── Import handler after mocks ────────────────────────────────────

import { POST } from '@/app/api/admin/inventory/quote-pdf/route'

// ── Tests ─────────────────────────────────────────────────────────

const VALID_DATA = {
  params: {
    leasePeriodMonths: 36,
    residualRate: 0.4,
    depositRate: 0.3,
    creditGroup: 1,
  },
  vehicles: [
    {
      vehicleName: 'Test Car',
      vehiclePrice: 30000000,
      brand: 'Hyundai',
    },
  ],
}

describe('POST /api/admin/inventory/quote-pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/admin/inventory/quote-pdf',
      VALID_DATA
    )
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '인증이 필요합니다' })
  })

  it('returns 403 when user role is CUSTOMER', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/admin/inventory/quote-pdf',
      VALID_DATA
    )
    const res = await POST(req)

    expect(res.status).toBe(403)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '관리자 권한이 필요합니다' })
  })

  it('returns 400 when vehicles array is empty', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/admin/inventory/quote-pdf',
      { ...VALID_DATA, vehicles: [] }
    )
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: 'No vehicles provided' })
  })

  it('returns 200 with PDF content-type on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    const fakeBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // %PDF
    mockRenderToBuffer.mockResolvedValue(fakeBuffer)

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/admin/inventory/quote-pdf',
      VALID_DATA
    )
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('navid-quote-')
    expect(mockRenderToBuffer).toHaveBeenCalledOnce()
  })

  it('returns 500 when PDF rendering fails', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockRenderToBuffer.mockRejectedValue(new Error('Render failed'))

    const req = createJsonRequest(
      'POST',
      'http://localhost/api/admin/inventory/quote-pdf',
      VALID_DATA
    )
    const res = await POST(req)

    expect(res.status).toBe(500)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: 'Failed to generate PDF' })
  })
})
