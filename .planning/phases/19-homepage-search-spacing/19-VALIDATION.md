---
phase: 19
slug: homepage-search-spacing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 19 — Validation Strategy

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
| 19-01-01 | 01 | 1 | HOME-01, HOME-02, HOME-03 | type-check | `yarn type-check` | ✅ | ⬜ pending |
| 19-01-02 | 01 | 1 | HOME-04, SRCH-01 | type-check | `yarn type-check` | ✅ | ⬜ pending |
| 19-02-01 | 02 | 1 | SRCH-02, SRCH-03, SRCH-04 | type-check | `yarn type-check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. All changes are pure Tailwind class modifications — `yarn type-check` validates TypeScript integrity, existing component tests verify rendering.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Homepage section gaps ≥80px | HOME-01 | Visual spacing measurement | Open localhost:3000, measure gaps between hero/search/quick-links/featured/promos/partners using DevTools |
| Featured grid 3-column | HOME-02 | Visual layout verification | Check homepage featured section shows 3 columns on desktop |
| Search card gaps 24px | SRCH-01 | Visual spacing measurement | Open /vehicles, measure gap between vehicle cards |
| Vehicle card internal padding | SRCH-04 | Visual padding verification | Check card image-to-text spacing in DevTools |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
