import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const singleFn = vi.fn()
  const eqFn = vi.fn().mockReturnValue({ single: singleFn })
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
  const fromFn = vi.fn().mockReturnValue({ select: selectFn })
  const getUser = vi.fn()

  return {
    getUser,
    from: fromFn,
    select: selectFn,
    eq: eqFn,
    single: singleFn,
    createServerClient: vi.fn(),
  }
})

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => {
    mocks.createServerClient(...args)
    return {
      auth: { getUser: mocks.getUser },
      from: mocks.from,
    }
  },
}))

// Mock env vars
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

import { proxy } from './proxy'

// Helper to create mock NextRequest
function createMockRequest(pathname: string) {
  const url = new URL(pathname, 'http://localhost:3000')
  return {
    nextUrl: url,
    url: url.toString(),
    cookies: {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
    },
  } as unknown as Parameters<typeof proxy>[0]
}

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('public routes', () => {
    it('passes through / without auth check beyond getUser', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null } })

      const response = await proxy(createMockRequest('/'))
      // from() should NOT be called for public routes (no profile query)
      expect(mocks.from).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('passes through /vehicles without profile query', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null } })

      const response = await proxy(createMockRequest('/vehicles'))
      expect(mocks.from).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
    })
  })

  describe('protected routes - unauthenticated', () => {
    it('redirects /admin to /login if not authenticated', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null } })

      const response = await proxy(createMockRequest('/admin/dashboard'))
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('redirects /dealer to /login if not authenticated', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null } })

      const response = await proxy(createMockRequest('/dealer/dashboard'))
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('redirects /mypage to /login if not authenticated', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null } })

      const response = await proxy(createMockRequest('/mypage'))
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('includes redirect param in login redirect', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null } })

      const response = await proxy(createMockRequest('/admin/users'))
      const location = response.headers.get('location')!
      expect(location).toContain('redirect=%2Fadmin%2Fusers')
    })
  })

  describe('protected routes - wrong role', () => {
    it('redirects CUSTOMER from /admin to /', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mocks.single.mockResolvedValue({ data: { role: 'CUSTOMER' }, error: null })

      const response = await proxy(createMockRequest('/admin/dashboard'))
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('redirects CUSTOMER from /dealer to /', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mocks.single.mockResolvedValue({ data: { role: 'CUSTOMER' }, error: null })

      const response = await proxy(createMockRequest('/dealer/dashboard'))
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('allows ADMIN to access /dealer', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mocks.single.mockResolvedValue({ data: { role: 'ADMIN' }, error: null })

      const response = await proxy(createMockRequest('/dealer/dashboard'))
      expect(response.status).toBe(200)
    })
  })

  describe('protected routes - correct role', () => {
    it('allows ADMIN to access /admin', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mocks.single.mockResolvedValue({ data: { role: 'ADMIN' }, error: null })

      const response = await proxy(createMockRequest('/admin/dashboard'))
      expect(response.status).toBe(200)
    })

    it('allows DEALER to access /dealer', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-2' } } })
      mocks.single.mockResolvedValue({ data: { role: 'DEALER' }, error: null })

      const response = await proxy(createMockRequest('/dealer/dashboard'))
      expect(response.status).toBe(200)
    })

    it('allows CUSTOMER to access /mypage', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-3' } } })
      mocks.single.mockResolvedValue({ data: { role: 'CUSTOMER' }, error: null })

      const response = await proxy(createMockRequest('/mypage'))
      expect(response.status).toBe(200)
    })
  })

  describe('auth pages - already authenticated', () => {
    it('redirects authenticated ADMIN on /login to /admin/dashboard', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mocks.single.mockResolvedValue({ data: { role: 'ADMIN' }, error: null })

      const response = await proxy(createMockRequest('/login'))
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/admin/dashboard')
    })

    it('redirects authenticated CUSTOMER on /signup to /mypage', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-3' } } })
      mocks.single.mockResolvedValue({ data: { role: 'CUSTOMER' }, error: null })

      const response = await proxy(createMockRequest('/signup'))
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/mypage')
    })
  })
})
