import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getResponseJson } from '../../helpers/api-test-utils'

// ── Mocks ─────────────────────────────────────────────────────────

const { mockGetModelsByBrand, mockGetGenerationsByModel, mockGetTrimsByGeneration } = vi.hoisted(() => ({
  mockGetModelsByBrand: vi.fn(),
  mockGetGenerationsByModel: vi.fn(),
  mockGetTrimsByGeneration: vi.fn(),
}))
vi.mock('@/features/vehicles/queries/cascade', () => ({
  getModelsByBrand: mockGetModelsByBrand,
  getGenerationsByModel: mockGetGenerationsByModel,
  getTrimsByGeneration: mockGetTrimsByGeneration,
}))

// ── Imports ───────────────────────────────────────────────────────

import { GET as getModels } from '@/app/api/vehicles/brands/[id]/models/route'
import { GET as getGenerations } from '@/app/api/vehicles/models/[id]/generations/route'
import { GET as getTrims } from '@/app/api/vehicles/generations/[id]/trims/route'

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) })

// ── GET /api/vehicles/brands/[id]/models ──────────────────────────

describe('GET /api/vehicles/brands/[id]/models', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with models', async () => {
    mockGetModelsByBrand.mockResolvedValue([{ id: 'm1', name: 'Sonata' }])
    const req = new Request('http://localhost/test')
    const res = await getModels(req, makeParams('brand-1'))
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: [{ id: 'm1', name: 'Sonata' }] })
    expect(mockGetModelsByBrand).toHaveBeenCalledWith('brand-1')
  })

  it('returns 500 on error', async () => {
    mockGetModelsByBrand.mockRejectedValue(new Error('DB error'))
    const req = new Request('http://localhost/test')
    const res = await getModels(req, makeParams('brand-1'))
    expect(res.status).toBe(500)
  })
})

// ── GET /api/vehicles/models/[id]/generations ─────────────────────

describe('GET /api/vehicles/models/[id]/generations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with generations', async () => {
    mockGetGenerationsByModel.mockResolvedValue([{ id: 'g1', name: '8th Gen' }])
    const req = new Request('http://localhost/test')
    const res = await getGenerations(req, makeParams('model-1'))
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: [{ id: 'g1', name: '8th Gen' }] })
  })

  it('returns 500 on error', async () => {
    mockGetGenerationsByModel.mockRejectedValue(new Error('DB error'))
    const req = new Request('http://localhost/test')
    const res = await getGenerations(req, makeParams('model-1'))
    expect(res.status).toBe(500)
  })
})

// ── GET /api/vehicles/generations/[id]/trims ──────────────────────

describe('GET /api/vehicles/generations/[id]/trims', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with trims', async () => {
    mockGetTrimsByGeneration.mockResolvedValue([{ id: 't1', name: 'Premium' }])
    const req = new Request('http://localhost/test')
    const res = await getTrims(req, makeParams('gen-1'))
    expect(res.status).toBe(200)
    const body = await getResponseJson(res)
    expect(body).toEqual({ data: [{ id: 't1', name: 'Premium' }] })
  })

  it('returns 500 on error', async () => {
    mockGetTrimsByGeneration.mockRejectedValue(new Error('DB error'))
    const req = new Request('http://localhost/test')
    const res = await getTrims(req, makeParams('gen-1'))
    expect(res.status).toBe(500)
  })
})
