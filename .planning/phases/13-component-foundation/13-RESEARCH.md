# Phase 13: Component Foundation - Research

**Researched:** 2026-03-19
**Domain:** Design system foundation -- npm packages, shadcn/ui components, design tokens, utility functions
**Confidence:** HIGH

## Summary

Phase 13 establishes the shared design system foundation before any page-level work begins (Phases 14-17). The scope is well-bounded: install 4 npm packages, add 13 shadcn/ui components, extend Tailwind CSS design tokens for K Car-style layouts, and add one new utility function (`getKoreanVehicleName`).

The existing codebase is mature (v1.1 complete, 264 tests, 16 shadcn components, Tailwind v4 with CSS variables). All additions are incremental and low-risk. shadcn v4.0.2 is already configured with `base-nova` style, Tailwind v4 `@theme inline` pattern, and Pretendard font. The project uses yarn as package manager (npm forbidden per CLAUDE.md).

**Primary recommendation:** Execute in 4 discrete waves -- packages first, then shadcn components, then design tokens, then utility function with tests. Each wave is independently verifiable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Keep existing Navy primary (#0F172A) + Blue accent (#3B82F6) palette -- do NOT switch to K Car Red
- K Car influence is limited to layout/structure/component patterns only, not colors
- COMP-03 reinterpreted as adding supplementary tokens (badge colors, status colors, card background variants) not replacing the palette
- Hybrid design tone: hero/landing keep glassmorphism + dark hero; information pages (search/detail) use K Car-style flat design
- Preserve existing DESIGN-SPEC.md glassmorphism card and dark hero patterns
- Kakao Maps SDK excluded (deferred to v3.0)
- Install 4 packages: Embla plugins (autoplay, auto-scroll), YARL lightbox, react-intersection-observer
- All 13 shadcn components installed in Phase 13 (pre-installed for downstream phases)
- Existing `formatKRW()` and `formatDate()` unchanged
- New `getKoreanVehicleName()` function added
- `formatKoreanDate()` checked against existing `formatDate()` for duplication

### Claude's Discretion
- `getKoreanVehicleName()` format -- analyze existing Vehicle model fields and K Car display patterns
- Supplementary design token values (badge colors, K Car layout spacing)
- shadcn component customization scope (default styles vs theme application)

### Deferred Ideas (OUT OF SCOPE)
- Kakao Maps SDK installation and directStore map features (MAP-01, MAP-02) -- v3.0
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | Install 4 npm packages (Embla plugins, YARL, Intersection Observer) | Package versions verified, installation commands documented, Embla core auto-installed via shadcn Carousel |
| COMP-02 | Add 13 shadcn/ui components (Accordion, Tabs, Carousel, etc.) | shadcn v4.0.2 CLI confirmed, `npx shadcn@latest add` pattern verified, no conflicts with existing 16 components |
| COMP-03 | Supplementary design tokens for K Car layouts (badge, status, spacing) | Existing `@theme inline` + CSS variables pattern documented, token extension approach defined |
| COMP-04 | Utility functions -- `getKoreanVehicleName()` new, verify `formatKoreanDate()` vs existing `formatDate()` | Existing format.ts analyzed, Vehicle model chain documented, `nameKo` fallback pattern identified |
</phase_requirements>

## Standard Stack

### Core (New Packages to Install)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| embla-carousel-autoplay | ^8.6.0 | Auto-advance carousel slides | Official Embla plugin, shadcn Carousel built on Embla |
| embla-carousel-auto-scroll | ^8.6.0 | Continuous scroll carousel | Official Embla plugin for testimonial/review carousels |
| yet-another-react-lightbox | ^3.29.1 | Fullscreen image lightbox | React 19 compatible, plugin system (thumbnails, zoom, fullscreen) |
| react-intersection-observer | ^10.0.3 | Viewport detection for infinite scroll | De facto standard React IO wrapper, ~2KB gzipped |

### Already Installed (No Action)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| shadcn | ^4.0.2 | Component CLI | Already configured in components.json |
| tailwindcss | ^4 | CSS framework | `@theme inline` pattern established |
| lucide-react | ^0.577.0 | Icon library | Used throughout existing components |
| embla-carousel-react | (auto) | Carousel core | Will be auto-installed when adding shadcn Carousel component |
| embla-carousel | (auto) | Carousel engine | Will be auto-installed when adding shadcn Carousel component |

### Installation

```bash
# Step 1: shadcn Carousel (auto-installs embla-carousel + embla-carousel-react)
npx shadcn@latest add carousel

# Step 2: Embla plugins
yarn add embla-carousel-autoplay embla-carousel-auto-scroll

# Step 3: YARL lightbox
yarn add yet-another-react-lightbox

# Step 4: Intersection Observer
yarn add react-intersection-observer

# Step 5: Remaining shadcn components (batch)
npx shadcn@latest add accordion tabs collapsible progress pagination popover scroll-area avatar breadcrumb toggle-group radio-group dropdown-menu
```

**IMPORTANT:** Install Carousel FIRST via shadcn (not yarn) because shadcn's Carousel component auto-configures Embla dependencies with correct peer versions. Then add Embla plugins separately.

## Architecture Patterns

### Existing Project Structure (No Changes Needed)

```
src/
├── app/globals.css          # Design tokens (CSS variables + @theme inline)
├── components/ui/           # shadcn components (16 existing + 13 new)
├── lib/utils/format.ts      # Format utilities (extend here)
└── lib/utils.ts             # cn() helper (shadcn standard)
```

### Pattern 1: CSS Variables + @theme inline (Design Tokens)

**What:** Tailwind v4 pattern used in this project. CSS custom properties in `:root` mapped via `@theme inline` block.
**When to use:** All new design tokens MUST follow this pattern.

```css
/* In globals.css :root block -- add new supplementary tokens */
:root {
  /* Existing palette preserved */
  --primary: hsl(220 50% 15%);

  /* NEW: Supplementary tokens for K Car layouts */
  --badge-success: hsl(142 71% 45%);
  --badge-warning: hsl(38 92% 50%);
  --badge-info: hsl(217 91% 60%);
  --badge-new: hsl(262 83% 58%);
  --card-hover: hsl(220 15% 96%);
  --text-price: hsl(217 91% 60%);  /* Same as accent */
  --text-secondary: hsl(220 10% 45%);
}

/* In @theme inline block -- map to Tailwind utilities */
@theme inline {
  /* Existing mappings preserved */
  --color-badge-success: var(--badge-success);
  --color-badge-warning: var(--badge-warning);
  --color-badge-info: var(--badge-info);
  --color-badge-new: var(--badge-new);
  --color-card-hover: var(--card-hover);
  --color-text-price: var(--text-price);
  --color-text-secondary: var(--text-secondary);
}
```

### Pattern 2: nameKo Fallback (Established Codebase Convention)

**What:** All Korean display names use `nameKo || name` or `nameKo ?? name` pattern.
**When to use:** Any place displaying Brand, CarModel, or other entity names to users.

```typescript
// Established pattern found in 40+ locations in codebase
const brandName = brand.nameKo || brand.name    // "현대" || "Hyundai"
const modelName = model.nameKo || model.name    // "쏘나타" || "Sonata"
```

### Pattern 3: shadcn Component Style (base-nova)

**What:** Project uses `base-nova` shadcn style with RSC support. Components are placed in `src/components/ui/` with named exports.
**When to use:** All 13 new shadcn components will follow this pattern automatically via CLI.

```json
// components.json (already configured)
{
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "aliases": { "ui": "@/components/ui" }
}
```

### Anti-Patterns to Avoid
- **DO NOT modify existing CSS variable values** -- only ADD new variables. Navy/Blue palette is locked.
- **DO NOT create custom carousel** -- use shadcn Carousel (Embla-backed).
- **DO NOT default export** -- project convention is named exports only.
- **DO NOT use npm** -- project uses yarn exclusively.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Carousel/slider | Custom scroll handler | shadcn Carousel + Embla plugins | Touch/swipe, accessibility, plugin ecosystem |
| Fullscreen lightbox | Custom modal with img zoom | yet-another-react-lightbox | Keyboard nav, touch gestures, srcSet, thumbnails plugin |
| Viewport detection | Custom IntersectionObserver | react-intersection-observer | Cleanup, threshold options, SSR-safe, React 19 hooks |
| Korean vehicle name | Inline template literals | `getKoreanVehicleName()` utility | Currently duplicated across 10+ files as inline string concat |

**Key insight:** The vehicle name formatting is currently scattered across the codebase as inline `${brand.nameKo || brand.name} ${model.nameKo || model.name}` in 10+ files. Centralizing into `getKoreanVehicleName()` is the primary utility win of COMP-04.

## Common Pitfalls

### Pitfall 1: Embla Plugin Version Mismatch
**What goes wrong:** Embla plugins must match the core Embla version. Installing plugins before the shadcn Carousel can lead to version conflicts.
**Why it happens:** shadcn Carousel installs specific `embla-carousel` + `embla-carousel-react` versions. Plugins installed separately may pull different majors.
**How to avoid:** Install shadcn Carousel FIRST (which installs Embla core), THEN install plugins. Verify all Embla packages share the same major version (8.x).
**Warning signs:** TypeScript errors about incompatible plugin types, runtime `useEmblaCarousel` errors.

### Pitfall 2: YARL CSS Import Missing
**What goes wrong:** Lightbox renders but is completely unstyled (invisible overlay, no positioning).
**Why it happens:** YARL requires `import "yet-another-react-lightbox/styles.css"` in addition to the component import.
**How to avoid:** Add the CSS import in `globals.css` or at the component level where Lightbox is first used. For Phase 13, just verify the package imports correctly -- actual Lightbox usage is in Phase 14.
**Warning signs:** Lightbox opens but images are not visible or positioned at (0,0).

### Pitfall 3: shadcn Overwrites Existing Components
**What goes wrong:** Running `npx shadcn@latest add` on an already-installed component overwrites customizations.
**Why it happens:** shadcn CLI overwrites files by default.
**How to avoid:** Only add the 13 NEW components. The existing 16 (badge, button, card, checkbox, dialog, input, label, navigation-menu, select, separator, sheet, skeleton, slider, table, textarea, tooltip) must NOT be re-added.
**Warning signs:** Git diff showing changes to existing `src/components/ui/` files.

### Pitfall 4: formatKoreanDate Duplication
**What goes wrong:** Creating a redundant `formatKoreanDate()` when `formatDate()` already outputs Korean format.
**Why it happens:** COMP-04 requirement lists it, but existing `formatDate()` already produces "2026년 3월 9일" format.
**How to avoid:** Verify existing `formatDate()` covers the need. If identical, export an alias `formatKoreanDate = formatDate` or skip entirely with documentation.
**Warning signs:** Two functions with identical output behavior.

### Pitfall 5: @theme inline Ordering in Tailwind v4
**What goes wrong:** New CSS variables added but not usable as Tailwind classes.
**Why it happens:** In Tailwind v4, `@theme inline` must map CSS variables to `--color-*` names for color utilities to work. Missing the mapping means `bg-badge-success` won't resolve.
**How to avoid:** For every new CSS variable in `:root`, add a corresponding `--color-*` entry in `@theme inline`.
**Warning signs:** Tailwind classes like `bg-badge-success` or `text-badge-warning` have no effect.

## Code Examples

### getKoreanVehicleName() Implementation

Based on analysis of 10+ existing inline usages across the codebase:

```typescript
// Source: Codebase analysis of src/app/admin/contracts/page.tsx:55,
// src/features/vehicles/components/vehicle-card.tsx:92-93,
// src/features/admin/actions/get-dashboard-stats.ts:171-172

/**
 * Build Korean display name for a vehicle from its nested relations.
 *
 * Pattern: "현대 쏘나타 DN8 2024" (brand model trim year)
 * Fallback: Uses English name if nameKo is null
 *
 * @example
 * getKoreanVehicleName({
 *   year: 2024,
 *   trim: {
 *     name: "프리미엄",
 *     generation: {
 *       carModel: {
 *         name: "Sonata", nameKo: "쏘나타",
 *         brand: { name: "Hyundai", nameKo: "현대" }
 *       }
 *     }
 *   }
 * })
 * // => "현대 쏘나타 프리미엄 2024"
 */
type VehicleNameInput = {
  year: number
  trim: {
    name: string
    generation: {
      carModel: {
        name: string
        nameKo: string | null
        brand: {
          name: string
          nameKo: string | null
        }
      }
    }
  }
}

export function getKoreanVehicleName(
  vehicle: VehicleNameInput,
  options?: { includeTrim?: boolean; includeYear?: boolean }
): string {
  const { includeTrim = true, includeYear = true } = options ?? {}
  const brand = vehicle.trim.generation.carModel.brand
  const model = vehicle.trim.generation.carModel
  const parts = [
    brand.nameKo || brand.name,
    model.nameKo || model.name,
  ]
  if (includeTrim) parts.push(vehicle.trim.name)
  if (includeYear) parts.push(String(vehicle.year))
  return parts.join(' ')
}
```

### YARL Lightbox Integration Pattern (for Phase 14 reference)

```typescript
// Source: https://yet-another-react-lightbox.com/documentation
import Lightbox from "yet-another-react-lightbox"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"

// Usage with vehicle images
<Lightbox
  open={lightboxOpen}
  close={() => setLightboxOpen(false)}
  index={currentIndex}
  slides={vehicleImages.map(img => ({ src: img.url }))}
  plugins={[Thumbnails, Zoom]}
/>
```

### Embla Autoplay with shadcn Carousel (for Phase 14/16 reference)

```typescript
// Source: https://ui.shadcn.com/docs/components/radix/carousel
import Autoplay from "embla-carousel-autoplay"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"

<Carousel
  plugins={[
    Autoplay({ delay: 4000, stopOnInteraction: true }),
  ]}
>
  <CarouselContent>
    <CarouselItem>...</CarouselItem>
  </CarouselContent>
</Carousel>
```

### react-intersection-observer (for Phase 15 reference)

```typescript
// Source: https://github.com/thebuilder/react-intersection-observer
import { useInView } from "react-intersection-observer"

function InfiniteScrollSentinel({ onLoadMore }: { onLoadMore: () => void }) {
  const { ref } = useInView({
    threshold: 0,
    onChange: (inView) => { if (inView) onLoadMore() },
  })
  return <div ref={ref} />
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| shadcn v0 CLI (`npx shadcn-ui@latest`) | shadcn v4 CLI (`npx shadcn@latest`) | March 2026 | New `--dry-run`, `--diff` flags available |
| Embla Carousel v7 | Embla Carousel v8.6 | 2024 | Plugin API changed, new `autoScroll` plugin |
| YARL v2 | YARL v3.29 | 2024 | New plugin architecture, CSS module approach |
| Tailwind v3 (tailwind.config.js) | Tailwind v4 (@theme inline) | 2025 | No config file needed, CSS-native configuration |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 + happy-dom |
| Config file | `vitest.config.mts` |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` (same -- all unit tests) |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | Packages importable (no runtime errors) | unit | `yarn test tests/unit/features/component-foundation/packages.test.ts -x` | No -- Wave 0 |
| COMP-02 | 13 shadcn components render without errors | unit | `yarn test tests/unit/features/component-foundation/shadcn-components.test.ts -x` | No -- Wave 0 |
| COMP-03 | Design tokens resolve in Tailwind classes | manual | Build succeeds (`yarn build`) + visual spot check | N/A -- build verification |
| COMP-04 | `getKoreanVehicleName()` produces correct output | unit | `yarn test tests/unit/features/component-foundation/format-utils.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test`
- **Per wave merge:** `yarn test && yarn build`
- **Phase gate:** Full suite green + build success before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/features/component-foundation/packages.test.ts` -- import smoke tests for COMP-01
- [ ] `tests/unit/features/component-foundation/shadcn-components.test.ts` -- render tests for COMP-02
- [ ] `tests/unit/features/component-foundation/format-utils.test.ts` -- unit tests for COMP-04 (getKoreanVehicleName)

## Open Questions

1. **Supplementary token exact values**
   - What we know: User wants badge colors, status colors, card background variants, K Car layout spacing tokens
   - What's unclear: Exact HSL values for each token (K Car site is JS-rendered, hard to extract exact values)
   - Recommendation: Use semantic color values derived from existing palette (success=green, warning=amber, info=blue, new=purple). Match existing DESIGN-SPEC.md semantic colors where possible.

2. **formatKoreanDate() disposition**
   - What we know: Existing `formatDate()` already outputs "2026년 3월 9일" (Korean formal) and "2026.03.09" (short). This IS `formatKoreanDate`.
   - What's unclear: Whether COMP-04 requirement expects a distinct function or recognizes the existing one suffices.
   - Recommendation: Export `formatKoreanDate` as an alias for `formatDate` for API consistency, with a JSDoc note.

3. **shadcn component customization depth**
   - What we know: Claude's discretion per CONTEXT.md. Components should work with existing Navy/Blue theme.
   - What's unclear: Whether any of the 13 components need immediate theme overrides or if defaults suffice.
   - Recommendation: Install with defaults first. shadcn base-nova style + existing CSS variables should auto-theme. Customize only if visual testing reveals mismatches.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `package.json`, `components.json`, `globals.css`, `format.ts`, `schema.prisma` -- direct file reads
- Codebase pattern analysis: 40+ files using `nameKo || name` pattern, 10+ files with inline vehicle name formatting
- [shadcn/ui Carousel docs](https://ui.shadcn.com/docs/components/radix/carousel) -- Embla integration, plugin usage
- [YARL documentation](https://yet-another-react-lightbox.com/documentation) -- plugin system, CSS requirement

### Secondary (MEDIUM confidence)
- [embla-carousel-autoplay npm](https://www.npmjs.com/package/embla-carousel-autoplay) -- version 8.6.0 confirmed
- [react-intersection-observer npm](https://www.npmjs.com/package/react-intersection-observer) -- version 10.0.3 confirmed
- [yet-another-react-lightbox npm](https://www.npmjs.com/package/yet-another-react-lightbox) -- version 3.29.1 confirmed
- [shadcn/ui CLI v4 changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) -- v4 CLI features

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all package versions verified via npm, shadcn config verified from codebase
- Architecture: HIGH -- patterns extracted directly from existing codebase (40+ file evidence)
- Pitfalls: HIGH -- based on known library behaviors and codebase conventions
- Utilities: HIGH -- `getKoreanVehicleName` type signature derived from Prisma schema + 10+ usage sites

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain -- design system foundation, no fast-moving APIs)
