---
phase: 8
slug: contract-completion-my-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 8 — Validation Strategy

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
- **After every plan wave:** Run `yarn test && yarn type-check && yarn lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | CONT-03 | unit | `yarn vitest run src/features/contracts/components/contract-pdf.test.tsx -t "generates PDF"` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | CONT-03 | integration | `yarn vitest run src/app/api/contracts/pdf.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | CONT-03 | unit | `yarn vitest run src/app/api/contracts/pdf.test.ts -t "unauthorized"` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | CONT-04 | unit | `yarn vitest run src/features/contracts/components/contract-list.test.tsx` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | CONT-04 | unit | `yarn vitest run src/features/contracts/components/contract-list.test.tsx -t "filter"` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 1 | UIEX-03 | unit | `yarn vitest run src/features/contracts/components/contract-card.test.tsx` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 1 | UIEX-03 | unit | `yarn vitest run src/features/contracts/components/contract-card.test.tsx -t "download"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/contracts/components/contract-pdf.test.tsx` — stubs for CONT-03 PDF generation
- [ ] `src/features/contracts/components/contract-card.test.tsx` — stubs for UIEX-03 card rendering
- [ ] `src/features/contracts/components/contract-list.test.tsx` — stubs for CONT-04 list + filtering
- [ ] `src/app/api/contracts/pdf.test.ts` — stubs for CONT-03 API auth + streaming

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF Korean text renders correctly | CONT-03 | Font rendering requires visual inspection | Generate PDF, open in browser/viewer, verify Korean characters display |
| PDF download works on mobile Safari | UIEX-03 | Mobile browser behavior varies | Open my page on iOS Safari, tap download, verify PDF opens |
| PDF content matches contract data | CONT-03 | Layout verification needs human review | Compare PDF fields against database values |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
