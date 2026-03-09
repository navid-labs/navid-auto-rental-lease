---
phase: 5
slug: public-search-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (already configured) |
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
| 05-01-01 | 01 | 1 | SRCH-01 | unit | `yarn test src/features/vehicles/lib/search-query.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | SRCH-02 | unit | `yarn test src/features/vehicles/lib/search-query.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | SRCH-05 | unit | `yarn test src/features/vehicles/lib/search-params.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | SRCH-03 | unit | `yarn test src/features/vehicles/actions/create-inquiry.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | UIEX-02 | smoke | Manual verification via dev server | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/vehicles/lib/search-query.test.ts` — stubs for SRCH-01, SRCH-02
- [ ] `src/features/vehicles/actions/create-inquiry.test.ts` — stubs for SRCH-03
- [ ] `src/features/vehicles/lib/search-params.test.ts` — stubs for SRCH-05
- [ ] `npx shadcn@latest add slider` — install slider component
- [ ] `yarn add nuqs` — install URL state management library

*Infrastructure: vitest already configured, no additional framework setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Landing page renders featured vehicles | UIEX-02 | Server Component rendering, visual layout | 1. Start dev server 2. Visit / 3. Verify featured vehicles section renders with cards |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
