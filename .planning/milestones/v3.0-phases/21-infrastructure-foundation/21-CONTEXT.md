# Phase 21: Infrastructure Foundation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Platform infrastructure preparation for v3.0 Hardening. Rename middleware to proxy.ts (Next.js 16), add security headers, fix Korean font loading (currently zero Korean glyphs), define CSS token system for design system migration, and install test coverage tooling. All items are independent and parallelizable.

</domain>

<decisions>
## Implementation Decisions

### Font Loading Strategy
- Remove `@fontsource/pretendard` (Latin-only, 3MB wasted, zero Korean glyphs)
- Switch to **Pretendard CDN dynamic subset** via jsDelivr
- Keep all 4 weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- Update `globals.css` to import CDN CSS instead of `@fontsource` packages
- Keep `--font-sans: "Pretendard"` in `@theme inline`

### CSS Token Design
- **Extend shadcn token system** — add brand tokens within existing `@theme inline` block
- New tokens: `--brand-blue` (#3B82F6), `--brand-navy`, `--brand-bg`, `--brand-text`, and ~6 more based on hex audit
- Map hardcoded hex values to these tokens (actual migration is Phase 23)
- **Dark mode tokens defined only** — `.dark` selector with color values in globals.css, but no toggle UI (v4.0)
- Token naming follows shadcn convention: `--{semantic-name}` not `--{color-name}`

### Security Headers
- **Strict policy** applied via `next.config.ts` `headers()` function
- HSTS: `max-age=31536000; includeSubDomains`
- X-Frame-Options: `DENY`
- X-Content-Type-Options: `nosniff`
- Referrer-Policy: `strict-origin-when-cross-origin`
- X-DNS-Prefetch-Control: `on`
- Permissions-Policy: restrict camera, microphone, geolocation
- Applied to all routes via `source: '/(.*)'`

### proxy.ts Migration
- **Simple rename**: `src/middleware.ts` → `src/proxy.ts`
- Change `export async function middleware()` → `export async function proxy()`
- Remove `export const config` (proxy.ts runs on all routes by default in Next.js 16)
- Supabase SSR cookie handling unchanged — `@supabase/ssr` works on Node.js runtime
- Runtime changes from Edge to Node.js — no functional impact for current logic
- Keep existing PROTECTED_ROUTES pattern and role-based access control intact

### Test Coverage Tooling
- Install `@vitest/coverage-v8` as devDependency
- Add `test:coverage` script to package.json: `vitest run --coverage`
- Configure coverage in `vitest.config.ts` with `provider: 'v8'`
- Measure baseline coverage (expected ~3.9%)
- No new tests in this phase — just tooling setup

### Claude's Discretion
- Exact coverage config thresholds (just measure baseline, don't enforce yet)
- Pretendard CDN URL format and exact import syntax
- Any additional security headers beyond the specified set
- `vitest.config.ts` coverage include/exclude patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Font
- Pretendard CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/` — dynamic subset CSS files
- `.planning/research/STACK.md` — Font migration research with CDN URL patterns

### Security
- `.planning/research/ARCHITECTURE.md` — Security header recommendations, unguarded endpoint list
- `src/middleware.ts` — Current middleware to be renamed (110 LOC, Supabase SSR integration)

### CSS Tokens
- `src/app/globals.css` — Current `@theme inline` block, existing shadcn tokens, font imports to replace
- `.planning/research/FEATURES.md` — Hex audit counts and color clustering analysis

### Testing
- `.planning/research/STACK.md` — `@vitest/coverage-v8` version and config recommendations

### Next.js 16
- `.planning/research/PITFALLS.md` — proxy.ts migration warnings, runtime change implications

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/middleware.ts` — 110 LOC, well-structured Supabase auth + role-based routing. Direct rename candidate.
- `src/app/globals.css` — Already has `@theme inline` with shadcn tokens + radius/font definitions. Extend with brand tokens.
- `next.config.ts` — Minimal config (serverExternalPackages, images). Clean location for headers() addition.
- `vitest.config.ts` — Existing vitest setup to extend with coverage provider.

### Established Patterns
- `@theme inline` in globals.css — all Tailwind theme extensions go here
- `@custom-variant dark` — dark mode variant already defined, ready for dark tokens
- shadcn token naming: `--primary`, `--accent`, `--muted`, `--destructive` — follow this pattern

### Integration Points
- `src/app/layout.tsx` — root layout where font class is applied
- `package.json` — scripts section for test:coverage
- `bun.lock` — `@fontsource/pretendard` to be removed, `@vitest/coverage-v8` to be added

</code_context>

<specifics>
## Specific Ideas

- Font loading should produce zero CLS (cumulative layout shift) — CDN dynamic subset handles this via unicode-range
- Security headers should not break Supabase Realtime WebSocket connections
- Dark mode tokens should use the exact same semantic names as light mode (just different values in `.dark` scope)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-infrastructure-foundation*
*Context gathered: 2026-03-27*
