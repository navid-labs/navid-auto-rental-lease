# Phase 22: Security Fixes - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Source:** Auto-mode (recommended defaults selected)

<domain>
## Phase Boundary

Patch all known security vulnerabilities: add authentication guards to unprotected API endpoints, replace hardcoded plaintext password with hashed version, and add server-side file type validation for image uploads. Small scope (~80 LOC across 6 files), high impact.

</domain>

<decisions>
## Implementation Decisions

### Auth Guard Pattern
- Use existing `requireAuth()` and `requireRole()` helpers from `src/lib/api/auth.ts`
- Add guards to 5 unprotected endpoints:
  - `/api/admin/inventory/quote-pdf` — requireRole('ADMIN')
  - `/api/contracts/ekyc/send-code` — requireAuth() (any authenticated user)
  - `/api/inquiry` POST — no auth required (public contact form), but add rate limiting note for v4.0
  - `/api/vehicles/[id]/inquiry` POST — no auth required (public), rate limiting deferred
  - `/api/admin/settings/verify-password` — requireRole('ADMIN')
- Return 401 for unauthenticated, 403 for unauthorized role
- Follow existing pattern from other admin API routes

### Password Hashing
- Replace plaintext `admin1234` comparison in `src/features/settings/mutations/auth.ts`
- Use `Bun.password.hash()` with argon2id algorithm (Bun built-in, no extra package)
- Migration strategy: first check if stored value is already a hash (starts with `$argon2`), if not, hash the input and compare with plaintext for backwards compatibility
- Seed script should store hashed version of default password
- `verifySettingsPasswordMutation` uses `Bun.password.verify()` for hash comparison

### File Upload Validation
- Add server-side validation in `src/features/vehicles/mutations/images.ts`
- MIME type whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Magic byte verification: check first 4-8 bytes against known image signatures
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47`
  - WebP: `52 49 46 46` + offset `57 45 42 50`
  - GIF: `47 49 46 38`
- Max file size: 10MB (existing limit, verify it's enforced server-side)
- Reject with descriptive error message in Korean

### Claude's Discretion
- Exact error message wording
- Whether to log security violations
- Test file structure and naming

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth helpers
- `src/lib/api/auth.ts` — requireAuth() and requireRole() helper implementations
- `src/lib/api/response.ts` — API response helpers (successResponse, errorResponse)

### Password
- `src/features/settings/mutations/auth.ts` — Current plaintext password comparison (line 3: `const DEFAULT_PASSWORD = 'admin1234'`)
- `src/app/api/admin/settings/verify-password/route.ts` — API route calling the mutation
- `prisma/seed.ts` — Seed script that may set default password

### File upload
- `src/features/vehicles/mutations/images.ts` — Image upload mutation
- `src/app/api/vehicles/[id]/images/route.ts` — Upload API route handler

### Unprotected endpoints
- `src/app/api/admin/inventory/quote-pdf/route.ts` — No auth guard
- `src/app/api/contracts/ekyc/send-code/route.ts` — No auth guard (if exists)
- `src/app/api/inquiry/route.ts` — Public contact form

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `requireAuth()` / `requireRole()` in `src/lib/api/auth.ts` — already used by ~10 admin routes, proven pattern
- `Bun.password` — built-in argon2id hashing, no package install needed
- `errorResponse()` in `src/lib/api/response.ts` — standardized error responses

### Established Patterns
- Admin routes use `requireRole('ADMIN')` at the top of handler
- Auth routes use `requireAuth()` for any logged-in user
- Error responses return `{ error: string }` with appropriate HTTP status

### Integration Points
- `src/app/api/admin/inventory/quote-pdf/route.ts` — needs guard addition
- `src/features/settings/mutations/auth.ts` — needs hash migration
- `src/features/vehicles/mutations/images.ts` — needs validation addition
- `prisma/seed.ts` — may need password hash update

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard security hardening patterns apply.

</specifics>

<deferred>
## Deferred Ideas

- Rate limiting for public endpoints (inquiry) — deferred to v4.0, depends on Vercel plan tier
- CSRF protection beyond Next.js built-in — already handled by Next.js 16

</deferred>

---

*Phase: 22-security-fixes*
*Context gathered: 2026-03-27 via auto-mode*
