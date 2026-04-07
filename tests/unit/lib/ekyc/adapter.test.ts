import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { MockKcbAdapter } from '@/lib/ekyc/mock-adapter'

const BASE_INPUT = {
  name: '홍길동',
  phone: '010-1234-5678',
  carrier: 'SKT',
  birthDate: '19900101',
  gender: 'M',
  verificationCode: '123456',
}

describe('MockKcbAdapter', () => {
  let adapter: MockKcbAdapter

  beforeEach(() => {
    vi.useFakeTimers()
    adapter = new MockKcbAdapter()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── sendVerificationCode ──────────────────────────────────────────

  describe('sendVerificationCode', () => {
    it('returns { sent: true } on first call', async () => {
      const promise = adapter.sendVerificationCode('010-1234-5678')
      vi.advanceTimersByTime(500)
      const result = await promise
      expect(result).toEqual({ sent: true })
    })

    it('allows up to MAX_SEND_ATTEMPTS (3) within the window', async () => {
      for (let i = 0; i < 3; i++) {
        const p = adapter.sendVerificationCode('010-1111-2222')
        vi.advanceTimersByTime(500)
        await expect(p).resolves.toEqual({ sent: true })
      }
    })

    it('throws after exceeding 3 send attempts within 5-minute window', async () => {
      // Exhaust the 3 allowed attempts
      for (let i = 0; i < 3; i++) {
        const p = adapter.sendVerificationCode('010-9999-8888')
        vi.advanceTimersByTime(500)
        await p
      }

      // 4th attempt should throw
      await expect(
        adapter.sendVerificationCode('010-9999-8888')
      ).rejects.toThrow('인증번호 발송 횟수를 초과했습니다 (5분 후 재시도)')
    })

    it('resets rate limit after the 5-minute window expires', async () => {
      // Exhaust attempts
      for (let i = 0; i < 3; i++) {
        const p = adapter.sendVerificationCode('010-7777-6666')
        vi.advanceTimersByTime(500)
        await p
      }

      // Advance past the 5-minute window
      vi.advanceTimersByTime(5 * 60 * 1000 + 1)

      // Should succeed again
      const p = adapter.sendVerificationCode('010-7777-6666')
      vi.advanceTimersByTime(500)
      await expect(p).resolves.toEqual({ sent: true })
    })

    it('rate limiting is per-phone (different phones are independent)', async () => {
      // Exhaust phone A
      for (let i = 0; i < 3; i++) {
        const p = adapter.sendVerificationCode('010-1111-1111')
        vi.advanceTimersByTime(500)
        await p
      }

      // Phone B should still work
      const p = adapter.sendVerificationCode('010-2222-2222')
      vi.advanceTimersByTime(500)
      await expect(p).resolves.toEqual({ sent: true })
    })
  })

  // ── verifyIdentity ────────────────────────────────────────────────

  describe('verifyIdentity', () => {
    it('returns a verified result for correct code', async () => {
      const p = adapter.verifyIdentity(BASE_INPUT)
      vi.advanceTimersByTime(500)
      const result = await p

      expect(result.verified).toBe(true)
      expect(result.name).toBe(BASE_INPUT.name)
      expect(result.phone).toBe(BASE_INPUT.phone)
      expect(result.carrier).toBe('SKT')
      expect(result.birthDate).toBe(BASE_INPUT.birthDate)
      expect(result.gender).toBe('M')
      expect(result.verifiedAt).toBeInstanceOf(Date)
    })

    it('throws for incorrect verification code', async () => {
      const p = adapter.verifyIdentity({ ...BASE_INPUT, verificationCode: '000000' })
      vi.advanceTimersByTime(500)
      await expect(p).rejects.toThrow('인증번호가 일치하지 않습니다.')
    })

    it('throws after exceeding 5 verify attempts', async () => {
      // Use up 5 attempts (all with wrong code to avoid consuming the pass slot)
      for (let i = 0; i < 5; i++) {
        const p = adapter.verifyIdentity({ ...BASE_INPUT, verificationCode: 'wrong' })
        vi.advanceTimersByTime(500)
        await p.catch(() => {}) // swallow expected errors
      }

      // 6th attempt should throw the lockout error
      await expect(
        adapter.verifyIdentity(BASE_INPUT)
      ).rejects.toThrow('인증 시도 횟수를 초과했습니다 (30분 후 재시도)')
    })

    it('verify attempt counter is per-phone', async () => {
      // Exhaust attempts for phone A
      for (let i = 0; i < 5; i++) {
        const p = adapter.verifyIdentity({ ...BASE_INPUT, verificationCode: 'wrong' })
        vi.advanceTimersByTime(500)
        await p.catch(() => {})
      }

      // Phone B should still work
      const p = adapter.verifyIdentity({ ...BASE_INPUT, phone: '010-9999-0000' })
      vi.advanceTimersByTime(500)
      await expect(p).resolves.toMatchObject({ verified: true })
    })
  })

  // ── CI / DI length validation ─────────────────────────────────────

  describe('CI and DI generation', () => {
    it('ci is exactly 88 characters', async () => {
      const p = adapter.verifyIdentity(BASE_INPUT)
      vi.advanceTimersByTime(500)
      const result = await p
      expect(result.ci).not.toBeNull()
      expect(result.ci!.length).toBe(88)
    })

    it('di is exactly 64 characters', async () => {
      const p = adapter.verifyIdentity(BASE_INPUT)
      vi.advanceTimersByTime(500)
      const result = await p
      expect(result.di).not.toBeNull()
      expect(result.di!.length).toBe(64)
    })

    it('ci and di are deterministic for the same phone', async () => {
      const p1 = adapter.verifyIdentity(BASE_INPUT)
      vi.advanceTimersByTime(500)
      const r1 = await p1

      // New adapter instance — same phone should yield same CI/DI
      const adapter2 = new MockKcbAdapter()
      const p2 = adapter2.verifyIdentity(BASE_INPUT)
      vi.advanceTimersByTime(500)
      const r2 = await p2

      expect(r1.ci).toBe(r2.ci)
      expect(r1.di).toBe(r2.di)
    })

    it('ci and di differ between different phones', async () => {
      const p1 = adapter.verifyIdentity(BASE_INPUT)
      vi.advanceTimersByTime(500)
      const r1 = await p1

      const adapter2 = new MockKcbAdapter()
      const p2 = adapter2.verifyIdentity({ ...BASE_INPUT, phone: '010-0000-0000' })
      vi.advanceTimersByTime(500)
      const r2 = await p2

      expect(r1.ci).not.toBe(r2.ci)
      expect(r1.di).not.toBe(r2.di)
    })
  })
})
