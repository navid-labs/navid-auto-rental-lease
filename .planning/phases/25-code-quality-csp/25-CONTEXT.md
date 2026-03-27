# Phase 25: Code Quality + CSP - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Source:** Auto-mode (recommended defaults selected)

<domain>
## Phase Boundary

Final phase of v3.0 Hardening. Expand test coverage to 30%+ with meaningful API route tests, clean up accumulated tech debt, and deploy CSP in Report-Only mode. Tests should validate the post-fix behavior from Phases 21-24, not pre-fix bugs.

</domain>

<decisions>
## Implementation Decisions

### Test Coverage Strategy
- Target: 30%+ line coverage (baseline from Phase 21: 15.64%)
- Priority test targets (behavioral tests with real Request/Response objects):
  1. Auth API routes — login, signup, logout, profile endpoints
  2. Contract creation — full contract wizard API flow
  3. Vehicle search — filter, pagination, detail endpoints
  4. Admin settings — password verification (post-argon2 migration)
  5. Image upload — validation rejection scenarios
- Test pattern: create Request objects, call route handlers directly, assert status codes + response shapes
- NO mocking of Prisma or Supabase client — use `vi.mock()` at module level only where unavoidable
- Use `vi.hoisted()` pattern established in existing tests

### Tech Debt Cleanup
- Replace 4 native `confirm()` dialogs with proper confirmation dialog component
  - Use shadcn AlertDialog (already in component library)
  - Locations: likely in admin CRUD operations and contract actions
- Remove orphaned modules:
  - `EmptyState` component (created but never imported)
  - Finance modules (`acquisition-tax`, `deposit-credit`) — orphaned
- Fix `/contracts` route redirect bug (`/auth/login` should be `/login`)
- Add `/contracts` to PROTECTED_ROUTES in proxy.ts

### CSP Content-Security-Policy-Report-Only
- Deploy as Report-Only header (not enforcing) — data collection phase
- Initial permissive policy:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (Next.js needs these)
  - `style-src 'self' 'unsafe-inline'` (Tailwind inline styles)
  - `img-src 'self' data: https://*.supabase.co https://images.unsplash.com https://cdn.jsdelivr.net`
  - `font-src 'self' https://cdn.jsdelivr.net` (Pretendard CDN)
  - `connect-src 'self' https://*.supabase.co wss://*.supabase.co` (Supabase Realtime)
- Create `/api/csp-report` POST endpoint to receive violation reports
- Add CSP header via next.config.ts headers() (alongside existing security headers)
- Log violations to console in development, structured JSON in production

### Claude's Discretion
- Exact test file organization and naming
- Which orphaned modules to verify before removing
- CSP report endpoint response format
- Whether to add `loading.tsx` for any routes during tech debt cleanup

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Testing
- `vitest.config.mts` — Coverage configuration from Phase 21
- `tests/` — Existing test structure and patterns
- `src/lib/api/auth.ts` — requireAuth/requireRole helpers to test
- `src/lib/api/response.ts` — Response helpers
- `src/lib/api/validation.ts` — Validation helpers

### Tech Debt
- `.planning/MILESTONES.md` — v1.0 known tech debt list (EmptyState, finance modules, confirm dialogs, redirect bug)
- `src/proxy.ts` — PROTECTED_ROUTES map (needs /contracts)

### CSP
- `next.config.ts` — Existing security headers from Phase 21 (add CSP alongside)
- `.planning/research/PITFALLS.md` — CSP domain enumeration warnings

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vi.hoisted()` pattern — established in 50+ test files
- shadcn `AlertDialog` — already available in `src/components/ui/`
- `next.config.ts` `headers()` — already configured from Phase 21, extend with CSP

### Established Patterns
- API route tests use real `Request` objects + direct handler calls
- `vi.mock()` at module level for Prisma client
- Test files in `tests/unit/` mirroring `src/` structure

### Integration Points
- `src/app/api/` — 52 REST endpoints to test
- `src/components/ui/alert-dialog.tsx` — confirm() replacement target
- `next.config.ts` — CSP header addition

</code_context>

<specifics>
## Specific Ideas

- Test coverage should focus on the security fixes from Phase 22 (auth guards, password hashing, upload validation) to prevent regressions
- CSP violations will inform the v4.0 enforcing mode transition

</specifics>

<deferred>
## Deferred Ideas

- CSP enforcing mode — v4.0 (SEC-F01), after Report-Only data collection
- Rate limiting — v4.0 (SEC-F02), depends on Vercel plan tier

</deferred>

---

*Phase: 25-code-quality-csp*
*Context gathered: 2026-03-27 via auto-mode*
