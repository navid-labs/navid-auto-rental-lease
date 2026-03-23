# Roadmap: Navid Auto

## Milestones

- ✅ **v1.0 Demo MVP** -- Phases 1-9 (shipped 2026-03-10)
- ✅ **v1.1 Inventory Admin** -- Phases 10-12 (shipped 2026-03-10)
- ✅ **v2.0 K Car Style Redesign** -- Phases 13-17 (shipped 2026-03-23)
- 🚧 **v2.1 Visual Polish** -- Phases 18-20 (in progress)

## Phases

<details>
<summary>✅ v1.0 Demo MVP (Phases 1-9) -- SHIPPED 2026-03-10</summary>

- [x] Phase 1: Foundation (2/2 plans) -- completed 2026-03-09
- [x] Phase 2: Authentication & User Management (2/2 plans) -- completed 2026-03-09
- [x] Phase 3: Vehicle Data & Storage (3/3 plans) -- completed 2026-03-09
- [x] Phase 4: Dealer Portal & Approval Workflow (2/2 plans) -- completed 2026-03-09
- [x] Phase 5: Public Search & Discovery (2/2 plans) -- completed 2026-03-09
- [x] Phase 6: Pricing & Calculation (3/3 plans) -- completed 2026-03-10
- [x] Phase 7: Contract Engine (3/3 plans) -- completed 2026-03-09
- [x] Phase 8: Contract Completion & My Page (2/2 plans) -- completed 2026-03-09
- [x] Phase 9: Admin Dashboard & Demo Readiness (3/3 plans) -- completed 2026-03-10

</details>

<details>
<summary>✅ v1.1 Inventory Admin (Phases 10-12) -- SHIPPED 2026-03-10</summary>

- [x] Phase 10: Inventory Data & Table UI (2/2 plans) -- completed 2026-03-09
- [x] Phase 11: Quote Generation Engine (3/3 plans) -- completed 2026-03-09
- [x] Phase 12: Settings Management & Polish (3/3 plans) -- completed 2026-03-10

</details>

<details>
<summary>✅ v2.0 K Car Style Redesign (Phases 13-17) -- SHIPPED 2026-03-23</summary>

- [x] Phase 13: Component Foundation (2/2 plans) -- completed 2026-03-19
- [x] Phase 14: Vehicle Detail Page (5/5 plans) -- completed 2026-03-20
- [x] Phase 15: Search & Listing Page (5/5 plans) -- completed 2026-03-22
- [x] Phase 16: Homepage & Navigation (4/4 plans) -- completed 2026-03-22
- [x] Phase 17: Admin Refresh & Polish (2/2 plans) -- completed 2026-03-23

</details>

### v2.1 Visual Polish (In Progress)

- [x] **Phase 18: Global Spacing Foundation** - Nav bar height, content top margins, admin spacing rules (completed 2026-03-23)
- [ ] **Phase 19: Homepage & Search Spacing** - Section gaps, card grids, filter area padding
- [ ] **Phase 20: Detail Page Spacing** - Gallery breadcrumb, section card gaps, similar vehicles grid

## Phase Details

### Phase 18: Global Spacing Foundation
**Goal**: All pages share consistent navigation height and content start margins
**Depends on**: Nothing (first phase of v2.1)
**Requirements**: GLBL-01, GLBL-02, GLBL-03
**Success Criteria** (what must be TRUE):
  1. Navigation bar across all pages renders at 52px height (up from 44px)
  2. Every page's content starts with 24-32px of breathing room below the navigation
  3. Admin dashboard pages follow the same spacing rules as public pages
**Plans**: 1 plan

Plans:
- [x] 18-01-PLAN.md -- Nav height, layout padding, per-page de-duplication, visual verification (completed 2026-03-23)

### Phase 19: Homepage & Search Spacing
**Goal**: Homepage sections and search results feel spacious with generous gaps between elements
**Depends on**: Phase 18
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, SRCH-01, SRCH-02, SRCH-03, SRCH-04
**Success Criteria** (what must be TRUE):
  1. Homepage sections (hero, search, quick links, featured, promos, partners) have visible breathing room between them (80px+ gaps)
  2. Homepage featured vehicles display in a 3-column grid instead of 4, with each card having more horizontal space
  3. Homepage search section and promotion cards have generous internal padding and inter-card gaps
  4. Search results page shows vehicle cards with 24px gaps, and the search bar / breadcrumb / filter transitions have clear spacing
  5. Vehicle cards on the search page have increased internal padding between image and text content
**Plans**: 2 plans

Plans:
- [ ] 19-01-PLAN.md -- Homepage section spacing, 3-col grid, search box padding, promo gaps
- [ ] 19-02-PLAN.md -- Search page grid gap, breadcrumb spacing, card padding, filter pill margins

### Phase 20: Detail Page Spacing
**Goal**: Vehicle detail page has proper visual hierarchy with breadcrumb navigation and consistent section spacing
**Depends on**: Phase 18
**Requirements**: DETL-01, DETL-02, DETL-03
**Success Criteria** (what must be TRUE):
  1. A breadcrumb trail appears between the navigation bar and the gallery, with 24px of spacing separating them
  2. Similar vehicles recommendation section displays in a 3-column grid (matching homepage pattern)
  3. All information section cards on the detail page are separated by a uniform 32px vertical gap
**Plans**: TBD

Plans:
- [ ] 20-01: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 18. Global Spacing Foundation | v2.1 | Complete    | 2026-03-23 | 2026-03-23 |
| 19. Homepage & Search Spacing | 1/2 | In Progress|  | - |
| 20. Detail Page Spacing | v2.1 | 0/? | Not started | - |
