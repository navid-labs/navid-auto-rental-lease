---
phase: 16
slug: homepage-navigation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-22
updated: 2026-03-22
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + happy-dom |
| **Config file** | vitest.config.ts |
| **Quick run command** | `yarn test --run` |
| **Full suite command** | `yarn test --run && yarn type-check` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn type-check` + relevant test file
- **After every plan wave:** Run `yarn test --run && yarn type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-00 | 01 | 1 | HOME-01, HOME-02 | scaffold | `yarn type-check` | N/A (creates test files) | ⬜ pending |
| 16-01-01 | 01 | 1 | HOME-01 | unit | `yarn test --run src/features/marketing/components/hero-banner.test.tsx` | ✅ (Task 0) | ⬜ pending |
| 16-01-02 | 01 | 1 | — | type-check | `yarn type-check` | ✅ | ⬜ pending |
| 16-01-03 | 01 | 1 | HOME-02 | unit | `yarn test --run src/features/marketing/components/quick-links.test.tsx` | ✅ (Task 0) | ⬜ pending |
| 16-02-00 | 02 | 1 | HOME-03 | scaffold | `yarn type-check` | N/A (creates test file) | ⬜ pending |
| 16-02-01 | 02 | 1 | HOME-03 | unit | `yarn test --run src/features/marketing/components/recommended-vehicles.test.tsx` | ✅ (Task 0) | ⬜ pending |
| 16-02-02 | 02 | 1 | — | type-check | `yarn type-check` | ✅ | ⬜ pending |
| 16-03-00 | 03 | 1 | HOME-04 | scaffold | `yarn type-check` | N/A (creates test file) | ⬜ pending |
| 16-03-01 | 03 | 1 | HOME-04 | unit | `yarn test --run src/components/layout/header.test.tsx` | ✅ (Task 0) | ⬜ pending |
| 16-03-02 | 03 | 1 | HOME-04 | unit | `yarn test --run src/components/layout/header.test.tsx` | ✅ (Task 0) | ⬜ pending |
| 16-04-00 | 04 | 2 | HOME-05, HOME-06 | scaffold | `yarn type-check` | N/A (creates test files) | ⬜ pending |
| 16-04-01 | 04 | 2 | HOME-05 | unit | `yarn test --run src/components/layout/footer.test.tsx` | ✅ (Task 0) | ⬜ pending |
| 16-04-02 | 04 | 2 | HOME-06 | unit | `yarn test --run src/components/layout/breadcrumb-nav.test.tsx` | ✅ (Task 0) | ⬜ pending |
| 16-04-03 | 04 | 2 | HOME-01-06 | build | `yarn type-check && yarn build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Each plan creates its own test scaffolds as Task 0:

- [x] Plan 01 Task 0: `src/features/marketing/components/hero-banner.test.tsx` — covers HOME-01
- [x] Plan 01 Task 0: `src/features/marketing/components/quick-links.test.tsx` — covers HOME-02
- [x] Plan 02 Task 0: `src/features/marketing/components/recommended-vehicles.test.tsx` — covers HOME-03
- [x] Plan 03 Task 0: `src/components/layout/header.test.tsx` — covers HOME-04
- [x] Plan 04 Task 0: `src/components/layout/footer.test.tsx` — covers HOME-05
- [x] Plan 04 Task 0: `src/components/layout/breadcrumb-nav.test.tsx` — covers HOME-06

All 6 test files from RESEARCH.md Wave 0 gaps are now covered by plan Task 0s.

---

## Sampling Continuity Check

**No more than 2 consecutive tasks use only type-check verify:**

- Plan 01: Task 0 (scaffold) → Task 1 (unit test) → Task 2 (type-check only) → Task 3 (unit test) ✅
- Plan 02: Task 0 (scaffold) → Task 1 (unit test) → Task 2 (type-check only) ✅
- Plan 03: Task 0 (scaffold) → Task 1 (unit test) → Task 2 (unit test) ✅
- Plan 04: Task 0 (scaffold) → Task 1 (unit test) → Task 2 (unit test) → Task 3 (build) ✅

Maximum consecutive type-check-only tasks: 1. Nyquist rule satisfied.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Banner autoplay rotation | HOME-01 | Requires visual verification of Embla autoplay timing | Open homepage, verify banners rotate every 3-5s |
| Mega menu hover interaction | HOME-04 | Mouse hover timing requires browser interaction | Hover over nav links, verify dropdown appears/dismisses correctly |
| Mobile responsive layout | HOME-01-06 | Requires viewport resizing and touch gestures | Test at 375px viewport width |
| Breadcrumb navigation paths | HOME-06 | Requires multi-page navigation to all public pages | Navigate through all 8 public pages, verify breadcrumb accuracy |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (6/6 test files)
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
