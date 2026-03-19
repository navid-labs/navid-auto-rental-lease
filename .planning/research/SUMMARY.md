# Project Research Summary

**Project:** Navid Auto v2.0 — K Car Style Redesign
**Domain:** B2B2C Used Car Rental/Lease Marketplace (Korean Market) — UI Overhaul Milestone
**Researched:** 2026-03-19
**Confidence:** HIGH

## Executive Summary

v2.0 is a major UI overhaul milestone, not a feature milestone. The existing v1.0 platform ships a fully functional rental/lease marketplace (auth, vehicle CRUD, contract engine, admin dashboard, PDF generation, Realtime status) on Next.js 15 + Supabase + Tailwind v4 + shadcn/ui. v2.0 targets K Car (kcar.com) visual parity: a polished, high-trust commercial UI with richer image presentation, a more detailed vehicle detail page (panel damage diagrams, inspection scores, accident history), infinite scroll on listings, a Kakao Maps dealership locator, and overall visual refinement to support real dealer onboarding and investor credibility beyond demo. The core stack is validated and unchanged — v2.0 adds only 5 lightweight npm packages and 13 new shadcn/ui components on top of the existing codebase.

The recommended approach is component-by-component progressive enhancement: start with the highest-visibility surfaces (vehicle detail page and search listing) since these are what investors and customers see first, then extend to navigation, map integration, and admin UI improvements. The vehicle body damage diagram (SVG-based, custom React components) is the most technically novel element but has no external dependency risk — it is pure SVG in JSX. The Kakao Maps integration requires an API key registration and careful `next/script` + `next/dynamic` loading order, which is the only meaningful external dependency risk.

The primary risks for v2.0 are scope creep and visual regression. Because v2.0 touches the most visible pages of a working application, every UI change carries regression risk against existing functionality (search filters, contract wizard, admin CRUD). The existing 264 unit tests provide a safety net for business logic but do not cover UI rendering. The recommended mitigation is incremental rollout per page (not a big-bang redesign) with manual testing of critical flows after each page redesign.

## Key Findings

### Recommended Stack

The v1.0 stack (Next.js 15, React 19, Tailwind v4, shadcn/ui, Prisma, Supabase, Zustand) is fully validated and requires no changes. v2.0 introduces only these additions:

**New npm packages (5 packages, ~32KB gzipped total):**
- Embla Carousel plugins (`embla-carousel-autoplay` ^8.6.0, `embla-carousel-thumbs` ^8.6.0): Auto-rotating hero banners and thumbnail-strip image galleries — already in the shadcn ecosystem via the Carousel component, zero additional dependency management
- `yet-another-react-lightbox` ^3.25.0: Full-screen image viewer with pinch-zoom and swipe navigation — most actively maintained React lightbox with React 19 support, ~7KB gzipped
- `react-intersection-observer` ^10.0.3: Infinite scroll sentinel, sticky nav activation, section tracking — wraps native IntersectionObserver cleanly, 10M+ weekly downloads
- `react-kakao-maps-sdk` ^1.2.0: Dealership location map — Kakao Maps is de facto standard for Korean web (higher market share than Naver for web), K Car uses it, generous free tier (300K calls/day)

**New shadcn/ui components (13 components, zero npm — copy-paste):**
Accordion, Tabs, Carousel, Collapsible, Progress, Pagination, Popover, Scroll Area, Avatar, Breadcrumb, Toggle Group, Radio Group, Dropdown Menu

**What NOT to add:** Swiper (Embla already covers this), Framer Motion beyond current usage, Three.js (K Car uses 360-photo sequences not 3D), `@tanstack/react-query` (Server Components + Server Actions sufficient), react-window/react-virtual (overkill for vehicle list scale), date-fns (native Intl API sufficient).

**Confidence:** HIGH — all packages version-verified, React 19 compatibility confirmed, bundle impact estimated at ~32KB gzipped total.

### Expected Features

v2.0 features are categorized as UI redesign targets, not new business capabilities.

**Must have (K Car visual parity — v2.0 launch):**
- Hero carousel with auto-rotating banners (Embla autoplay plugin)
- Vehicle image gallery with thumbnail strip + full-screen lightbox (Embla thumbs + YARL)
- Vehicle body panel damage diagram — 5 SVG views (front/rear/left/right/top) with per-panel color coding (normal/repaired/replaced), custom React SVG components, no library needed
- Vehicle detail page redesign: accordion sections for inspection/history/specs, sticky sidebar with section TOC, breadcrumb navigation
- Search listing page improvements: infinite scroll sentinel (react-intersection-observer), grid/list view toggle (Toggle Group), mobile collapsible filter sidebar
- Dealership location map with Kakao Maps markers (react-kakao-maps-sdk)
- Korean vehicle naming convention enforcement throughout (현대 쏘나타 not Hyundai Sonata)
- Responsive refinement pass on all redesigned pages (375px mobile viewport)

**Should have (quality improvements — v2.0 if time allows):**
- Vehicle comparison table improvement (side-by-side spec table with visual diff highlighting)
- Admin UI visual refresh (consistent with new design language)
- 360-degree photo sequence viewer (Embla carousel with ~36 angle images — no Three.js needed)
- Loading skeleton refinement (match K Car's skeleton patterns for vehicle cards)

**Defer (v3.0+ or separate milestones):**
- Real eKYC/electronic signature API integration
- Payment/CMS integration
- Social login (Kakao/Naver)
- Native mobile app (Capacitor)
- AI vehicle recommendations
- Real-time chat

**v1.0 features preserved (must not regress):**
- License plate auto-lookup with cache/fallback
- Multi-step contract wizard with mock eKYC
- Contract state machine and PDF generation
- Admin dashboard CRUD and statistics
- Role-based access control and RLS policies

### Architecture Approach

The v1.0 architecture is correct and unchanged: four route groups (`(public)`, `(customer)`, `(dealer)`, `(admin)`), Server Component reads, Server Action mutations, three Supabase clients. v2.0 changes are purely in the presentation layer — new and enhanced React components within existing route groups. No new route groups, no new API routes (except potentially Kakao Maps API key proxy), no schema changes except possibly adding a vehicle inspection JSONB column for the panel diagram data.

**Key architectural decisions for v2.0:**
1. Vehicle body diagram data: Store panel inspection data as a JSONB column in the vehicle table (Prisma schema addition). SVG component reads this data and maps to fill colors. No real-time updates needed — inspection data is static per vehicle.
2. Kakao Maps loading: Use `next/dynamic` with `ssr: false` to prevent SSR hydration issues. Load Kakao Maps SDK via `next/script` with `strategy="afterInteractive"` only on pages that need it.
3. Infinite scroll: Intersection Observer sentinel `<div>` at bottom of vehicle grid. When `inView` becomes true, trigger a Server Action for the next page. Display skeleton cards during loading. Combine with URL-based pagination fallback for SEO (page 1 is always SSR with `searchParams`).
4. Image carousel + lightbox: Embla for inline gallery, clicking any image opens YARL lightbox. Pass the same `images[]` array to both. Embla thumbnails use the same array with `embla-carousel-thumbs` plugin syncing two Embla instances.

**Major components being added or redesigned:**
1. `VehicleImageGallery` — Embla main carousel + thumbnail strip + YARL lightbox integration
2. `VehicleBodyDiagram` — 5 SVG view components with ~20 named path regions each, colored by inspection data
3. `VehicleDetailPage` redesign — accordion sections, sticky TOC sidebar, breadcrumb, K Car-style information hierarchy
4. `SearchListingPage` redesign — infinite scroll, grid/list toggle, collapsible mobile filters, visual card updates
5. `DealershipMap` — Kakao Maps with dealer location markers, `next/dynamic` SSR-disabled wrapper
6. `HeroBanner` — Embla carousel with autoplay, K Car-style full-width banner

**Scaling considerations unchanged from v1.0:** Vehicle search bottleneck (composite indexes on status/make/model/year/price) and Realtime connection batching are the same concerns. v2.0 adds image-heavy pages — ensure Next.js `<Image>` with explicit width/height is used throughout to prevent CLS and enable Vercel's image optimization.

### Critical Pitfalls

The v1.0 critical pitfalls (RLS misconfiguration, double-booking race condition, auth token mismanagement) are already addressed in the shipped codebase. The relevant pitfalls for v2.0 are:

1. **UI regression on working contract flow** — Vehicle detail and search listing pages are entry points to the contract wizard. Any redesign that breaks the "Apply for Rental/Lease" CTA, filter state persistence in URL, or vehicle ID routing will break the contract flow. Prevention: test the full contract happy path after each page redesign, not just at the end.

2. **Kakao Maps loading in Next.js App Router** — `react-kakao-maps-sdk` requires `'use client'`, `next/dynamic` with `ssr: false`, and Kakao Maps SDK loaded via `next/script` in the correct order. Getting the loading sequence wrong causes `window.kakao is not defined` errors that are hard to debug. Prevention: implement with `next/dynamic` from the start, test in production build (not just dev server where timing differs).

3. **Image-heavy pages degrading performance** — Vehicle detail redesign adds a full-screen lightbox, thumbnail strip, and potentially 360-degree sequence. Without proper lazy loading and Next.js `<Image>` optimization, this can make the detail page significantly slower. Prevention: use Next.js `<Image>` with explicit dimensions for all vehicle photos, lazy-load YARL lightbox via `next/dynamic`, avoid loading 360-degree sequence images until user clicks the 360 tab.

4. **Vehicle body SVG complexity underestimated** — Creating accurate car body outlines for 5 views with ~20 named regions each is more design work than engineering work. The SVG paths must be correct enough to be recognizable as a real car, and the region labels must match the inspection data schema. Prevention: source a reference SVG from K Car's public HTML (inspect their damage diagram in browser DevTools), adapt it rather than drawing from scratch. Define the panel region naming schema in Prisma before drawing the SVG.

5. **Demo survivability regression** — v1.0's final phase hardened the demo environment. v2.0 UI changes could break loading states, error states, or skeleton screens that were previously audited. Prevention: the "Looks Done But Isn't" checklist from v1.0 PITFALLS.md should be re-run against every redesigned page.

6. **Korean locale formatting gaps in redesigned pages** — New UI surfaces (vehicle detail sections, map markers, inspection score labels) must use Korean formatting (KRW currency with comma separators, 년/월/일 date format, Korean brand/model names). Prevention: define a shared `formatKRW()`, `formatKoreanDate()`, and `getKoreanVehicleName()` utility reused across all new components rather than inline formatting.

## Implications for Roadmap

Based on research, the v2.0 roadmap should structure phases around UI surfaces (not features), ordered by investor/customer visibility:

### Phase 1: Component Foundation & Design System Update
**Rationale:** Install new packages and shadcn components before any page work begins. Update global design tokens (colors, typography, spacing) to match K Car aesthetic. This prevents installing packages mid-development and ensures all page phases share the same base components.
**Delivers:** 5 new npm packages installed, 13 new shadcn components added, Tailwind CSS color/typography tokens updated to K Car palette, shared utility components (Korean formatters, skeleton patterns), Storybook-style component demos for new carousel and lightbox components (optional)
**Addresses:** Embla carousel, YARL lightbox, Intersection Observer, Kakao Maps SDK setup
**Avoids:** Installing packages mid-phase, inconsistent design token usage across pages

### Phase 2: Vehicle Detail Page Redesign
**Rationale:** Highest-value single page for both investors and customers. Contains the most complex new UI elements (image gallery, body diagram, accordion sections, sticky TOC). Best to tackle first while the team's focus is sharpest and before patterns are set by lower-complexity pages.
**Delivers:** Vehicle detail page fully redesigned to K Car standard: main image carousel + thumbnail strip + lightbox, vehicle body panel damage diagram (custom SVG, 5 views), accordion sections (inspection report, accident history, specs, pricing), sticky sidebar with section TOC and "Apply" CTA, breadcrumb navigation, K Car-style information hierarchy
**Addresses:** VehicleImageGallery, VehicleBodyDiagram, accordion/tabs for inspection data
**Avoids:** UI regression on contract application CTA, image performance issues (use Next.js Image throughout)
**Research flag:** SVG panel diagram — inspect K Car's actual HTML to source reference SVG paths before implementation

### Phase 3: Search & Listing Page Redesign
**Rationale:** Primary entry point for new visitors. Infinite scroll and grid/list toggle are high-visibility improvements. Must preserve URL-based filter state (existing nuqs implementation) during redesign.
**Delivers:** Vehicle listing page redesigned: infinite scroll with skeleton loading (Intersection Observer sentinel), grid/list view toggle (Toggle Group), mobile collapsible filter sidebar (Collapsible), vehicle card visual refresh (photos, price hierarchy, status badges), sort dropdown (Dropdown Menu), pagination fallback for SEO
**Addresses:** Infinite scroll, filter UI improvements, vehicle card design
**Avoids:** URL filter state regression (nuqs implementation must be preserved), N+1 query on infinite scroll pages

### Phase 4: Navigation, Landing Page & Global UI
**Rationale:** After the two highest-traffic pages are redesigned, standardize the global navigation and landing page to match the new design language. Landing page hero redesign (Embla autoplay carousel) ties together the visual identity.
**Delivers:** Global header redesign (K Car-style nav with dropdowns), hero banner with auto-rotating carousel (Embla autoplay), footer redesign, breadcrumb navigation integrated globally, loading and error state consistency across all new pages
**Addresses:** HeroBanner (Embla autoplay), navigation redesign, global design consistency
**Avoids:** Navigation regression (existing role-based nav links must be preserved), hero banner blocking LCP (preload first image)

### Phase 5: Dealership Map & Location Pages
**Rationale:** Kakao Maps requires careful SSR/dynamic loading setup that is isolated to specific pages. Doing this in its own phase prevents loading sequence issues from affecting earlier phases and allows dedicated testing of the `next/dynamic` + `next/script` combination.
**Delivers:** Dealership location page with Kakao Maps markers, dealer profile cards, API key proxy endpoint (if needed), graceful fallback (list view) when map fails to load
**Addresses:** DealershipMap component (react-kakao-maps-sdk), Kakao API key setup
**Avoids:** `window.kakao is not defined` SSR errors, map loading blocking page paint
**Research flag:** Kakao Maps API key registration (free but requires developer account) should be done before Phase 5 begins

### Phase 6: Admin UI Refresh & Polish
**Rationale:** Admin UI is not investor-facing but is used daily by operations staff. Light visual refresh to match new design language. Final polish pass on all redesigned pages. Re-run v1.0 "Looks Done But Isn't" checklist against all new UI.
**Delivers:** Admin dashboard visual refresh (consistent with new design), vehicle comparison table improvement, Korean locale formatting audit on all new components, mobile responsive verification (375px viewport) on all redesigned pages, performance check (Lighthouse scores on vehicle detail and search pages), demo script re-tested end-to-end
**Addresses:** Admin UI consistency, Korean formatting completeness, demo survivability continuity
**Avoids:** Demo regression from UI changes (re-run full contract flow after all redesigns)

### Phase Ordering Rationale

- Component foundation (Phase 1) must precede all page work to avoid dependency gaps mid-phase
- Vehicle detail (Phase 2) before search (Phase 3) because it is more complex, higher investor value, and sets component patterns (image gallery, skeleton cards) reused in search
- Global UI (Phase 4) after the two main pages so the design language is established before being applied globally
- Kakao Maps (Phase 5) isolated to its own phase because the SSR/dynamic loading configuration is an isolated risk that should not block other phases
- Admin polish (Phase 6) last because it is the lowest customer/investor visibility surface

### Research Flags

Phases likely needing deeper research or pre-work before implementation:
- **Phase 2 (Vehicle Detail):** SVG panel diagram — inspect K Car's HTML source to find or adapt their damage diagram SVG paths before drawing from scratch. Also define the Prisma schema for `inspection_data` JSONB column before the component is built.
- **Phase 5 (Kakao Maps):** API key registration at https://developers.kakao.com must be completed before Phase 5 begins. Test `next/script` + `react-kakao-maps-sdk` loading sequence in a production build (not dev) to catch timing issues early.

Phases with standard patterns (no additional research needed):
- **Phase 1 (Component Foundation):** Package installation and shadcn component addition follow documented patterns.
- **Phase 3 (Search/Listing):** Intersection Observer infinite scroll with Server Components is a well-documented Next.js pattern. nuqs URL state is already implemented and just needs to be preserved.
- **Phase 4 (Landing/Nav):** Embla autoplay carousel has official shadcn docs. Navigation changes are additive to existing role-based nav.
- **Phase 6 (Polish):** Reusing the v1.0 "Looks Done But Isn't" checklist as the verification framework — no new research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 4 of 5 new packages are widely-used with 6M-10M+ weekly downloads and React 19 support confirmed. Kakao Maps SDK is MEDIUM — less widely used but official docs cover Next.js App Router setup. |
| Features | HIGH | K Car feature analysis is based on direct inspection of kcar.com. Target features are well-defined visual patterns, not speculative business features. |
| Architecture | HIGH | All architectural changes are in the presentation layer only. No new route groups, no RLS changes, no auth changes. Pattern is additive, not rearchitectural. |
| Pitfalls | HIGH | v2.0 pitfalls are primarily UI regression and integration order risks, which are well-understood. The Kakao Maps loading order issue is documented and has a known solution. |

**Overall confidence:** HIGH

### Gaps to Address

- **Vehicle body SVG source:** The car body panel damage diagram requires SVG outlines of a vehicle in 5 views with ~20 named regions. Decision needed before Phase 2: trace from K Car's public HTML, use a generic car silhouette from SVG libraries (e.g., Font Awesome does not have this; consider Noun Project or similar), or create simplified custom paths. The quality of these SVGs directly impacts the feature's visual impact.
- **Prisma inspection data schema:** The vehicle body diagram maps SVG panel regions to inspection data stored in the database. The JSONB schema for `inspection_data` (which panels exist, status values, severity levels) must be defined before the SVG component is built. This is a ~1-hour design decision but must happen first.
- **Kakao Maps API key:** Needs registration at https://developers.kakao.com before Phase 5. Add `NEXT_PUBLIC_KAKAO_MAP_API_KEY` to `.env.local` and Vercel environment variables. Free tier is sufficient (300K daily calls).
- **K Car design token extraction:** Before Phase 1, spend 30 minutes extracting K Car's primary color palette, typography scale, and border-radius values from their CSS (browser DevTools). These become the Tailwind v4 `@theme` tokens for v2.0. Without this, the redesign will look "inspired by K Car" but not visually matching.

## Sources

### Primary (HIGH confidence)
- [K Car website](https://www.kcar.com/) — Direct UI reference for all visual patterns (inspected via browser DevTools, March 2026)
- [shadcn/ui Carousel docs](https://ui.shadcn.com/docs/components/carousel) — Embla integration confirmation
- [Embla Carousel GitHub](https://github.com/davidjerleke/embla-carousel) — v8.6.0, 6M+ weekly downloads, thumbs and autoplay plugins
- [yet-another-react-lightbox](https://yet-another-react-lightbox.com/) — React 19 support, plugin architecture, ~7KB gzipped
- [react-intersection-observer npm](https://www.npmjs.com/package/react-intersection-observer) — v10.0.3, 10M+ weekly downloads
- [react-kakao-maps-sdk docs](https://react-kakao-maps-sdk.jaeseokim.dev/docs/setup/next/) — Next.js App Router setup guide
- [Supabase + Next.js 15 v1.0 research](STACK.md) — Core stack validated and unchanged

### Secondary (MEDIUM confidence)
- [Kakao Developers Platform](https://developers.kakao.com/) — API key registration and Maps SDK documentation
- [SVGR documentation](https://react-svgr.com/) — SVG to React component conversion tooling
- [shadcn/ui component list](https://ui.shadcn.com/docs/components) — All 13 new components available in current shadcn CLI

### Tertiary (LOW confidence — needs validation)
- Vehicle body SVG paths — not yet sourced; K Car HTML inspection may reveal their SVG structure, but clean sourcing of a 5-view car body diagram with labeled regions is unresolved
- Kakao Maps daily quota behavior in practice — 300K calls/day free tier is documented but real-world production behavior with concurrent users is unverified

---
*Research completed: 2026-03-19*
*Ready for roadmap: yes*
