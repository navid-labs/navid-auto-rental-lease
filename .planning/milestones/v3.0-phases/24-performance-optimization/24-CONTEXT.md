# Phase 24: Performance Optimization - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Source:** Auto-mode (recommended defaults selected)

<domain>
## Phase Boundary

Optimize public page performance: analyze JS bundle and apply dynamic imports for heavy libraries, add ISR caching for public pages, reduce excessive RSC prefetch requests on homepage. Target: homepage first-load JS under 300KB (from 1,197KB).

</domain>

<decisions>
## Implementation Decisions

### Bundle Analysis + Dynamic Imports
- Run `next experimental-analyze` first to identify actual bundle offenders
- Dynamic import targets (based on research):
  - `recharts` — only used on admin dashboard charts, not needed in shared bundle
  - `@react-pdf/renderer` — only used in contract PDF generation, already in serverExternalPackages
  - `framer-motion` — used in 7 files, 6/7 are below-fold or page-specific
- Use `next/dynamic` with `ssr: false` for client-only heavy components
- Use `React.lazy` + `Suspense` for route-level code splitting where appropriate

### ISR Revalidation Strategy
- Homepage (`/`): `revalidate: 60` (1 minute — featured vehicles change frequently)
- Vehicle detail (`/vehicles/[id]`): `revalidate: 300` (5 minutes — data rarely changes)
- Search/listing (`/vehicles`): `revalidate: 120` (2 minutes — inventory updates)
- Admin pages: NO ISR (always fresh, behind auth)
- Dealer pages: NO ISR (always fresh, behind auth)

### RSC Prefetch Optimization
- Homepage currently triggers 59 simultaneous prefetch requests
- Apply `prefetch={false}` to non-critical navigation links:
  - Footer links
  - Mega-menu deep links
  - "See all" / "View more" links
  - Secondary CTA links
- Keep prefetch enabled for:
  - Primary CTA buttons (검색하기, 견적 받기)
  - Main navigation tabs
  - Vehicle card links (first visible set)

### Claude's Discretion
- Exact bundle analyzer output interpretation
- Which framer-motion usages to keep vs dynamic import
- Loading skeleton design for lazy-loaded components
- Whether to add `loading.tsx` files for ISR pages

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Performance
- `.gstack/benchmark-reports/2026-03-27-benchmark.md` — Baseline metrics (JS 1,197KB, 59 requests, font 3MB)
- `.planning/research/FEATURES.md` — Bundle offenders analysis
- `.planning/research/ARCHITECTURE.md` — framer-motion usage map (7 files)

### Next.js
- `next.config.ts` — Current config with serverExternalPackages
- `src/app/(public)/page.tsx` — Homepage (ISR target)
- `src/app/(public)/vehicles/page.tsx` — Search page (ISR target)
- `src/app/(public)/vehicles/[id]/page.tsx` — Detail page (ISR target)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `next/dynamic` — Next.js built-in dynamic import with SSR control
- `serverExternalPackages: ['@react-pdf/renderer']` — already configured in next.config.ts

### Established Patterns
- Server Components by default (App Router)
- `'use client'` only where needed
- Tailwind CSS for styling (no runtime CSS-in-JS)

### Integration Points
- `src/app/(public)/` — public pages for ISR
- `src/components/` — components with recharts/framer-motion imports
- `src/app/admin/` — admin pages (no ISR)

</code_context>

<specifics>
## Specific Ideas

- Measure before/after with `next experimental-analyze` to verify improvements
- Consider `loading.tsx` for ISR pages to show skeleton during revalidation

</specifics>

<deferred>
## Deferred Ideas

- Edge caching strategy — v4.0 (PERF-F01), needs production traffic data
- Image CDN + WebP auto-conversion — v4.0 (PERF-F02)

</deferred>

---

*Phase: 24-performance-optimization*
*Context gathered: 2026-03-27 via auto-mode*
