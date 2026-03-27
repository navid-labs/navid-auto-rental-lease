import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createJsonRequest } from '../../helpers/api-test-utils'

// ── Import handler (no mocks needed) ──────────────────────────────

import { POST } from '@/app/api/csp-report/route'

// ── Tests ─────────────────────────────────────────────────────────

describe('POST /api/csp-report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('returns 204 with valid CSP violation body', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const cspViolation = {
      'csp-report': {
        'document-uri': 'http://localhost:3000',
        'violated-directive': 'script-src',
        'blocked-uri': 'https://evil.com/script.js',
        'original-policy': "default-src 'self'",
      },
    }

    const req = createJsonRequest('POST', 'http://localhost/api/csp-report', cspViolation)
    const res = await POST(req)

    expect(res.status).toBe(204)
  })

  it('returns 204 with report body (no csp-report wrapper)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const body = {
      'document-uri': 'http://localhost:3000',
      'violated-directive': 'img-src',
    }

    const req = createJsonRequest('POST', 'http://localhost/api/csp-report', body)
    const res = await POST(req)

    expect(res.status).toBe(204)
  })

  it('returns 400 with malformed JSON', async () => {
    const req = new Request('http://localhost/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{{{',
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})
