---
phase: 21
slug: infrastructure-foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-27
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.1 + happy-dom |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `bun run test` |
| **Full suite command** | `bun run test:coverage` (after CQ-01 setup) |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run test`
- **After every plan wave:** Run `bun run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | SEC-01 | unit | `bun run test -- src/proxy.test.ts` | Needs rename from middleware.test.ts | ⬜ pending |
| 21-01-02 | 01 | 1 | SEC-05, SEC-06 | unit | `bun run test -- tests/unit/security-headers.test.ts` | ❌ W0 | ⬜ pending |
| 21-02-01 | 02 | 1 | PERF-01 | manual-only | Visual: Korean text renders in Pretendard | N/A | ⬜ pending |
| 21-02-02 | 02 | 1 | DS-02 | manual-only | Visual: tokens exist in `:root` and `.dark` | N/A | ⬜ pending |
| 21-03-01 | 03 | 1 | CQ-01 | smoke | `bun run test:coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/proxy.test.ts` — rename from `src/middleware.test.ts`, update imports and function references
- [ ] `@vitest/coverage-v8@^4.1.2` — install as devDependency
- [ ] Coverage config in `vitest.config.mts` — add `coverage` block with `provider: 'v8'`

*Wave 0 is handled within Plan 21-01 Task 1 (proxy rename) and Plan 21-03 Task 1 (coverage setup).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Korean text renders in Pretendard font | PERF-01 | CSS import, font rendering not testable in vitest | Open homepage in browser, inspect computed font-family |
| CSS custom properties exist in :root and .dark | DS-02 | CSS variables, verify via browser dev tools | Open DevTools > Elements > Computed, check for --brand-blue etc. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
