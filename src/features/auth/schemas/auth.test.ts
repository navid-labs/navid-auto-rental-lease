import { describe, it, expect } from 'vitest'
import { loginSchema, signupSchema, profileUpdateSchema } from './auth'

describe('loginSchema', () => {
  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('rejects password < 6 chars', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '12345' })
    expect(result.success).toBe(false)
  })

  it('accepts valid email + password >= 6 chars', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '123456' })
    expect(result.success).toBe(true)
  })
})

describe('signupSchema', () => {
  const validSignup = {
    email: 'user@test.com',
    password: '12345678',
    confirmPassword: '12345678',
    name: 'Test User',
  }

  it('rejects password < 8 chars', () => {
    const result = signupSchema.safeParse({ ...validSignup, password: '1234567', confirmPassword: '1234567' })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = signupSchema.safeParse({ ...validSignup, confirmPassword: 'different' })
    expect(result.success).toBe(false)
  })

  it('rejects name < 1 char', () => {
    const result = signupSchema.safeParse({ ...validSignup, name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts valid signup data', () => {
    const result = signupSchema.safeParse(validSignup)
    expect(result.success).toBe(true)
  })

  it('accepts signup with optional phone', () => {
    const result = signupSchema.safeParse({ ...validSignup, phone: '010-1234-5678' })
    expect(result.success).toBe(true)
  })
})

describe('profileUpdateSchema', () => {
  it('rejects empty name', () => {
    const result = profileUpdateSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts name + optional phone', () => {
    const result = profileUpdateSchema.safeParse({ name: 'Test', phone: '010-1234-5678' })
    expect(result.success).toBe(true)
  })

  it('accepts name without phone', () => {
    const result = profileUpdateSchema.safeParse({ name: 'Test' })
    expect(result.success).toBe(true)
  })
})
