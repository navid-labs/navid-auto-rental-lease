# Phase 5: Public Search & Discovery - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Any visitor can find, browse, and examine vehicles through a polished public storefront. Covers vehicle search with filters/sort, vehicle detail page with gallery and inquiry form, URL state persistence, and landing page with featured vehicles. Pricing calculator is Phase 6. Contract application is Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Search Page Layout
- Card grid layout: 3 columns desktop, 2 columns tablet, 1 column mobile
- Left sidebar filters on desktop; mobile uses filter button → bottom sheet/drawer
- Sort options above results grid: price (low/high), year (new/old), mileage (low/high), newest listing

### Filter UX
- Brand → Model cascade selection, reusing existing CascadeSelect component from Phase 3
- Optional Generation filter after Model selection
- Price range: dual-handle slider (월 렌탈료 기준)
- Mileage range: dual-handle slider
- Year range: dual-handle slider or min/max year select
- All filter state persisted in URL query params (SRCH-05)
- Only APPROVED vehicles shown (Phase 4 visibility rule enforced)

### Vehicle Card Design
- Compact essential info: photo, brand/model name, year/mileage, monthly price
- Image aspect ratio: 16:9 landscape
- Monthly price only ("월 320,000원") — no rental/lease distinction until Phase 6
- Placeholder image (car icon on gray background) for vehicles without photos
- Cards use existing Card component with shadow and rounded corners

### Public Vehicle Detail Page
- Reuse existing VehicleDetailView gallery component from Phase 3
- Remove edit/status controls — public view only
- Add CTA section: "상담 신청" button opens inquiry form (name, phone, message)
- Inquiry creates record in existing Inquiry DB model
- Spec table: 2-column key-value grid (연식, 주행거리, 연료, 변속기, 색상, 배기량)
- Price display: monthly price prominently shown

### Landing Page
- Full-width dark navy hero with glassmorphism quick search widget (brand + model cascade + search button)
- Sections below hero (in order):
  1. **신착 차량** — Horizontal scroll of 4-8 newest approved vehicles (auto-selected by approvedAt DESC)
  2. **브랜드 바로가기** — Grid of brand logos linking to pre-filtered search results
  3. **이용 방법** — 3-step process: 검색 → 비교 → 계약
  4. **신뢰 지표** — Stats (등록 차량 수, 협력 딜러 수 etc.) — static or DB-driven for demo
- Responsive reflow on mobile: sections stack vertically, hero search simplified, brand grid becomes 2-row scroll

### Claude's Discretion
- Exact slider component implementation (shadcn Slider or custom dual-handle)
- Search results pagination vs infinite scroll vs load-more
- URL query param naming convention
- Empty search results state design
- Mobile bottom sheet filter implementation details
- Landing page hero background treatment (gradient, image, pattern)
- Brand logo assets (text fallback if no logo images)
- Inquiry form validation rules and success state

</decisions>

<specifics>
## Specific Ideas

- Quick search on landing hero should feel like a "gateway" — minimal friction, just brand/model and go
- Cards should match the premium aesthetic from DESIGN-SPEC (dark navy + blue accent theme)
- Status badges from Phase 3 should remain consistent — same colors used if status is ever shown publicly
- Inquiry form is a bridge CTA until Phase 7 contract engine is built
- Featured vehicles section uses the same card component as search results for visual consistency

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/vehicles/components/vehicle-detail-view.tsx`: Gallery + specs view — reuse for public detail page
- `src/features/vehicles/components/cascade-select.tsx`: Brand → Model → Generation cascade — reuse for search filters
- `src/features/vehicles/components/status-badge.tsx`: Color-coded status badges
- `src/features/vehicles/components/approval-badge.tsx`: Approval status badges
- `src/components/ui/card.tsx`, `badge.tsx`, `button.tsx`, `input.tsx`, `select.tsx`: shadcn/ui primitives
- `src/lib/utils/format.ts`: formatKRW, formatDistance, formatYearModel, formatDate helpers
- `src/features/vehicles/types/index.ts`: VehicleWithDetails type with relations

### Established Patterns
- Server Actions for form submissions (auth, vehicle CRUD)
- Server Components by default, 'use client' only when needed
- force-dynamic for pages querying DB at request time
- Zod validation with React Hook Form
- Prisma queries with relation includes

### Integration Points
- `src/app/(public)/`: Public route group — currently has layout.tsx and page.tsx (landing page placeholder)
- Prisma Vehicle model with ApprovalStatus field — filter for APPROVED only
- Prisma Inquiry model — ready for inquiry form submissions
- Public header at `src/components/layout/header.tsx` — already renders on public pages
- Vehicle images in Supabase Storage — public bucket accessible via URL

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-public-search-discovery*
*Context gathered: 2026-03-09*
