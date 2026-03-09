# Architecture Research

**Domain:** Used car rental/lease marketplace (B2B2C hybrid)
**Researched:** 2026-03-09
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  Public    │  │  Customer │  │  Dealer   │  │   Admin     │  │
│  │  Pages     │  │  Portal   │  │  Portal   │  │  Dashboard  │  │
│  │ (SSR/SSG) │  │  (Auth)   │  │  (Auth)   │  │   (Auth)    │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘  │
│        │              │              │               │          │
├────────┴──────────────┴──────────────┴───────────────┴──────────┤
│                     Application Layer                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │  Server     │  │  Route       │  │   Middleware         │    │
│  │  Actions    │  │  Handlers    │  │  (Auth + Role Guard) │    │
│  │ (Mutations) │  │ (Ext. API)   │  │                      │    │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘    │
│         │               │                      │                │
├─────────┴───────────────┴──────────────────────┴────────────────┤
│                      Data Layer                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐    │
│  │  Supabase     │  │  Supabase     │  │   Supabase       │    │
│  │  Database     │  │  Auth         │  │   Storage        │    │
│  │  (PostgreSQL  │  │  (JWT +       │  │   (Vehicle       │    │
│  │   + RLS)      │  │   Roles)      │  │    Images)       │    │
│  └───────────────┘  └───────────────┘  └──────────────────┘    │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐                          │
│  │  Supabase     │  │  External     │                          │
│  │  Realtime     │  │  APIs         │                          │
│  │  (Status      │  │  (License     │                          │
│  │   Updates)    │  │   Plate API)  │                          │
│  └───────────────┘  └───────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Public Pages | Vehicle search, listing, detail view. SEO-critical. | Next.js SSR/SSG pages with Server Components |
| Customer Portal | My contracts, profile, eKYC flow, contract signing | Protected routes with auth middleware |
| Dealer Portal | Vehicle CRUD, inventory management, contract review | Role-gated routes (dealer role check) |
| Admin Dashboard | All CRUD, user management, approval workflows, stats | Role-gated routes (admin role check) |
| Server Actions | All data mutations (create/update/delete) | `'use server'` functions, Zod validation |
| Route Handlers | External webhook endpoints, license plate API proxy | `app/api/` route handlers |
| Middleware | Session refresh, role-based route protection | `middleware.ts` with Supabase SSR |
| Supabase DB + RLS | Data storage, tenant isolation, query filtering | PostgreSQL with RLS policies per role |
| Supabase Auth | User sessions, JWT tokens, role claims | Email/password auth with custom claims |
| Supabase Storage | Vehicle photos, contract PDFs, ID documents | Storage buckets with RLS policies |
| Supabase Realtime | Vehicle status changes pushed to connected clients | `postgres_changes` subscriptions |
| External APIs | License plate lookup (v1), eKYC/e-sign (v2) | Route handlers as proxy to external services |

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (public)/               # Route group: public pages (no auth)
│   │   ├── page.tsx            # Homepage / vehicle search
│   │   ├── vehicles/
│   │   │   ├── page.tsx        # Search results with filters
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Vehicle detail
│   │   └── layout.tsx          # Public layout (header, footer)
│   ├── (auth)/                 # Route group: auth pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (customer)/             # Route group: customer portal
│   │   ├── my/
│   │   │   ├── contracts/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── layout.tsx
│   │   ├── contract/
│   │   │   └── [vehicleId]/
│   │   │       ├── page.tsx    # Contract application flow
│   │   │       └── ekyc/page.tsx
│   │   └── layout.tsx          # Customer layout with sidebar
│   ├── (dealer)/               # Route group: dealer portal
│   │   ├── inventory/
│   │   │   ├── page.tsx        # Dealer's vehicles list
│   │   │   ├── new/page.tsx    # Add vehicle
│   │   │   └── [id]/edit/page.tsx
│   │   ├── contracts/page.tsx  # Contracts on dealer vehicles
│   │   └── layout.tsx
│   ├── (admin)/                # Route group: admin dashboard
│   │   ├── dashboard/page.tsx  # Stats overview
│   │   ├── vehicles/page.tsx   # All vehicles CRUD
│   │   ├── users/page.tsx      # User management
│   │   ├── contracts/page.tsx  # All contracts
│   │   ├── approvals/page.tsx  # Dealer vehicle approvals
│   │   └── layout.tsx
│   ├── api/                    # Route handlers (external-facing)
│   │   ├── license-plate/route.ts  # Proxy to license plate API
│   │   └── webhooks/route.ts       # Future webhook endpoints
│   ├── layout.tsx              # Root layout
│   └── error.tsx               # Global error boundary
├── components/                 # Shared UI components
│   ├── ui/                     # shadcn/ui primitives
│   ├── vehicles/               # Vehicle-specific components
│   │   ├── vehicle-card.tsx
│   │   ├── vehicle-filters.tsx
│   │   ├── vehicle-gallery.tsx
│   │   └── vehicle-comparison.tsx
│   ├── contracts/              # Contract flow components
│   │   ├── contract-form.tsx
│   │   ├── lease-calculator.tsx
│   │   └── ekyc-steps.tsx
│   ├── dashboard/              # Admin dashboard widgets
│   │   ├── stats-card.tsx
│   │   └── charts.tsx
│   └── layout/                 # Layout components
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── footer.tsx
├── lib/                        # Core business logic
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server Component client
│   │   ├── admin.ts            # Service role client (mutations)
│   │   └── middleware.ts       # Session refresh helper
│   ├── actions/                # Server Actions (all mutations)
│   │   ├── vehicles.ts         # Vehicle CRUD actions
│   │   ├── contracts.ts        # Contract lifecycle actions
│   │   ├── users.ts            # User management actions
│   │   └── auth.ts             # Auth actions (signup, login)
│   ├── queries/                # Data fetching functions
│   │   ├── vehicles.ts         # Vehicle queries
│   │   ├── contracts.ts        # Contract queries
│   │   └── stats.ts            # Dashboard statistics
│   ├── validations/            # Zod schemas
│   │   ├── vehicle.ts
│   │   ├── contract.ts
│   │   └── user.ts
│   └── utils/                  # Pure utility functions
│       ├── residual-value.ts   # Lease residual value calculator
│       ├── format.ts           # Korean number/date formatting
│       └── constants.ts        # Enums, status maps
├── hooks/                      # Client-side React hooks
│   ├── use-realtime-status.ts  # Vehicle status subscriptions
│   └── use-filters.ts         # Search filter state management
├── types/                      # TypeScript types
│   ├── database.ts             # Supabase generated types
│   ├── vehicles.ts
│   └── contracts.ts
├── middleware.ts               # Next.js middleware (auth guard)
└── supabase/
    ├── migrations/             # SQL migration files
    │   ├── 001_initial.sql
    │   ├── 002_rls_policies.sql
    │   └── 003_functions.sql
    └── seed.sql                # Development seed data
```

### Structure Rationale

- **`app/` route groups `(public)`, `(customer)`, `(dealer)`, `(admin)`:** Cleanly separates four distinct user experiences. Each group gets its own layout. Route groups do not affect URL structure, keeping URLs clean.
- **`lib/actions/` for Server Actions:** All mutations centralized here, not scattered across page files. Every action validates input with Zod, checks permissions, then mutates via Supabase service role client.
- **`lib/queries/` for data fetching:** Reusable query functions called from Server Components. Uses the per-request Supabase server client so RLS applies automatically.
- **`lib/supabase/` with three clients:** Browser client for realtime subscriptions. Server client for SSR reads (RLS-scoped). Admin client (service_role) for trusted mutations where business logic validation happens in the Server Action before the DB call.
- **`components/` by domain:** Vehicle, contract, and dashboard components grouped by feature, not by type (no `components/buttons/` folder).

## Architectural Patterns

### Pattern 1: Server Component Reads + Server Action Writes

**What:** All data reading happens in Server Components using the RLS-scoped Supabase server client. All writes go through Server Actions using the service_role client after explicit validation.
**When to use:** Every data operation in the app.
**Trade-offs:** Cleaner separation of concerns and better security. Slightly more boilerplate than doing everything client-side, but prevents RLS bypass issues on writes.

```typescript
// lib/queries/vehicles.ts — Read (Server Component)
import { createServerClient } from '@/lib/supabase/server'

export async function getVehicles(filters: VehicleFilters) {
  const supabase = await createServerClient()
  const query = supabase.from('vehicles').select('*, dealer:profiles(*)')
    .eq('status', 'approved')
  // RLS automatically scopes results
  return query
}

// lib/actions/vehicles.ts — Write (Server Action)
'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { vehicleSchema } from '@/lib/validations/vehicle'

export async function createVehicle(formData: FormData) {
  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  // Check user role explicitly
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('vehicles')
    .insert(parsed.data)
    .select()
    .single()

  return error ? { error: error.message } : { data }
}
```

### Pattern 2: Role-Based Access via Middleware + RLS

**What:** Two-layer authorization. Middleware blocks unauthorized route access at the edge. RLS policies enforce data-level isolation in PostgreSQL.
**When to use:** Every authenticated route and every database query.
**Trade-offs:** Defense-in-depth security. Middleware catches unauthorized navigation early (fast rejection). RLS ensures even if middleware is bypassed, data is still protected.

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  if (path.startsWith('/admin') && user?.user_metadata?.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (path.startsWith('/dealer') && user?.user_metadata?.role !== 'dealer') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  // Customer routes: any authenticated user
  if (path.startsWith('/my') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

```sql
-- RLS policy: dealers see only their own vehicles
CREATE POLICY "Dealers manage own vehicles" ON vehicles
  FOR ALL
  USING (
    owner_id = auth.uid()
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

### Pattern 3: Contract State Machine

**What:** Contracts follow a strict state machine: `draft` -> `pending_ekyc` -> `ekyc_verified` -> `pending_approval` -> `approved` -> `active` -> `completed`/`cancelled`. Transitions are enforced in Server Actions, not in the database.
**When to use:** All contract lifecycle operations.
**Trade-offs:** Explicit transitions prevent invalid state changes. Business rules (who can approve, when can cancel) are codified in one place. Slightly more code than just updating a status field, but prevents data corruption.

```typescript
const CONTRACT_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  draft: ['pending_ekyc', 'cancelled'],
  pending_ekyc: ['ekyc_verified', 'cancelled'],
  ekyc_verified: ['pending_approval'],
  pending_approval: ['approved', 'rejected'],
  approved: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: [],
}

export function canTransition(from: ContractStatus, to: ContractStatus): boolean {
  return CONTRACT_TRANSITIONS[from]?.includes(to) ?? false
}
```

### Pattern 4: Optimistic UI with Realtime Fallback

**What:** For vehicle status changes (available -> reserved -> rented), update the UI optimistically on user action, then reconcile with Supabase Realtime subscription. If the server rejects (e.g., another user reserved first), the Realtime event corrects the UI.
**When to use:** Vehicle status display on search/listing pages.
**Trade-offs:** Snappy UX for the user performing the action. Other users see near-instant updates via Realtime. Adds complexity for conflict handling.

```typescript
// hooks/use-realtime-status.ts
'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export function useRealtimeVehicleStatus(vehicleId: string, initialStatus: string) {
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`vehicle-${vehicleId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'vehicles',
        filter: `id=eq.${vehicleId}`,
      }, (payload) => {
        setStatus(payload.new.status)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [vehicleId])

  return status
}
```

## Data Flow

### Vehicle Search Flow (Public, SSR)

```
[User enters search/filters]
    |
[Next.js Server Component renders]
    |
[lib/queries/vehicles.ts] --> [Supabase Server Client] --> [PostgreSQL + RLS]
    |                                                           |
[Server returns HTML with vehicle list]  <--  [Query results]
    |
[Client hydrates, enables filter interactions]
    |
[URL search params update] --> [Server re-renders with new filters]
```

### Contract Application Flow

```
[Customer clicks "Apply for Lease"]
    |
[Contract form page (Server Component)]
    |
[Customer fills form + selects terms]
    |
[Server Action: createContract]
    |-> Zod validates input
    |-> Checks vehicle availability
    |-> Creates contract (status: draft)
    |-> Returns contract ID
    |
[Redirect to eKYC flow]
    |
[Mock eKYC steps (Client Components)]
    |-> ID upload UI
    |-> Face verification UI (mock)
    |
[Server Action: completeEkyc]
    |-> State machine: draft -> pending_ekyc -> ekyc_verified
    |-> Updates contract status
    |
[Server Action: submitForApproval]
    |-> State machine: ekyc_verified -> pending_approval
    |
[Admin reviews and approves]
    |
[Server Action: approveContract]
    |-> State machine: pending_approval -> approved
    |-> Generates PDF contract
    |-> Stores in Supabase Storage
    |-> Updates vehicle status to 'reserved'
    |-> Realtime broadcasts status change
```

### Dealer Vehicle Registration Flow

```
[Dealer enters license plate number]
    |
[Route Handler: /api/license-plate]
    |-> Proxies to external Korean license plate API
    |-> Returns vehicle specs (make, model, year, etc.)
    |
[Form auto-populated with API data]
    |
[Dealer adds photos, price, rental/lease terms]
    |
[Server Action: registerVehicle]
    |-> Zod validates all fields
    |-> Uploads images to Supabase Storage
    |-> Creates vehicle record (status: pending_approval)
    |
[Admin sees in approval queue]
    |
[Server Action: approveVehicle]
    |-> Updates status to 'approved'
    |-> Vehicle appears in public search
```

### Key Data Flows

1. **Search/Browse:** Server-rendered with URL-based filter state. No client-side data fetching for initial load -- pure SSR for SEO and performance. Filter changes update URL params, triggering server re-render.

2. **Vehicle Status Sync:** Initial status loaded via SSR. Connected clients subscribe to Realtime `postgres_changes` for live status updates. Status changes propagate within seconds to all viewers.

3. **Contract Lifecycle:** Strictly server-side via Server Actions. Each step validates the state machine transition. PDF generation happens server-side on approval. Customer portal polls or subscribes for status updates.

4. **Image Upload:** Client uploads directly to Supabase Storage (signed URLs), then passes the storage path to a Server Action that associates the image with a vehicle record.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture is fine. Single Supabase project. No caching needed. SSR handles everything. |
| 1k-10k users | Add Redis/Vercel KV for search result caching. Consider ISR (Incremental Static Regeneration) for popular vehicle detail pages. Index all RLS-referenced columns. |
| 10k-100k users | Supabase connection pooling (Supavisor). Edge caching for vehicle search. Consider read replicas. Split Supabase Storage into CDN-backed buckets. |

### Scaling Priorities

1. **First bottleneck: Vehicle search queries.** Complex filters with joins on a growing dataset. Fix: add composite indexes on (status, make, model, year, price). Consider full-text search via Supabase's pg_trgm or move to a search index.
2. **Second bottleneck: Realtime connections.** Each vehicle detail page opens a Realtime channel. Fix: batch status updates via a single channel per listing page instead of per-vehicle channels.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Data Mutations

**What people do:** Call Supabase directly from the browser for inserts/updates, relying on RLS for validation.
**Why it's wrong:** RLS can only check row-level permissions, not business logic (e.g., "is this vehicle still available?", "has the eKYC been completed?"). Race conditions on vehicle reservations. No input sanitization.
**Do this instead:** Route all mutations through Server Actions. Validate with Zod, check business rules, then use service_role client to write.

### Anti-Pattern 2: God Layout with Global State

**What people do:** Put all providers, auth checks, and data fetching in the root layout, creating a single large context that wraps everything.
**Why it's wrong:** Root layout cannot re-render on navigation (it is static in App Router). Stale data across route transitions. Unnecessary data loading for unauthenticated pages.
**Do this instead:** Use route group layouts. Each group `(public)`, `(customer)`, `(dealer)`, `(admin)` has its own layout that loads only what that section needs.

### Anti-Pattern 3: Storing Computed Lease Values

**What people do:** Store calculated monthly payments, total cost, and residual values in the database when a lease is quoted.
**Why it's wrong:** Interest rates, residual value tables, and pricing can change. Stored calculations become stale. Disputes arise from mismatched numbers.
**Do this instead:** Store the input parameters (vehicle price, term length, mileage, rate tier). Calculate lease payments on-the-fly using `residual-value.ts`. Only persist the final approved contract terms.

### Anti-Pattern 4: Single Supabase Client Everywhere

**What people do:** Create one Supabase client and use it in Server Components, Client Components, and Server Actions.
**Why it's wrong:** Server Components need a per-request client (for proper cookie handling). Client Components need a singleton browser client. Server Actions need a service_role client for trusted writes. Mixing them causes auth context leaks and security holes.
**Do this instead:** Three separate client factories in `lib/supabase/`: `server.ts` (per-request, SSR), `client.ts` (browser singleton), `admin.ts` (service_role, mutations only).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| License Plate API | Route handler proxy (`/api/license-plate`) | v1 real integration. Rate-limit the proxy endpoint. Cache responses by plate number. |
| eKYC (CLOVA etc.) | Mock service in `lib/services/ekyc-mock.ts` | v1 mock only. Interface should match expected real API shape for easy v2 swap. |
| Electronic Signature | Mock PDF generation via `@react-pdf/renderer` or `jsPDF` | v1 generates unsigned PDF. v2 integrates real e-sign API (Modusign etc.). |
| Image CDN | Supabase Storage + Vercel Image Optimization | Transform vehicle images via `next/image` with Supabase Storage URLs. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Public Pages <-> Database | Server Component queries via RLS-scoped client | Read-only. No mutations from public pages. |
| Customer Portal <-> Contract Engine | Server Actions with state machine validation | Every transition checked against allowed states. |
| Dealer Portal <-> Vehicle Management | Server Actions with ownership validation | Dealer can only modify own vehicles. |
| Admin Dashboard <-> All Data | Server Actions with admin role check, service_role client | Full access but still validated through Server Actions. |
| Vehicle Status <-> All Portals | Supabase Realtime `postgres_changes` | One-way broadcast. Status writes only via Server Actions. |

## Suggested Build Order

Based on component dependencies, the recommended build sequence:

1. **Foundation (must be first):** Supabase project setup, DB schema + RLS policies, auth flow (signup/login), middleware, three Supabase clients, role system in profiles table.

2. **Vehicle Core (depends on foundation):** Vehicle table, dealer registration flow (CRUD), admin approval workflow, license plate API integration, Supabase Storage for images.

3. **Public Experience (depends on vehicle data):** Search/filter/listing pages (SSR), vehicle detail pages, comparison feature, responsive mobile design.

4. **Contract Engine (depends on vehicle + auth):** Contract state machine, application form, mock eKYC flow, PDF generation, Realtime status updates.

5. **Admin Dashboard (depends on all data):** Stats/analytics, user management, contract oversight, approval queues.

6. **Polish (depends on all above):** Residual value calculator refinement, edge cases in contract flow, error handling, loading states, SEO optimization.

**Rationale:** Foundation is a hard prerequisite. Vehicle data must exist before you can search or contract on it. Public search is the primary user entry point. Contract engine is the core business logic but needs vehicles to exist first. Admin dashboard aggregates everything so it naturally comes last.

## Sources

- [Supabase + Next.js Official Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Realtime: Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [Next.js App Router Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Supabase + Next.js Vercel Starter Template](https://vercel.com/templates/next.js/supabase)
- [Server Actions vs Route Handlers (MakerKit)](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers)
- [Next.js + Supabase Production Lessons](https://catjam.fi/articles/next-supabase-what-do-differently)
- [Multi-Tenant RLS on Supabase (AntStack)](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Car Rental Database Design (PostgreSQL)](https://github.com/dhvani-k/Car_Rental_Database_Design)
- [Car Rental System Design (OpenGenus)](https://iq.opengenus.org/system-design-of-car-rental-system/)

---
*Architecture research for: Navid Auto -- Used Car Rental/Lease Platform*
*Researched: 2026-03-09*
