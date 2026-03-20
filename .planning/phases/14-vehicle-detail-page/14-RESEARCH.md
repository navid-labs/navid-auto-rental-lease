# Phase 14: Vehicle Detail Page - Research

**Researched:** 2026-03-20
**Domain:** Vehicle detail page UI reconstruction -- K Car style 10-section layout with gallery, body diagram, diagnosis, history, warranty, sticky sidebar
**Confidence:** HIGH

## Summary

Phase 14 transforms the existing monolithic `public-vehicle-detail.tsx` (~700 LOC) into a 10-section K Car-style detail page with image gallery (Embla + YARL lightbox), SVG body diagram, diagnosis/history/warranty sections, sticky sidebar, and mobile bottom CTA. The existing codebase provides strong foundations: shadcn carousel component wrapping Embla, YARL lightbox already installed (v3.29.1), format utilities, Zustand interaction store (wishlist/comparison/share), PMT calculator, and IntersectionObserver scroll-spy pattern already in use.

The primary technical challenges are: (1) SVG body diagram creation (no library exists -- must be hand-crafted), (2) Prisma schema extension with JSONB columns for inspection/history data without breaking 264 existing tests, and (3) coordinating two Embla instances for main carousel + thumbnail strip sync. All other sections are straightforward UI work leveraging existing components (accordion, tabs, progress, carousel).

**Primary recommendation:** Start with Prisma schema extension (DETAIL-12) as Wave 0, then build UI primitives (gallery, body diagram) in parallel, followed by section-by-section implementation using the established Server Component data-fetch + Client Component render pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Image Gallery: Bottom strip thumbnails (horizontal scroll), 4:3 landscape main image, overlay badge for image count, YARL fullscreen lightbox on main image click, category tabs above thumbnails (전체/외관/내부/엔진룸), VehicleImage category enum (EXTERIOR, INTERIOR, ENGINE, OTHER)
- Body Diagram: 5-direction SVG, 3-color coding (판금 #F59E0B, 교환 #EF4444, 정상 #CBD5E1), hover tooltip (mobile: tap)
- Section Layout: Scroll-spy sticky tabs, K Car section order (갤러리 -> 가격 -> 기본정보 -> 옵션 -> 도면/진단 -> 이력 -> 보증 -> 홈서비스 -> 후기/FAQ -> 평가사), Desktop 7:3 ratio, Mobile horizontal scroll tab bar + "더보기" expand
- Sticky Sidebar: K Car style (차량명 + 가격만원 + 할부 월납금 + 구매비용 분류 + CTA 5개), sticky starts below gallery, Mobile bottom fixed bar
- "구매하기" CTA connects to existing rental/lease contract wizard
- Price: 만원 단위, 할부 월납금, 구매비용 계산기/대출한도/보험료 CTA (기존 PMT 재사용)
- Options: Icon-based grid + "옵션 모두 보기" expand
- Diagnosis: 종합등급(A+~C) + 카테고리별 건수, "전체보기" expand
- History: 카드형 요약 (내차피해/소유주변경/주의이력) + 하단 상세 타임라인
- Warranty: 수평 타임라인 바 (제조사 -> 연장), 남은 기간/주행거리
- Home Service: 4-step indicator (주문->결제->배송->3일환불), 방문예약 Dialog
- Reviews & FAQ: Embla 수평 리뷰 캐러셀 + shadcn Accordion FAQ
- Evaluator: 프로필 카드 (사진+이름+소속+사원증+추천코멘트), inspectionData JSONB 내 evaluator 객체
- Prisma: Vehicle에 inspectionData/historyData JSONB, VehicleImage에 category enum

### Claude's Discretion
- SVG body diagram creation method (custom inline vs open source)
- inspectionData/historyData JSONB schema structure
- Mobile gallery behavior
- Diagnosis grade calculation logic (score -> A+/A/B+/B/C)
- Component split strategy (monolith -> section separation)
- Loading skeleton design
- Error/Empty state handling

### Deferred Ideas (OUT OF SCOPE)
- 360도 사진 시퀀스 뷰어 -- v3.0 (EXT-01)
- 카카오맵 직영점 위치 표시 -- v3.0 (MAP-01)
- 실제 eKYC/전자서명 연동 -- v3.0 (EXT-02, EXT-03)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DETAIL-01 | Image gallery -- Embla main carousel + thumbnail strip + YARL lightbox | Embla 8.6.0 already installed; YARL 3.29.1 installed; need embla-carousel-class-names or manual two-instance sync for thumbnails; YARL Thumbnails plugin for lightbox |
| DETAIL-02 | Price section -- price (만원), installment, cost calculator CTAs | Existing `pmt.ts` for monthly payment calc; `formatKRW` for display; new cost breakdown UI |
| DETAIL-03 | Options grid -- icon-based + expandable | lucide-react icons already available; shadcn Collapsible for expand; need options data structure |
| DETAIL-04 | Body diagram -- SVG 5-direction + damage color coding | Custom inline SVG component; no third-party library; ~200-300 LOC per view; React.memo for perf |
| DETAIL-05 | Diagnosis results -- grade + category counts | New inspectionData JSONB with Zod validation; grade enum (A+ through C); category scoring |
| DETAIL-06 | Vehicle history -- accident, ownership, warnings | New historyData JSONB; card-style summary; timeline detail view |
| DETAIL-07 | Warranty timeline -- manufacturer + extended | shadcn Progress component for timeline bar; relative date calculations |
| DETAIL-08 | Home service -- 4-step flow + visit reservation | Step indicator UI; existing inquiry-form.tsx Dialog pattern for reservation |
| DETAIL-09 | Reviews + FAQ -- carousel + accordion | Embla for review carousel; shadcn Accordion for FAQ; static FAQ content |
| DETAIL-10 | Sticky sidebar -- vehicle name, price, CTAs | CSS `position: sticky` with `top-32`; mobile bottom fixed bar; existing interaction store for wishlist/compare/share |
| DETAIL-11 | Evaluator recommendation -- profile card | Data from inspectionData JSONB evaluator field; quotation-style card UI |
| DETAIL-12 | Prisma schema extension -- inspectionData, historyData JSONB, image category enum | JSONB columns on Vehicle; new ImageCategory enum; migration + seed data |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| embla-carousel-react | 8.6.0 | Main image carousel + review carousel | Already used by shadcn Carousel; lightweight (~3KB gzip) |
| yet-another-react-lightbox | 3.29.1 | Fullscreen image lightbox | Already installed; supports Thumbnails/Zoom/Counter plugins; portal-based overlay |
| react-intersection-observer | 10.0.3 | Scroll-spy for sticky tab navigation | Already installed; used in existing detail page |
| lucide-react | 0.577.0 | Icons for options grid, CTAs, status indicators | Already project standard |
| shadcn/ui components | 4.0.2 | Accordion (FAQ), Tabs (categories), Progress (warranty), Carousel (reviews) | All 13 new components added in Phase 13 |
| zustand | 5.0.11 | Wishlist/comparison/share state (vehicle-interaction-store) | Already in use with localStorage persistence |

### New Dependencies Needed
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| embla-carousel-class-names | ^8.6.0 | Optional: CSS class toggling for active thumbnail | Only if manual two-instance sync proves complex |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Two Embla instances for thumbnails | Single Embla + manual scroll | Two instances is Embla's official thumbnail pattern; more reliable sync |
| Custom SVG body diagram | react-svg-pan-zoom | Overkill for static panels; custom SVG gives full control over hit areas |
| YARL for lightbox | Dialog-based custom lightbox | YARL handles gestures, zoom, keyboard nav out of box; Dialog would need 300+ LOC |

**Installation:**
```bash
yarn add embla-carousel-class-names
```

Note: `embla-carousel-thumbs` does NOT exist on npm. Thumbnail sync is achieved via two `useEmblaCarousel` instances with `onSelect` event listeners -- this is Embla's official documented pattern.

## Architecture Patterns

### Recommended Project Structure
```
src/features/vehicles/components/
  detail/                           # NEW directory
    vehicle-detail-page.tsx         # Orchestrator client component (~100 LOC)
    section-gallery.tsx             # DETAIL-01: Gallery + lightbox
    section-price.tsx               # DETAIL-02: Price + cost breakdown
    section-basic-info.tsx          # Basic specs grid (part of existing data)
    section-options.tsx             # DETAIL-03: Options grid
    section-body-diagram.tsx        # DETAIL-04: SVG body diagram
    section-diagnosis.tsx           # DETAIL-05: Diagnosis results
    section-history.tsx             # DETAIL-06: Vehicle history
    section-warranty.tsx            # DETAIL-07: Warranty timeline
    section-home-service.tsx        # DETAIL-08: Home service flow
    section-reviews-faq.tsx         # DETAIL-09: Reviews + FAQ
    section-evaluator.tsx           # DETAIL-11: Evaluator recommendation
    sticky-sidebar.tsx              # DETAIL-10: Sticky sidebar + mobile CTA
    sticky-tab-nav.tsx              # Scroll-spy tab navigation bar
    types.ts                        # Section-specific types

src/features/vehicles/schemas/
    inspection-data.ts              # Zod schema for inspectionData JSONB
    history-data.ts                 # Zod schema for historyData JSONB

src/features/vehicles/lib/
    diagnosis-grade.ts              # Grade calculation (score -> A+/A/B+/B/C)
```

### Pattern 1: Server Component Orchestrator + Client Section Components

The page Server Component fetches ALL data via `Promise.all()`, then passes data slices to a single client orchestrator which renders sections.

```typescript
// src/app/(public)/vehicles/[id]/page.tsx (Server Component)
// Existing pattern preserved -- just expand the include and pass more data

const vehicle = await prisma.vehicle.findUnique({
  where: { id, approvalStatus: 'APPROVED', status: { not: 'HIDDEN' } },
  include: {
    ...vehicleInclude,
    // images already included, just order by category + order
  },
})

// inspectionData and historyData are JSONB on Vehicle -- no separate query needed
// Parse JSONB with Zod on the server for type safety
const inspection = inspectionDataSchema.safeParse(vehicle.inspectionData)
const history = historyDataSchema.safeParse(vehicle.historyData)
```

### Pattern 2: Embla Thumbnail Sync (Two Instances)

```typescript
// Official Embla pattern for thumbnail carousel synchronization
const [mainRef, mainApi] = useEmblaCarousel({ loop: false })
const [thumbRef, thumbApi] = useEmblaCarousel({
  containScroll: 'keepSnaps',
  dragFree: true,
})

const onThumbClick = useCallback(
  (index: number) => { mainApi?.scrollTo(index) },
  [mainApi],
)

useEffect(() => {
  if (!mainApi || !thumbApi) return
  const onSelect = () => {
    const selected = mainApi.selectedScrollSnap()
    thumbApi.scrollTo(selected)
    setSelectedIndex(selected)
  }
  mainApi.on('select', onSelect)
  onSelect()
  return () => { mainApi.off('select', onSelect) }
}, [mainApi, thumbApi])
```

### Pattern 3: YARL Lightbox Integration

```typescript
import Lightbox from "yet-another-react-lightbox"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Counter from "yet-another-react-lightbox/plugins/counter"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import "yet-another-react-lightbox/plugins/counter.css"

// Usage:
<Lightbox
  open={lightboxOpen}
  close={() => setLightboxOpen(false)}
  index={selectedIndex}
  slides={images.map(img => ({ src: img.url, alt: `Vehicle image ${img.order}` }))}
  plugins={[Thumbnails, Zoom, Counter]}
/>
```

### Pattern 4: IntersectionObserver Scroll-Spy

```typescript
// Already established in existing codebase -- reuse pattern
function useActiveSection(sectionIds: string[]) {
  const [activeId, setActiveId] = useState(sectionIds[0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(e => e.isIntersecting)
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-80px 0px -60% 0px' } // Account for sticky header + tab bar
    )
    sectionIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sectionIds])

  return activeId
}
```

### Anti-Patterns to Avoid
- **Monolith detail component:** Do NOT put all 10 sections in one file. Each section is its own component receiving only its required props.
- **Client Components everywhere:** SectionBasicInfo, SectionOptions (static grid) can be server-safe. Only add `'use client'` for interactive elements.
- **Fetching data in sections:** All data from page-level Server Component via `Promise.all()`, passed as props. No server actions inside section components.
- **Inline SVG without memoization:** Body diagram SVG must be wrapped in `React.memo()` -- expensive DOM diffing with 200+ paths.
- **Breaking VehicleWithDetails type:** New JSONB fields are OPTIONAL on Vehicle model. Create extended type `VehicleDetailData` instead of modifying shared type.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fullscreen image viewer | Custom Dialog-based lightbox | YARL (already installed) | Gesture handling, zoom, keyboard nav, portal overlay, thumbnail strip -- 500+ LOC saved |
| Carousel with thumbnails | Manual scroll sync from scratch | Two Embla instances with `onSelect` sync | Embla handles momentum, drag, loop, resize; manual sync is ~20 LOC vs building from scratch |
| FAQ accordion | Custom toggle sections | shadcn Accordion (installed Phase 13) | Accessible, animated, keyboard navigable out of box |
| Tab navigation | Custom tab implementation | shadcn Tabs + IntersectionObserver scroll-spy | Accessible tab semantics + scroll tracking already established |
| Sticky sidebar | JavaScript scroll listener | CSS `position: sticky` with `top-32` | Pure CSS, zero JS, no scroll event overhead |
| Grade badge styling | Custom conditional classes | cva (class-variance-authority) variant | Already used in project for Button variants; clean grade -> style mapping |

**Key insight:** 8 of the 10 sections can be built primarily with existing shadcn components (Accordion, Tabs, Progress, Carousel, Card, Badge, Dialog, Collapsible). Only the gallery (Embla + YARL) and body diagram (custom SVG) require significant new code.

## Common Pitfalls

### Pitfall 1: Breaking Existing Tests with Prisma Schema Changes
**What goes wrong:** Adding `inspectionData`/`historyData` as required JSONB columns on Vehicle breaks 264 existing tests that create mock Vehicle objects missing these fields.
**Why it happens:** `VehicleWithDetails` type is used in 12+ test files with inline mocks.
**How to avoid:** (1) Make all new columns NULLABLE (`Json?` in Prisma). (2) Create a NEW extended type `VehicleDetailData = VehicleWithDetails & { inspectionData: InspectionData | null; historyData: HistoryData | null }` instead of modifying `VehicleWithDetails`. (3) Only use the extended type in new detail section components. (4) Run `yarn test` after migration.
**Warning signs:** More than 5 type-check errors after schema change means you modified a shared type unsafely.

### Pitfall 2: Z-Index Stacking War
**What goes wrong:** Sticky tab bar, sticky sidebar, mobile bottom CTA, YARL lightbox overlay, and existing header all compete for z-index.
**Why it happens:** Ad-hoc z-index values without a system.
**How to avoid:** Follow established z-index scale: header z-40, tab bar z-30, sidebar uses CSS sticky (no z-index needed), mobile CTA z-40, YARL lightbox z-[9999] (its own portal). Key rule: YARL renders in a portal so it avoids stacking context issues entirely.
**Warning signs:** Elements disappearing behind other elements on scroll.

### Pitfall 3: YARL CSS Not Imported
**What goes wrong:** Lightbox renders but looks broken -- no styling, thumbnails invisible.
**Why it happens:** YARL requires explicit CSS imports for base styles AND each plugin's styles.
**How to avoid:** Import ALL required CSS files:
```typescript
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import "yet-another-react-lightbox/plugins/counter.css"
```

### Pitfall 4: Embla Thumbnail Desync on Image Category Filter
**What goes wrong:** Filtering images by category (외관/내부/엔진룸) changes the slide array but Embla's internal index doesn't reset, causing misaligned thumbnails.
**Why it happens:** Embla caches scroll snap positions. Changing `children` count without reinitializing causes stale state.
**How to avoid:** Use `key={activeCategory}` on the Carousel component to force remount when category changes. Or call `mainApi?.reInit()` after category filter change.

### Pitfall 5: SVG Body Diagram Not Responsive
**What goes wrong:** Fixed-size SVG overflows mobile viewport or renders too small.
**Why it happens:** SVG `width`/`height` attributes set to pixel values instead of using `viewBox`.
**How to avoid:** Use `viewBox="0 0 800 400"` with `width="100%" preserveAspectRatio="xMidYMid meet"`. Let CSS container control actual rendered size. Never set pixel width/height on SVG root element.

### Pitfall 6: Sticky Sidebar Overlap with Gallery on Desktop
**What goes wrong:** Sidebar starts sticky from page top, overlapping the gallery area.
**Why it happens:** Missing the constraint that sidebar should only be sticky AFTER the gallery section.
**How to avoid:** Layout structure: gallery spans full width (12 cols), then below gallery a flex container with 7:3 split. Sidebar `sticky top-32` only applies within this flex container, never alongside gallery.

## Code Examples

### JSONB Schema Design for inspectionData

```typescript
// src/features/vehicles/schemas/inspection-data.ts
import { z } from 'zod'

const panelStatus = z.enum(['normal', 'repainted', 'replaced'])

const bodyPanelSchema = z.object({
  hood: panelStatus,
  frontBumper: panelStatus,
  rearBumper: panelStatus,
  trunk: panelStatus,
  roof: panelStatus,
  frontLeftFender: panelStatus,
  frontRightFender: panelStatus,
  rearLeftFender: panelStatus,
  rearRightFender: panelStatus,
  frontLeftDoor: panelStatus,
  frontRightDoor: panelStatus,
  rearLeftDoor: panelStatus,
  rearRightDoor: panelStatus,
  leftRocker: panelStatus,
  rightRocker: panelStatus,
})

const diagnosisCategorySchema = z.object({
  score: z.number().min(0).max(100),
  totalItems: z.number(),
  passedItems: z.number(),
  warningItems: z.number(),
  failedItems: z.number(),
})

const evaluatorSchema = z.object({
  name: z.string(),
  branch: z.string(),            // 소속 직영점명
  employeeId: z.string(),        // 사원증 번호
  photoUrl: z.string().nullable(),
  recommendation: z.string(),    // 추천 코멘트
})

export const inspectionDataSchema = z.object({
  overallScore: z.number().min(0).max(100),
  overallGrade: z.enum(['A_PLUS', 'A', 'B_PLUS', 'B', 'C']),
  panels: bodyPanelSchema,
  repaintCount: z.number().default(0),    // 판금 건수
  replacedCount: z.number().default(0),   // 교환 건수
  categories: z.object({
    interior: diagnosisCategorySchema,
    exterior: diagnosisCategorySchema,
    tires: diagnosisCategorySchema,
    consumables: diagnosisCategorySchema,
    undercarriage: diagnosisCategorySchema,
  }),
  accidentDiagnosis: z.enum(['clean', 'minor', 'major']),
  evaluator: evaluatorSchema.nullable(),
  inspectedAt: z.string(),      // ISO date string
})

export type InspectionData = z.infer<typeof inspectionDataSchema>
```

### JSONB Schema Design for historyData

```typescript
// src/features/vehicles/schemas/history-data.ts
import { z } from 'zod'

const ownershipRecordSchema = z.object({
  ownerNumber: z.number(),
  usageType: z.enum(['personal', 'rental', 'corporate', 'government']),
  startDate: z.string(),
  endDate: z.string().nullable(),
})

const insuranceClaimSchema = z.object({
  date: z.string(),
  type: z.enum(['myDamage', 'otherDamage']),
  amount: z.number(),
  description: z.string().nullable(),
})

export const historyDataSchema = z.object({
  accidentCount: z.number().default(0),
  myDamageCount: z.number().default(0),
  myDamageAmount: z.number().default(0),
  otherDamageCount: z.number().default(0),
  otherDamageAmount: z.number().default(0),
  ownerCount: z.number().default(1),
  ownershipHistory: z.array(ownershipRecordSchema).default([]),
  insuranceClaims: z.array(insuranceClaimSchema).default([]),
  warnings: z.object({
    flood: z.boolean().default(false),
    theft: z.boolean().default(false),
    totalLoss: z.boolean().default(false),
  }),
})

export type HistoryData = z.infer<typeof historyDataSchema>
```

### Prisma Schema Additions

```prisma
// Add to existing enums
enum ImageCategory {
  EXTERIOR
  INTERIOR
  ENGINE
  OTHER
}

// Modify existing VehicleImage model
model VehicleImage {
  // ... existing fields ...
  category  ImageCategory @default(OTHER)  // NEW
}

// Modify existing Vehicle model -- ADD nullable JSONB columns
model Vehicle {
  // ... existing fields ...
  inspectionData  Json?  @map("inspection_data")   // NEW
  historyData     Json?  @map("history_data")       // NEW
  warrantyEndDate DateTime? @map("warranty_end_date") // NEW - manufacturer warranty end
  warrantyMileage Int?     @map("warranty_mileage")   // NEW - warranty mileage limit
}
```

### Diagnosis Grade Calculation

```typescript
// src/features/vehicles/lib/diagnosis-grade.ts
export type DiagnosisGrade = 'A_PLUS' | 'A' | 'B_PLUS' | 'B' | 'C'

export function calculateGrade(score: number): DiagnosisGrade {
  if (score >= 90) return 'A_PLUS'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B_PLUS'
  if (score >= 60) return 'B'
  return 'C'
}

export function gradeToLabel(grade: DiagnosisGrade): string {
  const map: Record<DiagnosisGrade, string> = {
    A_PLUS: 'A+',
    A: 'A',
    B_PLUS: 'B+',
    B: 'B',
    C: 'C',
  }
  return map[grade]
}

export function gradeToColor(grade: DiagnosisGrade): string {
  const map: Record<DiagnosisGrade, string> = {
    A_PLUS: 'text-green-600 bg-green-50',
    A: 'text-blue-600 bg-blue-50',
    B_PLUS: 'text-yellow-600 bg-yellow-50',
    B: 'text-orange-600 bg-orange-50',
    C: 'text-red-600 bg-red-50',
  }
  return map[grade]
}
```

### Extended Vehicle Type (Non-Breaking)

```typescript
// src/features/vehicles/types/index.ts -- ADD, do not modify existing
import type { InspectionData } from '../schemas/inspection-data'
import type { HistoryData } from '../schemas/history-data'

// Existing VehicleWithDetails stays UNCHANGED

/** Extended type for detail page only -- does not affect existing components */
export type VehicleDetailData = VehicleWithDetails & {
  inspectionData: InspectionData | null
  historyData: HistoryData | null
  warrantyEndDate: Date | null
  warrantyMileage: number | null
  images: (VehicleImage & { category: ImageCategory })[]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single monolith detail component | Section-per-file with orchestrator | Established pattern in React ecosystem | Better code splitting, testability, parallel development |
| Separate Prisma models for diagnosis/history | JSONB columns on Vehicle model | CONTEXT.md decision | Simpler schema, fewer joins, flexible structure with Zod validation |
| Custom lightbox Dialog | YARL plugin-based lightbox | YARL v3 (2024) | Zero custom code for zoom, gestures, thumbnails, keyboard nav |
| Static car body image | Interactive SVG with hit areas | K Car pattern | Clickable panels with tooltips > static diagram image |

**Note on ARCHITECTURE.md vs CONTEXT.md:** The research file ARCHITECTURE.md suggested separate Prisma models (VehicleDiagnosis, VehicleHistory). However, the user's CONTEXT.md decision overrides this: use JSONB columns directly on Vehicle model. This is simpler and avoids additional migrations/relations.

## Open Questions

1. **SVG Body Diagram Source**
   - What we know: Need 5 directions (front, rear, left, right, top), sedan silhouette style, ~15 named panel paths per view
   - What's unclear: Exact SVG path data -- must be hand-drawn or traced from a reference
   - Recommendation: Create simplified geometric outlines (not photorealistic). Each panel is a distinct `<path>` with `data-panel` attribute. Start with sedan only (covers 80% of inventory). Can add SUV/van variants later if needed.

2. **Seed Data for inspectionData/historyData**
   - What we know: 180 existing seeded vehicles need inspection and history data
   - What's unclear: How realistic the mock data needs to be
   - Recommendation: Generate randomized but plausible data in seed script. Use weighted randomization (70% clean panels, 20% repainted, 10% replaced). Most vehicles score 70-95. Few with accidents.

3. **Mobile Gallery Behavior**
   - What we know: K Car mobile uses horizontal swipe gallery with dots, tap to fullscreen
   - Recommendation: Same Embla carousel on mobile but hide thumbnail strip (show dots instead). Category tabs as horizontal scroll chips above carousel. Tap main image opens YARL lightbox.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 + happy-dom |
| Config file | `vitest.config.mts` |
| Quick run command | `yarn test --reporter=verbose` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DETAIL-12 | inspectionData Zod schema validates correctly | unit | `yarn test src/features/vehicles/schemas/inspection-data.test.ts -x` | Wave 0 |
| DETAIL-12 | historyData Zod schema validates correctly | unit | `yarn test src/features/vehicles/schemas/history-data.test.ts -x` | Wave 0 |
| DETAIL-05 | diagnosis grade calculation (score -> grade) | unit | `yarn test src/features/vehicles/lib/diagnosis-grade.test.ts -x` | Wave 0 |
| DETAIL-02 | PMT monthly payment calculation (already tested) | unit | `yarn test src/lib/finance/pmt.test.ts -x` | Exists |
| DETAIL-10 | vehicle interaction store toggleWishlist/toggleComparison | unit | `yarn test src/lib/stores/vehicle-interaction-store.test.ts -x` | Exists |
| DETAIL-04 | body diagram panel color mapping | unit | `yarn test src/features/vehicles/components/detail/body-diagram.test.ts -x` | Wave 0 |
| DETAIL-01 | gallery renders images, category filter changes slides | unit | `yarn test src/features/vehicles/components/detail/section-gallery.test.ts -x` | Wave 0 |
| DETAIL-10 | sticky sidebar renders price and CTA buttons | unit | `yarn test src/features/vehicles/components/detail/sticky-sidebar.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test --reporter=verbose`
- **Per wave merge:** `yarn test && yarn type-check`
- **Phase gate:** Full suite green + `yarn build` success before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/vehicles/schemas/inspection-data.test.ts` -- covers DETAIL-12 (inspection Zod schema)
- [ ] `src/features/vehicles/schemas/history-data.test.ts` -- covers DETAIL-12 (history Zod schema)
- [ ] `src/features/vehicles/lib/diagnosis-grade.test.ts` -- covers DETAIL-05 (grade calculation)
- [ ] `src/features/vehicles/components/detail/body-diagram.test.ts` -- covers DETAIL-04 (panel color mapping)

## Sources

### Primary (HIGH confidence)
- Existing codebase -- direct file reads of all referenced source files (page.tsx, public-vehicle-detail.tsx, schema.prisma, carousel.tsx, floating-cta.tsx, pmt.ts, vehicle-interaction-store.ts, format.ts, types/index.ts)
- `.planning/research/ARCHITECTURE.md` -- existing architecture research with component structure plan
- `.planning/research/FEATURES.md` -- K Car feature landscape and delta analysis
- `.planning/research/PITFALLS.md` -- identified pitfalls (z-index, test breakage, nuqs)
- `.firecrawl/m.kcar.com-bc-detail-carInfoDtl.md` -- K Car mobile detail page crawl data

### Secondary (MEDIUM confidence)
- [YARL Documentation](https://yet-another-react-lightbox.com/documentation) -- plugins API, slides format, Thumbnails/Zoom/Counter plugin usage
- [Embla Carousel](https://www.embla-carousel.com/) -- thumbnail sync pattern via two instances (official approach, no `embla-carousel-thumbs` package exists)
- [shadcn/ui Carousel Pattern](https://www.shadcn.io/patterns/carousel-standard-2) -- shadcn + Embla thumbnail integration reference

### Tertiary (LOW confidence)
- SVG body diagram complexity estimate -- based on training knowledge of automotive SVG diagrams; actual LOC may vary significantly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages already installed, versions verified from package.json
- Architecture: HIGH - decomposition pattern well-established in ARCHITECTURE.md research + existing codebase patterns
- JSONB schema design: MEDIUM - Zod schema structure is Claude's discretion; validated against K Car crawl data
- SVG body diagram: MEDIUM - no existing library; hand-crafting required; complexity estimate based on similar projects
- Pitfalls: HIGH - directly derived from existing PITFALLS.md research + codebase analysis

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable -- all dependencies pinned, no fast-moving concerns)
