# Phase 23: Design System Migration - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Source:** Auto-mode (recommended defaults selected)

<domain>
## Phase Boundary

Migrate all hardcoded hex color values to CSS variables, unify brand blue to #3B82F6, resolve accessibility gaps (focus-visible, prefers-reduced-motion, h1 hierarchy), and define dark mode token values. Largest file-count phase in v3.0 (~29 files). Phase 21 CSS tokens are the foundation.

</domain>

<decisions>
## Implementation Decisions

### Brand Color Unification
- Replace all `#1A6DFF` (43 occurrences) with `var(--brand-blue)` (#3B82F6)
- Replace all other blue variants with appropriate brand token references
- Exception: car color swatches (literal color display) keep hardcoded values
- Brand blue token `--brand-blue: #3B82F6` already defined in Phase 21 globals.css

### Hex-to-CSS-Variable Migration Strategy
- File-by-file systematic replacement across ~29 component files
- ~394 hardcoded hex values clustering into ~10 distinct colors
- Map each hex cluster to the nearest CSS token (brand or shadcn)
- Verify each file with grep after replacement — zero remaining hex except intentional exceptions
- Intentional exceptions: car color swatches, image placeholders, SVG fills with dynamic values

### Dark Mode Token Values
- Define inverted semantic values in `.dark` selector (already scaffolded in Phase 21)
- Dark backgrounds: navy/slate tones for cards and surfaces
- Light text: white/gray-200 for primary and secondary text
- Brand blue stays the same in dark mode (#3B82F6)
- No toggle UI — just token definitions for future v4.0 dark mode

### Accessibility — Focus Visible
- Replace all 51 `outline-none` instances with `outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2`
- Exception: elements where shadcn/ui already handles focus styling
- Tab navigation must show visible focus ring on every interactive element

### Accessibility — Reduced Motion
- Add global CSS rule: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`
- framer-motion components: wrap with `useReducedMotion()` hook or set `transition={{ duration: 0 }}` when reduced motion is preferred
- CSS transitions in Tailwind: already covered by global rule

### Accessibility — Heading Hierarchy
- Add `<h1>` to homepage — likely the hero section title
- Verify no other page has duplicate or missing h1
- Follow semantic heading hierarchy (h1 → h2 → h3, no skips)

### Claude's Discretion
- Exact token mapping for each hex cluster
- Dark mode specific color values (within inverted semantic pattern)
- Which framer-motion components need useReducedMotion vs global CSS coverage
- Order of file-by-file migration

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### CSS Tokens (Phase 21 output)
- `src/app/globals.css` — `:root` brand tokens, `.dark` values, `@theme inline` semantic mappings

### Design Review
- `.gstack/design-reports/design-audit-navid-auto-2026-03-27.md` — Full design audit with 24 findings, hex counts, accessibility gaps

### Research
- `.planning/research/FEATURES.md` — Hex audit counts per file, color clustering analysis
- `.planning/research/ARCHITECTURE.md` — 394 hex values across 29 files, ~10 distinct colors
- `.planning/research/PITFALLS.md` — CSS variable migration pitfalls, visual regression warnings

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/globals.css` — Phase 21 defined 9 brand tokens in `:root`, `.dark`, and `@theme inline`
- shadcn tokens — `--primary`, `--accent`, `--muted`, `--destructive` etc. already available
- `cn()` utility — Tailwind merge for conditional class application

### Established Patterns
- Tailwind utility classes for styling (not inline styles)
- `@custom-variant dark` already defined for dark mode
- shadcn components use `text-foreground`, `bg-background` etc. — follow this pattern

### Integration Points
- `src/components/` — UI primitives and layout components
- `src/features/*/components/` — Feature-specific components with hardcoded hex
- `src/app/` — Page components (homepage h1, marketing pages)

</code_context>

<specifics>
## Specific Ideas

- After migration, `grep -rn '#[0-9a-fA-F]\{6\}' src/` should return only intentional exceptions
- Visual regression: compare before/after screenshots of key pages (homepage, search, detail, admin)

</specifics>

<deferred>
## Deferred Ideas

- Dark mode toggle UI — v4.0 (DS-F01)
- Automated visual regression testing with Playwright — separate infrastructure phase

</deferred>

---

*Phase: 23-design-system-migration*
*Context gathered: 2026-03-27 via auto-mode*
