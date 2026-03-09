import { vi } from 'vitest'

export function mockSupabaseClient() {
  const singleFn = vi.fn()
  const eqFn = vi.fn().mockReturnValue({ single: singleFn })
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
  const fromFn = vi.fn().mockReturnValue({ select: selectFn })

  const client = {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: fromFn,
  }

  return {
    client,
    // Convenience accessors for assertions
    mocks: {
      getUser: client.auth.getUser,
      signInWithPassword: client.auth.signInWithPassword,
      signUp: client.auth.signUp,
      signOut: client.auth.signOut,
      from: fromFn,
      select: selectFn,
      eq: eqFn,
      single: singleFn,
    },
  }
}
