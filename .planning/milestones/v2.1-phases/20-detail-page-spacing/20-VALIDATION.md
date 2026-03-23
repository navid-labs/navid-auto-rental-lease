---
phase: 20
slug: detail-page-spacing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `yarn type-check` |
| **Full suite command** | `yarn type-check && yarn test --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn type-check`
- **After every plan wave:** Run `yarn type-check && yarn test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | DETL-01, DETL-02, DETL-03 | type-check | `yarn type-check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Changes are Tailwind class modifications plus one existing component import — `yarn type-check` validates TypeScript integrity.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Breadcrumb visible between nav and gallery | DETL-01 | Visual layout verification | Open vehicle detail page, verify breadcrumb trail appears with 24px spacing |
| Similar vehicles 3-col grid | DETL-02 | Visual layout verification | Scroll to similar vehicles section on desktop, verify 3 columns |
| Uniform 32px section gaps | DETL-03 | Visual spacing measurement | Use DevTools to measure gaps between info section cards |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
