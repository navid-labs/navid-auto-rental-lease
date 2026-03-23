---
phase: 18
slug: global-spacing-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `yarn test --run` |
| **Full suite command** | `yarn test --run && yarn type-check` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn type-check`
- **After every plan wave:** Run `yarn test --run && yarn type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | GLBL-01 | visual + type-check | `yarn type-check` | ✅ | ⬜ pending |
| 18-01-02 | 01 | 1 | GLBL-02 | visual + type-check | `yarn type-check` | ✅ | ⬜ pending |
| 18-01-03 | 01 | 1 | GLBL-03 | visual + type-check | `yarn type-check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

This phase is pure Tailwind class modifications — no new test files needed. Existing type-check and test suite catch regressions.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nav bar renders at 52px height | GLBL-01 | Visual measurement needed | Open browser devtools, inspect nav element, verify computed height = 52px |
| Content starts with 24-32px below nav | GLBL-02 | Visual spacing check | On each public page, inspect main content top margin/padding in devtools |
| Admin pages follow same spacing | GLBL-03 | Visual verification across admin pages | Navigate to /admin/*, verify consistent top spacing |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
