# Roadmap: Navid Auto

## Overview

Navid Auto delivers a demo/investor-ready used car rental/lease platform for the Korean market. The roadmap builds foundation-first (schema, auth, RLS), then supply-side (vehicle data, dealer portal), then demand-side (search, pricing), then the core business logic (contract engine with eKYC and PDF), and finally aggregation layers (admin dashboard) and demo polish. Each phase delivers a coherent, verifiable capability that unblocks subsequent phases.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project scaffolding, database schema with RLS, Supabase client setup, responsive layout shell (completed 2026-03-09)
- [x] **Phase 2: Authentication & User Management** - Signup/login/logout, role-based access, profile management, route protection (completed 2026-03-09)
- [x] **Phase 3: Vehicle Data & Storage** - Vehicle CRUD for dealers and admins, image upload, license plate API, vehicle status management (completed 2026-03-09)
- [x] **Phase 4: Dealer Portal & Approval Workflow** - Dealer dashboard, admin vehicle approval queue (completed 2026-03-09)
- [ ] **Phase 5: Public Search & Discovery** - Vehicle search/filter/sort, detail pages with gallery, URL state persistence, landing page
- [ ] **Phase 6: Pricing & Calculation** - Monthly payment calculator, residual value estimation, rental vs lease comparison
- [ ] **Phase 7: Contract Engine** - Contract state machine, multi-step application form, mock eKYC flow, realtime status updates
- [ ] **Phase 8: Contract Completion & My Page** - Contract PDF generation, my page with contract tracking and download
- [ ] **Phase 9: Admin Dashboard & Demo Readiness** - Admin CRUD dashboard, statistics, residual value table management, responsive polish

## Phase Details

### Phase 1: Foundation
**Goal**: A deployable Next.js application with Supabase integration, database schema with RLS policies, and responsive layout skeleton ready for feature development
**Depends on**: Nothing (first phase)
**Requirements**: UIEX-01
**Success Criteria** (what must be TRUE):
  1. Next.js 15 app deploys successfully to Vercel with Supabase connected
  2. Database schema exists with all core tables and RLS enabled on every table
  3. Three Supabase clients (browser, server, admin) are configured and working
  4. Responsive layout shell renders correctly on desktop and mobile viewports
  5. Tailwind CSS v4 + shadcn/ui components render without errors
  6. Korean locale utilities configured (formatKRW, formatDate, formatDistance helpers)
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md -- Scaffold Next.js 15 project with Supabase clients, Prisma schema with RLS, Tailwind v4 + shadcn/ui, Korean locale utilities, and test framework
- [ ] 01-02-PLAN.md -- Build responsive layout shell with public header/footer, admin sidebar, and dealer sidebar

### Phase 2: Authentication & User Management
**Goal**: Users can create accounts, log in, and access role-appropriate areas of the platform
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password and is assigned default customer role
  2. User can log in and remain authenticated across browser sessions and page refreshes
  3. User can log out from any page and is redirected appropriately
  4. Admin can assign roles (customer/dealer/admin) to users and role change takes effect immediately
  5. Protected routes reject unauthorized users and redirect based on role (customer vs dealer vs admin areas)
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Auth core: Zod schemas, Server Actions (signup/login/logout), auth form pages, middleware route protection with role-based access
- [ ] 02-02-PLAN.md -- Profile management: user profile edit on my page, admin user list with role assignment, authenticated header state

### Phase 3: Vehicle Data & Storage
**Goal**: Dealers and admins can register vehicles with full details and images, and vehicle status transitions are tracked
**Depends on**: Phase 2
**Requirements**: VEHI-01, VEHI-02, VEHI-03, VEHI-04, VEHI-05, VEHI-06
**Success Criteria** (what must be TRUE):
  1. Dealer can register a vehicle with make, model, year, mileage, color, and price
  2. Dealer can upload multiple photos per vehicle and they display correctly
  3. Dealer can edit and delete their own vehicle listings but not others'
  4. Admin can register, edit, and delete vehicles for self-operated inventory
  5. Vehicle status transitions (available, reserved, rented, maintenance) update in real time and are enforced
  6. License plate auto-lookup populates vehicle details via API, with manual input as fallback
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md -- Vehicle foundation: install deps, VehicleStatusLog schema, Zod schemas, status machine, plate adapter, image compression utility, status badge
- [ ] 03-02-PLAN.md -- Vehicle CRUD Server Actions with ownership enforcement, multi-step wizard UI, vehicle list/management pages for dealer and admin
- [ ] 03-03-PLAN.md -- Image upload system (Supabase Storage, drag-and-drop, compression, sortable reorder), vehicle detail pages with photo gallery

### Phase 4: Dealer Portal & Approval Workflow
**Goal**: Dealers have a dedicated dashboard to manage their business, and admins control which dealer vehicles appear on the platform
**Depends on**: Phase 3
**Requirements**: VEHI-07, DEAL-01
**Success Criteria** (what must be TRUE):
  1. Dealer dashboard shows their vehicles, incoming contract requests, and approval status at a glance
  2. Dealer-registered vehicles are not publicly visible until admin approves them
  3. Admin can approve or reject dealer vehicles with a reason, and dealer sees the decision
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md -- ApprovalStatus schema migration, approval server actions (approve/reject/batch/resubmit), modified create/update actions, ApprovalBadge component
- [ ] 04-02-PLAN.md -- Dealer dashboard with stats sidebar, admin approval queue tab with batch actions, rejection dialog with Korean presets

### Phase 5: Public Search & Discovery
**Goal**: Any visitor can find, browse, and examine vehicles through a polished public storefront
**Depends on**: Phase 3
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-05, UIEX-02
**Success Criteria** (what must be TRUE):
  1. User can search and filter vehicles by brand, model, year range, price range, and mileage
  2. User can sort search results by price, year, mileage, or newest listing
  3. Vehicle detail page shows photo gallery, full specs, and pricing information
  4. Filter and sort state is persisted in the URL so users can share or bookmark searches
  5. Landing page displays featured vehicles and a quick search entry point
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md -- Search infrastructure (nuqs URL state, Prisma query builders, tests), search page with filters/sort/grid/pagination, vehicle detail page with inquiry form
- [ ] 05-02-PLAN.md -- Landing page with hero quick search, featured vehicles, brand shortcuts, how-it-works, trust metrics sections

### Phase 6: Pricing & Calculation
**Goal**: Users can understand and compare rental vs lease costs with transparent pricing calculations
**Depends on**: Phase 5
**Requirements**: PRIC-01, PRIC-02, SRCH-04
**Success Criteria** (what must be TRUE):
  1. User can calculate monthly rental and lease payments based on contract terms (period, deposit)
  2. Residual value estimation displays for lease contracts based on admin-configured lookup table (make/model/year)
  3. Interactive rental vs lease comparison calculator allows users to adjust period and deposit via sliders and see side-by-side results
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Contract Engine
**Goal**: Users can apply for rental/lease contracts through a complete multi-step flow with identity verification and real-time status tracking
**Depends on**: Phase 6
**Requirements**: CONT-01, CONT-02, CONT-05, CONT-06, CONT-07
**Success Criteria** (what must be TRUE):
  1. User completes a multi-step contract application (vehicle selection, terms, eKYC, review, submit)
  2. Mock eKYC flow presents a realistic ID verification UI that persists state in the database
  3. Contract state machine enforces explicit transitions (draft, pending_ekyc, pending_approval, approved, active, completed)
  4. Real-time status updates reflect vehicle and contract changes without page refresh (via Supabase Realtime)
  5. Admin approval step gates contract activation after submission
  6. Concurrent contract applications for the same vehicle are prevented at the database level (no double-booking)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD
- [ ] 07-03: TBD

### Phase 8: Contract Completion & My Page
**Goal**: Customers can track their contracts and download official documents from a personal dashboard
**Depends on**: Phase 7
**Requirements**: CONT-03, CONT-04, UIEX-03
**Success Criteria** (what must be TRUE):
  1. Contract PDF is auto-generated with all contract details (vehicle, terms, parties, dates)
  2. Customer my page shows list of all contracts with current status
  3. Customer can download contract PDF from their my page
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

### Phase 9: Admin Dashboard & Demo Readiness
**Goal**: Admins have full operational control through a comprehensive dashboard, and the entire platform is demo-ready for investor presentations
**Depends on**: Phase 8
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04
**Success Criteria** (what must be TRUE):
  1. Admin can view, edit, and delete all vehicles, contracts, and users from the dashboard
  2. Dealer vehicle approval queue allows approve/reject with reason
  3. Stats dashboard shows registered vehicle count, active contract count, and user count
  4. Admin can manage residual value rate table (make/model/year to percentage mappings)
  5. End-to-end demo flow (search, register, apply, approve, track) works without errors on both desktop and mobile
  6. Demo seed data includes 20+ realistic Korean vehicles (Hyundai, Kia, Genesis etc.), 3 dealer accounts, 5 customer accounts, sample contracts in various states
  7. All pages display appropriate loading indicators, empty states, and error messages — no blank screens during demo
  8. All monetary values display in KRW format (월 450,000원), dates in Korean format (2026년 3월 9일)
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in order: 1 → 2 → 3 → {4, 5 parallel} → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-09 |
| 2. Authentication & User Management | 2/2 | Complete   | 2026-03-09 |
| 3. Vehicle Data & Storage | 3/3 | Complete   | 2026-03-09 |
| 4. Dealer Portal & Approval Workflow | 2/2 | Complete   | 2026-03-09 |
| 5. Public Search & Discovery | 0/2 | Not started | - |
| 6. Pricing & Calculation | 0/2 | Not started | - |
| 7. Contract Engine | 0/3 | Not started | - |
| 8. Contract Completion & My Page | 0/1 | Not started | - |
| 9. Admin Dashboard & Demo Readiness | 0/2 | Not started | - |
