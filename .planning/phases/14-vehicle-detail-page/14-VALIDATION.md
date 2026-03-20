---
phase: 14
slug: vehicle-detail-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x + happy-dom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `yarn test --run --reporter=verbose` |
| **Full suite command** | `yarn test --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test --run --reporter=verbose`
- **After every plan wave:** Run `yarn test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | DETAIL-12 | unit | `yarn test --run` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | DETAIL-01 | unit | `yarn test --run` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | DETAIL-04 | unit | `yarn test --run` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 1 | DETAIL-02 | unit | `yarn test --run` | ❌ W0 | ⬜ pending |
| 14-03-01 | 03 | 2 | DETAIL-03 | manual | visual inspection | N/A | ⬜ pending |
| 14-03-02 | 03 | 2 | DETAIL-05 | unit | `yarn test --run` | ❌ W0 | ⬜ pending |
| 14-03-03 | 03 | 2 | DETAIL-06 | unit | `yarn test --run` | ❌ W0 | ⬜ pending |
| 14-03-04 | 03 | 2 | DETAIL-07 | manual | visual inspection | N/A | ⬜ pending |
| 14-03-05 | 03 | 2 | DETAIL-08 | manual | visual inspection | N/A | ⬜ pending |
| 14-03-06 | 03 | 2 | DETAIL-09 | unit | `yarn test --run` | ❌ W0 | ⬜ pending |
| 14-03-07 | 03 | 2 | DETAIL-10 | unit | `yarn test --run` | ❌ W0 | ⬜ pending |
| 14-03-08 | 03 | 2 | DETAIL-11 | manual | visual inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/features/vehicles/vehicle-detail-sections.test.ts` — stubs for section components
- [ ] `tests/unit/lib/validation/inspection-schema.test.ts` — Zod schema validation for JSONB data
- [ ] Existing test infrastructure covers framework setup (vitest + happy-dom already configured)

*Existing infrastructure covers framework and config — only test files need creation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SVG body diagram panel highlighting | DETAIL-04 | Complex SVG interaction + hover/tap states | Hover each panel, verify tooltip + color coding |
| Warranty timeline visual rendering | DETAIL-07 | Visual timeline bar layout | Check horizontal bar proportions match warranty periods |
| Home service step indicator | DETAIL-08 | Step indicator visual design | Verify 4-step horizontal flow renders correctly |
| Evaluator profile card | DETAIL-11 | Quote-style card visual design | Check profile photo, name, credentials display |

*Visual/interaction components require manual verification for layout correctness.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
