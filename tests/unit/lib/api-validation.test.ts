import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { parseBody, parseQuery, parseParams } from '@/lib/api/validation'

const testSchema = z.object({ name: z.string() })

describe('parseBody', () => {
  it('returns data for valid JSON matching schema', async () => {
    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    })

    const result = await parseBody(testSchema, req)

    expect(result.data).toEqual({ name: 'Test' })
    expect(result.error).toBeUndefined()
  })

  it('returns 400 error for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{{{',
    })

    const result = await parseBody(testSchema, req)

    expect(result.data).toBeUndefined()
    expect(result.error).toBeDefined()
    expect(result.error!.status).toBe(400)
    const body = await result.error!.json()
    expect(body.error).toBe('잘못된 JSON 형식입니다')
  })

  it('returns 422 error when JSON does not match schema', async () => {
    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 123 }),
    })

    const result = await parseBody(testSchema, req)

    expect(result.data).toBeUndefined()
    expect(result.error).toBeDefined()
    expect(result.error!.status).toBe(422)
    const body = await result.error!.json()
    expect(body.error).toBe('유효성 검증 실패')
    expect(body.details).toBeInstanceOf(Array)
  })
})

describe('parseQuery', () => {
  it('returns data for valid query params', async () => {
    const req = new Request('http://localhost/api/test?name=hello')

    const result = await parseQuery(testSchema, req)

    expect(result.data).toEqual({ name: 'hello' })
    expect(result.error).toBeUndefined()
  })

  it('returns 422 error for invalid query params', async () => {
    const numberSchema = z.object({ count: z.coerce.number().min(1) })
    const req = new Request('http://localhost/api/test?count=abc')

    const result = await parseQuery(numberSchema, req)

    expect(result.data).toBeUndefined()
    expect(result.error).toBeDefined()
    expect(result.error!.status).toBe(422)
  })

  it('returns 422 when required param is missing', async () => {
    const req = new Request('http://localhost/api/test')

    const result = await parseQuery(testSchema, req)

    expect(result.data).toBeUndefined()
    expect(result.error).toBeDefined()
    expect(result.error!.status).toBe(422)
  })
})

describe('parseParams', () => {
  it('returns data for valid params', () => {
    const idSchema = z.object({ id: z.string().uuid() })
    const testId = '550e8400-e29b-41d4-a716-446655440000'

    const result = parseParams(idSchema, { id: testId })

    expect(result.data).toEqual({ id: testId })
    expect(result.error).toBeUndefined()
  })

  it('returns error for invalid params', () => {
    const idSchema = z.object({ id: z.string().uuid() })

    const result = parseParams(idSchema, { id: 'not-a-uuid' })

    expect(result.data).toBeUndefined()
    expect(result.error).toBeDefined()
  })
})
