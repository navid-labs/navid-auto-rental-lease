import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MOCK_ADMIN,
  MOCK_DEALER,
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

const { mockUpdateVehicleStatusMutation } = vi.hoisted(() => ({
  mockUpdateVehicleStatusMutation: vi.fn(),
}))
vi.mock('@/features/vehicles/mutations/status', () => ({
  updateVehicleStatusMutation: mockUpdateVehicleStatusMutation,
}))

const { mockRestoreVehicleMutation, mockResubmitVehicleMutation } = vi.hoisted(() => ({
  mockRestoreVehicleMutation: vi.fn(),
  mockResubmitVehicleMutation: vi.fn(),
}))
vi.mock('@/features/vehicles/mutations/misc', () => ({
  restoreVehicleMutation: mockRestoreVehicleMutation,
  resubmitVehicleMutation: mockResubmitVehicleMutation,
}))

const { mockApproveVehicleMutation } = vi.hoisted(() => ({
  mockApproveVehicleMutation: vi.fn(),
}))
vi.mock('@/features/vehicles/mutations/approval', () => ({
  approveVehicleMutation: mockApproveVehicleMutation,
}))

const { mockBatchApproveVehiclesMutation } = vi.hoisted(() => ({
  mockBatchApproveVehiclesMutation: vi.fn(),
}))
// Separate mock for batch-approve (different import path)
vi.mock('@/features/vehicles/mutations/approval', async () => ({
  approveVehicleMutation: mockApproveVehicleMutation,
  batchApproveVehiclesMutation: mockBatchApproveVehiclesMutation,
}))

const { mockCreateVehicleInquiryMutation } = vi.hoisted(() => ({
  mockCreateVehicleInquiryMutation: vi.fn(),
}))
vi.mock('@/features/vehicles/queries/inquiry', () => ({
  createVehicleInquiryMutation: mockCreateVehicleInquiryMutation,
}))

const { mockLookupPlateMutation } = vi.hoisted(() => ({
  mockLookupPlateMutation: vi.fn(),
}))
vi.mock('@/features/vehicles/queries/lookup', () => ({
  lookupPlateMutation: mockLookupPlateMutation,
}))

const { mockReorderImagesMutation, mockDeleteImageMutation } = vi.hoisted(() => ({
  mockReorderImagesMutation: vi.fn(),
  mockDeleteImageMutation: vi.fn(),
}))
vi.mock('@/features/vehicles/mutations/images', () => ({
  reorderImagesMutation: mockReorderImagesMutation,
  deleteImageMutation: mockDeleteImageMutation,
}))

// ── Imports ───────────────────────────────────────────────────────

import { PATCH as updateStatus } from '@/app/api/vehicles/[id]/status/route'
import { POST as restoreVehicle } from '@/app/api/vehicles/[id]/restore/route'
import { POST as resubmitVehicle } from '@/app/api/vehicles/[id]/resubmit/route'
import { POST as approveVehicle } from '@/app/api/vehicles/[id]/approve/route'
import { POST as vehicleInquiry } from '@/app/api/vehicles/[id]/inquiry/route'
import { GET as lookupPlate } from '@/app/api/vehicles/lookup-plate/route'
import { POST as batchApprove } from '@/app/api/vehicles/batch-approve/route'
import { PATCH as reorderImages } from '@/app/api/vehicles/[id]/images/reorder/route'
import { DELETE as deleteImage } from '@/app/api/vehicles/[id]/images/[imageId]/route'

const makeParams = () => ({ params: Promise.resolve({ id: 'v-uuid' }) })
const makeImageParams = () => ({ params: Promise.resolve({ id: 'v-uuid', imageId: 'img-uuid' }) })

// ── PATCH /api/vehicles/[id]/status ───────────────────────────────

describe('PATCH /api/vehicles/[id]/status', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = createJsonRequest('PATCH', 'http://localhost/api/vehicles/1/status', { status: 'ACTIVE' })
    const res = await updateStatus(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockUpdateVehicleStatusMutation.mockResolvedValue({ id: 'v-uuid', status: 'ACTIVE' })
    const req = createJsonRequest('PATCH', 'http://localhost/api/vehicles/1/status', { status: 'ACTIVE' })
    const res = await updateStatus(req, makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 400 on mutation error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockUpdateVehicleStatusMutation.mockResolvedValue({ error: 'Invalid transition' })
    const req = createJsonRequest('PATCH', 'http://localhost/api/vehicles/1/status', { status: 'SOLD' })
    const res = await updateStatus(req, makeParams())
    expect(res.status).toBe(400)
  })
})

// ── POST /api/vehicles/[id]/restore ───────────────────────────────

describe('POST /api/vehicles/[id]/restore', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = new Request('http://localhost/test', { method: 'POST' })
    const res = await restoreVehicle(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    const req = new Request('http://localhost/test', { method: 'POST' })
    const res = await restoreVehicle(req, makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockRestoreVehicleMutation.mockResolvedValue({ restored: true })
    const req = new Request('http://localhost/test', { method: 'POST' })
    const res = await restoreVehicle(req, makeParams())
    expect(res.status).toBe(200)
  })
})

// ── POST /api/vehicles/[id]/resubmit ──────────────────────────────

describe('POST /api/vehicles/[id]/resubmit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 for dealer', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockResubmitVehicleMutation.mockResolvedValue({ resubmitted: true })
    const req = new Request('http://localhost/test', { method: 'POST' })
    const res = await resubmitVehicle(req, makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 403 for customer', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_CUSTOMER)
    const req = new Request('http://localhost/test', { method: 'POST' })
    const res = await resubmitVehicle(req, makeParams())
    expect(res.status).toBe(403)
  })
})

// ── POST /api/vehicles/[id]/approve ───────────────────────────────

describe('POST /api/vehicles/[id]/approve', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on approval', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockApproveVehicleMutation.mockResolvedValue({ id: 'v-uuid', status: 'APPROVED' })
    const req = createJsonRequest('POST', 'http://localhost/test', { action: 'APPROVED' })
    const res = await approveVehicle(req, makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 400 on mutation error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockApproveVehicleMutation.mockResolvedValue({ error: 'Already approved' })
    const req = createJsonRequest('POST', 'http://localhost/test', { action: 'APPROVED' })
    const res = await approveVehicle(req, makeParams())
    expect(res.status).toBe(400)
  })
})

// ── POST /api/vehicles/[id]/inquiry ───────────────────────────────

describe('POST /api/vehicles/[id]/inquiry', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 on success (public endpoint)', async () => {
    mockCreateVehicleInquiryMutation.mockResolvedValue({ id: 'inq-1' })
    const req = createJsonRequest('POST', 'http://localhost/test', {
      name: 'User',
      phone: '010-0000-0000',
      message: 'Interested',
    })
    const res = await vehicleInquiry(req, makeParams())
    expect(res.status).toBe(201)
  })

  it('returns 400 on mutation error', async () => {
    mockCreateVehicleInquiryMutation.mockResolvedValue({ error: 'Invalid phone' })
    const req = createJsonRequest('POST', 'http://localhost/test', { name: 'User', phone: '' })
    const res = await vehicleInquiry(req, makeParams())
    expect(res.status).toBe(400)
  })
})

// ── GET /api/vehicles/lookup-plate ────────────────────────────────

describe('GET /api/vehicles/lookup-plate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = new Request('http://localhost/api/vehicles/lookup-plate?plateNumber=12가3456')
    const res = await lookupPlate(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when plateNumber is missing', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    const req = new Request('http://localhost/api/vehicles/lookup-plate')
    const res = await lookupPlate(req)
    expect(res.status).toBe(400)
    const body = await getResponseJson(res)
    expect(body).toEqual({ error: '번호판을 입력해주세요' })
  })

  it('returns 200 with vehicle data', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockLookupPlateMutation.mockResolvedValue({ data: { brand: 'Hyundai' } })
    const req = new Request('http://localhost/api/vehicles/lookup-plate?plateNumber=12가3456')
    const res = await lookupPlate(req)
    expect(res.status).toBe(200)
  })
})

// ── POST /api/vehicles/batch-approve ──────────────────────────────

describe('POST /api/vehicles/batch-approve', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockBatchApproveVehiclesMutation.mockResolvedValue({ approved: 3 })
    const req = createJsonRequest('POST', 'http://localhost/test', {
      vehicleIds: ['v1', 'v2', 'v3'],
    })
    const res = await batchApprove(req)
    expect(res.status).toBe(200)
  })

  it('returns 400 on mutation error', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_ADMIN)
    mockBatchApproveVehiclesMutation.mockResolvedValue({ error: 'Some failed' })
    const req = createJsonRequest('POST', 'http://localhost/test', { vehicleIds: ['v1'] })
    const res = await batchApprove(req)
    expect(res.status).toBe(400)
  })
})

// ── PATCH /api/vehicles/[id]/images/reorder ───────────────────────

describe('PATCH /api/vehicles/[id]/images/reorder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockReorderImagesMutation.mockResolvedValue({ reordered: true })
    const req = createJsonRequest('PATCH', 'http://localhost/test', {
      orderedImageIds: ['img1', 'img2'],
    })
    const res = await reorderImages(req, makeParams())
    expect(res.status).toBe(200)
  })
})

// ── DELETE /api/vehicles/[id]/images/[imageId] ────────────────────

describe('DELETE /api/vehicles/[id]/images/[imageId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const req = new Request('http://localhost/test', { method: 'DELETE' })
    const res = await deleteImage(req, makeImageParams())
    expect(res.status).toBe(401)
  })

  it('returns 200 on success', async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_DEALER)
    mockDeleteImageMutation.mockResolvedValue({ deleted: true })
    const req = new Request('http://localhost/test', { method: 'DELETE' })
    const res = await deleteImage(req, makeImageParams())
    expect(res.status).toBe(200)
  })
})
