import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const signOut = vi.fn()
  const redirect = vi.fn()

  return {
    client: {
      auth: { getUser: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(), signOut },
      from: vi.fn(),
    },
    signOut,
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

import { logout } from './logout'

describe('logout action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase.auth.signOut and redirects to /', async () => {
    mocks.signOut.mockResolvedValue({ error: null })

    await expect(logout()).rejects.toThrow('NEXT_REDIRECT')

    expect(mocks.signOut).toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/')
  })
})
