# Phase 6: Pricing & Calculation - Research

**Researched:** 2026-03-10
**Domain:** Financial calculation UI, admin CRUD, vehicle card/detail integration
**Confidence:** HIGH

## Summary

Phase 6 is primarily a frontend-heavy phase with client-side calculation logic and admin CRUD for residual value rates. The core challenge is implementing accurate Korean rental/lease monthly payment formulas and presenting them in an interactive, side-by-side comparison UI. The database schema already has `ResidualValueRate` model with brand/carModel/year/rate fields and a unique constraint -- no migrations needed.

The existing codebase provides strong foundations: a working Slider component (base-ui), CascadeSelect for brand/model selection, formatKRW for currency display, and established patterns for admin pages (force-dynamic, Server Actions). The `src/lib/finance/` directory is empty and ready for calculation logic.

**Primary recommendation:** Build pure calculation functions in `src/lib/finance/`, a shared `PricingCalculator` client component used in both standalone `/calculator` page and vehicle detail page, and a simple admin CRUD page for residual value rates using Server Actions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two calculator locations: standalone `/calculator` page AND embedded in vehicle detail page
- Fully public -- no login required
- Vehicle detail: calculator section placed below specs table, above inquiry CTA
- Side-by-side columns: rental left, lease right, both update simultaneously
- User-controllable variables: contract period (months) and deposit amount via two sliders
- Period range: 12, 24, 36, 48, 60 months
- Deposit range: configurable steps (e.g., 0 ~ 1,000만원)
- Admin residual value table: inline editing with brand-only filter dropdown
- Admin sidebar: add '잔존가치 관리' menu item (already present in code)
- Vehicle cards show monthly rental estimate: "렌탈 월 ~32만원부터"
- Calculator pre-fills vehicle info when navigated from vehicle detail page

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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRIC-01 | Monthly rental/lease payment calculator based on contract terms | Calculation formulas in `src/lib/finance/`, PricingCalculator component with period/deposit sliders |
| PRIC-02 | Residual value estimation from admin-configurable lookup table (make/model/year -> %) | ResidualValueRate Prisma model already exists, admin CRUD page, lookup in calculator |
| SRCH-04 | Interactive rental vs lease comparison calculator (period/deposit sliders) | Side-by-side comparison UI, shared slider inputs updating both columns simultaneously |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Interactive calculator UI | Already in project |
| base-ui Slider | @base-ui/react ^1.2.0 | Period and deposit sliders | Already installed, Slider component exists |
| Zod 4 | 4.x | Validation for admin forms and calculation inputs | Already in project |
| Prisma 6 | 6.x | ResidualValueRate CRUD | Already in project |
| React Hook Form | latest | Admin residual value form | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nuqs | installed | URL state for calculator params | Standalone calculator page to allow sharing calculation results |
| lucide-react | installed | Calculator/comparison icons | UI icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side calculation | Server API route | Unnecessary network overhead for simple math; client-side is instant feedback |
| Complex PMT formula with interest | Simple linear formula | Demo/MVP -- simple is appropriate; interest rates add complexity without demo value |

**Installation:**
No new packages needed. All required libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── finance/
│       ├── calculate.ts          # Pure calculation functions (rental, lease, comparison)
│       └── calculate.test.ts     # Unit tests for calculation logic
├── features/
│   └── pricing/
│       ├── components/
│       │   ├── pricing-calculator.tsx      # Main calculator (client component, shared)
│       │   ├── comparison-columns.tsx      # Side-by-side rental vs lease display
│       │   ├── period-slider.tsx           # Period slider with step markers
│       │   ├── deposit-slider.tsx          # Deposit slider with formatted labels
│       │   └── vehicle-selector.tsx        # Vehicle selection for standalone page
│       ├── actions/
│       │   ├── get-residual-rate.ts        # Fetch residual rate for vehicle
│       │   ├── upsert-residual-rate.ts     # Admin create/update rate
│       │   └── delete-residual-rate.ts     # Admin delete rate
│       └── schemas/
│           └── residual-value.ts           # Zod schemas for admin forms
├── app/
│   ├── (public)/
│   │   └── calculator/
│   │       └── page.tsx                    # Standalone calculator page
│   └── admin/
│       └── residual-values/
│           └── page.tsx                    # Admin residual value management
```

### Pattern 1: Pure Calculation Functions
**What:** All pricing math in pure functions with no side effects
**When to use:** Always -- these are the core business logic
**Example:**
```typescript
// src/lib/finance/calculate.ts

type RentalCalculation = {
  monthlyPayment: number
  deposit: number
  totalCost: number
  periodMonths: number
}

type LeaseCalculation = {
  monthlyPayment: number
  deposit: number
  residualValue: number
  residualRate: number
  totalCost: number
  periodMonths: number
}

/**
 * Simplified rental calculation for demo/MVP.
 * Formula: monthlyPayment = (vehiclePrice - deposit) / periodMonths
 *
 * In production, this would include interest rate, insurance,
 * registration fees, and maintenance costs.
 */
export function calculateRental(
  vehiclePrice: number,
  periodMonths: number,
  deposit: number
): RentalCalculation {
  const financeAmount = vehiclePrice - deposit
  const monthlyPayment = Math.round(financeAmount / periodMonths)
  return {
    monthlyPayment,
    deposit,
    totalCost: monthlyPayment * periodMonths + deposit,
    periodMonths,
  }
}

/**
 * Simplified lease calculation for demo/MVP.
 * Formula: monthlyPayment = (vehiclePrice - deposit - residualValue) / periodMonths
 * where residualValue = vehiclePrice * residualRate
 *
 * Lease monthly is lower because residual value is excluded from financing.
 */
export function calculateLease(
  vehiclePrice: number,
  periodMonths: number,
  deposit: number,
  residualRate: number // e.g., 0.45 = 45%
): LeaseCalculation {
  const residualValue = Math.round(vehiclePrice * residualRate)
  const financeAmount = vehiclePrice - deposit - residualValue
  const monthlyPayment = Math.round(financeAmount / periodMonths)
  return {
    monthlyPayment,
    deposit,
    residualValue,
    residualRate,
    totalCost: monthlyPayment * periodMonths + deposit,
    periodMonths,
  }
}

/**
 * Quick estimate for vehicle cards (default: 36 months, 0 deposit, rental)
 */
export function estimateMonthlyRental(
  vehiclePrice: number,
  defaultPeriod = 36
): number {
  return Math.round(vehiclePrice / defaultPeriod)
}
```

### Pattern 2: Shared Calculator Component
**What:** Single `PricingCalculator` component used in both standalone page and vehicle detail
**When to use:** Both locations share the same calculation UI
**Example:**
```typescript
// src/features/pricing/components/pricing-calculator.tsx
'use client'

type PricingCalculatorProps = {
  vehicle?: {
    id: string
    price: number
    brandName: string
    modelName: string
    year: number
  }
  residualRate?: number | null  // null = no rate found
}

// When vehicle is provided (detail page), skip vehicle selection
// When vehicle is absent (standalone page), show vehicle selector
export function PricingCalculator({ vehicle, residualRate }: PricingCalculatorProps) {
  // ... sliders, calculation, comparison display
}
```

### Pattern 3: Admin Inline Table with Server Actions
**What:** Table rows with inline edit capability using Server Actions
**When to use:** Admin residual value management
**Example:**
```typescript
// Server Action pattern matching project conventions
'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function upsertResidualRate(data: {
  brandId: string
  carModelId: string
  year: number
  rate: number
}) {
  const user = await getCurrentUser()
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized')

  await prisma.residualValueRate.upsert({
    where: {
      brandId_carModelId_year: {
        brandId: data.brandId,
        carModelId: data.carModelId,
        year: data.year,
      },
    },
    update: { rate: data.rate },
    create: data,
  })

  revalidatePath('/admin/residual-values')
}
```

### Anti-Patterns to Avoid
- **Server-side calculation for interactive UI:** Calculations are simple math -- doing them server-side adds unnecessary latency to slider interactions
- **Storing calculated monthly payments in DB:** The vehicle card estimate should be computed at render time from `vehicle.price`, not stored in `monthlyRental`/`monthlyLease` fields (those are for actual contract values)
- **Complex PMT formulas for MVP:** Adding compound interest makes the calculator harder to verify and debug without adding demo value
- **Separate components for standalone vs detail page:** Use one shared component with optional vehicle prop

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slider UI | Custom range input | Existing `Slider` component (base-ui) | Already styled and working |
| Currency formatting | Manual number formatting | `formatKRW()` from `src/lib/utils/format.ts` | Handles Korean Won format correctly |
| Vehicle brand/model selection | Custom cascade dropdowns | Existing `CascadeSelect` component | Already handles Brand -> Model -> Generation flow |
| Admin route protection | Custom middleware check | Existing admin layout auth pattern | Already established in `src/app/admin/layout.tsx` |

**Key insight:** This phase heavily reuses existing UI components and patterns. The new work is primarily the calculation logic and the comparison layout.

## Common Pitfalls

### Pitfall 1: Slider Step Values Not Aligned
**What goes wrong:** Slider produces values between steps (e.g., 13 months instead of only 12, 24, 36...)
**Why it happens:** base-ui Slider uses continuous values by default
**How to avoid:** Use the `step` prop on Slider. For period: discrete values with `step` and `min/max`. For deposit: use step increments (e.g., 100만원 steps)
**Warning signs:** Console shows non-standard month values

### Pitfall 2: Division by Zero
**What goes wrong:** Calculator crashes when period is 0 or vehicle price is 0
**Why it happens:** Slider min not properly enforced or edge case not handled
**How to avoid:** Validate inputs before calculation; minimum period = 12 months; guard against zero price
**Warning signs:** NaN or Infinity in displayed values

### Pitfall 3: Decimal Precision in Residual Rate
**What goes wrong:** Residual rate stored as Decimal in Prisma but used as number in JS
**Why it happens:** Prisma `Decimal` type returns `Prisma.Decimal` object, not `number`
**How to avoid:** Convert with `.toNumber()` when reading from DB: `rate.rate.toNumber()`
**Warning signs:** `[object Object]` displayed instead of number, or type errors

### Pitfall 4: Vehicle Card Estimate vs Actual Pricing
**What goes wrong:** Monthly estimate on card implies a fixed price, leading to user confusion
**Why it happens:** Estimate uses default assumptions (36mo, 0 deposit) but user expects exact price
**How to avoid:** Use "~" prefix and "부터" suffix: "렌탈 월 ~32만원부터". Add footnote explaining default assumptions
**Warning signs:** User complaints about price mismatch

### Pitfall 5: Admin Sidebar Already Has the Menu Item
**What goes wrong:** Duplicate menu item added
**Why it happens:** Admin sidebar already includes `{ href: '/admin/residual-value', label: '잔존가치 관리', icon: Calculator }`
**How to avoid:** Check existing code -- the nav item exists, only need the actual page at `/admin/residual-value/page.tsx` (note: singular, not plural "residual-values")
**Warning signs:** Two identical menu items in sidebar

### Pitfall 6: base-ui Slider onValueChange Type
**What goes wrong:** Type error when reading slider value
**Why it happens:** base-ui Slider passes `number | number[]` to onValueChange
**How to avoid:** Use `Array.isArray()` guard as established in Phase 5: `const val = Array.isArray(v) ? v[0] : v`
**Warning signs:** TypeScript compilation errors

## Code Examples

### Formatting for Calculator Display
```typescript
// Reuse existing formatKRW
import { formatKRW } from '@/lib/utils/format'

// "월 320,000원"
formatKRW(320000, { monthly: true })

// "3,200,000원"
formatKRW(3200000)

// New helper needed: format in 만원 units for large amounts
// "렌탈 월 ~32만원부터"
function formatEstimate(monthlyAmount: number): string {
  const man = Math.round(monthlyAmount / 10000)
  return `렌탈 월 ~${man}만원부터`
}
```

### Residual Rate Lookup with Fallback
```typescript
// Fetch residual rate for a specific vehicle
async function getResidualRate(
  brandId: string,
  carModelId: string,
  year: number
): Promise<number | null> {
  const rate = await prisma.residualValueRate.findUnique({
    where: {
      brandId_carModelId_year: { brandId, carModelId, year },
    },
  })
  return rate ? rate.rate.toNumber() : null
}

// Fallback: use a default rate (e.g., 0.40 = 40%) when no specific rate exists
const DEFAULT_RESIDUAL_RATE = 0.40
```

### Vehicle Card Monthly Estimate Integration
```typescript
// In vehicle-card.tsx, add below the price line:
<p className="mt-1 text-xs text-muted-foreground">
  {formatEstimate(estimateMonthlyRental(vehicle.price))}
</p>
```

### Admin Residual Value Table Query
```typescript
// Admin page: fetch rates with brand/model names
const rates = await prisma.residualValueRate.findMany({
  where: brandId ? { brandId } : undefined,
  include: {
    brand: { select: { name: true } },
    carModel: { select: { name: true } },
  },
  orderBy: [{ brand: { name: 'asc' } }, { carModel: { name: 'asc' } }, { year: 'desc' }],
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-rendered price tables | Interactive client-side calculators with sliders | Standard since 2020+ | Users expect real-time feedback |
| Complex PMT financial formulas | Simplified linear for demos, complex for production | N/A | Keep simple for MVP |
| Separate mobile calculator page | Responsive single-page with column stacking | CSS Grid/Flexbox | One component serves all breakpoints |

**Note on formula complexity:** Korean auto lease/rental calculators (Danawa, KB Capital, BMW Korea) use full PMT formulas with interest rates. For this demo/MVP, a simplified linear formula (price - deposit - residual) / months is appropriate and matches the CONTEXT.md guidance. The formula can be upgraded to include interest in v2.

## Open Questions

1. **Residual rate data seeding**
   - What we know: Admin can add rates manually via the table UI
   - What's unclear: Whether to seed sample data for demo purposes
   - Recommendation: Seed 5-10 sample rates for common brands/models to make the demo immediately functional

2. **Vehicle price = 0 or null edge case**
   - What we know: `Vehicle.price` is `Int` (required) in schema
   - What's unclear: Whether price=0 vehicles exist in practice
   - Recommendation: Guard with minimum price check; hide calculator for price <= 0

3. **Admin sidebar route path**
   - What we know: Sidebar already has `/admin/residual-value` (singular)
   - What's unclear: N/A -- just use the existing path
   - Recommendation: Create page at `src/app/admin/residual-value/page.tsx` matching existing nav

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (latest) with happy-dom |
| Config file | `vitest.config.mts` |
| Quick run command | `yarn test src/lib/finance/calculate.test.ts` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRIC-01 | Rental monthly payment calculation correct | unit | `yarn test src/lib/finance/calculate.test.ts -x` | Wave 0 |
| PRIC-01 | Lease monthly payment calculation correct | unit | `yarn test src/lib/finance/calculate.test.ts -x` | Wave 0 |
| PRIC-01 | Edge cases: zero deposit, max period, min period | unit | `yarn test src/lib/finance/calculate.test.ts -x` | Wave 0 |
| PRIC-02 | Residual rate CRUD (create, update, delete) | unit | `yarn test src/features/pricing/actions/residual-rate.test.ts -x` | Wave 0 |
| PRIC-02 | Residual rate lookup with fallback | unit | `yarn test src/lib/finance/calculate.test.ts -x` | Wave 0 |
| SRCH-04 | Comparison produces correct rental vs lease side-by-side | unit | `yarn test src/lib/finance/calculate.test.ts -x` | Wave 0 |
| SRCH-04 | Estimate function for vehicle cards | unit | `yarn test src/lib/finance/calculate.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test src/lib/finance/calculate.test.ts -x`
- **Per wave merge:** `yarn test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/finance/calculate.test.ts` -- covers PRIC-01, SRCH-04 core calculations
- [ ] `src/features/pricing/actions/residual-rate.test.ts` -- covers PRIC-02 CRUD actions

## Sources

### Primary (HIGH confidence)
- Project codebase inspection: `prisma/schema.prisma` (ResidualValueRate model), existing components (Slider, CascadeSelect, VehicleCard, PublicVehicleDetail, AdminSidebar)
- Project CONTEXT.md: locked decisions and discretion areas

### Secondary (MEDIUM confidence)
- [Korean auto lease/rental calculation guide (Carding)](https://carding.co.kr/2023/12/14/%EC%9E%90%EB%8F%99%EC%B0%A8%EB%A6%AC%EC%8A%A4-%EC%9E%A5%EA%B8%B0%EB%A0%8C%ED%84%B0%EC%B9%B4-%EC%9D%B4%EC%9E%90%EA%B3%84%EC%82%B0-%EB%B0%A9%EB%B2%95/) - formula structure verified
- [Danawa lease/rent guide](https://auto.danawa.com/leaserent/?Work=leaserentGuide) - industry standard reference
- [BankSalad lease vs rent comparison](https://www.banksalad.com/articles/%EC%9E%90%EC%82%B0%EA%B4%80%EB%A6%AC-%EC%9E%90%EB%8F%99%EC%B0%A8%EB%A0%8C%ED%8A%B8-%EB%A6%AC%EC%8A%A4%EB%A0%8C%ED%8A%B8%EC%B0%A8%EC%9D%B4) - rental vs lease differences for educational content

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in project
- Architecture: HIGH - follows established project patterns (features/, Server Actions, force-dynamic admin)
- Pitfalls: HIGH - verified against actual codebase (admin sidebar already has nav item, Decimal type in Prisma, Slider type guards)
- Calculation formulas: MEDIUM - simplified for MVP per CONTEXT.md guidance; verified against Korean financial sources

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable -- no fast-moving dependencies)
