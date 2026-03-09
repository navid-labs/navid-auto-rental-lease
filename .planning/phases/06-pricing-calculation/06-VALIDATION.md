---
phase: 6
slug: pricing-calculation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest with happy-dom |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `yarn test src/lib/finance/calculate.test.ts` |
| **Full suite command** | `yarn test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test src/lib/finance/calculate.test.ts`
- **After every plan wave:** Run `yarn test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | PRIC-01 | unit | `yarn test src/lib/finance/calculate.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | PRIC-01 | unit | `yarn test src/lib/finance/calculate.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | PRIC-01 | unit | `yarn test src/lib/finance/calculate.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | PRIC-02 | unit | `yarn test src/features/pricing/actions/residual-rate.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | PRIC-02 | unit | `yarn test src/features/pricing/actions/residual-rate.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | SRCH-04 | unit | `yarn test src/lib/finance/calculate.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 2 | SRCH-04 | unit | `yarn test src/lib/finance/calculate.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/finance/calculate.test.ts` — stubs for PRIC-01, SRCH-04 core calculations
- [ ] `src/features/pricing/actions/residual-rate.test.ts` — stubs for PRIC-02 CRUD actions

*Existing infrastructure covers test framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slider interaction UX | SRCH-04 | Browser interaction required | Adjust period/deposit sliders, verify real-time update of rental vs lease comparison |
| Responsive layout | SRCH-04 | Visual verification | Check calculator layout on mobile (375px) and desktop (1440px) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
