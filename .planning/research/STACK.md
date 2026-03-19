# Technology Stack

**Project:** Navid Auto v2.0 - K Car Style Redesign
**Researched:** 2026-03-19
**Mode:** Subsequent milestone - UI library additions only

## Context

The core stack (Next.js 15, React 19, Tailwind v4, shadcn/ui, Prisma, Supabase, Zustand, etc.) is validated and unchanged from v1. This document covers ONLY the new libraries needed for K Car-style UI features.

---

## New Libraries Required

### 1. Image Gallery & Carousel: Embla Carousel (via shadcn)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui Carousel | (built-in) | Vehicle image gallery slider | shadcn's Carousel component wraps Embla Carousel internally. Already in the shadcn ecosystem -- zero new dependency management. Handles touch, keyboard, thumbnails via Embla plugins. |
| embla-carousel-autoplay | ^8.6.0 | Auto-advance hero banners | Official Embla plugin. K Car homepage has auto-rotating hero banners. |
| embla-carousel-thumbs | ^8.6.0 | Thumbnail navigation for vehicle gallery | K Car vehicle detail has a main image + thumbnail strip pattern. This plugin syncs two Embla instances. |

**Why Embla (via shadcn) over Swiper:** shadcn already bundles Embla. Adding Swiper would mean two carousel libraries. Embla is lighter (4KB gzipped vs Swiper's 30KB+), dependency-free, and shadcn provides styled wrappers. No reason to add Swiper.

**Confidence:** HIGH - shadcn docs confirm Embla integration. Embla 8.6.0 is stable with 6M+ weekly downloads.

### 2. Image Lightbox/Zoom: yet-another-react-lightbox

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| yet-another-react-lightbox | ^3.25.0 | Full-screen image viewer with zoom | K Car vehicle detail lets users click images to view full-screen with pinch-zoom and swipe navigation. YARL is the most actively maintained React lightbox (supports React 19), has plugin architecture (Zoom, Thumbnails, Counter), and weighs ~7KB gzipped. |

**Why YARL over alternatives:**
- `react-image-lightbox` -- deprecated, no React 19 support
- `lightGallery` -- heavy (50KB+), jQuery legacy, commercial license for some features
- `PhotoSwipe` -- good but YARL has better React integration and TypeScript support

**Confidence:** HIGH - YARL actively maintained, React 19 compatible, plugin-based architecture.

### 3. Infinite Scroll: react-intersection-observer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-intersection-observer | ^10.0.3 | Viewport detection for infinite scroll, sticky nav, section tracking | K Car vehicle listing uses infinite scroll (load more vehicles as user scrolls). Also needed for: sticky sidebar activation, active section highlighting in vehicle detail TOC. Uses native IntersectionObserver API -- no polling, no scroll listeners. |

**Why a library over raw IntersectionObserver:** The `useInView` hook from this library handles ref management, cleanup, threshold options, and SSR safety in 3 lines vs 20+ lines of raw useEffect/useRef boilerplate. 10M+ weekly downloads, actively maintained.

**Confidence:** HIGH - v10.0.3 published within last month, widely used with Next.js App Router.

### 4. Map Integration: react-kakao-maps-sdk

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-kakao-maps-sdk | ^1.2.0 | Dealership location map | K Car has a "nationwide branch" map with markers. Kakao Map is the de facto standard for Korean web services (higher market share than Naver Maps in web). Has official Next.js docs, supports App Router via Script component loading. |

**Why Kakao over Naver Maps:**
- `react-kakao-maps-sdk` is more actively maintained (1.2.0, 8 months ago) vs `react-naver-maps` (0.1.5, fragmented ecosystem with 3 competing wrappers)
- Kakao Map API has better documentation in Korean
- K Car actually uses Kakao Maps
- Free tier is generous (300K calls/day)

**Requires:** Kakao Developers API key (free registration). Load via `next/script` with `strategy="afterInteractive"`.

**Confidence:** MEDIUM - library works but needs `'use client'` wrapper and careful Script loading order in App Router. Official docs cover this.

### 5. Vehicle Body Diagram: Custom SVG Components (NO library needed)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom React SVG | N/A | Car body panel diagram (front/rear/left/right/top views) | K Car's panel exchange/repair diagram is a static SVG with clickable regions colored by status (green=normal, yellow=repaired, red=replaced). No library exists for this. Build 5 SVG view components (sedan outline) with ~20 named path regions each. Color paths based on inspection data from DB. |

**Implementation approach:**
1. Create SVG outlines for front/rear/left/right/top views (trace from K Car or create simplified versions)
2. Each panel region is a `<path>` with a data attribute (`data-panel="front-left-fender"`)
3. React component maps inspection data to fill colors
4. Tooltip on hover shows panel status detail
5. Total effort: ~200 lines of SVG + ~100 lines of React component logic

**Why NOT use a library:**
- No "car body diagram" React library exists
- Generic diagram libraries (yFiles, GoJS) are massive overkill and expensive
- SVG is natively supported in JSX -- React has first-class SVG support
- K Car's diagram is fundamentally simple: colored regions on a car outline

**Confidence:** HIGH - this is standard React SVG work, no external dependency risk.

---

## shadcn/ui Components to Add

The following shadcn components are NOT yet installed but are needed for K Car UI patterns:

| Component | K Car Feature | Install Command |
|-----------|--------------|-----------------|
| Accordion | Vehicle detail expandable sections (inspection, history, specs) | `npx shadcn@latest add accordion` |
| Tabs | Vehicle detail section switcher, search page view modes | `npx shadcn@latest add tabs` |
| Carousel | Hero banner, vehicle image gallery | `npx shadcn@latest add carousel` |
| Collapsible | Mobile filter sidebar sections | `npx shadcn@latest add collapsible` |
| Progress | Warranty timeline, inspection score bars | `npx shadcn@latest add progress` |
| Pagination | Vehicle listing page numbers (fallback from infinite scroll) | `npx shadcn@latest add pagination` |
| Popover | Filter dropdowns, quick info tooltips | `npx shadcn@latest add popover` |
| Scroll Area | Fixed-height scrollable areas (filter sidebar, comparison panel) | `npx shadcn@latest add scroll-area` |
| Avatar | User/dealer profile images | `npx shadcn@latest add avatar` |
| Breadcrumb | Page navigation hierarchy | `npx shadcn@latest add breadcrumb` |
| Toggle Group | Grid/list view switcher, filter tag groups | `npx shadcn@latest add toggle-group` |
| Radio Group | Single-select filter options | `npx shadcn@latest add radio-group` |
| Dropdown Menu | Sort options, user menu | `npx shadcn@latest add dropdown-menu` |

**Already installed (no action):** Badge, Button, Card, Checkbox, Dialog, Input, Label, NavigationMenu, Select, Separator, Sheet, Skeleton, Slider, Table, Textarea, Tooltip.

---

## What NOT to Add

| Library | Why NOT |
|---------|---------|
| Swiper.js | shadcn Carousel (Embla) already covers all carousel needs. Adding Swiper = duplicate dependency, +30KB bundle. |
| Framer Motion (more usage) | Already installed at v12.35.2. Use for page transitions and micro-animations, but DO NOT over-animate. K Car is clean and fast -- minimal animation. |
| react-slick | Legacy jQuery-era carousel. Embla is superior in every metric. |
| Three.js / react-three-fiber | 3D car viewer is NOT in K Car's actual UI. They use 360-degree photo sequences, not 3D models. Implement with Embla carousel if needed (just a sequence of photos at different angles). |
| @tanstack/react-query | Not needed -- Server Components + Server Actions handle data fetching. Zustand for client state. Adding react-query adds complexity without benefit in this architecture. |
| react-virtualized / react-window | Infinite scroll with intersection observer + pagination is sufficient for vehicle listings (~50 items per page). Virtualization is overkill unless rendering 1000+ items simultaneously. |
| Naver Maps | Kakao Maps is better maintained for React and K Car uses it. |
| date-fns / dayjs | Native Intl.DateTimeFormat + Intl.RelativeTimeFormat handles Korean date formatting. No library needed. |

---

## Installation

```bash
# New npm dependencies (4 packages)
yarn add embla-carousel-autoplay@^8.6.0 embla-carousel-thumbs@^8.6.0 yet-another-react-lightbox@^3.25.0 react-intersection-observer@^10.0.3 react-kakao-maps-sdk@^1.2.0

# New shadcn components (13 components, zero npm packages -- copy-paste)
npx shadcn@latest add accordion tabs carousel collapsible progress pagination popover scroll-area avatar breadcrumb toggle-group radio-group dropdown-menu
```

**Bundle impact estimate:**
- embla-carousel-autoplay: ~2KB gzipped
- embla-carousel-thumbs: ~2KB gzipped
- yet-another-react-lightbox: ~7KB gzipped (+ plugins ~3KB)
- react-intersection-observer: ~3KB gzipped
- react-kakao-maps-sdk: ~15KB gzipped (+ Kakao Maps SDK loaded via script tag)
- **Total new JS: ~32KB gzipped** (acceptable for the features gained)

All new libraries support tree-shaking. Kakao Maps SDK is loaded asynchronously via `next/script` and only on pages that need it.

---

## Integration Points

### Embla Carousel + YARL Lightbox
Vehicle detail page image gallery: Embla for inline browsing, clicking any image opens YARL lightbox for full-screen zoom. Pass the same image array to both components.

### Intersection Observer + Sticky Sidebar
Vehicle detail page: observe section headings to highlight active TOC item in sticky sidebar. Also detect when sidebar should switch from `position: relative` to `position: sticky` using a sentinel element.

### Intersection Observer + Infinite Scroll
Vehicle listing: observe a sentinel `<div>` at the bottom of the grid. When `inView` becomes true, trigger Server Action to fetch next page. Show skeleton cards during loading.

### Kakao Maps + Vehicle Locations
Dealership page: load map only when user navigates to that page. Use `next/dynamic` with `ssr: false` to prevent SSR issues. Markers for each dealership location from DB.

### Custom SVG Diagram + Prisma Data
Vehicle inspection data (panel status per region) stored in JSONB column in Prisma schema. SVG component reads this data and maps to fill colors. No real-time updates needed -- inspection data is static per vehicle.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Carousel | Embla (via shadcn) | Swiper | Duplicate dependency, heavier bundle |
| Lightbox | yet-another-react-lightbox | lightGallery | Heavier, partial commercial license |
| Infinite Scroll | react-intersection-observer | @tanstack/react-virtual | Virtualization overkill for this use case |
| Maps | react-kakao-maps-sdk | react-naver-maps | Fragmented ecosystem, less maintained |
| Body Diagram | Custom SVG | GoJS / yFiles | Massive overkill, expensive license |
| 3D Viewer | Not needed (360 photo carousel) | Three.js / react-three-fiber | K Car does not use 3D -- just photo sequences |

---

## Sources

- [shadcn/ui Carousel docs](https://ui.shadcn.com/docs/components/radix/carousel) - Embla integration confirmation
- [Embla Carousel GitHub](https://github.com/davidjerleke/embla-carousel) - v8.6.0, 6M+ weekly downloads
- [yet-another-react-lightbox](https://yet-another-react-lightbox.com/) - React 19 support, plugin architecture
- [react-intersection-observer npm](https://www.npmjs.com/package/react-intersection-observer) - v10.0.3, 10M+ weekly downloads
- [react-kakao-maps-sdk docs](https://react-kakao-maps-sdk.jaeseokim.dev/docs/setup/next/) - Next.js setup guide
- [SVGR](https://react-svgr.com/) - SVG to React component tooling (for body diagram SVGs)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components) - Full component list
