---
phase: 7
slug: contract-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + happy-dom |
| **Config file** | vitest.config.mts |
| **Quick run command** | `yarn test src/features/contracts/ --reporter=verbose` |
| **Full suite command** | `yarn test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test src/features/contracts/ --reporter=verbose`
- **After every plan wave:** Run `yarn test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | CONT-06 | unit | `yarn test src/features/contracts/utils/contract-machine.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | CONT-01 | unit | `yarn test src/features/contracts/schemas/contract.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | CONT-01 | unit | `yarn test src/features/contracts/actions/create-contract.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | CONT-02 | unit | `yarn test src/features/contracts/utils/mock-ekyc.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | CONT-07 | unit | `yarn test src/features/contracts/actions/approve-contract.test.ts` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | CONT-05 | unit | `yarn test src/features/contracts/hooks/use-contract-realtime.test.ts` | ❌ W0 | ⬜ pending |
| 07-03-02 | 03 | 2 | CONT-06 | unit | `yarn test src/features/contracts/actions/update-contract.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/contracts/utils/contract-machine.test.ts` — stubs for CONT-06 state transitions
- [ ] `src/features/contracts/schemas/contract.test.ts` — stubs for CONT-01 form validation
- [ ] `src/features/contracts/utils/mock-ekyc.test.ts` — stubs for CONT-02 mock verification
- [ ] `src/features/contracts/actions/create-contract.test.ts` — stubs for CONT-01 creation + double-booking
- [ ] `src/features/contracts/actions/approve-contract.test.ts` — stubs for CONT-07 admin approval
- [ ] `src/features/contracts/hooks/use-contract-realtime.test.ts` — stubs for CONT-05 realtime
- [ ] `src/features/contracts/actions/update-contract.test.ts` — stubs for CONT-06 server transition enforcement

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase Realtime subscription updates UI | CONT-05 | Requires live Supabase connection + browser | 1. Open contract detail page 2. Update contract status via admin 3. Verify UI updates without refresh |
| eKYC wizard UX flow (4 steps) | CONT-02 | Visual verification of step transitions | 1. Start contract application 2. Walk through all 4 wizard steps 3. Verify eKYC form renders Korean PASS-style UI |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
