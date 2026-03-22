---
phase: 15
slug: search-listing-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + happy-dom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `yarn test --reporter=verbose` |
| **Full suite command** | `yarn test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test --reporter=verbose`
- **After every plan wave:** Run `yarn test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | SEARCH-01 | unit | `yarn test tests/unit/features/vehicles/search-filters.test.ts` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | SEARCH-02 | unit | `yarn test tests/unit/features/vehicles/vehicle-card.test.ts` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 1 | SEARCH-03 | unit | `yarn test tests/unit/features/vehicles/infinite-scroll.test.ts` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 1 | SEARCH-04 | unit | `yarn test tests/unit/features/vehicles/sort-options.test.ts` | ❌ W0 | ⬜ pending |
| 15-03-01 | 03 | 2 | SEARCH-05 | unit | `yarn test tests/unit/features/vehicles/comparison.test.ts` | ❌ W0 | ⬜ pending |
| 15-03-02 | 03 | 2 | SEARCH-06 | unit | `yarn test tests/unit/features/vehicles/active-filters.test.ts` | ❌ W0 | ⬜ pending |
| 15-03-03 | 03 | 2 | SEARCH-07 | unit | `yarn test tests/unit/features/vehicles/mobile-filters.test.ts` | ❌ W0 | ⬜ pending |
| 15-03-04 | 03 | 2 | SEARCH-08 | unit | `yarn test tests/unit/features/vehicles/seo-meta.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/features/vehicles/search-filters.test.ts` — stubs for SEARCH-01
- [ ] `tests/unit/features/vehicles/vehicle-card.test.ts` — stubs for SEARCH-02
- [ ] `tests/unit/features/vehicles/infinite-scroll.test.ts` — stubs for SEARCH-03
- [ ] `tests/unit/features/vehicles/sort-options.test.ts` — stubs for SEARCH-04
- [ ] `tests/unit/features/vehicles/comparison.test.ts` — stubs for SEARCH-05
- [ ] `tests/unit/features/vehicles/active-filters.test.ts` — stubs for SEARCH-06
- [ ] `tests/unit/features/vehicles/mobile-filters.test.ts` — stubs for SEARCH-07
- [ ] `tests/unit/features/vehicles/seo-meta.test.ts` — stubs for SEARCH-08

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Infinite scroll visual smoothness | SEARCH-03 | Requires visual scroll behavior | Scroll listing page, verify skeleton UI appears and loads seamlessly |
| Mobile filter sheet UX | SEARCH-07 | Requires 375px viewport interaction | Open mobile viewport, tap filter button, verify Sheet opens with all filters |
| Vehicle comparison side-by-side layout | SEARCH-05 | Visual layout verification | Add 3 vehicles to compare, verify table renders correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
