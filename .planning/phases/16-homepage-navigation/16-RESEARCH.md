# Phase 16: Homepage & Navigation - Research

**Researched:** 2026-03-22
**Domain:** Homepage redesign (hero carousel, quick links, recommended vehicles), global navigation (header mega menu, footer, breadcrumbs)
**Confidence:** HIGH

## Summary

Phase 16 transforms the homepage and global navigation from v1.0 glassmorphism style to K Car-inspired information-dense layout. The existing codebase has all required packages already installed (Embla Carousel + autoplay plugin, shadcn Breadcrumb, Lucide icons). No new npm packages are needed. The work is primarily a **component rewrite/enhancement** of 6 existing marketing components plus header, footer, and mobile nav.

The architecture follows established project patterns: Server Components for data fetching (Prisma queries), Client Components only for interactivity (carousel autoplay, mega menu hover, mobile accordion), and the existing `max-w-7xl` container width. Phase 15's `VehicleCard` and `VehicleCardSkeleton` components are reused directly in the recommended vehicles section.

**Primary recommendation:** Structure work in 4-5 plans: (1) hero carousel + search box separation, (2) quick links + recommended vehicles tabs, (3) global header redesign with mega menu + search bar, (4) global footer + breadcrumb navigation, (5) homepage section integration and mobile polish.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Hero banner: K Car style promo banner carousel replacing dark gradient hero, Embla Carousel + autoplay plugin
- Banner images: placeholder (gradient + text overlay), real promo CMS in v3.0
- Tabbed search box: moves below hero as independent section (not inside banner)
- Quick links: redesign from 4-col grid to K Car-style circular icons + horizontal scroll on mobile
- Recommended vehicles: tab-based (popular/newest/deal) using Phase 15 vehicle-card, 4-col desktop / 2-col mobile
- Existing sections (EventBanners, RentSubscription, FinancePartners): integrate into K Car-style promo banner grid + rent carousel + partner logo bar
- Global header: logo(left) + centered search bar + login/signup(right) + mega menu dropdown (hover)
- Mega menu: public navigation only, existing role-based routing preserved
- Mobile header: keep Sheet-based hamburger, add mega menu categories as accordion
- Footer: expand with SNS icons (Instagram, YouTube, Blog, Kakao), app download badges (placeholder), award/cert section
- Breadcrumb: shadcn Breadcrumb component, all public pages, consistent path structure
- Colors: Navy/Blue branding maintained (Phase 13 decision)

### Claude's Discretion
- Promo banner placeholder design (gradient + text combination)
- Banner autoplay interval (3-5 second range)
- Mega menu category grid details
- Quick link icon selection (Lucide icons)
- Recommended vehicle tab query logic (popular=view count, newest=createdAt, deal=price asc)
- Breadcrumb separator style
- Existing section integration approach (EventBanners, RentSubscription, FinancePartners)
- Loading skeleton design
- Error/Empty state handling

### Deferred Ideas (OUT OF SCOPE)
- Kakao Map location display (MAP-01) -- v3.0
- Promo banner admin CMS -- v3.0
- Real app store download links -- v3.0
- AI vehicle recommendations -- v3.0+
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOME-01 | Hero banner carousel -- Embla autoplay full-width promo banners | Embla autoplay plugin API verified (delay, playOnInit, stopOnMouseEnter, stopOnInteraction options). shadcn Carousel component available as wrapper. Placeholder banner pattern documented. |
| HOME-02 | Quick link icon bar -- circular icons for key categories | Existing QuickMenu component (8 Lucide icons) serves as base. K Car crawl shows: free delivery, weekly deals, themed events, rent deals. Mobile horizontal scroll pattern. |
| HOME-03 | Recommended vehicles section -- tabbed popular/newest/deal grid | Phase 15 VehicleCard + VehicleCardSkeleton reusable. FeaturedVehicles has existing Prisma query pattern. Tab switching needs Client Component wrapper around Server-fetched data. |
| HOME-04 | Global header redesign -- logo + center search + mega menu | Existing header.tsx is async Server Component (getCurrentUser). Search bar needs Client Component. Mega menu needs Client Component for hover/click. Header restructure requires splitting server/client boundaries. |
| HOME-05 | Global footer redesign -- SNS, awards, app download | Existing footer.tsx is Server Component with 4-column layout. Extension is additive (new sections). K Car footer structure from crawl data provides exact reference. |
| HOME-06 | Breadcrumb navigation -- all public pages | shadcn Breadcrumb component already installed. Uses base-ui render prop pattern for links. Need wrapper component + integration in public layout or per-page. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| embla-carousel-react | ^8.6.0 | Carousel foundation | Already used in Phase 14 gallery, Phase 15 card preview |
| embla-carousel-autoplay | ^8.6.0 | Hero banner auto-rotation | Installed in Phase 13, Embla-native plugin |
| lucide-react | ^0.577.0 | Icons for quick links, mega menu, SNS | Project standard icon library |
| shadcn Breadcrumb | n/a (local) | Breadcrumb navigation | Already installed at `src/components/ui/breadcrumb.tsx` |
| shadcn Carousel | n/a (local) | Carousel wrapper | Already at `src/components/ui/carousel.tsx` |
| shadcn Accordion | n/a (local) | Mobile mega menu categories | Already installed |
| nuqs | ^2.8.9 | Header search -> URL params | Existing search param pattern |
| framer-motion | ^12.35.2 | Section animations (optional) | Already used in hero-section.tsx |

### Supporting (Existing)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/image | 16.1.6 | Banner images, vehicle card images | All image rendering |
| next/link | 16.1.6 | Navigation links, breadcrumb links | All internal navigation |
| Prisma | existing | Vehicle queries for recommended section | Server Component data fetching |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Carousel wrapper | Raw useEmblaCarousel | Phase 14 used raw hooks for dual-instance sync; for hero banner the shadcn wrapper is simpler and sufficient |
| CSS hover mega menu | Headless UI Popover | CSS is simpler, no JS needed for desktop hover; existing codebase has no Headless UI |
| framer-motion for banner transitions | Embla native transitions | Embla handles slide transitions natively; framer-motion adds unnecessary complexity |

**Installation:**
```bash
# No new packages needed -- all already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/marketing/components/
    hero-banner.tsx          # NEW - Embla autoplay carousel (replaces hero gradient)
    hero-search-box.tsx      # EXTRACT - tabbed search from hero-section.tsx
    quick-links.tsx          # REWRITE - K Car circular icons (replaces quick-menu.tsx)
    recommended-vehicles.tsx # REWRITE - tabbed section (replaces featured-vehicles.tsx)
    promo-banners.tsx        # REWRITE - K Car promo grid (replaces event-banners.tsx)
    rent-carousel.tsx        # REWRITE - Embla horizontal scroll (replaces rent-subscription.tsx)
    partner-logos.tsx        # REWRITE - logo bar (replaces finance-partners.tsx)
  components/layout/
    header.tsx               # REWRITE - mega menu + search bar
    header-search.tsx        # NEW - Client Component centered search input
    mega-menu.tsx            # NEW - Client Component dropdown content
    mega-menu-data.ts        # NEW - menu category data constants
    footer.tsx               # ENHANCE - add SNS, awards, app download sections
    mobile-nav.tsx           # ENHANCE - add accordion categories
    breadcrumb-nav.tsx       # NEW - reusable breadcrumb wrapper
  app/(public)/
    page.tsx                 # UPDATE - new section composition
    layout.tsx               # UPDATE - add breadcrumb integration point
```

### Pattern 1: Hero Banner Carousel with Autoplay
**What:** Full-width Embla carousel with autoplay plugin, indicator dots, manual arrows
**When to use:** HOME-01 hero banner
**Example:**
```typescript
// Source: embla-carousel-autoplay package types + shadcn Carousel pattern
'use client'

import Autoplay from 'embla-carousel-autoplay'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

const BANNERS = [
  { id: 1, title: '...', subtitle: '...', gradient: 'from-blue-600 to-indigo-900', cta: '/vehicles' },
  // ...
]

export function HeroBanner() {
  return (
    <Carousel
      opts={{ loop: true }}
      plugins={[
        Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
      ]}
    >
      <CarouselContent>
        {BANNERS.map((banner) => (
          <CarouselItem key={banner.id}>
            {/* Full-width banner slide */}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
      {/* Dot indicators via useCarousel().api */}
    </Carousel>
  )
}
```

### Pattern 2: Server/Client Split for Header
**What:** Header remains async Server Component for auth, delegates interactive parts to Client Components
**When to use:** HOME-04 header redesign
**Example:**
```typescript
// header.tsx -- Server Component (async, reads user)
export async function Header() {
  const user = await getCurrentUser()
  return (
    <>
      <TopBar user={user} />
      <MainHeader user={user} />
    </>
  )
}

// header-search.tsx -- Client Component
'use client'
export function HeaderSearch() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const handleSearch = () => router.push(`/vehicles?keyword=${encodeURIComponent(keyword)}`)
  // ...
}

// mega-menu.tsx -- Client Component
'use client'
export function MegaMenu({ categories }: { categories: MenuCategory[] }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  // hover handlers for desktop, click for mobile
}
```

### Pattern 3: Tabbed Recommended Vehicles with Server Data
**What:** Server Component fetches all tab data, Client Component handles tab switching
**When to use:** HOME-03 recommended vehicles
**Example:**
```typescript
// recommended-vehicles.tsx (Server Component)
export async function RecommendedVehicles() {
  // Parallel fetch all tabs -- CRITICAL: Promise.all per project convention
  const [popular, newest, deals] = await Promise.all([
    prisma.vehicle.findMany({ where: { approvalStatus: 'APPROVED' }, orderBy: { viewCount: 'desc' }, take: 8, include: vehicleInclude }),
    prisma.vehicle.findMany({ where: { approvalStatus: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 8, include: vehicleInclude }),
    prisma.vehicle.findMany({ where: { approvalStatus: 'APPROVED' }, orderBy: { price: 'asc' }, take: 8, include: vehicleInclude }),
  ])
  return <RecommendedVehiclesTabs popular={popular} newest={newest} deals={deals} />
}

// recommended-vehicles-tabs.tsx (Client Component)
'use client'
export function RecommendedVehiclesTabs({ popular, newest, deals }) {
  const [activeTab, setActiveTab] = useState('popular')
  const vehicles = activeTab === 'popular' ? popular : activeTab === 'newest' ? newest : deals
  return (
    <>
      <TabButtons active={activeTab} onChange={setActiveTab} />
      <VehicleGrid vehicles={vehicles} />
    </>
  )
}
```

### Pattern 4: Breadcrumb Wrapper Component
**What:** Reusable breadcrumb component that derives path from route segments
**When to use:** HOME-06 all public pages
**Example:**
```typescript
// breadcrumb-nav.tsx
import Link from 'next/link'
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

type Crumb = { label: string; href?: string }

export function BreadcrumbNav({ items }: { items: Crumb[] }) {
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>홈</BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item, i) => (
          <Fragment key={item.label}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {i === items.length - 1 ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={item.href!} />}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

### Anti-Patterns to Avoid
- **Making the entire header a Client Component:** The header uses `getCurrentUser()` (server-side). Keep header as Server Component; extract search bar and mega menu as separate Client Components.
- **Fetching recommended vehicle data per-tab on client:** Fetch all 3 tabs in parallel on the server with `Promise.all()`. Tab switching should be instant (data already loaded).
- **Using `overflow: hidden` on header ancestors:** CSS `position: sticky` on the header breaks if any parent has `overflow: hidden`. Use `overflow-x: clip` if horizontal overflow containment is needed.
- **Embedding banner images as base64:** Use placeholder gradients with text overlays for now. Real images come from admin CMS in v3.0.
- **Adding breadcrumbs in layout.tsx via pathname parsing:** Each page should pass explicit breadcrumb items. Path-based auto-generation creates brittle coupling.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Carousel with autoplay | Custom setInterval + CSS transforms | Embla Carousel + autoplay plugin | Touch/swipe, momentum, accessibility, loop, SSR handled |
| Breadcrumb component | Custom nav > ol > li chain | shadcn Breadcrumb | Already installed, handles separator, a11y, render prop for Link |
| Mega menu accessibility | Custom focus trap + aria | CSS hover + keyboard focus-within | Simpler, no JS for desktop; Sheet handles mobile accessibility |
| Dot indicators | Manual index tracking | Embla API `scrollSnapList()` + `selectedScrollSnap()` | Keeps in sync with carousel state automatically |
| Icon bar horizontal scroll | Custom overflow detection | `overflow-x-auto scrollbar-hide` + snap scroll | CSS-only, no JS needed |

**Key insight:** Every interactive element in this phase has an existing library or component pattern in the codebase. The work is composition and styling, not building new primitives.

## Common Pitfalls

### Pitfall 1: Embla Autoplay Not Starting
**What goes wrong:** Carousel renders but autoplay doesn't activate
**Why it happens:** `playOnInit` defaults to `true`, but if the carousel has no visible slides at mount time (SSR hydration mismatch or conditional rendering), autoplay won't start
**How to avoid:** Ensure carousel content is present at first render. Use `plugins={[Autoplay({ delay: 4000, playOnInit: true })]}` explicitly. If needed, call `api?.plugins().autoplay.play()` after mount.
**Warning signs:** Banner is static, no auto-rotation

### Pitfall 2: Header Search Form vs. Link Navigation
**What goes wrong:** Search input submits as form POST instead of navigating to `/vehicles?keyword=xxx`
**Why it happens:** Wrapping input in `<form>` without proper action, or using `onSubmit` without `e.preventDefault()`
**How to avoid:** Use `router.push()` on Enter key or button click. No `<form>` needed for simple keyword search navigation.
**Warning signs:** Page refreshes on search, URL doesn't update

### Pitfall 3: Mega Menu Hover Flicker
**What goes wrong:** Mega menu opens/closes erratically when mouse moves between trigger and dropdown
**Why it happens:** Gap between nav link and dropdown content causes `mouseLeave` before `mouseEnter` on dropdown
**How to avoid:** Use a single container that spans both trigger and content. Add `onMouseEnter`/`onMouseLeave` on the parent wrapper, not individual elements. Use a small delay (100-150ms) before closing.
**Warning signs:** Menu flickers when moving mouse from nav to dropdown area

### Pitfall 4: Server Component with Client Interactive Children
**What goes wrong:** TypeScript error or runtime crash when passing server-fetched data to client components
**Why it happens:** Prisma objects contain Date instances which aren't serializable across the server/client boundary
**How to avoid:** Use `vehicleInclude` for consistent data shape. Ensure Date fields are serialized (they auto-serialize in Next.js RSC, but verify edge cases). Keep data flow one-directional: Server fetches -> passes as props -> Client renders.
**Warning signs:** `Error: Only plain objects can be passed to Client Components from Server Components`

### Pitfall 5: Breadcrumb Not Matching Route Hierarchy
**What goes wrong:** Breadcrumb shows wrong path or broken links
**Why it happens:** Route groups like `(public)` are invisible in URLs but present in file structure
**How to avoid:** Breadcrumb items are explicitly defined per page, not auto-derived from file path. Vehicle detail: `[{ label: '내차사기', href: '/vehicles' }, { label: 'Brand Model', href: undefined }]`
**Warning signs:** Breadcrumb links to non-existent routes, or shows `(public)` in path

### Pitfall 6: Mobile Mega Menu State Leak
**What goes wrong:** Desktop mega menu state persists when window resizes to mobile, or vice versa
**Why it happens:** Single state managing both desktop hover menu and mobile Sheet accordion
**How to avoid:** Desktop mega menu uses CSS hover (`group-hover:block`) or separate state from mobile. Mobile uses existing Sheet + Accordion components. Use Tailwind responsive classes (`hidden md:block` / `md:hidden`) to render only the appropriate UI.
**Warning signs:** Menu stuck open on resize, desktop hover menu visible on mobile

## Code Examples

### Verified: Embla Autoplay Plugin Usage
```typescript
// Source: node_modules/embla-carousel-autoplay/components/Options.d.ts
// Verified options from installed package types
import Autoplay from 'embla-carousel-autoplay'

const autoplayPlugin = Autoplay({
  delay: 4000,          // 4 seconds between slides
  jump: false,          // Smooth transition (not jump)
  playOnInit: true,     // Start automatically
  stopOnFocusIn: true,  // Pause when focused (a11y)
  stopOnInteraction: true,  // Stop on user interaction
  stopOnMouseEnter: true,   // Pause on hover
  stopOnLastSnap: false,    // Don't stop at last slide (loop)
})
```

### Verified: shadcn Breadcrumb with Next.js Link
```typescript
// Source: src/components/ui/breadcrumb.tsx (already installed)
// BreadcrumbLink uses base-ui useRender with render prop pattern
<BreadcrumbLink render={<Link href="/vehicles" />}>
  내차사기
</BreadcrumbLink>
```

### Verified: shadcn Carousel with Plugins
```typescript
// Source: src/components/ui/carousel.tsx
// CarouselProps accepts plugins as second parameter to useEmblaCarousel
<Carousel
  opts={{ loop: true, align: 'start' }}
  plugins={[Autoplay({ delay: 4000 })]}
>
  <CarouselContent className="-ml-0">
    <CarouselItem className="pl-0 basis-full">
      {/* Full-width slide */}
    </CarouselItem>
  </CarouselContent>
</Carousel>
```

### Verified: K Car Footer Structure (from crawl)
```
K Car footer structure (from .firecrawl/kcar.com.md):
- Links row 1: 회사소개, IR, 보증서비스, 고객지원
- Links row 2: ESG, 인재채용, 이용약관, Foreigner Support
- Links row 3: 개인정보처리방침(bold), 윤리경영, 비윤리제보
- Logo
- Business info: 상호명, 대표자, 개인정보보호책임자, 사업자등록번호
- 통신판매업 신고번호, 사업장 소재지
- Contact: partnership@, ads@
- SNS icons: 페이스북, 인스타그램, 네이버카페, 블로그, 포스트, 유튜브
- Awards: NCSI 1위 (2025), 퍼스트브랜드 대상 7년 연속 (2020-2026)
- App download: App Store, Google Play (with QR codes)
- Copyright
```

### Verified: K Car Homepage Section Order (from crawl)
```
K Car homepage sections (from .firecrawl/kcar.com.md):
1. Header: 차량검색 + 로그인/회원가입 + 전체메뉴
2. Sub-navigation: K Car Warranty, 전국직영점, 브랜드인증관
3. Quick links: 무료배송, 위클리특가, 렌트특가, 테마기획전
4. Search section: "어떤 차를 찾으세요?" + 국산/수입 tabs + 제조사/모델 cascade
5. "내차팔기" promo section
6. "내차사기 홈서비스" promo section
7. "K Car 렌트" section
8. "K Car 금융서비스" section
9. "테마기획전" section
10. "위클리특가" section with countdown timer
11. "판매 준비 차량" section
12. "전국직영점" map section
13. K Car Warranty section
14. Footer: customer center + links + company info + SNS + awards
```

## State of the Art

| Old Approach (v1.0) | Current Approach (Phase 16) | Impact |
|--------------|------------------|--------|
| Dark gradient hero with inline search | Full-width banner carousel + separate search section | Matches K Car UX, promo-focused first impression |
| 4-col grid icon menu | Circular icons + horizontal scroll mobile | K Car pattern, better mobile UX |
| Simple recommended grid | Tabbed popular/newest/deal sections | Better discovery, engagement |
| Plain nav links | Mega menu with category grid | Richer navigation, lower bounce |
| Basic footer | Full footer with SNS, awards, app badges | Trust signals, professionalism |
| No breadcrumbs | Consistent breadcrumb across all public pages | Better wayfinding, SEO |

**Deprecated/outdated in this phase:**
- `hero-section.tsx` glassmorphism dark gradient -- replaced by banner carousel
- `quick-menu.tsx` 4-column grid layout -- replaced by circular icons
- `featured-vehicles.tsx` simple 8-card grid -- replaced by tabbed section
- `event-banners.tsx` 3-banner gradient cards -- integrated into promo section
- `finance-partners.tsx` tab-based partner showcase -- simplified to logo bar

## Key Implementation Details

### Header Server/Client Architecture
The current `header.tsx` is an `async` Server Component that calls `getCurrentUser()`. This pattern MUST be preserved. The solution is to compose Server and Client pieces:

```
Header (Server Component - async)
  +-- TopBar (Server - login/signup links, user name)
  +-- MainHeaderBar (Server wrapper)
  |   +-- Logo (Server - static)
  |   +-- HeaderSearch (Client - input state, router.push)
  |   +-- UserActions (Server - conditional login/signup vs username)
  +-- NavBar (Server wrapper)
  |   +-- MegaMenu (Client - hover state, dropdown content)
  +-- MobileNav (Client - Sheet, accordion)
```

### Homepage Section Composition
```
page.tsx (Server Component)
  +-- HeroBanner (Client - carousel autoplay)
  +-- HeroSearchBox (Client - tabbed search, extracted from hero-section.tsx)
  +-- QuickLinks (Server - static icons + links)
  +-- Suspense
  |   +-- RecommendedVehicles (Server - Prisma query)
  |       +-- RecommendedVehiclesTabs (Client - tab switching)
  +-- PromoBanners (Server - static promo cards)
  +-- Suspense
  |   +-- RentCarousel (Server - Prisma query + Client carousel)
  +-- PartnerLogos (Server - static logo bar)
```

### Breadcrumb Integration Strategy
Per CONTEXT.md, breadcrumbs go inside max-w-7xl below header. Two options:

**Option A (Recommended): Per-page explicit breadcrumbs**
Each page defines its own crumbs. Most flexible, no magic.
```typescript
// src/app/(public)/vehicles/page.tsx
<BreadcrumbNav items={[{ label: '내차사기' }]} />

// src/app/(public)/vehicles/[id]/page.tsx
<BreadcrumbNav items={[
  { label: '내차사기', href: '/vehicles' },
  { label: `${brand} ${model}` },
]} />
```

**Option B: Layout-level with slot**
Layout provides breadcrumb container, pages fill it. More complex, less explicit.

**Recommendation:** Option A. Each page knows its own context best. The homepage does NOT show breadcrumbs (it's the root).

### VehicleCard Reuse in Recommended Section
Phase 15's `VehicleCard` is a Client Component that requires `VehicleWithDetails` type (which includes `trim.generation.carModel.brand`, `images`, `dealer`). The recommended vehicles query MUST use the same `vehicleInclude` from `src/features/vehicles/lib/vehicle-include.ts` to match the expected type.

Note: `VehicleCard` depends on `useVehicleInteractionStore` for wishlist/compare. This means the recommended section needs `StoreHydration` (already in public layout). No additional setup needed.

### Mega Menu Data Structure
```typescript
type MenuCategory = {
  label: string           // e.g., '내차사기'
  href: string            // e.g., '/vehicles'
  hasMegaMenu: boolean    // true for expandable menus
  sections?: {
    title: string
    links: { label: string; href: string }[]
  }[]
}

const MENU_DATA: MenuCategory[] = [
  {
    label: '내차사기',
    href: '/vehicles',
    hasMegaMenu: true,
    sections: [
      { title: '차종별', links: [
        { label: '세단', href: '/vehicles?vehicleType=sedan' },
        { label: 'SUV', href: '/vehicles?vehicleType=suv' },
        // ...
      ]},
      { title: '브랜드별', links: [
        { label: '현대', href: '/vehicles?brand=hyundai' },
        // ...
      ]},
      { title: '가격별', links: [
        { label: '1000만원 이하', href: '/vehicles?priceMax=10000000' },
        // ...
      ]},
    ],
  },
  // ...
]
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.x + happy-dom |
| Config file | `vitest.config.ts` |
| Quick run command | `yarn test --run` |
| Full suite command | `yarn test --run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | Hero banner renders carousel slides + autoplay plugin attached | unit | `yarn test --run src/features/marketing/components/hero-banner.test.tsx` | No - Wave 0 |
| HOME-02 | Quick links render all icons with correct hrefs | unit | `yarn test --run src/features/marketing/components/quick-links.test.tsx` | No - Wave 0 |
| HOME-03 | Recommended vehicles renders tab buttons + vehicle cards | unit | `yarn test --run src/features/marketing/components/recommended-vehicles.test.tsx` | No - Wave 0 |
| HOME-04 | Header renders search bar + mega menu + role-based links | unit | `yarn test --run src/components/layout/header.test.tsx` | No - Wave 0 |
| HOME-05 | Footer renders SNS links + awards + business info | unit | `yarn test --run src/components/layout/footer.test.tsx` | No - Wave 0 |
| HOME-06 | Breadcrumb renders correct path hierarchy | unit | `yarn test --run src/components/layout/breadcrumb-nav.test.tsx` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test --run`
- **Per wave merge:** `yarn test --run && yarn type-check && yarn build`
- **Phase gate:** Full suite green + `yarn build` success before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/marketing/components/hero-banner.test.tsx` -- covers HOME-01
- [ ] `src/features/marketing/components/quick-links.test.tsx` -- covers HOME-02
- [ ] `src/features/marketing/components/recommended-vehicles.test.tsx` -- covers HOME-03 (mock Prisma, test tab switching)
- [ ] `src/components/layout/header.test.tsx` -- covers HOME-04 (search bar renders, mega menu items)
- [ ] `src/components/layout/footer.test.tsx` -- covers HOME-05 (SNS links, awards section)
- [ ] `src/components/layout/breadcrumb-nav.test.tsx` -- covers HOME-06 (path rendering, separator)

## Open Questions

1. **Mega menu hover delay timing**
   - What we know: K Car uses hover-activated dropdown on desktop
   - What's unclear: Exact delay before open/close
   - Recommendation: Use 100ms open delay, 200ms close delay. Tune visually.

2. **Tab data query: "popular" sort field**
   - What we know: Vehicle model has `viewCount` (Int, default 0) per FEATURES.md schema additions
   - What's unclear: Whether `viewCount` field exists in current schema (it was added in Phase 14 seed data for some vehicles)
   - Recommendation: Use `viewCount` if available, fallback to `approvedAt desc` (same as current FeaturedVehicles)

3. **Promo banner slide count**
   - What we know: K Car has 3-5 promotional slides
   - What's unclear: Exact content for Navid Auto placeholder banners
   - Recommendation: Create 3 placeholder banners with gradient backgrounds: "신규 차량 입고" (blue), "렌트 특가" (green), "보증 서비스" (navy)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/components/ui/carousel.tsx`, `src/components/ui/breadcrumb.tsx` -- verified Embla/Breadcrumb implementations
- Existing codebase: `src/components/layout/header.tsx`, `footer.tsx`, `mobile-nav.tsx` -- verified current architecture
- Existing codebase: `src/features/marketing/components/*.tsx` -- all 6 homepage sections analyzed
- `node_modules/embla-carousel-autoplay/components/Options.d.ts` -- verified autoplay plugin API
- `.firecrawl/kcar.com.md` -- K Car homepage structure (crawled 2026-03-19)

### Secondary (MEDIUM confidence)
- `.planning/research/FEATURES.md` -- K Car feature landscape (synthesized from multiple sources)
- `.planning/research/ARCHITECTURE.md` -- component placement patterns and build order
- `.planning/phases/16-homepage-navigation/16-CONTEXT.md` -- user decisions, canonical references

### Tertiary (LOW confidence)
- None -- all findings verified against existing code or installed packages

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages already installed, APIs verified from type declarations
- Architecture: HIGH - follows established patterns from Phases 13-15, no new architectural decisions
- Pitfalls: HIGH - based on direct code analysis and known React/Next.js patterns
- K Car reference: MEDIUM - crawled data provides structure but some JS-rendered content was missing

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- no moving targets, all dependencies locked)
