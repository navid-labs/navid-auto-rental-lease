---
phase: 3
slug: vehicle-data-storage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x with happy-dom |
| **Config file** | vitest.config.mts |
| **Quick run command** | `yarn test` |
| **Full suite command** | `yarn test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test`
- **After every plan wave:** Run `yarn test && yarn type-check && yarn lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | VEHI-05 | unit | `yarn vitest run src/features/vehicles/utils/status-machine.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | VEHI-01 | unit | `yarn vitest run src/features/vehicles/schemas/vehicle.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | VEHI-06 | unit | `yarn vitest run src/features/vehicles/utils/plate-adapter.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | VEHI-01 | unit | `yarn vitest run src/features/vehicles/actions/create-vehicle.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | VEHI-04 | unit | `yarn vitest run src/features/vehicles/actions/create-vehicle.test.ts -t "admin"` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | VEHI-03 | unit | `yarn vitest run src/features/vehicles/actions/update-vehicle.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | VEHI-03 | unit | `yarn vitest run src/features/vehicles/actions/delete-vehicle.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | VEHI-02 | unit | `yarn vitest run src/features/vehicles/actions/upload-images.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/vehicles/utils/status-machine.test.ts` — stubs for VEHI-05
- [ ] `src/features/vehicles/schemas/vehicle.test.ts` — stubs for VEHI-01
- [ ] `src/features/vehicles/utils/plate-adapter.test.ts` — stubs for VEHI-06
- [ ] `src/features/vehicles/actions/create-vehicle.test.ts` — stubs for VEHI-01, VEHI-04
- [ ] `src/features/vehicles/actions/upload-images.test.ts` — stubs for VEHI-02
- [ ] `src/features/vehicles/actions/update-vehicle.test.ts` — stubs for VEHI-03
- [ ] `src/features/vehicles/actions/delete-vehicle.test.ts` — stubs for VEHI-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Image drag-reorder UX | VEHI-02 | Requires visual DnD interaction | Open vehicle edit, drag thumbnails, verify order updates |
| Image display quality | VEHI-02 | Visual quality check | Upload photos, verify display at various sizes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
