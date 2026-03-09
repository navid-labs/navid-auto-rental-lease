# Phase 5: Public Search & Discovery - Research

**Researched:** 2026-03-09
**Domain:** Public-facing search, filtering, URL state management, landing page
**Confidence:** HIGH

## Summary

Phase 5 builds the public storefront: a landing page with featured vehicles and quick search, a search results page with multi-criteria filters and sort, and a public vehicle detail page with inquiry form. The project already has strong foundations -- VehicleDetailView, CascadeSelect, format helpers, Prisma Vehicle model with ApprovalStatus, and an Inquiry model ready for form submissions.

The primary technical challenges are: (1) URL state persistence for filters/sort using search params, (2) a dual-handle range slider for price/mileage/year filters, and (3) responsive layout with sidebar filters on desktop and bottom sheet on mobile. The existing shadcn base-nova style with @base-ui/react primitives supports all needed components including slider with range support.

**Primary recommendation:** Use `nuqs` for type-safe URL search param state management, add shadcn `slider` component (base-nova variant) for range filters, and build search as a Server Component page with Client Component filter sidebar. Keep the architecture simple -- no client-side data fetching library needed since Server Components handle data loading.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Card grid layout: 3 columns desktop, 2 columns tablet, 1 column mobile
- Left sidebar filters on desktop; mobile uses filter button -> bottom sheet/drawer
- Sort options above results grid: price (low/high), year (new/old), mileage (low/high), newest listing
- Brand -> Model cascade selection, reusing existing CascadeSelect component from Phase 3
- Optional Generation filter after Model selection
- Price range: dual-handle slider (monthly rental basis)
- Mileage range: dual-handle slider
- Year range: dual-handle slider or min/max year select
- All filter state persisted in URL query params (SRCH-05)
- Only APPROVED vehicles shown (Phase 4 visibility rule enforced)
- Vehicle card: photo, brand/model name, year/mileage, monthly price, 16:9 aspect ratio
- Monthly price only ("monthly 320,000 won") -- no rental/lease distinction until Phase 6
- Placeholder image (car icon on gray background) for vehicles without photos
- Reuse existing VehicleDetailView gallery component from Phase 3
- Remove edit/status controls -- public view only
- Add CTA section: "sandam shinchung" button opens inquiry form (name, phone, message)
- Inquiry creates record in existing Inquiry DB model
- Landing page: full-width dark navy hero with glassmorphism quick search widget
- Sections: newest vehicles, brand shortcuts, usage method (3-step), trust metrics

### Claude's Discretion
- Exact slider component implementation (shadcn Slider or custom dual-handle)
- Search results pagination vs infinite scroll vs load-more
- URL query param naming convention
- Empty search results state design
- Mobile bottom sheet filter implementation details
- Landing page hero background treatment (gradient, image, pattern)
- Brand logo assets (text fallback if no logo images)
- Inquiry form validation rules and success state

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-01 | User can search vehicles with multi-criteria filters (brand, model, year, price range, mileage) | CascadeSelect reuse for brand/model, shadcn Slider for ranges, Prisma where clause with dynamic filters, nuqs for URL state |
| SRCH-02 | User can sort results by price, year, mileage, or newest | Prisma orderBy with dynamic field, sort state in URL via nuqs |
| SRCH-03 | Vehicle detail page with photo gallery, specs, and pricing info | Reuse VehicleDetailView (public variant), add inquiry form with Zod validation |
| SRCH-05 | Filter state persisted in URL for sharing/bookmarking | nuqs library for type-safe URL search param management |
| UIEX-02 | Landing page with featured vehicles and quick search | Server Component with Prisma query for newest APPROVED vehicles, glassmorphism hero with cascade search widget |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuqs | ^2.x | Type-safe URL search param state | De facto standard for Next.js App Router URL state; useState-like API, 6KB gzipped, handles serialization/parsing |
| @base-ui/react (Slider) | ^1.2.0 | Range slider primitive | Already installed; shadcn base-nova slider uses this |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn slider | (add via CLI) | Dual-handle range slider UI | Price, mileage, year range filters |
| zod | (already installed) | Inquiry form validation | Validate name, phone, message fields |
| react-hook-form | (already installed) | Inquiry form state | Manage form submission with validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nuqs | Raw useSearchParams + URLSearchParams | nuqs provides type safety, parsers, debouncing; raw approach requires manual serialization and is error-prone |
| Server Component data loading | React Query / SWR | Unnecessary complexity; Server Components load data at request time, no client cache needed for search results |
| Pagination | Infinite scroll | Pagination is simpler, SEO-friendly, and matches URL state pattern; load-more or infinite scroll adds client complexity |

**Installation:**
```bash
yarn add nuqs
npx shadcn@latest add slider
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(public)/
│   ├── page.tsx                    # Landing page (Server Component)
│   ├── vehicles/
│   │   ├── page.tsx                # Search results page (Server Component)
│   │   └── [id]/
│   │       └── page.tsx            # Vehicle detail page (Server Component)
├── features/vehicles/
│   ├── components/
│   │   ├── vehicle-card.tsx        # NEW: Public vehicle card
│   │   ├── vehicle-grid.tsx        # NEW: Grid layout for cards
│   │   ├── search-filters.tsx      # NEW: Filter sidebar (Client Component)
│   │   ├── search-sort.tsx         # NEW: Sort selector (Client Component)
│   │   ├── public-vehicle-detail.tsx # NEW: Public detail view (reuses VehicleDetailView internals)
│   │   └── inquiry-form.tsx        # NEW: Inquiry form (Client Component)
│   ├── actions/
│   │   └── create-inquiry.ts       # NEW: Server Action for inquiry submission
│   └── lib/
│       └── search-params.ts        # NEW: nuqs parser definitions
├── features/marketing/
│   └── components/
│       ├── hero-section.tsx         # NEW: Landing hero with quick search
│       ├── featured-vehicles.tsx    # NEW: Newest vehicles horizontal scroll
│       ├── brand-shortcuts.tsx      # NEW: Brand logo grid
│       ├── how-it-works.tsx         # NEW: 3-step process section
│       └── trust-metrics.tsx        # NEW: Stats section
```

### Pattern 1: URL State with nuqs
**What:** All filter and sort state lives in the URL via nuqs parsers
**When to use:** Every filter interaction, sort change, pagination change
**Example:**
```typescript
// src/features/vehicles/lib/search-params.ts
import { parseAsString, parseAsInteger, createSearchParamsCache } from 'nuqs/server'

export const searchParamsParsers = {
  brand: parseAsString.withDefault(''),
  model: parseAsString.withDefault(''),
  generation: parseAsString.withDefault(''),
  yearMin: parseAsInteger,
  yearMax: parseAsInteger,
  priceMin: parseAsInteger,
  priceMax: parseAsInteger,
  mileageMin: parseAsInteger,
  mileageMax: parseAsInteger,
  sort: parseAsString.withDefault('newest'),
  page: parseAsInteger.withDefault(1),
}

// Server-side cache for reading params in Server Components
export const searchParamsCache = createSearchParamsCache(searchParamsParsers)
```

### Pattern 2: Server Component Search Page
**What:** Search results page as Server Component; reads searchParams, queries Prisma, renders grid
**When to use:** The search results page itself
**Example:**
```typescript
// src/app/(public)/vehicles/page.tsx
import { searchParamsCache } from '@/features/vehicles/lib/search-params'

export const dynamic = 'force-dynamic'

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const params = searchParamsCache.parse(await searchParams)

  // Build Prisma where clause from params
  const where = buildWhereClause(params)
  const orderBy = buildOrderBy(params.sort)

  const [vehicles, totalCount] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: vehicleWithDetailsInclude,
    }),
    prisma.vehicle.count({ where }),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex gap-8">
        <SearchFilters />       {/* Client Component - reads/writes URL */}
        <div className="flex-1">
          <SearchSort />          {/* Client Component */}
          <VehicleGrid vehicles={vehicles} />
          <Pagination total={totalCount} pageSize={PAGE_SIZE} />
        </div>
      </div>
    </div>
  )
}
```

### Pattern 3: Client Filter Component with nuqs
**What:** Client Components use nuqs hooks to read/write URL params
**When to use:** Filter sidebar, sort selector
**Example:**
```typescript
// src/features/vehicles/components/search-filters.tsx
'use client'
import { useQueryStates } from 'nuqs'
import { searchParamsParsers } from '../lib/search-params'

export function SearchFilters() {
  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    shallow: false, // trigger server re-render
  })

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      {/* Brand/Model cascade */}
      {/* Price range slider */}
      {/* Year range slider */}
      {/* Mileage range slider */}
    </aside>
  )
}
```

### Pattern 4: NuqsAdapter Setup
**What:** nuqs requires an adapter wrapper in the layout for Next.js App Router
**When to use:** Root or public layout
**Example:**
```typescript
// In layout.tsx or a provider
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export default function Layout({ children }) {
  return <NuqsAdapter>{children}</NuqsAdapter>
}
```

### Anti-Patterns to Avoid
- **Client-side data fetching for search results:** Use Server Components with searchParams prop. No need for useEffect + fetch or React Query for initial page load.
- **Local state for filters without URL sync:** Every filter must be in the URL. Users should be able to share/bookmark any search state.
- **Calling CascadeSelect onChange for all 4 fields on search page:** On the search page, brand and model are independent filters (not tied to trimId selection). Only use brand/model cascade; generation is optional. Don't require trimId.
- **Missing Suspense boundary:** useSearchParams/nuqs hooks in Client Components require Suspense wrapping in production builds.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL search param parsing/serialization | Custom parse/serialize for each param type | nuqs parsers (parseAsInteger, parseAsString) | Type safety, edge cases (null, arrays, encoding), history management |
| Range slider UI | Custom dual-thumb slider with drag handling | shadcn Slider (base-nova) with array defaultValue | Accessibility, keyboard nav, touch events, RTL support |
| Mobile filter drawer | Custom modal/overlay | Existing shadcn Sheet component | Already in project, accessible, animated |
| Image placeholder | Custom SVG/CSS | ImageIcon from lucide-react (already used in VehicleDetailView) | Consistent with existing pattern |

**Key insight:** The existing component library (shadcn base-nova + base-ui) already covers slider, sheet, card, and all needed primitives. The only new dependency is nuqs for URL state.

## Common Pitfalls

### Pitfall 1: Missing NuqsAdapter
**What goes wrong:** nuqs hooks throw "No adapter found" error at runtime
**Why it happens:** nuqs v2 requires an adapter wrapper in the component tree
**How to avoid:** Add NuqsAdapter in the public layout or root layout
**Warning signs:** Runtime error in browser console about missing adapter

### Pitfall 2: Shallow vs Deep URL Updates
**What goes wrong:** Changing filters doesn't update search results
**Why it happens:** nuqs defaults to shallow updates (client-side only, no server re-render)
**How to avoid:** Use `{ shallow: false }` in useQueryStates to trigger Server Component re-render
**Warning signs:** URL changes but page content stays the same

### Pitfall 3: CascadeSelect Adaptation for Search Filters
**What goes wrong:** Using CascadeSelect directly requires trimId which search doesn't need
**Why it happens:** CascadeSelect was built for vehicle registration (needs exact trim). Search only needs brand + model (optional generation)
**How to avoid:** Either create a simplified SearchCascadeSelect or extract the brand/model portion as a reusable sub-component
**Warning signs:** Search requires users to select all 4 levels before showing results

### Pitfall 4: Prisma Query Performance with Multiple Optional Filters
**What goes wrong:** Slow queries when many filters are applied
**Why it happens:** Dynamic where clause with nested relation filters (brand -> model -> generation -> trim -> vehicle)
**How to avoid:** Build where clause with only active filters. Use Prisma's relation filtering: `where: { trim: { generation: { carModel: { brandId } } } }`. Consider adding DB indexes on frequently filtered columns.
**Warning signs:** Search page takes > 1s to load with filters

### Pitfall 5: Image Loading Performance
**What goes wrong:** Search results page loads slowly with many vehicle images
**Why it happens:** Loading all images at once, no lazy loading, large image sizes
**How to avoid:** Use Next.js Image with `loading="lazy"`, appropriate `sizes` prop, and `priority` only for above-the-fold images. Use the primary image (isPrimary flag) or first image for cards.
**Warning signs:** Large Cumulative Layout Shift (CLS), slow page load

### Pitfall 6: Suspense Boundary for Search Params
**What goes wrong:** Build fails with "Missing Suspense boundary with useSearchParams"
**Why it happens:** Next.js requires Suspense boundary around Client Components using useSearchParams
**How to avoid:** Wrap filter/sort Client Components in Suspense with appropriate fallback
**Warning signs:** Build error in production build

## Code Examples

### Prisma Query Builder for Search Filters
```typescript
// Source: Project-specific pattern based on Prisma docs
import { Prisma, ApprovalStatus, VehicleStatus } from '@prisma/client'

type SearchFilters = {
  brand: string | null
  model: string | null
  generation: string | null
  yearMin: number | null
  yearMax: number | null
  priceMin: number | null
  priceMax: number | null
  mileageMin: number | null
  mileageMax: number | null
}

export function buildWhereClause(filters: SearchFilters): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {
    approvalStatus: ApprovalStatus.APPROVED,
    status: { not: VehicleStatus.HIDDEN },
  }

  // Brand/Model/Generation filters via nested relations
  if (filters.brand) {
    where.trim = {
      generation: {
        carModel: {
          brandId: filters.brand,
          ...(filters.model ? { id: filters.model } : {}),
        },
        ...(filters.generation ? { id: filters.generation } : {}),
      },
    }
  }

  // Range filters
  if (filters.yearMin || filters.yearMax) {
    where.year = {
      ...(filters.yearMin ? { gte: filters.yearMin } : {}),
      ...(filters.yearMax ? { lte: filters.yearMax } : {}),
    }
  }

  if (filters.priceMin || filters.priceMax) {
    where.monthlyRental = {
      ...(filters.priceMin ? { gte: filters.priceMin } : {}),
      ...(filters.priceMax ? { lte: filters.priceMax } : {}),
    }
  }

  if (filters.mileageMin || filters.mileageMax) {
    where.mileage = {
      ...(filters.mileageMin ? { gte: filters.mileageMin } : {}),
      ...(filters.mileageMax ? { lte: filters.mileageMax } : {}),
    }
  }

  return where
}

export function buildOrderBy(sort: string): Prisma.VehicleOrderByWithRelationInput {
  switch (sort) {
    case 'price-asc': return { monthlyRental: 'asc' }
    case 'price-desc': return { monthlyRental: 'desc' }
    case 'year-desc': return { year: 'desc' }
    case 'year-asc': return { year: 'asc' }
    case 'mileage-asc': return { mileage: 'asc' }
    case 'mileage-desc': return { mileage: 'desc' }
    case 'newest':
    default: return { approvedAt: 'desc' }
  }
}
```

### Vehicle Card Component
```typescript
// Source: DESIGN-SPEC.md card spec + existing format helpers
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { formatKRW, formatDistance, formatYearModel } from '@/lib/utils/format'
import { ImageIcon } from 'lucide-react'
import type { VehicleWithDetails } from '@/features/vehicles/types'

export function VehicleCard({ vehicle }: { vehicle: VehicleWithDetails }) {
  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const primaryImage = vehicle.images.find(img => img.isPrimary) ?? vehicle.images[0]

  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <Card className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative aspect-[16/9] bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={`${brand.name} ${model.name}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="size-10 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold">{brand.name} {model.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatYearModel(vehicle.year)} · {formatDistance(vehicle.mileage, { compact: true })}
          </p>
          <p className="mt-2 text-lg font-bold text-accent">
            {vehicle.monthlyRental
              ? formatKRW(vehicle.monthlyRental, { monthly: true })
              : formatKRW(vehicle.price)}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
```

### Inquiry Form Server Action
```typescript
// Source: Existing Prisma Inquiry model + project action patterns
'use server'

import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const inquirySchema = z.object({
  vehicleId: z.string().uuid(),
  name: z.string().min(2, '이름을 입력해 주세요'),
  phone: z.string().regex(/^01[016789]-?\d{3,4}-?\d{4}$/, '올바른 전화번호를 입력해 주세요'),
  message: z.string().min(10, '10자 이상 입력해 주세요').max(500),
})

export async function createInquiry(formData: z.infer<typeof inquirySchema>) {
  const parsed = inquirySchema.parse(formData)

  await prisma.inquiry.create({
    data: {
      vehicleId: parsed.vehicleId,
      name: parsed.name,
      phone: parsed.phone,
      message: parsed.message,
      status: 'NEW',
    },
  })

  return { success: true }
}
```

## Discretion Recommendations

For items marked as Claude's Discretion in CONTEXT.md:

| Item | Recommendation | Rationale |
|------|---------------|-----------|
| Slider implementation | Use shadcn Slider (base-nova) via `npx shadcn add slider` | Already uses @base-ui/react; supports range mode with array values |
| Pagination vs infinite scroll | **Pagination** with page numbers | SEO-friendly, URL-stateful (page param), simpler Server Component model, no client fetch needed |
| URL query param naming | Short lowercase: `brand`, `model`, `gen`, `yearMin`, `yearMax`, `priceMin`, `priceMax`, `mileMin`, `mileMax`, `sort`, `page` | Readable URLs, standard convention |
| Empty results state | Centered illustration (SearchX icon) + "No results" message + filter reset button | Standard UX pattern |
| Mobile bottom sheet filter | Use existing shadcn Sheet component (already in project) | Sheet component already built with base-ui Dialog primitive; bottom sheet behavior via CSS |
| Landing hero background | CSS gradient (navy-900 to navy-800) with subtle radial/mesh pattern | No external image dependency; fast load; matches glassmorphism design system |
| Brand logo assets | Text fallback with styled div (brand initial letter in circle) if no logoUrl | Brand.logoUrl field exists in schema; use it when available, text fallback otherwise |
| Inquiry form validation | Name (2+ chars), Phone (Korean mobile regex), Message (10-500 chars); success shows toast/alert then close dialog | Standard Korean form validation; no email required (optional in schema) |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useState + useEffect for filters | URL state with nuqs | 2024+ | Shareable/bookmarkable searches, SSR-friendly |
| Client-side data fetching for search | Server Components with searchParams | Next.js 13+ (2023) | No loading spinners, SEO-friendly, simpler code |
| Custom slider from scratch | shadcn Slider (base-ui) with range support | 2024-2025 | Accessible, keyboard-navigable, touch-friendly |
| Radix UI primitives | @base-ui/react primitives | 2024-2025 | Project already uses base-nova style; base-ui is the successor |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already configured) |
| Config file | vitest.config.mts |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | buildWhereClause returns correct Prisma filter for each criteria | unit | `yarn test src/features/vehicles/lib/search-query.test.ts -x` | Wave 0 |
| SRCH-02 | buildOrderBy returns correct Prisma orderBy for each sort option | unit | `yarn test src/features/vehicles/lib/search-query.test.ts -x` | Wave 0 |
| SRCH-03 | createInquiry server action validates and creates inquiry record | unit | `yarn test src/features/vehicles/actions/create-inquiry.test.ts -x` | Wave 0 |
| SRCH-05 | nuqs parsers serialize/deserialize all filter params correctly | unit | `yarn test src/features/vehicles/lib/search-params.test.ts -x` | Wave 0 |
| UIEX-02 | Landing page renders featured vehicles section | smoke | Manual verification via dev server | manual-only (Server Component rendering) |

### Sampling Rate
- **Per task commit:** `yarn test`
- **Per wave merge:** `yarn test && yarn type-check && yarn lint`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/vehicles/lib/search-query.test.ts` -- covers SRCH-01, SRCH-02
- [ ] `src/features/vehicles/actions/create-inquiry.test.ts` -- covers SRCH-03
- [ ] `src/features/vehicles/lib/search-params.test.ts` -- covers SRCH-05
- [ ] Slider component install: `npx shadcn@latest add slider`
- [ ] nuqs install: `yarn add nuqs`

## Open Questions

1. **monthlyRental null handling in price filter**
   - What we know: Vehicle.monthlyRental is optional (Int?). Some vehicles may only have `price` (vehicle value) without monthly rental set.
   - What's unclear: Should price filter apply to monthlyRental or price field? What about vehicles without monthlyRental?
   - Recommendation: Filter on monthlyRental when available; vehicles without monthlyRental should still appear in results but be excluded from price range filtering (or show "price TBD")

2. **Pagination page size**
   - What we know: Desktop shows 3-column grid
   - What's unclear: Optimal page size for demo
   - Recommendation: 12 items per page (fills 4 rows of 3 columns on desktop, reasonable scroll depth)

## Sources

### Primary (HIGH confidence)
- Project codebase: prisma/schema.prisma, existing components, DESIGN-SPEC.md
- [shadcn/ui Slider (base)](https://ui.shadcn.com/docs/components/base/slider) - base-nova slider with range support
- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params) - search params API
- [Base UI Slider](https://base-ui.com/react/components/slider) - underlying primitive

### Secondary (MEDIUM confidence)
- [nuqs](https://nuqs.dev/) - type-safe URL state manager, verified as standard approach for Next.js
- [shadcn Dual Range Slider pattern](https://shadcnui-expansions.typeart.cc/docs/dual-range-slider) - community dual-range pattern

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified, project already uses base-ui/shadcn ecosystem
- Architecture: HIGH - follows established project patterns (Server Components, Prisma, Server Actions)
- Pitfalls: HIGH - well-known Next.js App Router patterns, documented gotchas
- nuqs integration: MEDIUM - verified library but not yet used in this project

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable ecosystem, 30 days)
