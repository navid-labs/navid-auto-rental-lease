---
phase: 9
slug: admin-dashboard-demo-readiness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x + happy-dom |
| **Config file** | vitest.config.mts |
| **Quick run command** | `yarn test` |
| **Full suite command** | `yarn test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test`
- **After every plan wave:** Run `yarn test && yarn type-check && yarn build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | ADMN-01 | unit | `yarn test src/features/admin/actions/soft-delete-vehicle.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | ADMN-01 | unit | `yarn test src/features/admin/actions/deactivate-user.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | ADMN-03 | unit | `yarn test src/features/admin/actions/get-dashboard-stats.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 1 | ADMN-02 | unit | `yarn test src/features/vehicles/actions/approve-vehicle.test.ts` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 2 | ADMN-04 | manual | Existing functionality verified in Phase 6 | N/A | ⬜ pending |
| 09-02-02 | 02 | 2 | E2E | e2e | Playwright demo flow test | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/admin/actions/soft-delete-vehicle.test.ts` — stubs for ADMN-01 vehicle delete
- [ ] `src/features/admin/actions/deactivate-user.test.ts` — stubs for ADMN-01 user management
- [ ] `src/features/admin/actions/get-dashboard-stats.test.ts` — stubs for ADMN-03
- [ ] Skeleton component: `npx shadcn@latest add skeleton`
- [ ] New dependencies: `yarn add recharts sonner`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Residual value CRUD | ADMN-04 | Existing UI from Phase 6 | Navigate to admin residual values, add/edit/delete entries |
| Full demo walkthrough | E2E | Cross-feature user journey | Complete search → register → apply → approve → track flow |
| Mobile responsive | E2E | Visual verification needed | Test all pages on 375px viewport |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
