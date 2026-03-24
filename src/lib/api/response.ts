import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export function apiValidationError(error: ZodError): NextResponse {
  const details = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
  return NextResponse.json(
    { error: '유효성 검증 실패', details },
    { status: 422 },
  )
}
