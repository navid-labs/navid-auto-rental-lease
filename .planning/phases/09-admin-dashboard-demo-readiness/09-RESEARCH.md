# Phase 9: Admin Dashboard & Demo Readiness - Research

**Researched:** 2026-03-10
**Domain:** Admin dashboard (charts, CRUD polish), demo seed data, UX polish (toast, skeleton, format audit)
**Confidence:** HIGH

## Summary

Phase 9 completes the admin dashboard and makes the entire platform demo-ready for investor presentations. The CONTEXT.md reveals that much of ADMN-02 (approval queue) and ADMN-04 (residual value table) are already implemented in earlier phases. The remaining work centers on: (1) building the stats dashboard with recharts, (2) completing admin CRUD for vehicles/contracts/users with inline edit and soft delete, (3) expanding the seed script for full demo data including customer accounts and contracts in various states, (4) replacing all alert() calls with sonner toasts, (5) adding skeleton loading screens and empty states across all pages, (6) auditing KRW/date formatting, and (7) writing a DEMO.md walkthrough checklist.

The existing codebase has 5 files with alert() calls (9 total invocations) that need sonner migration. The dashboard page is currently a stub. The seed script already creates brands/models/trims/vehicles but lacks customer profiles and contracts. No Skeleton UI component exists yet -- it needs to be added via shadcn.

**Primary recommendation:** Use recharts for charts (client component islands within server-rendered dashboard), sonner for toasts (global Toaster in root layout), and expand the existing seed.ts to create full lifecycle demo data.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Stats Dashboard: Full analytics with recharts -- summary cards + bar/line charts
- Actionable cards: clicking pending count navigates to relevant admin page
- Recent activity feed: last 5 contracts/vehicles
- Data refresh: page load only (no Realtime)
- Admin CRUD: Full inline edit + soft delete (HIDDEN status for vehicles)
- Vehicle edit: Sheet (slide-out panel) on table row click
- Contract edit: state transitions only (approve/reject/cancel), no amount/period edit
- Demo seed: Full lifecycle coverage -- all ContractStatus states represented
- Demo accounts: Fixed emails (admin@navid.kr, dealer1@navid.kr, customer1@navid.kr etc.) with shared password
- 3 dealer accounts, 5 customer accounts
- Loading: Skeleton screens
- Empty states: Icon + message + CTA button
- Toast: sonner -- replace ALL existing alert() calls
- KRW/date format: Full audit using formatKRW() and formatDate()
- E2E demo flow: Manual DEMO.md checklist + Playwright E2E tests
- Mobile admin: Full mobile optimization with bottom nav, card stacks for dashboard

### Claude's Discretion
- Dashboard layout (top cards + bottom charts vs mixed grid)
- Chart period range (30-day fixed vs period selector)
- User deactivation method (isActive flag vs role downgrade)
- Vehicle image seed strategy (placeholder vs local SVG)
- Mobile table pattern per page (card list vs horizontal scroll)
- Demo vehicle mix composition

### Deferred Ideas (OUT OF SCOPE)
- Admin audit log full history page -- v2
- Admin notification center -- v2 (UIEX-V2-02)
- Admin contract amount/period editing -- v2
- Dashboard realtime updates (Supabase Realtime) -- v2
- Admin export (CSV/Excel) -- v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMN-01 | Admin can view/edit/delete all vehicles, contracts, users | Existing admin pages need Sheet-based edit for vehicles, soft delete (HIDDEN), user deactivation. Contract edit limited to status transitions. |
| ADMN-02 | Dealer vehicle approval queue (approve/reject with reason) | Already implemented in Phase 4 (ApprovalQueueTable). Verify still functional, add sonner toast. |
| ADMN-03 | Stats dashboard (registered vehicles, active contracts, user count) | Build with recharts. Server-side data aggregation via Prisma groupBy/count, pass to client chart components. |
| ADMN-04 | Residual value rate table management | Already implemented in Phase 6 (ResidualValueTable + ResidualValueForm). Verify still functional, add sonner toast. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.x | Dashboard charts (bar, line, area) | shadcn/ui officially recommends recharts; SSR-compatible with 'use client' islands |
| sonner | 2.0.x | Toast notifications | shadcn/ui recommended toast library; minimal API, supports promise toasts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Skeleton | (built-in) | Loading skeleton screens | Add via `shadcn add skeleton` -- animated placeholder blocks |
| lucide-react | 0.577.x | Icons for empty states, stat cards | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | chart.js / visx | recharts is React-native, declarative, shadcn-blessed |
| sonner | react-hot-toast | sonner has better defaults, promise support, and shadcn integration |

**Installation:**
```bash
yarn add recharts sonner
npx shadcn@latest add skeleton
```

## Architecture Patterns

### Dashboard Data Flow
```
Server Component (page.tsx)
  ├── Prisma aggregation queries (count, groupBy)
  ├── Pass serialized data as props
  └── Client Component islands
       ├── StatsCards (clickable → navigate)
       ├── ChartSection (recharts BarChart/LineChart)
       └── RecentActivityFeed (last 5 items)
```

### Recommended Component Structure
```
src/
├── app/admin/dashboard/
│   ├── page.tsx                    # Server Component -- data fetching
│   ├── stats-cards.tsx             # Client -- clickable stat cards
│   ├── chart-section.tsx           # Client -- recharts charts
│   └── recent-activity.tsx         # Client or Server -- activity feed
├── features/admin/
│   ├── components/
│   │   ├── vehicle-edit-sheet.tsx   # Sheet slide-out for vehicle editing
│   │   └── user-deactivate-button.tsx
│   └── actions/
│       ├── get-dashboard-stats.ts  # Server action for stats aggregation
│       ├── update-vehicle-admin.ts # Admin vehicle edit action
│       └── deactivate-user.ts      # User deactivation action
└── components/ui/
    └── skeleton.tsx                # shadcn Skeleton component (new)
```

### Pattern 1: Recharts in Next.js App Router
**What:** Charts must be client components; data fetching stays server-side
**When to use:** Any recharts chart in App Router
**Example:**
```typescript
// app/admin/dashboard/chart-section.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type ChartData = { name: string; count: number }[]

export function ChartSection({ data }: { data: ChartData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Pattern 2: Sonner Toast Replacement
**What:** Replace all alert() calls with sonner toast
**When to use:** Every error/success feedback in the app
**Example:**
```typescript
// Before:
alert(result.error)

// After:
import { toast } from 'sonner'
toast.error(result.error)

// In root layout (app/layout.tsx):
import { Toaster } from 'sonner'
// Add <Toaster position="top-right" richColors /> inside body
```

### Pattern 3: Sheet-based Vehicle Edit
**What:** Click table row -> open Sheet (slide-out panel) with edit form
**When to use:** Admin vehicle editing (preserves table context)
**Example:**
```typescript
// Sheet already exists as src/components/ui/sheet.tsx
// Open Sheet on row click, populate with vehicle data, submit via Server Action
```

### Pattern 4: Skeleton Loading
**What:** Content-shaped animated placeholder blocks during data loading
**When to use:** Every page that fetches data server-side (wrap in Suspense)
**Example:**
```typescript
import { Skeleton } from '@/components/ui/skeleton'

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  )
}

// In page.tsx:
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardContent />
</Suspense>
```

### Anti-Patterns to Avoid
- **Fetching chart data client-side:** Keep Prisma queries in Server Components, pass serialized data to chart client components
- **Global recharts import:** Use dynamic import (`next/dynamic`) for recharts components to reduce initial bundle if needed (100KB+)
- **Mixing alert() and toast():** After migration, ensure zero alert() calls remain in production code

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast with useState/portal | sonner | Animations, stacking, swipe-dismiss, auto-close, accessible |
| Charts | Canvas/SVG from scratch | recharts | Responsive, animated, tooltip/legend handling, React-native |
| Skeleton loading | Custom shimmer CSS | shadcn Skeleton component | Consistent with design system, handles animation |
| Number formatting | Manual toLocaleString | formatKRW() (already exists) | Consistent "월 450,000원" format across app |
| Date formatting | Manual date string building | formatDate() (already exists) | Consistent "2026년 3월 9일" format across app |

## Common Pitfalls

### Pitfall 1: Recharts SSR Hydration Mismatch
**What goes wrong:** Recharts uses browser APIs (window/document) and causes hydration errors if rendered server-side
**Why it happens:** Next.js Server Components try to render on server
**How to avoid:** Always mark recharts host components with 'use client'; optionally wrap with `next/dynamic({ ssr: false })` for safety
**Warning signs:** "Text content does not match" or "window is not defined" errors

### Pitfall 2: Seed Script Supabase Auth Sync
**What goes wrong:** Seed script creates Profile records directly in DB but no corresponding Supabase Auth user exists, so login fails
**Why it happens:** Profile table links to Supabase Auth via UUID, seed bypasses auth
**How to avoid:** Use Supabase Admin API (`supabase.auth.admin.createUser()`) in seed script, or document that demo accounts must be created via signup flow first, then seed maps to those UUIDs
**Warning signs:** Seed data visible in admin but demo accounts can't log in

### Pitfall 3: Incomplete alert() Migration
**What goes wrong:** Some alert() calls missed during migration, breaking demo polish
**Why it happens:** alert() scattered across 5 files with 9 invocations
**How to avoid:** Grep for `alert(` after migration to verify zero remaining. Files to check:
  - `residual-value-table.tsx` (3 calls)
  - `residual-value-form.tsx` (1 call)
  - `admin-contract-list.tsx` (2 calls)
  - `approval-queue-table.tsx` (1 call)
  - `vehicle-table.tsx` (2 calls)
**Warning signs:** Browser native alert popup during demo

### Pitfall 4: Missing Suspense Boundaries for Skeleton Loading
**What goes wrong:** Skeleton loading never shows because page renders fully server-side without streaming
**Why it happens:** Next.js App Router needs explicit `<Suspense>` boundaries to stream
**How to avoid:** Wrap data-fetching sections in `<Suspense fallback={<Skeleton />}>` and extract data-fetching into async child components
**Warning signs:** Page appears blank then fully renders (no progressive loading)

### Pitfall 5: Demo Seed Data Isolation
**What goes wrong:** Seed script deletes existing production data or conflicts with it
**Why it happens:** Using deleteMany/truncate without environment checks
**How to avoid:** Use upsert for idempotent seeding; use fixed UUIDs for demo accounts; add environment guard
**Warning signs:** Running seed on staging wipes real data

### Pitfall 6: Recharts Bundle Size
**What goes wrong:** recharts adds ~100KB+ to client bundle
**Why it happens:** Full library imported even if only BarChart used
**How to avoid:** Use `next/dynamic` with `{ ssr: false }` for the chart section component. recharts 3.x supports tree-shaking with named imports.
**Warning signs:** Lighthouse performance score drops

## Code Examples

### Dashboard Stats Query (Prisma aggregation)
```typescript
// Server-side data fetching for dashboard
const [vehicleCount, contractCounts, userCount, pendingApprovals, recentContracts] = await Promise.all([
  prisma.vehicle.count({ where: { status: { not: 'HIDDEN' } } }),
  Promise.all([
    prisma.rentalContract.groupBy({ by: ['status'], _count: true }),
    prisma.leaseContract.groupBy({ by: ['status'], _count: true }),
  ]),
  prisma.profile.count(),
  prisma.vehicle.count({ where: { approvalStatus: 'PENDING' } }),
  // Recent activity: last 5 contracts
  Promise.all([
    prisma.rentalContract.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { vehicle: { include: { trim: { include: { generation: { include: { carModel: true } } } } } }, customer: { select: { name: true } } } }),
    prisma.leaseContract.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { vehicle: { include: { trim: { include: { generation: { include: { carModel: true } } } } } }, customer: { select: { name: true } } } }),
  ]),
])
```

### Sonner Setup in Root Layout
```typescript
// app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
```

### Soft Delete Vehicle (HIDDEN status)
```typescript
// Server action
async function softDeleteVehicle(vehicleId: string) {
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: 'HIDDEN' },
  })
}
```

### Demo Seed Data Structure (Contracts)
```typescript
// Create contracts in various states for demo
const contractStatuses: ContractStatus[] = [
  'DRAFT', 'PENDING_EKYC', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED'
]
// For each status, create 1-2 rental + lease contracts
// Use fixed vehicle IDs from seed, fixed customer IDs
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| alert() for error feedback | sonner toast notifications | 2024+ | Professional UX, no blocking popups |
| Loading spinners | Skeleton screens with Suspense | React 18+ | Perceived performance improvement |
| recharts 2.x | recharts 3.x | 2024 | Better tree-shaking, ES modules |
| shadcn/ui Radix toast | sonner (recommended by shadcn) | 2024 | Simpler API, better animations |

## Open Questions

1. **Demo Account Auth Sync**
   - What we know: Seed script can create Profile records directly, but Supabase Auth users need to exist for login
   - What's unclear: Whether to use Supabase Admin API in seed or require manual signup + UUID mapping
   - Recommendation: Use Supabase Admin API (`supabase.auth.admin.createUser()`) in seed for complete demo setup. Requires service_role key in seed environment.

2. **Mobile Bottom Nav for Admin**
   - What we know: CONTEXT.md specifies "bottom nav, card stacks" for mobile admin
   - What's unclear: Whether to add a separate bottom nav component or enhance the existing Sheet sidebar
   - Recommendation: Add a fixed bottom nav bar (visible on md:hidden) with icons for the 5 admin sections, replacing the hamburger menu pattern for quicker access.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.x + happy-dom |
| Config file | vitest.config.mts |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMN-01 | Admin vehicle soft delete (HIDDEN) | unit | `yarn test src/features/admin/actions/soft-delete-vehicle.test.ts -t "soft delete"` | No -- Wave 0 |
| ADMN-01 | Admin user deactivation | unit | `yarn test src/features/admin/actions/deactivate-user.test.ts` | No -- Wave 0 |
| ADMN-03 | Dashboard stats aggregation | unit | `yarn test src/features/admin/actions/get-dashboard-stats.test.ts` | No -- Wave 0 |
| ADMN-02 | Approval queue (existing) | unit | `yarn test src/features/vehicles/actions/approve-vehicle.test.ts` | Yes |
| ADMN-04 | Residual value CRUD (existing) | manual | Existing functionality verified in Phase 6 | N/A |
| E2E | Full demo flow | e2e | Playwright test (new) | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test`
- **Per wave merge:** `yarn test && yarn type-check && yarn build`
- **Phase gate:** Full suite green + build success + manual demo walkthrough

### Wave 0 Gaps
- [ ] `src/features/admin/actions/soft-delete-vehicle.test.ts` -- covers ADMN-01 vehicle delete
- [ ] `src/features/admin/actions/deactivate-user.test.ts` -- covers ADMN-01 user management
- [ ] `src/features/admin/actions/get-dashboard-stats.test.ts` -- covers ADMN-03
- [ ] Skeleton component: `npx shadcn@latest add skeleton`
- [ ] New dependencies: `yarn add recharts sonner`

## Sources

### Primary (HIGH confidence)
- Project codebase analysis -- existing admin pages, seed script, format utilities, alert() locations
- npm registry -- recharts 3.8.0, sonner 2.0.7 confirmed current versions
- CONTEXT.md -- locked decisions from user discussion session

### Secondary (MEDIUM confidence)
- [recharts npm page](https://www.npmjs.com/package/recharts) -- version and compatibility
- [sonner GitHub](https://github.com/emilkowalski/sonner) -- API and setup patterns
- [shadcn/ui sonner integration](https://www.shadcn.io/ui/sonner) -- official shadcn recommendation
- [Next.js App Router docs](https://nextjs.org/docs/app) -- Suspense streaming patterns
- [Recharts + Next.js setup guide](https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html) -- client component pattern

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- recharts and sonner are well-established, shadcn-recommended
- Architecture: HIGH -- patterns follow existing codebase conventions (Server Component + client islands)
- Pitfalls: HIGH -- all identified from direct codebase analysis (alert locations, seed structure, schema)
- Demo seed: MEDIUM -- Supabase Auth integration in seed needs validation at implementation time

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries, project-specific)
