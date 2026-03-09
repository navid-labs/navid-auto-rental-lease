---
phase: 2
slug: auth-user-mgmt
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | `vitest.config.mts` (exists from Phase 1) |
| **Quick run command** | `yarn test --run` |
| **Full suite command** | `yarn test --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test --run`
- **After every plan wave:** Run `yarn test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | unit | `yarn test src/features/auth/actions/signup.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-02 | unit | `yarn test src/features/auth/actions/login.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | AUTH-03 | unit | `yarn test src/features/auth/actions/logout.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | AUTH-06 | unit | `yarn test src/middleware.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | AUTH-04 | unit | `yarn test src/features/auth/actions/profile.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | AUTH-05 | unit | `yarn test src/features/auth/actions/profile.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/auth/actions/signup.test.ts` — stubs for AUTH-01
- [ ] `src/features/auth/actions/login.test.ts` — stubs for AUTH-02
- [ ] `src/features/auth/actions/logout.test.ts` — stubs for AUTH-03
- [ ] `src/features/auth/actions/profile.test.ts` — stubs for AUTH-04, AUTH-05
- [ ] `src/middleware.test.ts` — stubs for AUTH-06
- [ ] `src/features/auth/schemas/auth.test.ts` — Zod schema validation
- [ ] Supabase client mocking utility (`tests/helpers/mock-supabase.ts`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session persists across browser refresh | AUTH-02 | Requires real browser session | 1. Login 2. Refresh page 3. Verify still authenticated |
| Role change takes effect immediately | AUTH-04 | Requires two concurrent sessions | 1. Admin changes role 2. User refreshes 3. Verify new access |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
