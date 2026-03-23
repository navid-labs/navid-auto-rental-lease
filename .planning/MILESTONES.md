# Milestones

## v2.1 Visual Polish (Shipped: 2026-03-23)

**Phases:** 3 | **Plans:** 4 | **Tasks:** 7 | **Requirements:** 14/14
**Timeline:** ~1.5 hours (2026-03-23)
**Source changes:** 18 files, +38/-23 lines

**Key accomplishments:**
1. Navigation bar height increased to 52px with global 24px content breathing room across all page layouts
2. Homepage sections spaced 80px+ apart with 3-column featured vehicle grid (was 4-column)
3. Search section internal padding increased to 40px+ with 24px promo card gaps
4. Search page vehicle card grid gap increased to 24px with 16px card internal padding
5. Breadcrumb navigation added to vehicle detail page (홈 > 내차사기 > 브랜드 모델)
6. Similar vehicles grid normalized to 3-column/6-item and all section cards spaced at uniform 32px

**Known tech debt:**
- Server fetches 8 similar vehicles but renders only 6 (take: 8 vs slice(0,6))

**Archive:** `.planning/milestones/v2.1-ROADMAP.md`

---

## v2.0 K Car Style Redesign (Shipped: 2026-03-23)

**Phases completed:** 5 phases, 18 plans, 0 tasks

**Key accomplishments:**
- (none recorded)

---

## v1.0 Demo MVP (Shipped: 2026-03-10)

**Phases:** 9 | **Plans:** 22 | **Commits:** 153 | **LOC:** 18,276
**Timeline:** 2 days (2026-03-09 → 2026-03-10)
**Requirements:** 35/35 satisfied

**Key accomplishments:**
1. Full-stack used car rental/lease platform with Next.js 15 + Supabase + Prisma
2. 3-role auth system (customer/dealer/admin) with RLS, middleware protection, and profile management
3. Vehicle CRUD with 3-step wizard, image upload to Supabase Storage, drag-and-drop reorder, plate lookup
4. Dealer portal with approval workflow — batch approve, rejection presets, notification dot
5. Public search with multi-criteria filters, URL state persistence (nuqs), landing page with hero section
6. Pricing calculator with rental vs lease comparison, residual value admin table
7. Contract engine with 4-step wizard, mock eKYC, state machine, Supabase Realtime status tracking
8. Contract PDF generation (@react-pdf/renderer), my page with status filter tabs
9. Admin dashboard with recharts stats, CRUD operations, demo seed (9 accounts, 13 contracts)

**Known tech debt:**
- EmptyState component created but never imported
- Finance modules (acquisition-tax, deposit-credit) orphaned
- Contract page redirect bug (`/auth/login` should be `/login`)
- /contracts path not in middleware PROTECTED_ROUTES
- 4 native confirm() dialogs

**Git range:** `59d792b..0f0d5a3`
**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

---
