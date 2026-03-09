# Milestones

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
