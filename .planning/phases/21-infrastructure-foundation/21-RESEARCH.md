# Phase 21: Infrastructure Foundation - Research

**Researched:** 2026-03-27
**Domain:** Next.js 16 proxy migration, security headers, Korean web font loading, CSS design tokens, test coverage tooling
**Confidence:** HIGH

## Summary

Phase 21 establishes the production infrastructure for v3.0 Hardening. It covers five independent, parallelizable work streams: (1) renaming `middleware.ts` to `proxy.ts` per Next.js 16 conventions, (2) adding security response headers via `next.config.ts`, (3) fixing Korean font loading by replacing the broken `@fontsource/pretendard` (Latin-only) with Pretendard CDN dynamic subset, (4) defining brand CSS custom property tokens in `globals.css`, and (5) installing `@vitest/coverage-v8` to measure test coverage baseline.

All five items are additive or rename-only changes. None modify business logic or database schema. The risk profile is LOW -- the most complex change (font migration) involves removing 4 CSS imports and adding 1 CDN import, while the proxy rename is a file rename + function rename with a codemod available.

**Primary recommendation:** Execute all five work streams in parallel since they touch different files with zero interdependence. Use the official Next.js codemod for the proxy migration. Apply security headers via `next.config.ts` `headers()` function (not in proxy.ts). Load Pretendard via CDN dynamic subset CSS import (91 font subsets with unicode-range, ~50-200KB actual download per page).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Font Loading:** Remove `@fontsource/pretendard` (Latin-only, 3MB wasted, zero Korean glyphs). Switch to Pretendard CDN dynamic subset via jsDelivr. Keep all 4 weights: 400, 500, 600, 700. Update `globals.css` to import CDN CSS. Keep `--font-sans: "Pretendard"` in `@theme inline`.
- **CSS Token Design:** Extend shadcn token system -- add brand tokens within existing `@theme inline` block. New tokens: `--brand-blue` (#3B82F6), `--brand-navy`, `--brand-bg`, `--brand-text`, and ~6 more based on hex audit. Map hardcoded hex values to these tokens (actual migration is Phase 23). Dark mode tokens defined only -- `.dark` selector with color values, but no toggle UI (v4.0). Token naming follows shadcn convention: `--{semantic-name}` not `--{color-name}`.
- **Security Headers:** Strict policy applied via `next.config.ts` `headers()` function. HSTS: `max-age=31536000; includeSubDomains`. X-Frame-Options: `DENY`. X-Content-Type-Options: `nosniff`. Referrer-Policy: `strict-origin-when-cross-origin`. X-DNS-Prefetch-Control: `on`. Permissions-Policy: restrict camera, microphone, geolocation. Applied to all routes via `source: '/(.*)'`.
- **proxy.ts Migration:** Simple rename: `src/middleware.ts` -> `src/proxy.ts`. Change `export async function middleware()` -> `export async function proxy()`. Remove `export const config` (proxy.ts runs on all routes by default in Next.js 16). Supabase SSR cookie handling unchanged. Runtime changes from Edge to Node.js -- no functional impact.
- **Test Coverage Tooling:** Install `@vitest/coverage-v8` as devDependency. Add `test:coverage` script (already exists in package.json). Configure coverage in `vitest.config.mts` with `provider: 'v8'`. Measure baseline coverage. No new tests in this phase.

### Claude's Discretion
- Exact coverage config thresholds (just measure baseline, don't enforce yet)
- Pretendard CDN URL format and exact import syntax
- Any additional security headers beyond the specified set
- `vitest.config.mts` coverage include/exclude patterns

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | middleware.ts -> proxy.ts rename + Node.js runtime | Verified via Next.js 16 official docs: file rename + function rename + remove `export const config`. Codemod available: `npx @next/codemod@canary middleware-to-proxy .` |
| SEC-05 | Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) | Implement via `next.config.ts` `headers()` async function. Pattern verified in Next.js docs execution order: headers run before proxy. |
| SEC-06 | next.config.ts security header configuration | Same as SEC-05 -- headers go in `next.config.ts`, not in proxy.ts. Clean separation of concerns. |
| PERF-01 | @fontsource/pretendard removal -> Pretendard CDN dynamic subset | CDN URL verified: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css`. Contains 91 @font-face declarations with unicode-range. Variable font weight 45-920. |
| DS-02 | ~10 core color CSS variable tokens in globals.css | Extend existing `@theme inline` block and `:root` / `.dark` sections. Add brand tokens mapping to hex values from the hex audit. |
| CQ-01 | @vitest/coverage-v8 install + baseline measurement | Latest compatible version: `@vitest/coverage-v8@^4.1.2` (matches installed vitest 4.1.1). Configure in `vitest.config.mts` with `provider: 'v8'`. |
</phase_requirements>

## Standard Stack

### Core (No New Packages for Runtime)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.1.6 (installed) | Framework -- proxy.ts convention, `headers()` in config | Already installed. Proxy migration is a rename, not an upgrade. |
| `pretendard` (CDN) | v1.3.9 | Korean + Latin variable font via jsDelivr dynamic subset | Official Pretendard distribution. 91 woff2 subsets with unicode-range. Zero npm package needed. |

### Supporting (1 New Dev Dependency)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vitest/coverage-v8` | ^4.1.2 | V8-native code coverage for vitest | Must match vitest major version. Project has vitest 4.1.1 installed. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CDN dynamic subset | `next/font/local` with downloaded woff2 | Self-hosted eliminates CDN dependency but requires downloading 6.4MB file and manual build config. CDN is simpler for demo stage. |
| `@vitest/coverage-v8` | `@vitest/coverage-istanbul` | Istanbul uses source instrumentation (slower). V8 is native engine coverage (faster, equally accurate since Vitest 3.2.0+). |
| `next.config.ts` headers | Security headers in proxy.ts | Headers in config run before proxy in execution order. Cleaner separation. Proxy should focus on routing logic only. |

**Installation:**
```bash
# Add dev dependency
bun add -D @vitest/coverage-v8@^4.1.2

# Remove broken font package
bun remove @fontsource/pretendard
```

**Version verification:**
- `@vitest/coverage-v8`: Latest is 4.1.2 (verified 2026-03-27 via `npm view`)
- `vitest` installed: 4.1.1 (verified via node_modules)
- `next` installed: 16.1.6 (verified via node_modules)

## Architecture Patterns

### Recommended Changes by File

```
src/
├── proxy.ts              # RENAMED from middleware.ts (function renamed too)
├── proxy.test.ts         # RENAMED from middleware.test.ts (imports updated)
├── app/
│   ├── globals.css       # MODIFIED: remove @fontsource imports, add CDN import, add brand tokens
│   └── layout.tsx        # NO CHANGE (font-sans class already correct, CDN handles loading)
next.config.ts            # MODIFIED: add headers() function
vitest.config.mts         # MODIFIED: add coverage config
package.json              # MODIFIED: remove @fontsource/pretendard, devDeps get @vitest/coverage-v8
```

### Pattern 1: proxy.ts Migration (Next.js 16)
**What:** Rename middleware.ts to proxy.ts, rename exported function, remove config matcher.
**When to use:** Required for Next.js 16 compatibility. Deprecated middleware convention still works but will be removed.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
// BEFORE (src/middleware.ts)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // ... auth logic unchanged
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

// AFTER (src/proxy.ts)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // ... auth logic IDENTICAL -- only function name changes
}

// NOTE: Remove `export const config` entirely.
// In Next.js 16, proxy runs on ALL routes by default.
// The existing matcher pattern excluded static files, which proxy already skips.
```

**Critical details from official docs (verified 2026-03-27):**
- The `config.matcher` export is still supported in proxy.ts (optional). But since the current matcher pattern only excludes `_next/static`, `_next/image`, and static file extensions (which proxy already skips by default), removing it is safe.
- Runtime is always Node.js in proxy.ts. Edge runtime is NOT supported. This is fine -- the current middleware uses `createServerClient` from `@supabase/ssr` which works on Node.js.
- The codemod `npx @next/codemod@canary middleware-to-proxy .` handles the rename automatically.

### Pattern 2: Security Headers via next.config.ts
**What:** Add `headers()` async function to next.config.ts that returns security headers for all routes.
**When to use:** For response headers that should apply globally.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/upgrading/version-16 + existing next.config.ts
import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
```

**Execution order (from official docs):**
1. `headers` from `next.config.js` <-- security headers apply here
2. `redirects` from `next.config.js`
3. Proxy (rewrites, redirects, etc.) <-- auth logic here
4. Filesystem routes

This means security headers are set BEFORE proxy runs, which is correct.

### Pattern 3: Pretendard CDN Dynamic Subset Import
**What:** Replace 4 `@fontsource` CSS imports with 1 CDN import in globals.css.
**When to use:** For Korean web font loading with automatic unicode-range subsetting.
**Example:**
```css
/* Source: https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/ (verified) */

/* REMOVE these 4 lines: */
/* @import "@fontsource/pretendard/400.css"; */
/* @import "@fontsource/pretendard/500.css"; */
/* @import "@fontsource/pretendard/600.css"; */
/* @import "@fontsource/pretendard/700.css"; */

/* ADD this 1 line (after tailwindcss imports): */
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");
```

**How it works:**
- The CDN CSS file contains 91 `@font-face` declarations
- Each declaration covers a specific unicode-range (e.g., Korean syllable blocks, Latin, punctuation)
- Browser only downloads the woff2 subset files containing characters actually used on the page
- Variable font format (`woff2-variations`) supports weight 45-920 in a single file per subset
- Typical page load: 50-200KB total (vs 3MB with @fontsource)
- The `--font-sans: "Pretendard"` value in `@theme inline` stays unchanged

**Font-src consideration:** If CSP is added later (Phase 25), `cdn.jsdelivr.net` must be in `font-src` directive.

### Pattern 4: CSS Brand Token Definition
**What:** Add brand-specific CSS custom properties to `:root` and `.dark` in globals.css, with corresponding Tailwind mappings in `@theme inline`.
**When to use:** To bridge the gap between hardcoded hex values in components and the design token system. Token definition happens now; actual component migration is Phase 23.
**Example:**
```css
/* Add to @theme inline block */
@theme inline {
  /* ... existing shadcn tokens ... */
  --color-brand-blue: var(--brand-blue);
  --color-brand-navy: var(--brand-navy);
  --color-brand-bg: var(--brand-bg);
  --color-brand-text: var(--brand-text);
  --color-text-tertiary: var(--text-tertiary);
  --color-accent-muted: var(--accent-muted);
  --color-surface-hover: var(--surface-hover);
}

/* Add to :root */
:root {
  /* ... existing tokens ... */
  --brand-blue: hsl(217 91% 60%);        /* #3B82F6 -- unified brand accent */
  --brand-navy: hsl(220 50% 15%);        /* Primary dark navy */
  --brand-bg: hsl(220 30% 98%);          /* Page background */
  --brand-text: hsl(220 30% 10%);        /* Primary text */
  --text-tertiary: hsl(0 0% 60%);        /* #999999 equivalent */
  --accent-muted: hsl(217 100% 96%);     /* #EBF3FF equivalent */
  --surface-hover: hsl(220 15% 97%);     /* #F5F5F5 equivalent */
}

/* Add to .dark */
.dark {
  /* ... existing tokens ... */
  --brand-blue: hsl(217 91% 65%);
  --brand-navy: hsl(220 50% 20%);
  --brand-bg: hsl(220 40% 8%);
  --brand-text: hsl(220 10% 95%);
  --text-tertiary: hsl(0 0% 50%);
  --accent-muted: hsl(217 50% 15%);
  --surface-hover: hsl(220 25% 12%);
}
```

**Naming convention:** Follows shadcn pattern. Use `--{semantic-name}` (e.g., `--brand-blue`, `--text-tertiary`), not `--{color-name}` (e.g., `--blue-500`). Map to Tailwind via `--color-{name}: var(--{name})` in `@theme inline`.

### Pattern 5: Vitest Coverage Configuration
**What:** Add coverage provider config to vitest.config.mts.
**Example:**
```typescript
// Source: https://vitest.dev/guide/coverage (verified patterns)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    setupFiles: [],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/types/**',
        'src/lib/api/generated/**',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
        'src/app/**/not-found.tsx',
      ],
      reporter: ['text', 'text-summary', 'html'],
      reportsDirectory: './coverage',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Important Vitest 4 note:** `coverage.all` was removed in Vitest 4. Use `coverage.include` to control which files appear in reports. Without it, only files touched by tests appear.

**Do NOT set thresholds yet.** Measure baseline first (expected ~3.9%), then set thresholds in a later phase after writing more tests.

### Anti-Patterns to Avoid

- **Adding security headers in proxy.ts instead of next.config.ts:** Headers in config run first in execution order and are the correct location. Proxy should handle routing logic only. Mixing concerns makes both harder to maintain.
- **Keeping `export const config` in proxy.ts:** The current matcher pattern only excludes static files, which proxy already skips by default. Removing it simplifies the file. However, if kept, it still works -- it is optional in proxy.ts.
- **Using `next/font/local` with the full 6.4MB PretendardVariable.woff2:** The user decided on CDN dynamic subset. Do not self-host the font in this phase.
- **Setting coverage thresholds before measuring baseline:** The user explicitly decided to measure baseline only, not enforce thresholds. Do not add `thresholds` to the coverage config.
- **Migrating hex values to tokens in this phase:** Token DEFINITION is Phase 21. Token MIGRATION (replacing hardcoded hex in components) is Phase 23. Do not touch component files in this phase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| proxy.ts migration | Manual file rename + regex find-replace | `npx @next/codemod@canary middleware-to-proxy .` | Codemod handles file rename, function rename, and config flag renames automatically |
| Font subsetting | Custom unicode-range declarations | Pretendard CDN dynamic subset CSS | 91 pre-built @font-face rules with precise unicode-range. Maintained by font author. |
| Security header middleware | Custom proxy.ts header injection | `next.config.ts` `headers()` function | Built-in Next.js feature, runs before proxy in execution order, cleaner separation |
| Coverage instrumentation | Istanbul source transforms | `@vitest/coverage-v8` with V8 engine native coverage | 2-3x faster, equally accurate since Vitest 3.2.0+ |

**Key insight:** Every task in this phase has an existing, well-supported solution. No custom engineering is needed for any of the five work streams.

## Common Pitfalls

### Pitfall 1: Keeping `export const config` with the wrong assumptions
**What goes wrong:** Developer removes the config but doesn't realize proxy now runs on ALL routes including API routes and static files -- or keeps the config thinking it's required.
**Why it happens:** Confusion between middleware behavior (required matcher) and proxy behavior (runs on all routes, matcher is optional).
**How to avoid:** The current matcher `/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)` only excludes things proxy already skips by default. Removing it is safe. Verify by checking dev server logs for unexpected proxy invocations on static assets.
**Warning signs:** Dev server shows proxy running on `_next/static` requests (unlikely but check).

### Pitfall 2: CDN font import order in globals.css
**What goes wrong:** Placing the Pretendard CDN `@import url(...)` after `@theme inline` or `:root` blocks causes the font to not apply because CSS `@import` must come before any rules.
**Why it happens:** CSS spec requires `@import` statements before all other rules except `@charset`.
**How to avoid:** Place the CDN import right after the existing `@import` statements at the top of globals.css (after `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`). The exact position within the import block does not matter, but it must be before `@custom-variant` and `@theme inline`.
**Warning signs:** Korean text renders in system font (Apple SD Gothic Neo on macOS, Malgun Gothic on Windows) instead of Pretendard.

### Pitfall 3: Test file not renamed alongside middleware
**What goes wrong:** `src/middleware.ts` is renamed to `src/proxy.ts` but `src/middleware.test.ts` is left behind. The test file imports from `./middleware` which no longer exists, causing test failures.
**Why it happens:** The codemod only renames the source file, not the test file.
**How to avoid:** Manually rename `src/middleware.test.ts` to `src/proxy.test.ts`. Update the import: `import { proxy } from './proxy'`. Update all test references from `middleware(...)` to `proxy(...)`. Update the `describe` block name.
**Warning signs:** `bun run test` fails with "Cannot find module './middleware'".

### Pitfall 4: Security headers breaking Supabase Realtime WebSocket
**What goes wrong:** Adding `X-Frame-Options: DENY` or restrictive headers could theoretically interfere with WebSocket upgrade requests.
**Why it happens:** Security headers applied via `next.config.ts` `headers()` affect all responses matching the source pattern.
**How to avoid:** The headers specified (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control) are all safe for WebSocket connections. X-Frame-Options only affects iframe embedding, not WebSocket. No action needed -- just verify Supabase auth login/signup still work after adding headers.
**Warning signs:** Supabase Realtime connection drops after header addition (unlikely but test).

### Pitfall 5: @vitest/coverage-v8 version mismatch with vitest
**What goes wrong:** Installing `@vitest/coverage-v8@4.0.18` (from STACK.md recommendation) when the project has vitest 4.1.1 installed causes version mismatch warnings or failures.
**Why it happens:** Coverage provider major.minor version should match vitest version.
**How to avoid:** Install `@vitest/coverage-v8@^4.1.2` to match the installed vitest 4.1.1. Use `^` prefix to allow patch updates.
**Warning signs:** Vitest warning about coverage provider version mismatch in console output.

## Code Examples

### Complete proxy.ts (after migration)
```typescript
// Source: Current src/middleware.ts + Next.js 16 proxy convention
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/dealer': ['DEALER', 'ADMIN'],
  '/mypage': ['CUSTOMER', 'DEALER', 'ADMIN'],
}

const AUTH_PAGES = ['/login', '/signup']

function getRoleDashboard(role: string): string {
  switch (role) {
    case 'ADMIN': return '/admin/dashboard'
    case 'DEALER': return '/dealer/dashboard'
    default: return '/mypage'
  }
}

// CHANGED: function name from `middleware` to `proxy`
export async function proxy(request: NextRequest) {
  // ... ALL existing logic remains IDENTICAL ...
  // (Supabase client creation, getUser(), protected route checks, auth page redirects)
}

// REMOVED: `export const config = { matcher: [...] }`
// proxy.ts runs on all routes by default in Next.js 16
```

### Complete globals.css font section (after migration)
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");

/* REMOVED:
   @import "@fontsource/pretendard/400.css";
   @import "@fontsource/pretendard/500.css";
   @import "@fontsource/pretendard/600.css";
   @import "@fontsource/pretendard/700.css";
*/

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* ... existing token mappings unchanged ... */
  --font-sans: "Pretendard Variable", "Pretendard", system-ui, sans-serif;
  /* The CDN dynamic subset declares font-family as "Pretendard Variable" */
}
```

### next.config.ts headers() pattern
```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `export function middleware()` | `proxy.ts` with `export function proxy()` | Next.js 16.0.0 (deprecated) | File and function rename required. Edge runtime no longer supported in proxy. |
| `export const config = { matcher: [...] }` required | `config` is optional in proxy.ts | Next.js 16.0.0 | Proxy runs on all routes by default. Matcher becomes opt-in filter. |
| `--turbopack` flag in dev script | Turbopack is default (flag optional) | Next.js 16.0.0 | Can remove `--turbopack` from `bun dev` script. Not required for this phase. |
| `@fontsource` packages for web fonts | CDN dynamic subset or `next/font/local` | Ongoing | @fontsource Latin-only subsets are broken for CJK languages |
| `coverage.all` in vitest config | `coverage.include` pattern | Vitest 4.0.0 | `coverage.all` removed. Must use `include` to control file scope. |

**Deprecated/outdated:**
- `middleware.ts` file convention: Still works with deprecation warning, will be removed in future Next.js release
- `@fontsource/pretendard` weight-specific imports (400.css, 500.css, etc.): Loads Latin-only subsets, zero Korean glyphs

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.1 + happy-dom |
| Config file | `vitest.config.mts` |
| Quick run command | `bun run test` |
| Full suite command | `bun run test:coverage` (after Phase 21 setup) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | proxy.ts exports `proxy` function, handles protected routes correctly | unit | `bun run test -- src/proxy.test.ts` | Needs rename from middleware.test.ts |
| SEC-05 | Security headers present on all responses | unit | `bun run test -- tests/unit/security-headers.test.ts` | No -- verify headers config object |
| SEC-06 | next.config.ts has headers() function | unit | `bun run test -- tests/unit/security-headers.test.ts` | No -- same as SEC-05 |
| PERF-01 | Pretendard CDN import in globals.css, @fontsource removed | manual-only | Visual check: Korean text renders in Pretendard | N/A -- CSS import, not testable in vitest |
| DS-02 | CSS custom properties defined in globals.css | manual-only | Visual check: tokens exist in `:root` and `.dark` | N/A -- CSS variables, verify via dev tools |
| CQ-01 | `bun run test:coverage` produces coverage report | smoke | `bun run test:coverage` | Wave 0 gap -- needs @vitest/coverage-v8 install |

### Sampling Rate
- **Per task commit:** `bun run test`
- **Per wave merge:** `bun run test:coverage` (after CQ-01 is complete)
- **Phase gate:** Full suite green + all manual checks pass before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/proxy.test.ts` -- rename from `src/middleware.test.ts`, update imports and function references
- [ ] `@vitest/coverage-v8` installation -- `bun add -D @vitest/coverage-v8@^4.1.2`
- [ ] Coverage config in `vitest.config.mts` -- add `coverage` block with `provider: 'v8'`

## Open Questions

1. **Pretendard CDN font-family name**
   - What we know: The CDN dynamic subset CSS uses `font-family: "Pretendard Variable"` (with "Variable" suffix), not plain `"Pretendard"`
   - What's unclear: Whether the existing `--font-sans: "Pretendard"` in `@theme inline` will match or needs updating
   - Recommendation: Update to `--font-sans: "Pretendard Variable", "Pretendard", system-ui, sans-serif` to cover both CDN and any local Pretendard installations. Verify in browser DevTools computed styles.

2. **Whether to keep config.matcher in proxy.ts**
   - What we know: CONTEXT.md says "Remove `export const config`". Official docs say it is optional.
   - What's unclear: Whether removing the matcher causes proxy to run on truly ALL requests (including API routes), potentially adding latency
   - Recommendation: Remove it as CONTEXT.md decided. Proxy already skips `_next/static` and `_next/image` by default. The Supabase `getUser()` call adds ~50ms to every request but this is needed for auth token refresh. The existing middleware already runs on API routes (matcher doesn't exclude `/api`).

3. **Exact brand tokens to define**
   - What we know: CONTEXT.md says ~10 tokens including `--brand-blue`, `--brand-navy`, `--brand-bg`, `--brand-text`, and ~6 more based on hex audit
   - What's unclear: The exact list of ~6 additional tokens
   - Recommendation: Use the hex audit from FEATURES.md research. The clustered hex values map to: `--text-tertiary` (#999999), `--accent-muted` (#EBF3FF), `--surface-hover` (#F5F5F5), `--border-subtle` (#E8E8E8 variant), `--text-caption` (#7A7A7A), `--brand-gradient-start`/`--brand-gradient-end` (if gradient values are common). Planner should define exact list based on component audit.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 proxy.ts docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) -- Full proxy convention reference, migration guide, config.matcher behavior, runtime details. Fetched 2026-03-27.
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) -- Breaking changes, middleware-to-proxy migration, codemod instructions. Fetched 2026-03-27.
- [Pretendard CDN dynamic subset CSS](https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css) -- Verified: 91 @font-face declarations, unicode-range subsetting, woff2-variations format. Fetched 2026-03-27.
- [npm registry: @vitest/coverage-v8](https://www.npmjs.com/package/@vitest/coverage-v8) -- Latest 4.1.2. Verified 2026-03-27.

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` -- Project-specific stack research with CDN URLs, coverage config patterns
- `.planning/research/ARCHITECTURE.md` -- Security header recommendations, hex-to-token mapping
- `.planning/research/FEATURES.md` -- Hex audit with frequency counts per color value
- `.planning/research/PITFALLS.md` -- proxy.ts migration warnings, font loading pitfalls

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified against npm registry, no new runtime dependencies
- Architecture: HIGH -- all patterns verified against Next.js 16 official docs, CDN CSS file inspected directly
- Pitfalls: HIGH -- based on direct codebase analysis + official migration guides

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable domain, Next.js 16 conventions settled)
