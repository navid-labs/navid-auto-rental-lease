---
phase: 4
slug: dealer-portal-approval-workflow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (happy-dom) |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `yarn test --run` |
| **Full suite command** | `yarn test --run && yarn type-check` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test --run`
- **After every plan wave:** Run `yarn test --run && yarn type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | VEHI-07a | unit | `yarn test src/features/vehicles/actions/approve-vehicle.test.ts -t "approve"` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | VEHI-07b | unit | `yarn test src/features/vehicles/actions/approve-vehicle.test.ts -t "reject"` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | VEHI-07c | unit | `yarn test src/features/vehicles/actions/approve-vehicle.test.ts -t "batch"` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | VEHI-07d | unit | `yarn test src/features/vehicles/actions/create-vehicle.test.ts -t "approval"` | ✅ extend | ⬜ pending |
| 04-01-05 | 01 | 1 | VEHI-07e | unit | `yarn test src/features/vehicles/actions/update-vehicle.test.ts -t "approval reset"` | ✅ extend | ⬜ pending |
| 04-02-01 | 02 | 1 | DEAL-01a | unit | `yarn test src/app/dealer/dashboard/page.test.tsx` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | DEAL-01b | unit | `yarn test src/features/vehicles/components/approval-badge.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/vehicles/actions/approve-vehicle.test.ts` — stubs for VEHI-07a/b/c
- [ ] `src/features/vehicles/components/approval-badge.test.tsx` — stubs for DEAL-01b
- [ ] `src/app/dealer/dashboard/page.test.tsx` — stubs for DEAL-01a
- [ ] Extend `src/features/vehicles/actions/create-vehicle.test.ts` with approval status tests — VEHI-07d
- [ ] Extend `src/features/vehicles/actions/update-vehicle.test.ts` with approval reset tests — VEHI-07e

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Notification dot appears on sidebar | DEAL-01 | localStorage + UI timing | 1. Login as dealer 2. Have admin approve/reject a vehicle 3. Verify dot appears on sidebar |
| Batch select checkbox UX | VEHI-07 | Interactive DOM state | 1. Go to admin approval queue 2. Select multiple vehicles 3. Click "Approve Selected" 4. Verify all approved |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
