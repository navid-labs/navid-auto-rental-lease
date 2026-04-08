import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/response'

describe('apiSuccess', () => {
  it('returns 200 with data wrapper by default', async () => {
    const res = apiSuccess({ id: 1 })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ data: { id: 1 } })
  })

  it('returns custom status code', async () => {
    const res = apiSuccess({ id: 1 }, 201)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toEqual({ data: { id: 1 } })
  })

  it('handles null data', async () => {
    const res = apiSuccess(null)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ data: null })
  })

  it('handles array data', async () => {
    const res = apiSuccess([1, 2, 3])

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ data: [1, 2, 3] })
  })
})

describe('apiError', () => {
  it('returns 400 by default with error message', async () => {
    const res = apiError('bad request')

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'bad request' })
  })

  it('returns custom status code', async () => {
    const res = apiError('not found', 404)

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'not found' })
  })

  it('returns 500 for server error', async () => {
    const res = apiError('internal server error', 500)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'internal server error' })
  })
})

describe('apiValidationError', () => {
  it('returns 422 with validation details from ZodError', async () => {
    const schema = z.object({ name: z.string(), age: z.number() })
    const result = schema.safeParse({ name: 123, age: 'not-a-number' })

    // safeParse should fail
    expect(result.success).toBe(false)
    if (result.success) return

    const res = apiValidationError(result.error)

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toBe('유효성 검증 실패')
    expect(body.details).toBeInstanceOf(Array)
    expect(body.details.length).toBe(2)
    expect(body.details[0]).toHaveProperty('path')
    expect(body.details[0]).toHaveProperty('message')
  })

  it('includes correct path for nested errors', async () => {
    const schema = z.object({
      user: z.object({ email: z.string().email() }),
    })
    const result = schema.safeParse({ user: { email: 'invalid' } })

    expect(result.success).toBe(false)
    if (result.success) return

    const res = apiValidationError(result.error)
    const body = await res.json()

    expect(body.details[0].path).toBe('user.email')
  })
})
