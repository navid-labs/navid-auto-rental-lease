import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const singleFn = vi.fn()
  const eqFn = vi.fn().mockReturnValue({ single: singleFn })
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
  const fromFn = vi.fn().mockReturnValue({ select: selectFn })
  const signUp = vi.fn()
  const signOut = vi.fn()
  const signInWithPassword = vi.fn()
  const getUser = vi.fn()
  const redirect = vi.fn()

  return {
    client: {
      auth: { getUser, signInWithPassword, signUp, signOut },
      from: fromFn,
    },
    signUp,
    getUser,
    single: singleFn,
    redirect,
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mocks.client),
}))

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mocks.redirect(...args)
    throw new Error('NEXT_REDIRECT')
  },
}))

import { signup } from './signup'

describe('signup action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects invalid input and returns error', async () => {
    const formData = new FormData()
    formData.set('email', 'invalid')
    formData.set('password', '123')
    formData.set('confirmPassword', '123')
    formData.set('name', '')

    const result = await signup(formData)
    expect(result?.error).toBe('입력 정보를 확인해주세요.')
    expect(mocks.signUp).not.toHaveBeenCalled()
  })

  it('calls supabase.auth.signUp with valid input', async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: '1' } }, error: null })

    const formData = new FormData()
    formData.set('email', 'test@test.com')
    formData.set('password', '12345678')
    formData.set('confirmPassword', '12345678')
    formData.set('name', 'Test User')

    await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT')

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: '12345678',
      options: { data: { name: 'Test User' } },
    })
    expect(mocks.redirect).toHaveBeenCalledWith('/login')
  })

  it('returns Korean error on Supabase failure', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    })

    const formData = new FormData()
    formData.set('email', 'test@test.com')
    formData.set('password', '12345678')
    formData.set('confirmPassword', '12345678')
    formData.set('name', 'Test User')

    const result = await signup(formData)
    expect(result?.error).toBe('이미 가입된 이메일입니다')
  })
})
