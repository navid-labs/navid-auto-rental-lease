# Project Research Summary

**Project:** Navid Auto -- Korean Used Car Rental/Lease Platform
**Domain:** B2B2C marketplace (used car rental/lease)
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH

## Executive Summary

Navid Auto sits at the intersection of two established Korean markets -- used car marketplaces (Encar, K Car) and rental/lease providers (Lotte Rentacar) -- combining them into a B2B2C platform where dealers list used vehicles and customers apply for rental or lease contracts online. This is a well-understood architectural pattern (marketplace with multi-tenant data isolation), but the domain introduces specific complexity around lease pricing (residual value calculations), contract lifecycle state management, and Korean regulatory requirements around personal data and vehicle ownership verification. The recommended stack (Next.js 15 + Supabase + Tailwind/shadcn) is pre-decided and well-suited: Supabase's RLS provides the multi-tenant isolation this model demands, and Next.js Server Components deliver the SEO-critical vehicle listing pages.

The recommended approach is to build foundation-first: database schema with RLS policies baked in from day one, followed by vehicle data management (the supply side), then public-facing search (the demand side), and finally the contract engine (the business logic). The license plate lookup API integration is a key demo differentiator and should be built early with aggressive caching and fallback to manual input. The contract flow -- including mock eKYC, state machine, and PDF generation -- is the most complex feature and should be treated as a distinct phase with careful state machine design before any UI work begins.

The top risks are: (1) RLS misconfiguration leaking dealer data across tenants -- must be addressed in the first migration, not retrofitted; (2) vehicle double-booking race conditions -- require database-level atomic reservation, not application-level checks; (3) auth token mismanagement in SSR context -- use `getUser()` never `getSession()` on the server; and (4) demo survivability -- the MVP targets investors, so depth over breadth matters more than feature count. Every feature built should survive a live walkthrough with intentional detours.

## Key Findings

### Recommended Stack

The core stack is pre-decided and version-verified: Next.js 15.x with App Router, React 19, Supabase (auth + Postgres + storage + realtime), Tailwind CSS v4, and shadcn/ui. The complementary stack fills in the gaps well: react-hook-form + zod for complex contract forms with shared client/server validation, zustand for lightweight client state, TanStack Query for mutations with optimistic updates, and @react-pdf/renderer for contract PDF generation.

**Core technologies:**
- **Next.js 15 + React 19:** App Router with Server Components for SEO-critical vehicle listings; Server Actions for all mutations
- **Supabase (@supabase/supabase-js + @supabase/ssr):** Auth, PostgreSQL with RLS for multi-tenant isolation, Storage for vehicle photos, Realtime for status updates
- **Tailwind CSS v4 + shadcn/ui:** Utility-first styling with pre-built accessible components; v4 uses CSS-based config (no tailwind.config.ts)
- **react-hook-form + zod:** Performant forms with type-safe validation shared between client and server
- **@react-pdf/renderer:** React-component approach to contract PDF generation with Korean text support
- **date-fns v4:** Lightweight date manipulation with Korean locale support

**Critical version note:** Verify zod v4 compatibility with @hookform/resolvers v5 before installing. Fall back to zod v3.23 if resolvers lag behind.

### Expected Features

**Must have (table stakes):**
- Vehicle search/filter/sort with multi-criteria filtering (brand, model, year, price, mileage)
- Vehicle detail pages with photo gallery and specs
- Auth with role-based access control (customer/dealer/admin)
- Dealer vehicle CRUD with image upload
- Rental/lease monthly payment calculator with residual value calculation
- Multi-step contract application flow with mock eKYC
- Contract PDF auto-generation
- My page (contract status tracking)
- Admin dashboard (CRUD + basic stats)
- Responsive web (mobile-first)

**Should have (differentiators):**
- License plate-based vehicle info auto-lookup (key demo feature, v1 real integration)
- Transparent residual value display with admin-configurable rates
- Rental vs. lease side-by-side comparison
- Dealer approval workflow

**Defer (v2+):**
- Real eKYC/e-sign API integration (PASS, Modusign)
- Payment/CMS integration
- Social login (Kakao/Naver)
- Real-time chat
- Native mobile app
- AI vehicle recommendations

### Architecture Approach

The architecture follows a three-layer pattern: Presentation (four route groups for public/customer/dealer/admin), Application (Server Actions for mutations, Route Handlers for external API proxying, Middleware for auth), and Data (Supabase Postgres+RLS, Auth, Storage, Realtime). Three separate Supabase clients enforce the security boundary: browser client for realtime, server client for SSR reads (RLS-scoped), and admin/service-role client for trusted mutations after Server Action validation.

**Major components:**
1. **Public Pages (SSR/SSG)** -- Vehicle search, listing, detail; SEO-critical, server-rendered
2. **Customer Portal** -- Contract application, eKYC flow, my page; auth-protected
3. **Dealer Portal** -- Vehicle CRUD, inventory management, contract review; role-gated
4. **Admin Dashboard** -- All CRUD, user management, approval workflows, stats; role-gated
5. **Contract State Machine** -- Explicit state transitions (draft -> pending_ekyc -> ... -> active -> completed); enforced in Server Actions
6. **External API Layer** -- License plate lookup proxy with caching; mock eKYC with real interface contracts

### Critical Pitfalls

1. **RLS misconfiguration leaking dealer data** -- Enable RLS on every table in every migration; index all policy-referenced columns; never test RLS from SQL Editor (it bypasses RLS); verify from client SDK
2. **Vehicle double-booking race condition** -- Use PostgreSQL advisory locks or SELECT FOR UPDATE in an atomic RPC function; add UNIQUE constraint preventing two active contracts per vehicle
3. **Auth token mismanagement in SSR** -- Always use `getUser()` (not `getSession()`) on the server; implement middleware per Supabase's official guide; cache with React `cache()` to avoid duplicate auth calls
4. **Residual value calculations divorced from market reality** -- Use admin-configurable lookup tables (make/model/year -> residual %), not hardcoded formulas; display as "estimated" with disclaimers
5. **Demo that breaks on live walkthrough** -- Prioritize depth over breadth; persist mock flow state in DB; pre-seed demo data; add loading/error states everywhere; build a demo script and rehearse it

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Auth
**Rationale:** Every other feature depends on database schema, RLS policies, authentication, and role-based access. Auth bugs compound -- every feature built on broken auth inherits the problem. RLS must be baked in from day one; retrofitting is error-prone.
**Delivers:** Supabase project setup, database schema with RLS, three Supabase clients (browser/server/admin), auth flow (signup/login/logout), middleware with role-based route protection, user profiles with roles
**Addresses:** Auth/signup/login, role-based access control
**Avoids:** Pitfall 1 (RLS misconfiguration), Pitfall 4 (auth token mismanagement), Pitfall (PII/privacy compliance in schema design)

### Phase 2: Vehicle Data and Dealer Portal
**Rationale:** Vehicle data is the supply side of the marketplace. Search, contracts, and admin features all depend on vehicles existing in the system. License plate API integration is a headline demo feature and should be built early with caching/fallback.
**Delivers:** Vehicle table and CRUD, dealer vehicle registration with license plate auto-lookup, image upload to Supabase Storage, vehicle status management, admin vehicle approval workflow
**Addresses:** Dealer vehicle registration/management, license plate auto-lookup, vehicle status display, dealer approval system
**Avoids:** Pitfall 7 (license plate API without fallback), performance trap (image optimization pipeline)

### Phase 3: Public Experience and Search
**Rationale:** With vehicle data populated, the primary user entry point (search/browse) can be built. SSR-first for SEO. URL-based filter state for shareability. This phase creates the "storefront" that investors see first.
**Delivers:** Vehicle search with multi-criteria filters, vehicle detail pages with gallery, monthly payment calculator, residual value estimation, responsive mobile layout
**Addresses:** Vehicle search/filter, vehicle detail pages, payment calculator, residual value calculation, responsive web
**Avoids:** Pitfall 3 (residual value divorced from reality -- use configurable lookup tables), UX pitfall (filter state not in URL)

### Phase 4: Contract Engine
**Rationale:** The contract flow is the core business logic and the most complex feature. It depends on vehicles (Phase 2) and payment calculations (Phase 3). The state machine must be designed before any UI work. Double-booking prevention is critical here.
**Delivers:** Contract state machine, multi-step application form, mock eKYC flow (with state persistence), contract PDF generation, Realtime status updates, my page (contract tracking)
**Addresses:** Contract application flow, eKYC mock, PDF generation, my page
**Avoids:** Pitfall 2 (double-booking race condition), Pitfall 5 (state machine without explicit transitions)

### Phase 5: Admin Dashboard
**Rationale:** Admin dashboard aggregates data from all other features, so it naturally comes last. It needs vehicles, contracts, and users to exist to be meaningful.
**Delivers:** Stats overview, user management, contract oversight, vehicle/dealer approval queues, data tables with filtering/sorting
**Addresses:** Admin dashboard with CRUD and statistics

### Phase 6: Polish and Demo Preparation
**Rationale:** The MVP targets investors/demos. This phase focuses on demo survivability: seeding realistic data, hardening error states, building a demo script, and testing edge cases.
**Delivers:** Demo seed data (realistic Korean vehicles), loading/error states audit, demo mode flag for cached API responses, end-to-end demo script, Korean locale formatting audit, performance optimization
**Addresses:** Demo survivability, Korean formatting, mobile responsive verification
**Avoids:** Pitfall 6 (demo that can't survive a live walkthrough)

### Phase Ordering Rationale

- **Foundation first** because auth and RLS are prerequisites for every data operation, and getting them wrong is the most expensive mistake to fix later
- **Vehicle data before search** because you cannot build or test search without data to search through
- **Search before contracts** because contracts depend on vehicle detail pages and payment calculators
- **Contract engine as a distinct phase** because it is the most complex feature and benefits from focused attention with the state machine designed upfront
- **Admin dashboard last** because it is a read-heavy aggregation layer that benefits from all data models being stable
- **Polish as final phase** because demo reliability requires all features to exist before they can be hardened

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Vehicle/Dealer):** License plate API integration needs API-specific research -- data.go.kr endpoint specifics, rate limits, response format variations, consent requirements
- **Phase 4 (Contract Engine):** Contract state machine design needs domain expert input -- rental vs. lease have different state flows; early termination, extension, and dispute handling need business rules

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Supabase + Next.js auth is extremely well-documented with official guides
- **Phase 3 (Public Experience):** SSR search with filters is a solved pattern in Next.js App Router
- **Phase 5 (Admin Dashboard):** CRUD dashboards with shadcn/ui data tables are well-documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack pre-decided; all versions verified against npm; compatibility matrix validated |
| Features | MEDIUM | Good competitor analysis of Korean market; MVP scope is aggressive (14 P1 features) -- may need trimming during roadmap |
| Architecture | HIGH | Standard marketplace patterns with Supabase; official docs and community patterns well-aligned |
| Pitfalls | MEDIUM-HIGH | Domain-specific pitfalls well-identified; Korean market specifics (residual value, privacy law) add nuance beyond generic web app pitfalls |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Residual value data source:** No authoritative Korean used car depreciation data source identified for v1. Plan is admin-configurable lookup tables, but initial seed values need domain expert input or industry benchmark data.
- **License plate API specifics:** data.go.kr vs. commercial providers (apick.app, CODEF) -- needs API key registration and testing to determine which endpoints return what data without owner consent. This should be validated early in Phase 2.
- **Zod v4 + @hookform/resolvers compatibility:** Zod v4 is a major release. Verify resolver support before committing; have zod v3.23 as fallback plan.
- **PDF generation on Vercel:** Serverless function timeout (10s on Hobby) may be tight for contract PDF generation. Test early; consider client-side generation as fallback.
- **MVP scope risk:** 14 P1 features for a demo/investment MVP is ambitious. During roadmap creation, consider which features can be simplified (e.g., comparison as a basic table rather than a rich interactive feature).

## Sources

### Primary (HIGH confidence)
- Supabase official docs (SSR, RLS, Auth, Storage, Realtime)
- Next.js official docs (App Router, Server Actions, Middleware)
- npm package registries (all versions verified)
- shadcn/ui official docs (React 19 + Tailwind v4 compatibility)

### Secondary (MEDIUM confidence)
- Korean competitor platforms (Encar, K Car, KB ChaCha, Lotte Rentacar) -- feature analysis via public websites
- MakerKit blog -- Supabase patterns and best practices
- Korean market analysis articles -- used car market dynamics
- data.go.kr -- vehicle API documentation

### Tertiary (LOW confidence)
- Residual value calculation patterns -- derived from industry articles (banksalad, getcha) rather than authoritative financial data
- Korean personal data protection law specifics -- referenced but not legally verified

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
