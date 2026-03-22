---
phase: 16
slug: homepage-navigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
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

- **After every task commit:** Run `yarn type-check`
- **After every plan wave:** Run `yarn test --run && yarn type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | HOME-04 | type-check | `yarn type-check` | ✅ | ⬜ pending |
| 16-01-02 | 01 | 1 | HOME-05, HOME-06 | type-check | `yarn type-check` | ✅ | ⬜ pending |
| 16-02-01 | 02 | 2 | HOME-01 | unit | `yarn test --run` | ❌ W0 | ⬜ pending |
| 16-02-02 | 02 | 2 | HOME-02, HOME-03 | unit | `yarn test --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing test infrastructure covers type-checking for all layout components
- Unit tests for Embla Carousel autoplay behavior may need new test stubs
- Phase 15 vehicle card tests already exist and cover HOME-03 card reuse

*Existing infrastructure covers most phase requirements. New carousel tests may be added inline.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Banner autoplay rotation | HOME-01 | Requires visual verification of Embla autoplay timing | Open homepage, verify banners rotate every 3-5s |
| Mega menu hover interaction | HOME-04 | Mouse hover timing requires browser interaction | Hover over nav links, verify dropdown appears/dismisses correctly |
| Mobile responsive layout | HOME-01-06 | Requires viewport resizing and touch gestures | Test at 375px viewport width |
| Breadcrumb navigation paths | HOME-06 | Requires multi-page navigation | Navigate through vehicle detail, search, verify breadcrumb accuracy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
