import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MOCK_ADMIN, MOCK_CUSTOMER } from '../../helpers/api-test-utils'

// ── Mocks ─────────────────────────────────────────────────────────

const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}))
vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

const { mockFindUniqueRental, mockFindUniqueLease } = vi.hoisted(() => ({
  mockFindUniqueRental: vi.fn(),
  mockFindUniqueLease: vi.fn(),
}))
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    rentalContract: { findUnique: mockFindUniqueRental },
    leaseContract: { findUnique: mockFindUniqueLease },
  },
}))

const { mockRenderToBuffer } = vi.hoisted(() => ({
  mockRenderToBuffer: vi.fn(),
}))
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: mockRenderToBuffer,
}))

vi.mock('@/features/contracts/components/contract-pdf', () => ({
  ContractPDF: () => null,
}))

// ── Import ────────────────────────────────────────────────────────

import { GET } from '@/app/api/contracts/[id]/pdf/route'

const makeParams = () => ({ params: Promise.resolve({ id: 'contract-uuid' }) })

// Mock contract data shape (common to both rental and lease)
const mockVehicle = {
  year: 2024,
  licensePlate: '12가3456',
  mileage: 10000,
  color: 'White',
  trim: {
    name: 'Premium',
    generation: {
      carModel: {
        name: 'Sonata',
        brand: { name: 'Hyundai' },
      },
    },
  },
  images: [{ url: '/img.jpg', order: 0 }],
}

const mockCustomer = {
  name: 'Customer',
  email: 'customer@test.com',
  phone: '010-1234-5678',
}

const mockDealer = { name: 'Dealer' }

// ── Tests ─────────────────────────────────────────────────────────

describe('GET /api/contracts/[id]/pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const req = { nextUrl: new URL('http://localhost/api/contracts/1/pdf?type=RENTAL') } as any
    const res = await GET(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 404 when rental contract not found', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockFindUniqueRental.mockResolvedValue(null)

    const req = { nextUrl: new URL('http://localhost/api/contracts/1/pdf?type=RENTAL') } as any
    const res = await GET(req, makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 403 when non-admin user does not own rental contract', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockFindUniqueRental.mockResolvedValue({
      id: 'contract-uuid',
      customerId: 'other-user-id',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(),
      monthlyPayment: 500000,
      deposit: 1000000,
      totalAmount: 6000000,
      createdAt: new Date(),
      vehicle: mockVehicle,
      customer: mockCustomer,
      dealer: mockDealer,
    })

    const req = { nextUrl: new URL('http://localhost/api/contracts/1/pdf?type=RENTAL') } as any
    const res = await GET(req, makeParams())
    expect(res.status).toBe(403)
  })

  it('returns PDF for admin even if not contract owner', async () => {
    const pdfBuffer = Buffer.from('fake pdf content')
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockFindUniqueRental.mockResolvedValue({
      id: 'contract-uuid',
      customerId: 'other-user-id',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(),
      monthlyPayment: 500000,
      deposit: 1000000,
      totalAmount: 6000000,
      createdAt: new Date(),
      vehicle: mockVehicle,
      customer: mockCustomer,
      dealer: mockDealer,
    })
    mockRenderToBuffer.mockResolvedValue(pdfBuffer)

    const req = { nextUrl: new URL('http://localhost/api/contracts/1/pdf?type=RENTAL') } as any
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
  })

  it('returns PDF for rental contract owner', async () => {
    const pdfBuffer = Buffer.from('fake pdf content')
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockFindUniqueRental.mockResolvedValue({
      id: 'contract-uuid',
      customerId: MOCK_CUSTOMER.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(),
      monthlyPayment: 500000,
      deposit: 1000000,
      totalAmount: 6000000,
      createdAt: new Date(),
      vehicle: mockVehicle,
      customer: mockCustomer,
      dealer: mockDealer,
    })
    mockRenderToBuffer.mockResolvedValue(pdfBuffer)

    const req = { nextUrl: new URL('http://localhost/api/contracts/1/pdf?type=RENTAL') } as any
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
    expect(res.headers.get('content-disposition')).toContain('navid-contract-')
  })

  it('returns 404 when lease contract not found', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockFindUniqueLease.mockResolvedValue(null)

    const req = { nextUrl: new URL('http://localhost/api/contracts/1/pdf?type=LEASE') } as any
    const res = await GET(req, makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 403 when non-admin user does not own lease contract', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockFindUniqueLease.mockResolvedValue({
      id: 'contract-uuid',
      customerId: 'other-user-id',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(),
      monthlyPayment: 500000,
      deposit: 1000000,
      totalAmount: 6000000,
      residualValue: 10000000,
      residualRate: 65,
      createdAt: new Date(),
      vehicle: mockVehicle,
      customer: mockCustomer,
      dealer: mockDealer,
    })

    const req = { nextUrl: new URL('http://localhost/api/contracts/1/pdf?type=LEASE') } as any
    const res = await GET(req, makeParams())
    expect(res.status).toBe(403)
  })

  it('returns PDF for lease contract owner', async () => {
    const pdfBuffer = Buffer.from('fake lease pdf')
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockFindUniqueLease.mockResolvedValue({
      id: 'contract-uuid',
      customerId: MOCK_CUSTOMER.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(),
      monthlyPayment: 400000,
      deposit: 500000,
      totalAmount: 5000000,
      residualValue: 8000000,
      residualRate: 60,
      createdAt: new Date(),
      vehicle: mockVehicle,
      customer: mockCustomer,
      dealer: mockDealer,
    })
    mockRenderToBuffer.mockResolvedValue(pdfBuffer)

    const req = { nextUrl: new URL('http://localhost/api/contracts/1/pdf?type=LEASE') } as any
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
  })

  it('returns 500 when PDF rendering fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockFindUniqueRental.mockResolvedValue({
      id: 'contract-uuid',
      customerId: MOCK_CUSTOMER.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(),
      monthlyPayment: 500000,
      deposit: 1000000,
      totalAmount: 6000000,
      createdAt: new Date(),
      vehicle: mockVehicle,
      customer: mockCustomer,
      dealer: mockDealer,
    })
    mockRenderToBuffer.mockRejectedValue(new Error('Render failed'))

    const req = { nextUrl: new URL('http://localhost/api/contracts/1/pdf?type=RENTAL') } as any
    const res = await GET(req, makeParams())
    expect(res.status).toBe(500)
  })

  it('defaults to RENTAL type when no type param', async () => {
    const pdfBuffer = Buffer.from('pdf')
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    mockFindUniqueRental.mockResolvedValue({
      id: 'contract-uuid',
      customerId: MOCK_CUSTOMER.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(),
      monthlyPayment: 500000,
      deposit: 1000000,
      totalAmount: 6000000,
      createdAt: new Date(),
      vehicle: mockVehicle,
      customer: mockCustomer,
      dealer: mockDealer,
    })
    mockRenderToBuffer.mockResolvedValue(pdfBuffer)

    const req = { nextUrl: new URL('http://localhost/api/contracts/1/pdf') } as any
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    // Should use rentalContract (default), not leaseContract
    expect(mockFindUniqueRental).toHaveBeenCalled()
    expect(mockFindUniqueLease).not.toHaveBeenCalled()
  })
})
