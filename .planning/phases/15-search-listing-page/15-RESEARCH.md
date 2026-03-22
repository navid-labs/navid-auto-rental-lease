# Phase 15: Search & Listing Page - Research

**Researched:** 2026-03-22
**Domain:** Search/listing page redesign -- infinite scroll, expanded filters, vehicle card redesign, comparison feature
**Confidence:** HIGH

## Summary

Phase 15 transforms the existing `/vehicles` search page from a Server Component with 5 filters and traditional pagination into a hybrid Server/Client architecture with 15 filters, infinite scroll, redesigned vehicle cards, and a comparison dialog. The existing codebase provides strong foundations: `nuqs` for URL-synced filter state, Prisma WHERE clause builder, Zustand comparison store, and `react-intersection-observer` (installed in Phase 13). The main architectural challenge is transitioning from full Server Component rendering with pagination to a hybrid model where the first page renders server-side (for SEO) and subsequent pages load client-side via Server Actions with IntersectionObserver.

The UI-SPEC (`15-UI-SPEC.md`) is already complete and provides pixel-level specifications for all components. This research focuses on the technical patterns, architectural decisions, and pitfalls the planner needs to create implementable tasks.

**Primary recommendation:** Use a Server Action (`loadMoreVehicles`) called from a client `VehicleListClient` component that receives initial vehicles from the page-level Server Component. Keep nuqs for filter state (with `shallow: false` to trigger server re-renders on filter change) and manage infinite scroll offset as client-only state (not in URL).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- K Car style information density on vehicle cards + rental/lease monthly payment parallel display (Navid differentiator)
- Image ratio: 4:3
- CTA icons (wishlist/compare): K Car style top-right placement on image
- Hover: simple scale + shadow (no image swipe)
- Card click opens preview popup -> "Detail" button navigates to /vehicles/[id]
- Range filters (price/year/mileage): K Car style dual sliders replacing existing RangeInputs
- Filter application: Real-time (K Car style, reusing existing nuqs URL sync)
- Infinite scroll: IntersectionObserver via react-intersection-observer replacing Pagination
- Compare table: Fullscreen Dialog (modal over search page)
- Existing Zustand vehicle-interaction-store comparison state reuse
- Mobile filter: K Car style fullscreen Sheet (existing Sheet component reuse)
- View toggle: Grid/List ToggleGroup for desktop and mobile

### Claude's Discretion
- Badge overlay placement (top-left stack vs distributed)
- Warranty bar design
- Tag chip content from inspectionData/historyData JSONB
- Card carousel (K Car pattern vs performance)
- Card preview popup content/method (Dialog vs Sheet, displayed info)
- Card grid columns (desktop: considering filter sidebar width, mobile: 375px)
- List view layout
- 14 filter grouping/collapse strategy
- Generation addition to Brand->Model cascade
- Color filter UI (color chips vs checkboxes)
- Quick filter badge placement
- Active filter chip display method
- Sort dropdown expansion (6->9 options)
- Filter sidebar width/collapse
- Filter reset UX
- Infinite scroll batch size (PAGE_SIZE)
- Back to top button
- SEO pagination fallback
- Scroll position restoration (back navigation)
- Compare max vehicles (3 vs 4)
- Compare table spec items
- Difference highlighting
- Compare floating UI design
- Mobile card grid columns
- Mobile compare display

### Deferred Ideas (OUT OF SCOPE)
- Kakao Map dealer locations (v3.0 MAP-01)
- Rent-only page/filters (v3.0 RENT-01)
- 360-degree photo viewer (v3.0 EXT-01)
- AI vehicle recommendations (v3.0+)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEARCH-01 | 14-filter sidebar (vehicle type, brand/model cascade, year range, mileage range, price slider, color chips, options, region, fuel, transmission, seating, drive type, sales type, keyword tags) | nuqs parser extension pattern, Prisma WHERE builder extension, base-ui Slider dual-thumb API, FilterSection collapsible pattern. UI-SPEC expands to 15 filters (adding monthly payment slider). |
| SEARCH-02 | Vehicle card redesign (image badge overlay, warranty bar, vehicle name, price+installment, spec line, tag chips) | Existing vehicle-card.tsx as base, inspectionData/historyData JSONB schemas for tag extraction, formatKRW/formatDistance utils, K Car badge mapping from UI-SPEC |
| SEARCH-03 | Infinite scroll (IntersectionObserver sentinel + skeleton loading + SEO pagination fallback) | Server Action loadMore pattern, react-intersection-observer useInView, skeleton card grid, hybrid Server/Client architecture |
| SEARCH-04 | Grid/list view toggle (ToggleGroup-based view mode) | shadcn ToggleGroup component, nuqs `view` param, conditional grid vs flex layout |
| SEARCH-05 | Compare feature (floating compare button + max 3 vehicles + spec comparison table) | Zustand store extension (MAX_COMPARISON 4->3), fullscreen Dialog, difference highlighting logic |
| SEARCH-06 | Quick filter badges (free delivery, weekly special, time deal, eco, rent available, no accident) | Boolean nuqs params, horizontal scrollable chip bar, toggle badge mapping |
| SEARCH-07 | Sort dropdown (expanded from 6 to 9 options) | Existing search-sort.tsx extension, new sort cases in buildOrderBy |
| SEARCH-08 | Mobile collapsible filter (Sheet-based mobile filter UI) | Existing Sheet component, FilterContent reuse, active filter count badge |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuqs | ^2.8.9 | URL-synced filter state | Already in use, proven pattern, type-safe parsers, shallow/deep option control |
| react-intersection-observer | ^10.0.3 | Infinite scroll sentinel | Already installed (Phase 13), simple useInView hook, SSR-safe |
| zustand | ^5.0.11 | Comparison/wishlist state | Already in use, localStorage persistence, SSR-safe hydration pattern |
| @base-ui/react | ^1.2.0 | Slider, Sheet, Dialog, Collapsible, ToggleGroup | Already installed via shadcn, dual-thumb slider support |
| Prisma | ^6 | Database queries | Already in use, WHERE clause builder pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.577.0 | Icons (Heart, GitCompareArrows, SlidersHorizontal, etc.) | All UI icons per UI-SPEC |
| next/image | built-in | Optimized vehicle images | Card images with lazy loading |
| sonner | ^2.0.7 | Toast notifications | Compare max reached warning |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-intersection-observer | Native IntersectionObserver | Library already installed, hook API is cleaner than manual ref management |
| Server Actions for loadMore | API Route (GET /api/vehicles) | Server Actions are simpler (no separate route file), but API route allows more caching control. Server Actions win for this project's patterns. |
| nuqs for view mode | React useState | nuqs keeps view mode in URL (shareable/bookmarkable), consistent with other filter params |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(public)/vehicles/
│   └── page.tsx                    # MODIFY: Server Component, initial fetch + pass to client
├── features/vehicles/
│   ├── actions/
│   │   ├── get-cascade-data.ts     # KEEP: Brand->Model->Generation cascade
│   │   └── load-more-vehicles.ts   # NEW: Server Action for infinite scroll
│   ├── components/
│   │   ├── vehicle-card.tsx        # REWRITE: K Car style card with preview popup
│   │   ├── vehicle-card-list.tsx   # NEW: List view card variant
│   │   ├── vehicle-card-skeleton.tsx # NEW: Skeleton loading card
│   │   ├── card-preview-dialog.tsx  # NEW: Click-to-preview popup
│   │   ├── search-filters.tsx      # REWRITE: 15 filters with dual sliders
│   │   ├── search-sort.tsx         # MODIFY: 9 sort options
│   │   ├── vehicle-grid.tsx        # REWRITE: Grid/list hybrid with infinite scroll
│   │   ├── vehicle-list-client.tsx # NEW: Client orchestrator for infinite scroll
│   │   ├── quick-filter-badges.tsx # NEW: Horizontal toggle badge bar
│   │   ├── active-filter-chips.tsx # NEW: Removable active filter tags
│   │   ├── compare-floating-bar.tsx # NEW: Bottom floating compare bar
│   │   ├── compare-dialog.tsx      # NEW: Fullscreen comparison table
│   │   ├── color-filter.tsx        # NEW: Color chip selector
│   │   ├── dual-range-slider.tsx   # NEW: Wrapper around Slider for range filters
│   │   ├── back-to-top.tsx         # NEW: Floating scroll-to-top button
│   │   ├── popular-searches.tsx    # KEEP
│   │   ├── vehicle-search-bar.tsx  # KEEP
│   │   └── pagination.tsx          # DEPRECATE (replaced by infinite scroll)
│   ├── lib/
│   │   ├── search-params.ts        # MODIFY: Add 9+ new filter parsers
│   │   └── search-query.ts         # MODIFY: Add WHERE clauses for new filters
│   └── types/
│       └── index.ts                # KEEP as-is
├── lib/stores/
│   └── vehicle-interaction-store.ts # MODIFY: MAX_COMPARISON 4->3, add drawer state
└── components/ui/
    └── slider.tsx                  # KEEP: Already supports dual-thumb via base-ui
```

### Pattern 1: Hybrid Server/Client Infinite Scroll Architecture

**What:** Server Component renders first page with SEO-friendly HTML; Client Component manages infinite scroll state and loads subsequent pages via Server Action.

**When to use:** Search/listing pages that need both SEO indexability and smooth client-side UX.

**Example:**
```typescript
// src/app/(public)/vehicles/page.tsx (Server Component)
export default async function VehiclesPage({ searchParams }: Props) {
  const params = searchParamsCache.parse(await searchParams)
  const where = buildWhereClause(params)
  const orderBy = buildOrderBy(params.sort)

  const [vehicles, totalCount] = await Promise.all([
    prisma.vehicle.findMany({
      where, orderBy,
      skip: 0,
      take: PAGE_SIZE,
      include: vehicleInclude,
    }),
    prisma.vehicle.count({ where }),
  ])

  return (
    <VehicleListClient
      initialVehicles={vehicles}
      totalCount={totalCount}
    />
  )
}

// src/features/vehicles/components/vehicle-list-client.tsx ('use client')
export function VehicleListClient({ initialVehicles, totalCount }: Props) {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [offset, setOffset] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(initialVehicles.length < totalCount)
  const [isLoading, setIsLoading] = useState(false)

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 })

  // Reset when filters change (nuqs triggers full page re-render via shallow:false)
  useEffect(() => {
    setVehicles(initialVehicles)
    setOffset(PAGE_SIZE)
    setHasMore(initialVehicles.length < totalCount)
  }, [initialVehicles, totalCount])

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore()
    }
  }, [inView, hasMore, isLoading])

  const loadMore = async () => {
    setIsLoading(true)
    const newVehicles = await loadMoreVehicles(offset, PAGE_SIZE)
    setVehicles(prev => [...prev, ...newVehicles])
    setOffset(prev => prev + PAGE_SIZE)
    if (newVehicles.length < PAGE_SIZE) setHasMore(false)
    setIsLoading(false)
  }

  return (
    <>
      <VehicleGrid vehicles={vehicles} />
      {isLoading && <VehicleCardSkeleton count={PAGE_SIZE} />}
      {hasMore && <div ref={sentinelRef} className="h-px w-full" />}
      {!hasMore && vehicles.length > 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          모든 차량을 불러왔습니다
        </p>
      )}
    </>
  )
}
```

### Pattern 2: Server Action for LoadMore with Filter Context

**What:** A Server Action that reads current URL search params to apply the same filters when loading more vehicles.

**When to use:** When infinite scroll needs to respect the active filter state without passing all filters as arguments.

**Example:**
```typescript
// src/features/vehicles/actions/load-more-vehicles.ts
'use server'

import { prisma } from '@/lib/db/prisma'
import { buildWhereClause, buildOrderBy } from '../lib/search-query'

export async function loadMoreVehicles(
  filters: SearchFilters,
  sort: string,
  offset: number,
  limit: number
) {
  const where = buildWhereClause(filters)
  const orderBy = buildOrderBy(sort)

  return prisma.vehicle.findMany({
    where,
    orderBy,
    skip: offset,
    take: limit,
    include: vehicleInclude,
  })
}
```

**Critical insight:** The Server Action receives filter state as arguments (not reading from URL) because Server Actions do not have access to the current page's search params. The client component reads nuqs state and passes it to the server action.

### Pattern 3: nuqs Filter State with Real-Time Application

**What:** Extending existing nuqs parsers for 15 filters with `shallow: false` to trigger server re-renders.

**When to use:** All filter state that affects the vehicle query.

**Example:**
```typescript
// search-params.ts extension
export const searchParamsParsers = {
  // EXISTING (keep all)
  brand: parseAsString.withDefault(''),
  model: parseAsString.withDefault(''),
  gen: parseAsString.withDefault(''),
  yearMin: parseAsInteger,
  yearMax: parseAsInteger,
  priceMin: parseAsInteger,
  priceMax: parseAsInteger,
  mileMin: parseAsInteger,
  mileMax: parseAsInteger,
  sort: parseAsString.withDefault('recommended'),
  page: parseAsInteger.withDefault(1), // Keep for SEO fallback

  // NEW filters
  fuel: parseAsString.withDefault(''),          // comma-separated: "GASOLINE,DIESEL"
  transmission: parseAsString.withDefault(''),   // "AUTOMATIC,MANUAL"
  color: parseAsString.withDefault(''),          // "white,black"
  seats: parseAsInteger,                         // 2, 5, 7, 9
  driveType: parseAsString.withDefault(''),      // "FWD,AWD"
  options: parseAsString.withDefault(''),         // "sunroof,navigation"
  region: parseAsString.withDefault(''),         // "서울"
  salesType: parseAsString.withDefault(''),       // "rental,lease"
  keyword: parseAsString.withDefault(''),         // keyword tags
  monthlyMin: parseAsInteger,                    // monthly payment min
  monthlyMax: parseAsInteger,                    // monthly payment max

  // NEW quick filters (boolean toggles)
  homeService: parseAsString.withDefault(''),    // "true"
  timeDeal: parseAsString.withDefault(''),       // "true"
  noAccident: parseAsString.withDefault(''),     // "true"
  hasRental: parseAsString.withDefault(''),      // "true"

  // NEW view mode
  view: parseAsString.withDefault('grid'),       // "grid" | "list"
}
```

### Pattern 4: base-ui Dual-Thumb Slider for Range Filters

**What:** Using the existing shadcn Slider (backed by base-ui) with dual thumbs for price/year/mileage ranges.

**When to use:** All range filter inputs (replaces RangeInputs text fields).

**Example:**
```typescript
// Dual range slider wrapper
function DualRangeSlider({
  min, max, step, value, onValueChange, formatLabel
}: DualRangeSliderProps) {
  return (
    <div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onValueCommitted={(event) => {
          // Use onValueCommitted (fires on pointerup) to avoid
          // excessive URL updates during drag
          const newValue = event.target.value as number[]
          onValueChange(newValue)
        }}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatLabel(value[0])}</span>
        <span>{formatLabel(value[1])}</span>
      </div>
    </div>
  )
}
```

**Critical insight:** Use `onValueCommitted` (fires on `pointerup`) instead of `onValueChange` (fires on every drag tick) to avoid flooding nuqs with URL updates during slider drag. Show real-time value labels via local state, then commit to URL on release.

### Pattern 5: Card Preview Popup with Click Intercept

**What:** Card click opens a Dialog with vehicle preview instead of navigating directly to `/vehicles/[id]`.

**When to use:** When users want quick info without losing search context.

**Example:**
```typescript
function VehicleCard({ vehicle }: { vehicle: VehicleWithDetails }) {
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <>
      <div
        role="article"
        className="group relative cursor-pointer"
        onClick={() => setPreviewOpen(true)}
        // No Link wrapper -- click opens dialog
      >
        {/* Card content */}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <CardPreviewContent
            vehicle={vehicle}
            onClose={() => setPreviewOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
```

**Important:** Since the card is no longer wrapped in `<Link>`, the wishlist/compare buttons no longer need `e.preventDefault()` / `e.stopPropagation()`. But the card itself must handle keyboard navigation (Enter opens preview) for accessibility.

### Anti-Patterns to Avoid

- **Storing infinite scroll offset in URL:** Offset/page should NOT be a nuqs param for infinite scroll. It causes the server to re-render and reset scroll position on each page load. Keep offset in client state only.

- **Calling nuqs setFilters on every slider drag tick:** Use `onValueCommitted` (pointerup) not `onValueChange` (drag). Alternatively, use local state for slider display value and debounce the nuqs update.

- **Fetching filter options (brands, models) inside FilterContent on every render:** Cache cascade data. The existing `useEffect` pattern with `startTransition` is correct; do not switch to SWR/React Query for these -- keep it simple.

- **Duplicating filter WHERE logic:** The `buildWhereClause` in `search-query.ts` must be the single source of truth for both server-rendered initial page AND the `loadMoreVehicles` server action. Do not create a separate query builder.

- **Making all card info interactive:** Only price calculator, wishlist, compare, and preview need client interactivity. Spec line, badges, tags are purely presentational.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dual-thumb slider | Custom slider with two inputs | shadcn Slider (base-ui) with `value={[min, max]}` | Touch handling, thumb collision, a11y keyboard nav all handled |
| URL state management | Custom URLSearchParams sync | nuqs `useQueryStates` with `shallow: false` | Batched updates, type-safe parsers, React transition support |
| Intersection detection | Custom scroll event listener | react-intersection-observer `useInView` | Efficient, debounced, SSR-safe, already installed |
| Collapsible sections | Custom height animation | shadcn Collapsible | Accessible, animated, keyboard-operable |
| Bottom sheet (mobile) | Custom modal | shadcn Sheet (side="left" for K Car style) | Focus trap, backdrop, swipe-to-dismiss, a11y |
| Comparison state | Separate context/reducer | Existing Zustand `vehicle-interaction-store` | Already handles localStorage persistence, SSR hydration |

**Key insight:** Every UI primitive needed for this phase is already installed as a shadcn component. The work is composing them into domain-specific components, not building primitives.

## Common Pitfalls

### Pitfall 1: Filter Change Resets Infinite Scroll But Not Client State
**What goes wrong:** User scrolls to page 5, changes a filter. The Server Component re-renders with new first page, but `vehicles` state in `VehicleListClient` still has old accumulated data.
**Why it happens:** nuqs with `shallow: false` triggers a full server re-render, which updates `initialVehicles` prop, but the client component `useState` initializer only runs once.
**How to avoid:** Use a `useEffect` that watches `initialVehicles` (or a serialized key like `JSON.stringify(initialVehicles.map(v => v.id))`) and resets `vehicles`, `offset`, and `hasMore` state.
**Warning signs:** Stale vehicles appearing after filter change.

### Pitfall 2: Slider Flooding URL Updates During Drag
**What goes wrong:** As user drags the price slider, every pixel movement fires `onValueChange`, which calls `setFilters` via nuqs, which triggers a server re-render on every frame.
**Why it happens:** base-ui Slider fires `onValueChange` on every value change during drag.
**How to avoid:** Use local `useState` for slider display value during drag. Commit to nuqs only on `onValueCommitted` (pointerup event). Show formatted labels from local state.
**Warning signs:** Laggy slider interaction, excessive network requests during drag.

### Pitfall 3: Server Action Cannot Read Current URL Params
**What goes wrong:** `loadMoreVehicles` server action tries to read `searchParams` but fails -- Server Actions don't have access to the request context.
**Why it happens:** Server Actions are POST requests, not page navigations. They don't receive `searchParams`.
**How to avoid:** Pass the current filter state as arguments to the server action from the client component. The client reads nuqs state and passes it explicitly.
**Warning signs:** loadMore returns unfiltered results.

### Pitfall 4: CSS Sticky Sidebar Broken by overflow:hidden Ancestor
**What goes wrong:** Filter sidebar stops being sticky.
**Why it happens:** Any ancestor element with `overflow: hidden` or `overflow: auto` breaks `position: sticky`.
**How to avoid:** Verify no ancestor has `overflow: hidden`. The sidebar's own `overflow-y-auto` with `max-h-[calc(100vh-5rem)]` is fine -- it's on the sticky element itself.
**Warning signs:** Sidebar scrolls with the page instead of staying fixed.

### Pitfall 5: Comparison MAX_COMPARISON Mismatch Between Store and UI
**What goes wrong:** Store allows 4 vehicles but UI shows 3 slots, or vice versa.
**Why it happens:** CONTEXT.md says "max 3" but existing store has `MAX_COMPARISON = 4`.
**How to avoid:** Update `MAX_COMPARISON` to 3 in `vehicle-interaction-store.ts` BEFORE building the compare floating bar. Also update the toast message.
**Warning signs:** 4th vehicle silently added to store but not shown in UI.

### Pitfall 6: Infinite Scroll Loading Duplicate Data
**What goes wrong:** Same vehicles appear twice in the list.
**Why it happens:** Offset miscalculation, or data changes between page loads (new vehicles inserted shifting offsets).
**How to avoid:** Use vehicle ID deduplication when appending: `setPosts(prev => [...prev, ...newPosts.filter(p => !prev.some(e => e.id === p.id))])`. For MVP offset-based is acceptable; cursor-based pagination is a future optimization.
**Warning signs:** Duplicate vehicle cards visible in the grid.

### Pitfall 7: Back-to-Top Button Overlaps Compare Floating Bar
**What goes wrong:** Both elements are `fixed bottom-6 right-6`, overlapping.
**Why it happens:** Both use fixed positioning at the bottom.
**How to avoid:** When compare bar is visible, shift back-to-top button up: `bottom-20 right-6`. Check comparison array length in Zustand store.
**Warning signs:** Buttons stack on top of each other.

### Pitfall 8: Multi-Value Filter Params Not Properly Parsed
**What goes wrong:** Selecting "GASOLINE" and "DIESEL" for fuel type only filters by one.
**Why it happens:** nuqs `parseAsString` stores a single string. Multiple selections need comma-separated storage and proper WHERE clause with `in`.
**How to avoid:** Store multi-select as comma-separated string (`"GASOLINE,DIESEL"`), split in `buildWhereClause`: `fuel.split(',')` -> Prisma `{ in: [...] }`.
**Warning signs:** Only last selected checkbox value is active.

## Code Examples

### Server Action for Infinite Scroll loadMore
```typescript
// Source: Adapted from LogRocket infinite scroll pattern + existing project patterns
'use server'

import { prisma } from '@/lib/db/prisma'
import { buildWhereClause, buildOrderBy } from '../lib/search-query'
import type { SearchFilters } from '../lib/search-query'

const vehicleInclude = {
  trim: {
    include: {
      generation: {
        include: {
          carModel: {
            include: { brand: true },
          },
        },
      },
    },
  },
  images: true,
  dealer: {
    select: { id: true, name: true, email: true, phone: true },
  },
} as const

export async function loadMoreVehicles(
  filters: SearchFilters,
  sort: string,
  offset: number,
  limit: number
) {
  const where = buildWhereClause(filters)
  const orderBy = buildOrderBy(sort)

  return prisma.vehicle.findMany({
    where,
    orderBy,
    skip: offset,
    take: limit,
    include: vehicleInclude,
  })
}
```

### Extended buildWhereClause for New Filters
```typescript
// Source: Existing search-query.ts pattern + Prisma docs
export function buildWhereClause(filters: ExtendedSearchFilters): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {
    approvalStatus: 'APPROVED',
    status: { not: 'HIDDEN' },
  }

  // ... existing brand/model/gen/year/price/mileage filters ...

  // NEW: Fuel type (multi-select, comma-separated)
  if (filters.fuel) {
    const fuelTypes = filters.fuel.split(',')
    where.trim = {
      ...where.trim as object,
      fuelType: { in: fuelTypes as FuelType[] },
    }
  }

  // NEW: Transmission (multi-select)
  if (filters.transmission) {
    const transmissions = filters.transmission.split(',')
    where.trim = {
      ...where.trim as object,
      transmission: { in: transmissions as Transmission[] },
    }
  }

  // NEW: Color
  if (filters.color) {
    const colors = filters.color.split(',')
    where.color = { in: colors }
  }

  // NEW: Monthly payment range
  if (filters.monthlyMin || filters.monthlyMax) {
    where.monthlyRental = {
      ...(filters.monthlyMin ? { gte: filters.monthlyMin } : {}),
      ...(filters.monthlyMax ? { lte: filters.monthlyMax } : {}),
    }
  }

  // NEW: No accident (from inspectionData JSONB)
  if (filters.noAccident === 'true') {
    where.inspectionData = {
      path: ['accidentDiagnosis'],
      equals: 'none',
    }
  }

  return where
}
```

### useInView Infinite Scroll Sentinel
```typescript
// Source: react-intersection-observer npm docs + LogRocket pattern
import { useInView } from 'react-intersection-observer'

function InfiniteScrollSentinel({
  onLoadMore,
  hasMore,
  isLoading,
}: {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
}) {
  const { ref, inView } = useInView({ threshold: 0 })

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore()
    }
  }, [inView, hasMore, isLoading, onLoadMore])

  if (!hasMore) return null

  return <div ref={ref} className="h-px w-full" aria-label="추가 차량 로딩 중" />
}
```

### Dual-Thumb Slider with Debounced URL Update
```typescript
// Source: base-ui Slider docs + nuqs options docs
function PriceRangeSlider() {
  const [filters, setFilters] = useQueryStates(searchParamsParsers, { shallow: false })

  // Local state for smooth drag UX
  const [localRange, setLocalRange] = useState<[number, number]>([
    filters.priceMin ?? 0,
    filters.priceMax ?? 20000,
  ])

  // Sync local state when URL params change (e.g., filter reset)
  useEffect(() => {
    setLocalRange([filters.priceMin ?? 0, filters.priceMax ?? 20000])
  }, [filters.priceMin, filters.priceMax])

  return (
    <div>
      <Slider
        value={localRange}
        min={0}
        max={20000}
        step={100}
        onValueChange={(event) => {
          // Update local display during drag (no URL update)
          setLocalRange(event.target.value as [number, number])
        }}
        onValueCommitted={(event) => {
          // Commit to URL only on pointerup
          const [min, max] = event.target.value as [number, number]
          setFilters({
            priceMin: min === 0 ? null : min,
            priceMax: max === 20000 ? null : max,
            page: 1,
          })
        }}
      />
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatKRW(localRange[0])}만원</span>
        <span>{formatKRW(localRange[1])}만원</span>
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Number input pairs for ranges | Dual-thumb slider | Phase 15 | Better UX, visual feedback during drag |
| Traditional pagination | Infinite scroll + sentinel | Phase 15 | Smoother browsing, reduced clicks |
| Direct card-to-detail navigation | Preview popup -> detail | Phase 15 | Users keep search context |
| 5 filter sections | 15 filter sections | Phase 15 | K Car parity |
| Full-page comparison | Fullscreen Dialog | Phase 15 | In-context comparison |
| MAX_COMPARISON = 4 | MAX_COMPARISON = 3 | Phase 15 | K Car pattern alignment |

**Deprecated/outdated:**
- `pagination.tsx`: Replaced by infinite scroll (keep for SEO `<link rel="next">` meta only)
- `RangeInputs` component in `search-filters.tsx`: Replaced by dual-thumb Slider

## Open Questions

1. **Prisma JSONB path filtering performance**
   - What we know: Prisma supports `path` queries on JSON fields (`inspectionData.path(['accidentDiagnosis'])`)
   - What's unclear: Performance at scale (1K+ vehicles) without a GIN index on the JSONB column
   - Recommendation: Acceptable for MVP. Add `CREATE INDEX` on inspectionData if query becomes slow. For now, 180 vehicles in seed data is fine.

2. **Scroll position restoration on back navigation**
   - What we know: Next.js does not auto-restore scroll position for infinite scroll pages
   - What's unclear: Whether `window.history.scrollRestoration = 'manual'` + Zustand-persisted scroll offset is worth the complexity
   - Recommendation: Defer to a future iteration. For now, card preview popup (Dialog) reduces the need to navigate away from the search page.

3. **SEO fallback for infinite scroll**
   - What we know: Google recommends `<link rel="next">` for paginated content
   - What's unclear: Whether Google's crawler handles infinite scroll pages well enough without explicit pagination links
   - Recommendation: Keep `page` param in URL for crawler support. Server Component renders first page content. Add `<link rel="next" href="/vehicles?page=2">` in `<head>`. Crawlers get paginated HTML; users get infinite scroll.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 + happy-dom |
| Config file | vitest.config.mts |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEARCH-01 | 15 filter parsers correctly extend searchParamsParsers | unit | `yarn vitest run tests/unit/features/vehicles/search-params.test.ts -t "parsers"` | No -- Wave 0 |
| SEARCH-01 | buildWhereClause handles all new filter combinations | unit | `yarn vitest run tests/unit/features/vehicles/search-query.test.ts -t "where"` | No -- Wave 0 |
| SEARCH-02 | getVehicleBadges returns correct badges for all conditions | unit | `yarn vitest run tests/unit/features/vehicles/vehicle-badges.test.ts` | No -- Wave 0 |
| SEARCH-02 | Tag extraction from inspectionData/historyData JSONB | unit | `yarn vitest run tests/unit/features/vehicles/vehicle-tags.test.ts` | No -- Wave 0 |
| SEARCH-03 | loadMoreVehicles server action returns correct offset data | unit | `yarn vitest run tests/unit/features/vehicles/load-more.test.ts` | No -- Wave 0 |
| SEARCH-05 | Comparison store MAX_COMPARISON enforced at 3 | unit | `yarn vitest run tests/unit/stores/vehicle-interaction-store.test.ts` | No -- Wave 0 |
| SEARCH-07 | buildOrderBy handles all 9 sort options | unit | `yarn vitest run tests/unit/features/vehicles/search-query.test.ts -t "orderBy"` | No -- Wave 0 |
| SEARCH-04 | Grid/list view toggle renders correct layout | manual-only | Visual verification at 1024px and 375px | N/A |
| SEARCH-06 | Quick filter badges toggle URL params | manual-only | Visual verification + URL inspection | N/A |
| SEARCH-08 | Mobile filter sheet opens and applies filters | manual-only | Visual verification at 375px | N/A |

### Sampling Rate
- **Per task commit:** `yarn test`
- **Per wave merge:** `yarn test && yarn type-check && yarn build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/features/vehicles/search-params.test.ts` -- covers SEARCH-01 parser extension
- [ ] `tests/unit/features/vehicles/search-query.test.ts` -- covers SEARCH-01 WHERE builder + SEARCH-07 sort
- [ ] `tests/unit/features/vehicles/vehicle-badges.test.ts` -- covers SEARCH-02 badge logic
- [ ] `tests/unit/features/vehicles/vehicle-tags.test.ts` -- covers SEARCH-02 tag extraction
- [ ] `tests/unit/features/vehicles/load-more.test.ts` -- covers SEARCH-03 server action
- [ ] `tests/unit/stores/vehicle-interaction-store.test.ts` -- covers SEARCH-05 max comparison

## Sources

### Primary (HIGH confidence)
- Existing codebase: `search-params.ts`, `search-query.ts`, `vehicle-card.tsx`, `search-filters.tsx`, `vehicle-interaction-store.ts`, `pagination.tsx`, `vehicle-grid.tsx`, `search-sort.tsx` -- all directly read
- [base-ui Slider docs](https://base-ui.com/react/components/slider) -- dual-thumb API, onValueChange vs onValueCommitted, thumbAlignment
- [nuqs options docs](https://nuqs.dev/docs/options) -- shallow, history, limitUrlUpdates, startTransition, mixed shallow behavior
- `prisma/schema.prisma` -- Vehicle model fields, Trim relations, enums (FuelType, Transmission)
- `15-UI-SPEC.md` -- Complete visual specifications for all components
- `15-CONTEXT.md` -- User decisions and locked constraints
- `inspection-data.ts` / `history-data.ts` -- Zod schemas for JSONB data (accidentDiagnosis, ownerCount, etc.)

### Secondary (MEDIUM confidence)
- [LogRocket: Infinite scroll with Next.js Server Actions](https://blog.logrocket.com/implementing-infinite-scroll-next-js-server-actions/) -- Server Action + useInView pattern
- [CloudApp: SEO pagination + infinite scroll](https://www.cloudapp.dev/nextjs-14-seo-combine-pagination-with-infinite-scroll-to-obtain-the-best-of-both-worlds) -- Hybrid pagination/infinite scroll architecture
- [react-intersection-observer npm](https://www.npmjs.com/package/react-intersection-observer) -- useInView hook API
- `.planning/research/FEATURES.md` -- K Car feature landscape and delta analysis
- `.planning/research/ARCHITECTURE.md` -- Component placement strategy and state management patterns

### Tertiary (LOW confidence)
- SEO link rel=next behavior with Google crawlers -- Google's actual handling of infinite scroll pages is not publicly documented with specifics. The `<link rel="next">` approach is a best-effort fallback.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and proven in this project
- Architecture: HIGH -- extends established patterns (nuqs, Prisma WHERE builder, Zustand store); infinite scroll pattern well-documented across multiple sources
- Pitfalls: HIGH -- identified from direct code analysis + known Next.js/nuqs interaction patterns
- UI-SPEC alignment: HIGH -- complete UI-SPEC already exists with pixel-level specifications

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days -- stable stack, no expected breaking changes)
