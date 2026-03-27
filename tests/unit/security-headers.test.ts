import { describe, it, expect } from 'vitest'
import nextConfig from '../../next.config'

const REQUIRED_HEADERS = [
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'X-DNS-Prefetch-Control',
  'Permissions-Policy',
  'Content-Security-Policy-Report-Only',
]

describe('security headers in next.config.ts', () => {
  it('has a headers function', () => {
    expect(typeof nextConfig.headers).toBe('function')
  })

  it('returns headers for all routes via /(.*)', async () => {
    const result = await nextConfig.headers!()
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('/(.*)')
  })

  it('includes all 7 required security headers', async () => {
    const result = await nextConfig.headers!()
    const headerKeys = result[0].headers.map((h) => h.key)

    for (const required of REQUIRED_HEADERS) {
      expect(headerKeys).toContain(required)
    }
  })

  it('sets HSTS with max-age of 1 year and includeSubDomains', async () => {
    const result = await nextConfig.headers!()
    const hsts = result[0].headers.find((h) => h.key === 'Strict-Transport-Security')
    expect(hsts?.value).toBe('max-age=31536000; includeSubDomains')
  })

  it('sets X-Frame-Options to DENY', async () => {
    const result = await nextConfig.headers!()
    const xfo = result[0].headers.find((h) => h.key === 'X-Frame-Options')
    expect(xfo?.value).toBe('DENY')
  })

  it('sets X-Content-Type-Options to nosniff', async () => {
    const result = await nextConfig.headers!()
    const xcto = result[0].headers.find((h) => h.key === 'X-Content-Type-Options')
    expect(xcto?.value).toBe('nosniff')
  })

  it('denies camera, microphone, and geolocation in Permissions-Policy', async () => {
    const result = await nextConfig.headers!()
    const pp = result[0].headers.find((h) => h.key === 'Permissions-Policy')
    expect(pp?.value).toContain('camera=()')
    expect(pp?.value).toContain('microphone=()')
    expect(pp?.value).toContain('geolocation=()')
  })

  it('includes Content-Security-Policy-Report-Only header', async () => {
    const result = await nextConfig.headers!()
    const csp = result[0].headers.find((h) => h.key === 'Content-Security-Policy-Report-Only')
    expect(csp).toBeDefined()
    expect(csp!.value).toContain("default-src 'self'")
    expect(csp!.value).toContain("report-uri /api/csp-report")
  })

  it('CSP allows Supabase and Pretendard CDN origins', async () => {
    const result = await nextConfig.headers!()
    const csp = result[0].headers.find((h) => h.key === 'Content-Security-Policy-Report-Only')
    expect(csp!.value).toContain('https://*.supabase.co')
    expect(csp!.value).toContain('https://cdn.jsdelivr.net')
    expect(csp!.value).toContain('wss://*.supabase.co')
  })
})
