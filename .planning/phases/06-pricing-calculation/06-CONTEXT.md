# Phase 6: Pricing & Calculation - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can understand and compare rental vs lease costs with transparent pricing calculations. Covers: monthly payment calculator with period/deposit sliders, residual value display from admin-configurable lookup table, interactive rental vs lease side-by-side comparison, and admin residual value rate management. Contract application flow is Phase 7. Full admin dashboard is Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Calculator Placement & UX
- Two locations: standalone `/calculator` page AND embedded in vehicle detail page
- Standalone page vehicle selection: Claude's discretion (search-select or cascade dropdowns)
- Slider interaction style: Claude's discretion (real-time vs calculate button)
- Fully public — no login required to use the calculator
- Vehicle detail: calculator section placed below specs table, above inquiry CTA

### Rental vs Lease Comparison
- Side-by-side columns layout: rental on left, lease on right
- Both update simultaneously when user adjusts shared inputs (period, deposit)
- Mobile adaptation: Claude's discretion (stack vertically or swipeable)
- Recommendation indicator: Claude's discretion
- Educational content (rental vs lease differences): Claude's discretion

### Pricing Formula & Inputs
- User-controllable variables: contract period (months) and deposit amount (보증금) — two sliders
- Period range: 12, 24, 36, 48, 60 months
- Deposit range: configurable steps (e.g., 0 ~ 1,000만원)
- Calculation formula: Claude's discretion (simple linear or include interest rate — demo/MVP appropriate)
- Residual value display format: Claude's discretion (amount only vs amount + percentage)
- Missing residual value rate fallback: Claude's discretion (default rate vs hide lease option)

### Vehicle Detail Page Integration
- Calculator embedded below specs, above 상담신청 button (gallery → specs → calculator → CTA flow)
- Detail page calculator scope: Claude's discretion (full comparison or simplified + link to standalone)

### Admin Residual Value Management
- Table with inline editing: rows of brand/model/year/rate, click to edit rate
- Add new rows via form
- Brand-only filter dropdown to narrow the table
- Admin sidebar nav: add '잔존가치 관리' menu item (same level as 차량 관리, 승인 관리)
- Default/fallback rate configuration: Claude's discretion (admin-configurable vs hardcoded)
- Seed data for sample rates: Claude's discretion

### Vehicle Card Monthly Estimate
- Search result cards show monthly rental estimate: "렌탈 월 ~32만원부터"
- Calculated from vehicle price with default period (e.g., 36 months, 0 deposit)
- Updates Phase 5 card design to include this line

### Navigation & Discoverability
- How users discover the standalone calculator: Claude's discretion (header nav, landing page CTA, or both)

### Claude's Discretion
- Standalone calculator vehicle selection mechanism
- Slider interaction pattern (real-time vs submit button)
- Mobile comparison layout adaptation
- Recommendation indicator on comparison
- Educational content level for rental vs lease differences
- Calculation formula complexity
- Residual value display format
- Missing rate fallback behavior
- Vehicle detail calculator scope (full vs simplified)
- Calculator empty/initial state design
- No-price vehicle handling
- Default fallback rate approach
- Seed data inclusion
- Navigation placement for calculator page

</decisions>

<specifics>
## Specific Ideas

- Side-by-side comparison inspired by the preview layout: rental column left, lease column right, with monthly payment, deposit, total cost, and lease-specific residual value
- Vehicle cards should show "렌탈 월 ~32만원부터" — approximate monthly estimate for quick browsing context
- Admin residual value table should feel like a simple spreadsheet — inline editing, brand filter, add row
- Calculator should pre-fill vehicle info when navigated from vehicle detail page (no re-selection needed)
- Period slider markers: 12, 24, 36, 48, 60 months — standard Korean rental/lease terms

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/slider.tsx`: Slider component already exists — reuse for period/deposit sliders
- `src/features/vehicles/components/cascade-select.tsx`: Brand → Model → Generation cascade — reuse for standalone calculator vehicle selection
- `src/features/vehicles/components/public-vehicle-detail.tsx`: Vehicle detail page — extend with calculator section
- `src/features/vehicles/components/vehicle-card.tsx`: Vehicle card — extend with monthly estimate line
- `src/lib/utils/format.ts`: formatKRW — reuse for price formatting
- `src/components/ui/card.tsx`, `button.tsx`, `input.tsx`: shadcn/ui primitives

### Established Patterns
- Server Components by default, 'use client' only when needed — calculator will be client component (interactive)
- Server Actions for form submissions — admin residual value CRUD
- Prisma queries with relation includes — ResidualValueRate with brand/carModel relations
- Admin pages use force-dynamic for request-time DB queries
- Admin sidebar at `src/components/layout/admin-sidebar.tsx` — add new menu item

### Integration Points
- Prisma `ResidualValueRate` model: brand + carModel + year → rate (already in schema)
- Prisma `RentalContract` / `LeaseContract` models: monthlyPayment, deposit, totalAmount, residualValue fields define the data shape
- `src/app/(public)/`: Public route group — add `/calculator` page here
- `src/app/admin/`: Admin route group — add `/admin/residual-values` page
- Vehicle price from `Vehicle.price` field — base for calculations

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-pricing-calculation*
*Context gathered: 2026-03-10*
