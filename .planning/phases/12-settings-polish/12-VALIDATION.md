---
phase: 12
slug: settings-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + happy-dom |
| **Config file** | vitest.config.mts |
| **Quick run command** | `yarn test --reporter=verbose` |
| **Full suite command** | `yarn test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn type-check && yarn test --reporter=verbose`
- **After every plan wave:** Run `yarn test && yarn build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | REQ-V11-08 | unit | `yarn test tests/unit/features/settings/settings-actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | REQ-V11-08 | unit | `yarn test tests/unit/features/settings/settings-actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 12-01-03 | 01 | 1 | REQ-V11-08 | unit | `yarn test tests/unit/features/settings/settings-actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 1 | REQ-V11-09 | unit | `yarn test tests/unit/features/inventory/inventory-upload.test.ts -x` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 1 | REQ-V11-09 | unit | `yarn test tests/unit/features/inventory/inventory-upload.test.ts -x` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 2 | REQ-V11-10 | smoke | `yarn build` | N/A | ⬜ pending |
| 12-03-02 | 03 | 2 | REQ-V11-10 | smoke | `yarn type-check` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/features/settings/settings-actions.test.ts` — stubs for REQ-V11-08 (schema validation, password auth)
- [ ] `tests/unit/features/inventory/inventory-upload.test.ts` — stubs for REQ-V11-09 (CSV row validation, header mapping)

*Both test files are created in Plan 12-03, Wave 2*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Password gate UI flow | REQ-V11-08 | UI interaction requires browser | Enter wrong password → see error; enter correct → see settings |
| CSV file upload UX | REQ-V11-09 | File input requires browser | Select CSV → upload → see inventory table updated |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
