---
phase: 17
slug: admin-refresh-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + happy-dom |
| **Config file** | vitest.config.ts |
| **Quick run command** | `yarn test --run` |
| **Full suite command** | `yarn test --run && yarn type-check && yarn build` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn type-check` + relevant test file
- **After every plan wave:** Run `yarn test --run && yarn type-check`
- **Before `/gsd:verify-work`:** Full suite must be green + `yarn build` clean
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | ADMIN-01 | type-check | `yarn type-check` | TBD | ⬜ pending |
| TBD | TBD | TBD | ADMIN-02 | unit | `yarn test --run` | TBD | ⬜ pending |
| TBD | TBD | TBD | ADMIN-03 | build | `yarn build` | TBD | ⬜ pending |
| TBD | TBD | TBD | ADMIN-04 | build+test | `yarn test --run && yarn build` | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Note: Task IDs will be populated after planner creates PLAN.md files.*

---

## Wave 0 Requirements

- Existing test infrastructure (439 tests) covers regression baseline
- Compare-dialog highlighting tests may need new test stubs
- Mobile audit test (e2e/mobile-audit) to be created if Playwright available

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin dashboard visual consistency | ADMIN-01 | Requires visual inspection of color/typography | Open admin dashboard, compare with public pages |
| Comparison highlighting correctness | ADMIN-02 | Requires visual verification of green/red cells | Add 2-3 vehicles to compare, verify highlighting |
| 375px mobile layout | ADMIN-03 | Requires viewport resize and visual check | Test all redesigned pages at 375px width |
| Demo flow end-to-end | ADMIN-04 | Requires multi-step navigation and form submission | Run full search → detail → contract → PDF flow |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
