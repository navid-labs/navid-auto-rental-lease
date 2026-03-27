import type { UserProfile } from '@/lib/auth/helpers'

// ── Mock user profiles for each role ──────────────────────────────

export const MOCK_ADMIN: UserProfile = {
  id: 'admin-uuid-001',
  email: 'admin@test.com',
  name: 'Admin',
  phone: '010-0000-0000',
  role: 'ADMIN',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const MOCK_DEALER: UserProfile = {
  id: 'dealer-uuid-001',
  email: 'dealer@test.com',
  name: 'Dealer',
  phone: '010-1111-1111',
  role: 'DEALER',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const MOCK_CUSTOMER: UserProfile = {
  id: 'customer-uuid-001',
  email: 'customer@test.com',
  name: 'Customer',
  phone: '010-2222-2222',
  role: 'CUSTOMER',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// ── Request helpers ───────────────────────────────────────────────

export function createJsonRequest(
  method: string,
  url: string,
  body?: unknown
): Request {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  return new Request(url, init)
}

export function createFormDataRequest(
  url: string,
  entries: Record<string, string>
): Request {
  const formData = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value)
  }
  return new Request(url, {
    method: 'PATCH',
    body: formData,
  })
}

// ── Response helpers ──────────────────────────────────────────────

export async function getResponseJson(response: Response): Promise<unknown> {
  return response.json()
}
