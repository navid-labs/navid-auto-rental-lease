# Phase 19: Homepage & Search Spacing - Research

**Researched:** 2026-03-23
**Domain:** CSS spacing adjustments, Tailwind CSS 4, homepage section layout, search page grid layout
**Confidence:** HIGH

## Summary

Phase 19 is a pure CSS spacing phase modifying 8 existing components across the homepage and search results page. The homepage has 6 section components (HeroBanner, HeroSearchBox, QuickLinks, RecommendedVehicles, PromoBanners, PartnerLogos) rendered sequentially in `page.tsx` -- currently with minimal inter-section gaps coming from each section's own `py-*` padding. The search page has a search bar, breadcrumb, filter sidebar, and vehicle grid -- all needing increased spacing between transition zones.

The changes are localized to Tailwind class modifications across approximately 8 files. No new components, no new libraries, no architectural changes. The Phase 18 pattern of layout-level `pt-6` is already established, and this phase works within that foundation by adjusting component-level spacing values.

**Primary recommendation:** Use a wrapper `<div>` with `space-y-20` (80px) on the homepage `page.tsx` to enforce consistent 80px inter-section gaps (the sections already define their own internal padding). For the search page, increase grid `gap-5` to `gap-6` (24px), add vertical margin between search bar / breadcrumb / content, and increase vehicle card internal padding from `p-3.5` to `p-4`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOME-01 | Homepage section vertical gaps to 80px+ | Current gaps are 0px between sections (each section has its own py-* but no inter-section spacing). Use `space-y-20` wrapper or explicit `mt-20` on each section. See Homepage Section Spacing Audit. |
| HOME-02 | Featured vehicles grid from 4-col to 3-col | `recommended-vehicles-tabs.tsx` line 60: `lg:grid-cols-4` -> `lg:grid-cols-3`. Direct class change. |
| HOME-03 | Search section internal padding increase (title-tab-input 40px+) | `hero-search-box.tsx`: current `mb-4` (16px) title-to-card gap, `py-5` (20px) filter area padding, `gap-3` (12px) between fields. All need increases. |
| HOME-04 | Promo card gap from current 4 to 24px | `promo-banners.tsx` line 46: `gap-4` (16px) -> `gap-6` (24px). Direct class change. |
| SRCH-01 | Vehicle card grid gap 16px -> 24px | `vehicle-grid.tsx` line 44: `gap-5` (20px) -> `gap-6` (24px). Note: current gap is actually 20px (gap-5), not 16px. |
| SRCH-02 | Search bar -> breadcrumb -> filter/cards spacing 24px+ | `vehicles/page.tsx`: no explicit spacing between VehicleSearchBar and breadcrumb div (0px gap), and `py-6` (24px) on main content div. Need to add spacing between sections. |
| SRCH-03 | Vehicle card internal image-to-text padding 12px -> 16px+ | `vehicle-card.tsx` line 188: `p-3.5` (14px) -> `p-4` (16px). Direct class change. |
| SRCH-04 | Quick filter pill area top/bottom margin 16px | `quick-filter-badges.tsx` line 55: current `mb-4` only. Need to add `py-4` or `my-4` for symmetrical spacing. |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase only modifies existing Tailwind CSS classes.

### Core (Already Installed)
| Library | Version | Purpose | Relevance |
|---------|---------|---------|-----------|
| tailwindcss | 4.x | Utility-first CSS | All spacing changes use Tailwind classes |
| next | 15.x | App Router | Page components define layout structure |

**No installation required.**

## Architecture Patterns

### Homepage Current Section Flow

```
page.tsx
  <div className="-mt-6">          <- edge-to-edge override from Phase 18
    <HeroBanner />                  <- py-3 on dot indicators, no bottom margin
  </div>
  <HeroSearchBox />                 <- py-6 md:py-8 (section-level)
  <QuickLinks />                    <- py-6 (section-level)
  <Suspense>
    <RecommendedVehicles />         <- py-10 md:py-12 (section-level)
  </Suspense>
  <PromoBanners />                  <- py-10 md:py-12 (section-level)
  <PartnerLogos />                  <- py-8 (section-level)
```

**Current inter-section gaps:** The sections sit directly adjacent. Each section uses its own `py-*` padding, so the visual gap between adjacent sections is the SUM of bottom padding of section N and top padding of section N+1.

Example: HeroSearchBox has `py-6` (24px top+bottom), QuickLinks has `py-6` (24px top+bottom). The visual gap between them is 24px + 24px = 48px. But the requirement asks for 80px+ visible breathing room between sections.

### Homepage Section Spacing Audit

| Section | Container Class | Top Padding | Bottom Padding | Visual Gap to Next |
|---------|----------------|-------------|----------------|-------------------|
| HeroBanner | `w-full` | 0 | 12px (py-3 dots) | 12px + 24px = 36px |
| HeroSearchBox | `bg-white py-6 md:py-8` | 24px / 32px | 24px / 32px | 48px / 64px |
| QuickLinks | `bg-white py-6` | 24px | 24px | 24px + 40px = 64px |
| RecommendedVehicles | `bg-[#F9FAFB] py-10 md:py-12` | 40px / 48px | 40px / 48px | 88px / 96px |
| PromoBanners | `bg-white py-10 md:py-12` | 40px / 48px | 40px / 48px | 88px / 96px |
| PartnerLogos | `border-t bg-white py-8` | 32px | 32px | N/A (last) |

**Key insight:** The gap between HeroBanner and HeroSearchBox (36px) and between HeroSearchBox and QuickLinks (48px) are both under 80px. The larger sections (RecommendedVehicles, PromoBanners) already have ~88px+ gaps between them due to `py-10/py-12`. The strategy should target the smaller gaps.

### Recommended Homepage Spacing Strategy

**Option A (Recommended): Increase individual section padding**

Increase each section's vertical padding to ensure 80px+ visual gaps:
- HeroSearchBox: `py-6 md:py-8` -> `py-10 md:py-12` (40px/48px each side)
- QuickLinks: `py-6` -> `py-8` (32px each side)
- RecommendedVehicles: Already `py-10 md:py-12` (sufficient)
- PromoBanners: Already `py-10 md:py-12` (sufficient)
- PartnerLogos: `py-8` -> `py-10` (40px each side)

This yields gaps of: Hero-Search: 12+40=52px (still under 80px). We need additional `mt-*` on sections that are under-spaced.

**Option B: Add margin between specific sections**

Add `mt-8` or `mt-10` between sections in `page.tsx`. This is more surgical and directly targets the requirement.

**Option C (Recommended -- combines A + B): Wrap sections with gap**

In `page.tsx`, add gap/margin values between sections. Since sections have background colors, we cannot use `space-y-*` (it adds margin-top which would push backgrounds apart and reveal the page background). Instead, increase padding within each section to meet the 80px target.

**Final recommendation:** Increase each section's `py-*` values so that adjacent bottom+top >= 80px. For the hero-to-search transition (the tightest gap), add explicit `mt-*` on HeroSearchBox since HeroBanner's bottom padding is minimal (12px dots area).

### Search Page Current Layout

```
vehicles/page.tsx
  <div className="min-h-screen bg-background">
    <VehicleSearchBar />              <- py-4 (16px each side), bg-[#F4F4F4]
    <div className="mx-auto max-w-[1440px] px-4 lg:px-8 xl:px-[120px]">
      <BreadcrumbNav />               <- mb-4 (16px bottom margin)
    </div>
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8 xl:px-[120px]">
      <div className="flex gap-8">
        <SearchFilters />             <- 280px sidebar
        <div className="min-w-0 flex-1">
          <VehicleListClient />       <- Contains sort bar, quick filters, grid
        </div>
      </div>
    </div>
  </div>
```

**Current gaps:**
- SearchBar bottom to Breadcrumb: 0px (no gap between sections)
- Breadcrumb bottom to main content: `mb-4` (16px) from breadcrumb + `py-6` (24px) from main content = 40px
- QuickFilter pills: `mb-4` bottom margin only, no top margin

### Search Page Spacing Change Map

| Area | Current | Target | Requirement |
|------|---------|--------|-------------|
| SearchBar -> Breadcrumb | 0px | 24px+ | SRCH-02 |
| Breadcrumb -> Main content | mb-4 + py-6 = 40px | 24px+ (already met) | SRCH-02 |
| Vehicle grid gap | gap-5 (20px) | gap-6 (24px) | SRCH-01 |
| Vehicle card info padding | p-3.5 (14px) | p-4 (16px) | SRCH-03 |
| Quick filter pill area | mb-4 only | py-4 (16px top + 16px bottom) | SRCH-04 |

### Exact Change Map

| File | Current Class/Value | Target | Requirement |
|------|-------------------|--------|-------------|
| `src/app/(public)/page.tsx` | No inter-section spacing | Add spacing wrappers/margins between sections | HOME-01 |
| `src/features/marketing/components/hero-search-box.tsx` | `py-6 md:py-8`, `mb-4`, `gap-3`, `py-5` | `py-10 md:py-12`, `mb-8`, `gap-4`, `py-6` | HOME-01, HOME-03 |
| `src/features/marketing/components/quick-links.tsx` | `py-6` | `py-8` | HOME-01 |
| `src/features/marketing/components/recommended-vehicles-tabs.tsx` | `lg:grid-cols-4` | `lg:grid-cols-3` | HOME-02 |
| `src/features/marketing/components/promo-banners.tsx` | `gap-4` | `gap-6` | HOME-04 |
| `src/features/marketing/components/partner-logos.tsx` | `py-8` | `py-10` | HOME-01 |
| `src/app/(public)/vehicles/page.tsx` | No spacing between SearchBar and Breadcrumb | Add `py-6` wrapper or `mt-6` on breadcrumb section | SRCH-02 |
| `src/features/vehicles/components/vehicle-grid.tsx` | `gap-5` | `gap-6` | SRCH-01 |
| `src/features/vehicles/components/vehicle-card.tsx` | `p-3.5` | `p-4` | SRCH-03 |
| `src/features/vehicles/components/quick-filter-badges.tsx` | `mb-4` | `my-4` or `py-4` | SRCH-04 |

### Anti-Patterns to Avoid

- **Do NOT use `space-y-*` on homepage when sections have different background colors.** `space-y-*` adds `margin-top`, which creates visible gaps between colored backgrounds revealing the page background color. Instead, use per-section padding increases.
- **Do NOT change the `-mt-6` on HeroBanner wrapper.** This is the Phase 18 edge-to-edge override and must remain. Section spacing below the hero should be added via padding/margin on HeroSearchBox instead.
- **Do NOT change the vehicle card aspect ratio or image sizing.** SRCH-03 only targets the text info area padding, not the image container.
- **Do NOT change the search page sidebar width (280px) or gap (gap-8).** Only the vehicle grid gap and card internal padding are in scope.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Section spacing system | Custom CSS grid layout for homepage sections | Per-section `py-*` Tailwind classes | Sections have different backgrounds; a unified system adds complexity |
| Responsive gap utilities | Custom media-query classes for gaps | Tailwind responsive prefixes (`md:py-12`, `lg:gap-6`) | Tailwind already has all needed responsive utilities |

**Key insight:** Every change in this phase is a single Tailwind class modification. No abstraction is needed.

## Common Pitfalls

### Pitfall 1: Background Color Gaps on Homepage
**What goes wrong:** Using `margin` between homepage sections exposes the page background color (likely white or gray) between sections that have distinct background colors (e.g., white section -> #F9FAFB section).
**Why it happens:** Margin creates space OUTSIDE the element, padding creates space INSIDE.
**How to avoid:** Use `padding` increases within each section rather than `margin` between them. The bg-[#F9FAFB] of RecommendedVehicles and bg-white of other sections should remain visually seamless.
**Warning signs:** Thin lines or color gaps appearing between homepage sections.

### Pitfall 2: Homepage SectionSkeleton Mismatch
**What goes wrong:** The `SectionSkeleton` in `page.tsx` has hardcoded `lg:grid-cols-4`. When RecommendedVehicles changes to 3-col, the skeleton still shows 4 columns.
**Why it happens:** The skeleton is defined separately from the actual component.
**How to avoid:** Update the `SectionSkeleton` function in `page.tsx` to match the new 3-col grid (`lg:grid-cols-3`).
**Warning signs:** Skeleton loading state shows 4 columns, then snaps to 3 when data loads.

### Pitfall 3: Search Page Negative Margin Interference
**What goes wrong:** The search page's `VehicleSearchBar` sits inside a `min-h-screen bg-background` wrapper that is itself inside the public layout's `<main className="flex-1 pt-6">`. The layout's `pt-6` is NOT counteracted with `-mt-6` on the search page (unlike homepage hero).
**Why it happens:** The search page intentionally uses the layout's 24px top padding.
**How to avoid:** Do NOT add `-mt-6` to the search page. The layout `pt-6` correctly provides breathing room above the search bar.
**Warning signs:** Search bar touching the navigation bar with no gap.

### Pitfall 4: Quick Filter Badges Double Margin
**What goes wrong:** Adding `my-4` to QuickFilterBadges while it already has `mb-4` results in `mb-4` + `my-4` = 32px bottom margin.
**Why it happens:** Tailwind `my-4` sets both margin-top AND margin-bottom. If `mb-4` is also present, the last one in class order wins for margin-bottom (Tailwind CSS 4 uses native cascade layers).
**How to avoid:** Replace `mb-4` with `my-4` (do not add both). Or use `mt-4 mb-4` explicitly.
**Warning signs:** QuickFilterBadges area has too much bottom margin.

### Pitfall 5: Hero-to-Search Gap Still Under 80px
**What goes wrong:** Even after increasing HeroSearchBox padding, the gap between HeroBanner and HeroSearchBox may still be under 80px because HeroBanner's bottom area (the dot indicators) only has `py-3` (12px).
**Why it happens:** HeroBanner ends with a `py-3 bg-white` dot indicator div. The visual gap = 12px (dots bottom padding) + HeroSearchBox top padding.
**How to avoid:** If HeroSearchBox gets `py-10` (40px top), gap = 12 + 40 = 52px. Still under 80px. Need to add explicit `mt-8` (32px) or more to HeroSearchBox, OR increase HeroBanner dot area padding, OR add a spacer in `page.tsx` between hero and search.
**Warning signs:** Gap between hero carousel and search box looks tighter than other section gaps.

## Code Examples

### HOME-01: Homepage Section Spacing via Page-Level Wrappers

```tsx
// src/app/(public)/page.tsx
// Strategy: Add explicit spacing between sections that need more gap.
// Sections with bg colors keep their internal padding.

export default function HomePage() {
  return (
    <>
      {/* 1. Hero Banner Carousel -- edge-to-edge */}
      <div className="-mt-6">
        <HeroBanner />
      </div>

      {/* 2. Search Box -- needs extra top margin for 80px+ gap from hero */}
      <div className="mt-10">
        <HeroSearchBox />
      </div>

      {/* 3. Quick Links */}
      <QuickLinks />

      {/* 4. Recommended Vehicles */}
      <Suspense fallback={<SectionSkeleton title="추천 차량" />}>
        <RecommendedVehicles />
      </Suspense>

      {/* 5. Promo Banners */}
      <PromoBanners />

      {/* 6. Partner Logos */}
      <PartnerLogos />
    </>
  )
}
```

### HOME-02: Featured Vehicles Grid 4-col -> 3-col

```tsx
// src/features/marketing/components/recommended-vehicles-tabs.tsx
// BEFORE (line 60):
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

// AFTER:
<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
```

### HOME-03: Search Section Internal Padding

```tsx
// src/features/marketing/components/hero-search-box.tsx
// BEFORE:
<section className="bg-white py-6 md:py-8">
  <div className="mx-auto max-w-3xl px-4">
    <h2 className="mb-4 text-center text-[18px] font-bold text-[#0D0D0D]">
    // ...
    <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center">

// AFTER:
<section className="bg-white py-10 md:py-12">
  <div className="mx-auto max-w-3xl px-4">
    <h2 className="mb-8 text-center text-[18px] font-bold text-[#0D0D0D]">
    // ...
    <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center">
```

### HOME-04: Promo Card Gap

```tsx
// src/features/marketing/components/promo-banners.tsx
// BEFORE (line 46):
<div className="grid grid-cols-1 gap-4 md:grid-cols-3">

// AFTER:
<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
```

### SRCH-01: Vehicle Grid Gap

```tsx
// src/features/vehicles/components/vehicle-grid.tsx
// BEFORE (line 44):
<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

// AFTER:
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
```

### SRCH-02: Search Bar to Breadcrumb Spacing

```tsx
// src/app/(public)/vehicles/page.tsx
// BEFORE:
<VehicleSearchBar />
<div className="mx-auto max-w-[1440px] px-4 lg:px-8 xl:px-[120px]">
  <BreadcrumbNav items={[{ label: '내차사기' }]} />
</div>
<div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8 xl:px-[120px]">

// AFTER:
<VehicleSearchBar />
<div className="mx-auto max-w-[1440px] px-4 pt-6 lg:px-8 xl:px-[120px]">
  <BreadcrumbNav items={[{ label: '내차사기' }]} />
</div>
<div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8 xl:px-[120px]">
```

### SRCH-03: Vehicle Card Internal Padding

```tsx
// src/features/vehicles/components/vehicle-card.tsx
// BEFORE (line 188):
<div className="p-3.5">

// AFTER:
<div className="p-4">
```

### SRCH-04: Quick Filter Pill Area Spacing

```tsx
// src/features/vehicles/components/quick-filter-badges.tsx
// BEFORE (line 55):
<div className="mb-4 flex gap-2 overflow-x-auto pb-1 ...">

// AFTER:
<div className="my-4 flex gap-2 overflow-x-auto pb-1 ...">
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Section-level py-6 (tight gaps) | Section-level py-10/py-12 (generous gaps) | This phase | 80px+ visible gaps between homepage sections |
| 4-col featured vehicle grid | 3-col grid with more card breathing room | This phase | Cards feel more premium, less cramped |
| gap-5 (20px) search results grid | gap-6 (24px) | This phase | More visible separation between cards |

## Open Questions

1. **Exact gap calculation between Hero and Search sections**
   - What we know: HeroBanner ends with 12px bottom padding (dot indicators area). Current HeroSearchBox starts with 24px top padding. Total visible gap = 36px. Need 80px+.
   - What's unclear: Should the gap be achieved via increased HeroSearchBox top padding alone, or an explicit margin wrapper in page.tsx?
   - Recommendation: Add `mt-10` (40px) wrapper on HeroSearchBox in page.tsx, AND increase HeroSearchBox to `py-10` (40px top). This yields 12 + 40 + 40 = 92px. Or simpler: `mt-16` (64px) on wrapper + keep HeroSearchBox `py-6` = 12 + 64 + 24 = 100px. The planner should pick the approach that results in the most consistent visual spacing with other sections.

2. **SectionSkeleton grid columns**
   - What we know: SectionSkeleton in page.tsx uses `lg:grid-cols-4` hardcoded.
   - Recommendation: Must update to `lg:grid-cols-3` in sync with HOME-02 to avoid skeleton/content mismatch. Include in the same task as HOME-02.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.x + happy-dom |
| Config file | `vitest.config.mts` |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | Homepage sections have 80px+ gaps (via py-10+ classes) | manual-only | Visual inspection | N/A -- CSS visual spacing cannot be unit-tested in happy-dom |
| HOME-02 | Featured vehicles grid uses 3-col layout | unit | `yarn test tests/unit/features/spacing/homepage-grid.test.tsx` | No -- Wave 0 |
| HOME-03 | Search section has increased internal padding | manual-only | Visual inspection | N/A |
| HOME-04 | Promo cards use gap-6 (24px) | manual-only | Visual inspection | N/A |
| SRCH-01 | Vehicle grid uses gap-6 (24px) | unit | `yarn test tests/unit/features/spacing/search-grid.test.tsx` | No -- Wave 0 |
| SRCH-02 | SearchBar->Breadcrumb has 24px+ spacing | manual-only | Visual inspection | N/A |
| SRCH-03 | Vehicle card info section uses p-4 | unit | `yarn test tests/unit/features/spacing/vehicle-card-spacing.test.tsx` | No -- Wave 0 |
| SRCH-04 | Quick filter pill area has symmetrical 16px top+bottom margin | manual-only | Visual inspection | N/A |

### Sampling Rate
- **Per task commit:** `yarn type-check`
- **Per wave merge:** `yarn test && yarn type-check`
- **Phase gate:** Full suite green + visual spot-check of homepage and search page (both desktop and mobile widths)

### Wave 0 Gaps
- [ ] `tests/unit/features/spacing/homepage-grid.test.tsx` -- renders RecommendedVehiclesTabs, asserts `lg:grid-cols-3` present and `lg:grid-cols-4` absent
- [ ] `tests/unit/features/spacing/search-grid.test.tsx` -- renders VehicleGrid, asserts `gap-6` present
- [ ] `tests/unit/features/spacing/vehicle-card-spacing.test.tsx` -- renders VehicleCard info section, asserts `p-4` class present

*(Note: Most spacing requirements are visual-only and cannot be meaningfully unit-tested in happy-dom. The grid column and gap class checks are the most testable aspects. Visual verification via human checkpoint is the primary validation method.)*

## Sources

### Primary (HIGH confidence)
- **Codebase audit** -- direct reading of all 10+ source files involved in this phase
- `src/app/(public)/page.tsx` -- homepage section ordering and structure
- `src/features/marketing/components/hero-banner.tsx` -- hero banner spacing (py-3 dots)
- `src/features/marketing/components/hero-search-box.tsx` -- search box padding (py-6, mb-4, gap-3, py-5)
- `src/features/marketing/components/quick-links.tsx` -- quick links padding (py-6)
- `src/features/marketing/components/recommended-vehicles.tsx` -- recommended section (py-10 md:py-12)
- `src/features/marketing/components/recommended-vehicles-tabs.tsx` -- grid layout (lg:grid-cols-4)
- `src/features/marketing/components/promo-banners.tsx` -- promo grid (gap-4)
- `src/features/marketing/components/partner-logos.tsx` -- partner section (py-8)
- `src/app/(public)/vehicles/page.tsx` -- search page layout structure
- `src/features/vehicles/components/vehicle-grid.tsx` -- grid gap (gap-5)
- `src/features/vehicles/components/vehicle-card.tsx` -- card info padding (p-3.5)
- `src/features/vehicles/components/vehicle-search-bar.tsx` -- search bar (py-4)
- `src/features/vehicles/components/quick-filter-badges.tsx` -- filter badges (mb-4)
- `src/features/vehicles/components/vehicle-list-client.tsx` -- list client layout
- `src/components/layout/breadcrumb-nav.tsx` -- breadcrumb (mb-4)
- `.planning/phases/18-global-spacing-foundation/18-01-SUMMARY.md` -- Phase 18 established patterns

### Secondary (MEDIUM confidence)
- None

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, pure CSS class changes
- Architecture: HIGH -- full codebase audit of all 10+ affected files completed
- Pitfalls: HIGH -- identified from direct code analysis, background color interaction and skeleton mismatch are concrete risks

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable -- pure CSS, no API changes)
