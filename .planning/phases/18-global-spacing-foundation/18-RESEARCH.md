# Phase 18: Global Spacing Foundation - Research

**Researched:** 2026-03-23
**Domain:** CSS layout spacing, Tailwind CSS 4, Next.js App Router layouts
**Confidence:** HIGH

## Summary

Phase 18 is a pure CSS/layout adjustment phase requiring changes to navigation height and content top margins across every page layout in the application. The codebase has 4 distinct layout groups (public, protected, admin, dealer) and the navigation is composed of 3 vertical sections (top bar, main header, mega menu). Current spacing is inconsistent -- some pages have zero top padding, others use `py-10`, `py-12`, `pt-4`, or `pt-6`.

The changes are low-risk and highly localized. The primary strategy is: (1) adjust nav height values in the header component, (2) add a consistent `pt-6` or `pt-8` (24-32px) to the `<main>` tag in each layout file, and (3) ensure admin pages follow the same spacing rules. No new libraries needed. No architectural changes.

**Primary recommendation:** Define a CSS custom property `--nav-height` for the navigation bar height and use a consistent `pt-6` (24px) or `pt-8` (32px) on `<main>` elements in all layout files. This creates a single source of truth and makes future adjustments trivial.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GLBL-01 | Navigation bar height 44px -> 52px | Header component (`h-[68px]`) and mega menu (`h-12`) need height adjustments. See Architecture Patterns for exact change map. |
| GLBL-02 | All pages content start top margin 24-32px unified | 4 layout files need `<main>` padding updates. See Current State Audit for per-layout analysis. |
| GLBL-03 | Admin dashboard same spacing rules as public pages | Admin layout `<main className="flex-1 p-6">` needs top padding aligned with public layout pattern. |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase only modifies existing CSS classes.

### Core (Already Installed)
| Library | Version | Purpose | Relevance |
|---------|---------|---------|-----------|
| tailwindcss | 4.x | Utility-first CSS | All spacing changes use Tailwind classes |
| next | 15.x | App Router layouts | Layout files define `<main>` spacing |

**No installation required.**

## Architecture Patterns

### Current Navigation Structure (Desktop)

```
+--------------------------------------------------+
| Top Bar (py-[10px], ~36px) -- desktop only        |  <- NOT sticky
+--------------------------------------------------+
| Main Header Bar (h-[68px]) -- STICKY top-0        |  <- Logo, search, auth
+--------------------------------------------------+
| Mega Menu Nav (h-12 = 48px) -- inside <header>    |  <- Category nav links
+--------------------------------------------------+
| <main> content starts here                        |  <- NO gap currently
+--------------------------------------------------+
```

The `<header>` element is `sticky top-0` and contains BOTH the main header bar (68px) and the mega menu (48px). The top bar sits ABOVE the header and scrolls away.

The requirement "nav bar height 44px -> 52px" refers to the mega menu nav bar (`h-12` = 48px currently, target 52px). The main header bar height (68px) is NOT mentioned in requirements and should stay unchanged.

### Current Navigation Structure (Mobile)

```
+--------------------------------------------------+
| Main Header Bar (h-[68px]) -- STICKY              |  <- Logo + hamburger
+--------------------------------------------------+
| <main> content starts here                        |  <- NO gap
+--------------------------------------------------+
```

Mobile has no top bar and no mega menu bar. The mega menu items are inside a Sheet/drawer.

### Current Layout Files Audit

| Layout File | `<main>` Class | Current Top Padding | Target |
|-------------|---------------|-------------------|--------|
| `(public)/layout.tsx` | `flex-1` | **0px** (none) | 24-32px |
| `(protected)/layout.tsx` | `min-h-[calc(100vh-4rem)]` | **0px** (none) | 24-32px |
| `admin/layout.tsx` | `flex-1 p-6` | **24px** (p-6 = all sides) | Keep 24px, verify consistency |
| `dealer/layout-client.tsx` | `flex-1 p-6` | **24px** (p-6 = all sides) | Keep 24px, verify consistency |
| `(auth)/layout.tsx` | N/A (split panel) | N/A (full-screen auth) | **No change needed** |

### Current Per-Page Top Spacing (Public Routes)

| Page | Own Top Padding | Effect |
|------|----------------|--------|
| `/` (homepage) | None (hero is edge-to-edge) | Content touches nav |
| `/vehicles` | `pt-4` on breadcrumb wrapper | 16px gap |
| `/vehicles/[id]` | None (gallery is edge-to-edge) | Content touches nav |
| `/sell` | `pt-6` on breadcrumb wrapper | 24px gap |
| `/calculator` | `py-10` on wrapper | 40px gap |
| `/inquiry` | `py-12` on wrapper | 48px gap |

### Recommended Change Strategy

**Approach A (Recommended): Layout-level `<main>` padding**

Add `pt-6` (24px) to `<main>` in each layout file. This provides a consistent baseline. Pages that need edge-to-edge content (homepage hero, vehicle detail gallery) can use **negative margin** (`-mt-6`) to bleed into the padding.

```tsx
// (public)/layout.tsx
<main className="flex-1 pt-6">{children}</main>

// Pages that need edge-to-edge (hero, gallery):
<div className="-mt-6">
  <HeroBanner />
</div>
```

**Approach B (Alternative): CSS custom property + layout token**

Define `--content-top-gap: 24px` in globals.css and reference it:

```css
:root {
  --nav-height: 52px;        /* mega menu */
  --content-top-gap: 24px;   /* breathing room */
}
```

```tsx
<main className="flex-1" style={{ paddingTop: 'var(--content-top-gap)' }}>
```

**Recommendation:** Use Approach A (Tailwind classes) for simplicity and consistency with the rest of the codebase which uses Tailwind exclusively. No inline styles, no custom properties needed for this scope.

### Exact Change Map

| File | Current | Change | Why |
|------|---------|--------|-----|
| `src/components/layout/mega-menu.tsx` | `h-12` (48px) on nav links | `h-[52px]` | GLBL-01: nav height 52px |
| `src/app/(public)/layout.tsx` | `<main className="flex-1">` | `<main className="flex-1 pt-6">` | GLBL-02: 24px top gap |
| `src/app/(protected)/layout.tsx` | `<main className="min-h-[calc(100vh-4rem)]">` | Add `pt-6` | GLBL-02 |
| `src/app/admin/layout.tsx` | `<main className="flex-1 p-6">` | Keep `p-6` (already 24px) | GLBL-03: verify already compliant |
| `src/app/dealer/layout-client.tsx` | `<main className="flex-1 p-6">` | Keep `p-6` (already 24px) | Already compliant |
| `src/app/(public)/page.tsx` | No wrapper | Add `-mt-6` on HeroBanner | Edge-to-edge hero |
| `src/app/(public)/vehicles/[id]/page.tsx` | No wrapper | Add `-mt-6` on gallery | Edge-to-edge gallery |
| `src/app/(public)/vehicles/page.tsx` | `pt-4` on breadcrumb | Remove `pt-4` (layout handles it) | De-duplicate |
| `src/app/(public)/sell/page.tsx` | `pt-6` on breadcrumb wrapper | Remove `pt-6` (layout handles it) | De-duplicate |
| `src/app/(public)/calculator/page.tsx` | `py-10` | Adjust to `pb-10` only | Layout provides top |
| `src/app/(public)/inquiry/page.tsx` | `py-12` | Adjust to `pb-12` only | Layout provides top |

### Admin Layout Detail

The admin layout uses a **sidebar + main content** pattern. The `<main>` already has `p-6` (24px all sides), which satisfies GLBL-03. The admin mobile top bar is `h-14` (56px) -- this is NOT the same as the public nav bar and is NOT covered by GLBL-01.

**Important:** GLBL-03 says "admin dashboard follows the same spacing rules as public pages." The admin sidebar layout is fundamentally different from the public header+content layout. The intent is: admin content should also have 24-32px breathing room at the top. Since `p-6` already provides 24px on all sides, the admin layout is already compliant. Only verification needed, no code change.

### Anti-Patterns to Avoid

- **Do NOT add padding to both layout `<main>` AND individual page wrappers** -- this causes double-padding (24px + 24px = 48px). When adding layout-level padding, remove per-page top padding.
- **Do NOT use `margin-top` on the `<main>` element** -- it creates a gap between the sticky header and the content that scrolls past. Use `padding-top` instead.
- **Do NOT change the main header bar height (68px)** -- GLBL-01 specifically targets the navigation bar (mega menu), not the entire header.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spacing tokens system | Custom CSS variable system | Tailwind `pt-6`/`pt-8` classes | Overkill for 3 requirements; Tailwind already has the values |
| Nav height observer | JavaScript ResizeObserver for dynamic nav height | Fixed `h-[52px]` class | Nav height is static, not dynamic |

**Key insight:** This phase is purely about changing a few Tailwind class values. No abstraction layer is needed.

## Common Pitfalls

### Pitfall 1: Double Padding After Layout Change
**What goes wrong:** Adding `pt-6` to `<main>` in the layout, but forgetting to remove existing `pt-*` / `py-*` from individual page components. Results in 48px+ gap instead of 24px.
**Why it happens:** 12+ page files each have their own top spacing values.
**How to avoid:** Grep all page files for `pt-` and `py-` classes after the layout change. Remove or adjust each one.
**Warning signs:** Visual inspection shows pages with much larger top gap than expected.

### Pitfall 2: Edge-to-Edge Content Broken
**What goes wrong:** Homepage hero banner and vehicle detail gallery need to touch the nav bar edge-to-edge. Adding layout padding pushes them down.
**Why it happens:** Some content intentionally has zero top margin for visual effect.
**How to avoid:** Use `-mt-6` (negative margin) on these specific components to counteract the layout padding. Only the homepage hero and vehicle detail gallery need this treatment.
**Warning signs:** Hero banner no longer touches the bottom of the navigation.

### Pitfall 3: Sticky Header Height Mismatch in Scroll Calculations
**What goes wrong:** The vehicle detail page uses `IntersectionObserver` with `rootMargin: '-80px 0px -60% 0px'` for scroll-spy. Changing nav heights may cause the wrong section to be highlighted.
**Why it happens:** The rootMargin offset is calibrated to the current header height.
**How to avoid:** After changing mega menu height from 48px to 52px (net +4px change), verify scroll-spy behavior. The change is small (4px) and unlikely to cause issues, but should be tested visually.
**Warning signs:** Wrong tab highlighted in vehicle detail sticky nav while scrolling.

### Pitfall 4: Admin Layout Misunderstanding
**What goes wrong:** Attempting to add the public header to admin pages, or changing the admin sidebar height to match the public nav.
**Why it happens:** GLBL-03 says "same spacing rules" which could be misread as "same navigation."
**How to avoid:** Admin has its own sidebar+topbar layout. "Same spacing rules" means the CONTENT area should have consistent 24-32px top margin. Admin already has `p-6`. No structural changes needed.
**Warning signs:** Admin layout breaks or looks inconsistent.

## Code Examples

### Mega Menu Height Change (GLBL-01)
```tsx
// src/components/layout/mega-menu.tsx
// BEFORE:
<Link className={`flex h-12 items-center px-5 ...`}>

// AFTER:
<Link className={`flex h-[52px] items-center px-5 ...`}>
```

### Public Layout Top Padding (GLBL-02)
```tsx
// src/app/(public)/layout.tsx
// BEFORE:
<main className="flex-1">{children}</main>

// AFTER:
<main className="flex-1 pt-6">{children}</main>
```

### Edge-to-Edge Hero Override
```tsx
// src/app/(public)/page.tsx
// BEFORE:
<HeroBanner />

// AFTER:
<div className="-mt-6">
  <HeroBanner />
</div>
```

### Protected Layout Top Padding (GLBL-02)
```tsx
// src/app/(protected)/layout.tsx
// BEFORE:
<main className="min-h-[calc(100vh-4rem)]">{children}</main>

// AFTER:
<main className="min-h-[calc(100vh-4rem)] pt-6">{children}</main>
```

### Removing Duplicate Page-Level Padding
```tsx
// src/app/(public)/calculator/page.tsx
// BEFORE:
<div className="mx-auto max-w-4xl px-4 py-10">

// AFTER:
<div className="mx-auto max-w-4xl px-4 pb-10">
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-page top spacing | Layout-level `<main>` padding | This phase | Single source of truth for content start position |
| Implicit nav height (no token) | Explicit `h-[52px]` class | This phase | Predictable, greppable value |

**Deprecated/outdated:**
- Tailwind CSS 3 `@apply` in component styles -- project uses Tailwind 4 with `@theme inline` block
- Using `space-y-*` on layout for nav-content gap -- not appropriate for layout-level spacing

## Open Questions

1. **Exact interpretation of "44px to 52px"**
   - What we know: The mega menu nav is currently `h-12` (48px). The main header bar is `h-[68px]`. The admin mobile topbar is `h-14` (56px).
   - What's unclear: The requirement says "44px" which doesn't match any current value. The closest is the mega menu's 48px. It's possible the requirement was measured visually from a screenshot and was approximate.
   - Recommendation: Change mega menu `h-12` (48px) to `h-[52px]` (52px). This is the navigation BAR (with category links), which is what users see as "the nav bar" below the header. The 4px increase is consistent with the "44 -> 52" intent of making the nav taller for visual weight.

2. **Homepage hero edge-to-edge**
   - What we know: The hero banner currently renders edge-to-edge immediately below the nav. Adding layout-level `pt-6` would create a gap.
   - What's unclear: Does the design intent want a gap between nav and hero on the homepage?
   - Recommendation: Use `-mt-6` to keep hero edge-to-edge. If designer wants a gap, remove the negative margin. Easy to adjust.

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
| GLBL-01 | Mega menu nav renders at 52px height | unit | `yarn test src/components/layout/header.test.tsx` | Partial (tests exist but don't check height) |
| GLBL-02 | Public/protected layouts have pt-6 on main | unit | `yarn test tests/unit/features/spacing/layout-spacing.test.tsx` | No -- Wave 0 |
| GLBL-03 | Admin layout has consistent top padding | unit | `yarn test tests/unit/features/spacing/layout-spacing.test.tsx` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test`
- **Per wave merge:** `yarn test && yarn type-check`
- **Phase gate:** Full suite green + visual spot-check of homepage, vehicle list, vehicle detail, admin dashboard

### Wave 0 Gaps
- [ ] `tests/unit/features/spacing/layout-spacing.test.tsx` -- test that renders layout components and checks for expected CSS classes (pt-6, h-[52px])
- [ ] Update `src/components/layout/header.test.tsx` -- add test for mega menu height class

*(Note: spacing tests are inherently limited in unit tests since happy-dom doesn't compute CSS layout. Tests should verify the correct Tailwind classes are present in rendered output, NOT pixel measurements.)*

## Sources

### Primary (HIGH confidence)
- **Codebase audit** -- direct reading of all layout files, header component, mega menu, admin sidebar, and 12+ page files
- `src/components/layout/header.tsx` -- main header structure (h-[68px])
- `src/components/layout/mega-menu.tsx` -- mega menu nav bar (h-12)
- `src/app/(public)/layout.tsx` -- public layout (no main padding)
- `src/app/admin/layout.tsx` -- admin layout (p-6 on main)
- `src/app/(protected)/layout.tsx` -- protected layout (no main padding)
- `src/app/globals.css` -- Tailwind 4 theme configuration

### Secondary (MEDIUM confidence)
- Requirements interpretation of "44px" -- the actual current value is 48px (h-12), not 44px. The 44px figure may be from visual measurement of a rendered page or a previous design iteration.

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, pure CSS class changes
- Architecture: HIGH -- full codebase audit completed, all layout files read
- Pitfalls: HIGH -- identified from direct code analysis, not speculation

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable -- pure CSS, no API changes)
