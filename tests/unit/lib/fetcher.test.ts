import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { customFetch, ApiError } from '@/lib/api/fetcher'

describe('customFetch', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns JSON data on successful response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ data: 'test' }),
    })

    const result = await customFetch('/api/test')
    expect(result).toEqual({ data: 'test' })
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('throws ApiError on non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
      json: () => Promise.resolve({ error: 'Not found' }),
    })

    await expect(customFetch('/api/missing')).rejects.toThrow(ApiError)
    await expect(customFetch('/api/missing')).rejects.toThrow('Not found')
  })

  it('handles failed JSON parsing in error response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers(),
      json: () => Promise.reject(new Error('invalid json')),
    })

    await expect(customFetch('/api/broken')).rejects.toThrow('Internal Server Error')
  })

  it('returns blob for PDF content-type', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/pdf' }),
      blob: () => Promise.resolve(mockBlob),
    })

    const result = await customFetch('/api/pdf')
    expect(result).toBe(mockBlob)
  })

  it('does not set Content-Type for FormData body', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true }),
    })

    const formData = new FormData()
    formData.append('file', 'test')
    await customFetch('/api/upload', { method: 'POST', body: formData })

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {},
    })
  })

  it('passes through custom headers', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    })

    await customFetch('/api/test', {
      headers: { Authorization: 'Bearer token' },
    })

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
    })
  })
})

describe('ApiError', () => {
  it('has correct properties', () => {
    const error = new ApiError(404, 'Not found')
    expect(error.status).toBe(404)
    expect(error.message).toBe('Not found')
    expect(error.name).toBe('ApiError')
    expect(error).toBeInstanceOf(Error)
  })
})
