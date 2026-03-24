import type { NextResponse } from 'next/server'
import type { ZodType } from 'zod'
import { apiError, apiValidationError } from './response'

type ParseResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: NextResponse }

export async function parseBody<T>(
  schema: ZodType<T>,
  request: Request,
): Promise<ParseResult<T>> {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return { error: apiError('잘못된 JSON 형식입니다', 400) }
  }

  const result = schema.safeParse(json)
  if (!result.success) {
    return { error: apiValidationError(result.error) }
  }
  return { data: result.data }
}

export async function parseQuery<T>(
  schema: ZodType<T>,
  request: Request,
): Promise<ParseResult<T>> {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())

  const result = schema.safeParse(params)
  if (!result.success) {
    return { error: apiValidationError(result.error) }
  }
  return { data: result.data }
}

export function parseParams<T>(
  schema: ZodType<T>,
  params: Record<string, string>,
): ParseResult<T> {
  const result = schema.safeParse(params)
  if (!result.success) {
    return { error: apiValidationError(result.error) }
  }
  return { data: result.data }
}
