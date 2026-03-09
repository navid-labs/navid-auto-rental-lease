---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `yarn test` |
| **Full suite command** | `yarn test:coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test`
- **After every plan wave:** Run `yarn test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | UIEX-01 | smoke | Manual viewport check | — | ⬜ pending |
| 01-01-02 | 01 | 1 | FOUND-01 | unit | `yarn test src/lib/supabase/` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | FOUND-02 | unit | `yarn test src/lib/utils/format.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | FOUND-03 | integration | `yarn test src/lib/db/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration file
- [ ] `src/lib/utils/format.test.ts` — Korean locale formatter tests
- [ ] `src/lib/supabase/__tests__/` — Supabase client initialization tests
- [ ] Framework install: `yarn add -D vitest @testing-library/react @testing-library/jest-dom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive layout renders on desktop and mobile | UIEX-01 | Requires visual viewport check | Open app at 375px and 1440px, verify layout renders correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
