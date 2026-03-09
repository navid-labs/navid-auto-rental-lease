import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const singleFn = vi.fn()
  const eqFn = vi.fn().mockReturnValue({ single: singleFn })
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
  const fromFn = vi.fn().mockReturnValue({ select: selectFn })
  const signInWithPassword = vi.fn()
  const getUser = vi.fn()
  const redirect = vi.fn()

  return {
    client: {
      auth: { getUser, signInWithPassword, signUp: vi.fn(), signOut: vi.fn() },
      from: fromFn,
    },
    signInWithPassword,
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

import { login } from './login'

describe('login action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects invalid input and returns error', async () => {
    const formData = new FormData()
    formData.set('email', '')
    formData.set('password', '')

    const result = await login(formData)
    expect(result?.error).toBe('입력 정보를 확인해주세요.')
    expect(mocks.signInWithPassword).not.toHaveBeenCalled()
  })

  it('returns Korean error on auth failure', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })

    const formData = new FormData()
    formData.set('email', 'test@test.com')
    formData.set('password', '123456')

    const result = await login(formData)
    expect(result?.error).toBe('이메일 또는 비밀번호가 올바르지 않습니다')
  })

  it('redirects ADMIN to /admin/dashboard', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    })
    mocks.single.mockResolvedValue({
      data: { role: 'ADMIN' },
      error: null,
    })

    const formData = new FormData()
    formData.set('email', 'admin@test.com')
    formData.set('password', '123456')

    await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('redirects DEALER to /dealer/dashboard', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-2' } },
      error: null,
    })
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-2' } },
    })
    mocks.single.mockResolvedValue({
      data: { role: 'DEALER' },
      error: null,
    })

    const formData = new FormData()
    formData.set('email', 'dealer@test.com')
    formData.set('password', '123456')

    await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.redirect).toHaveBeenCalledWith('/dealer/dashboard')
  })

  it('redirects CUSTOMER to /mypage', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-3' } },
      error: null,
    })
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-3' } },
    })
    mocks.single.mockResolvedValue({
      data: { role: 'CUSTOMER' },
      error: null,
    })

    const formData = new FormData()
    formData.set('email', 'customer@test.com')
    formData.set('password', '123456')

    await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.redirect).toHaveBeenCalledWith('/mypage')
  })
})
