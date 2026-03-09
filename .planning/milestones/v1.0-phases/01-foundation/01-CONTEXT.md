# Phase 1: Foundation - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffolding, database schema with RLS, Supabase client setup, and responsive layout shell. Delivers a deployable Next.js 15 app with all core tables, RLS policies, three Supabase clients, responsive layout skeleton, Tailwind CSS v4 + shadcn/ui, and Korean locale utilities. No feature logic — just the foundation for all subsequent phases.

</domain>

<decisions>
## Implementation Decisions

### Layout Shell Structure
- Navigation pattern (public): Claude's discretion — choose best pattern for Korean auto platform
- Admin/dealer dashboard layout: Claude's discretion — sidebar vs tabs
- URL structure (public/dealer/admin): Claude's discretion — route groups recommended
- Footer: Minimal — company name, copyright, contact info only. Expand later as needed

### Database Schema
- Scope: All core tables created in Phase 1 (User/Profile, Vehicle, Contract, Payment, Brand/Model/Generation/Trim, Inquiry, etc.)
- RLS: Enabled on every table with default deny-all policy. Phase-specific allow policies added in each subsequent phase
- Schema tool: Prisma ORM (schema.prisma → yarn db:push → Supabase)
- User table design: Claude's discretion (profiles table pattern recommended by Supabase)

### Design System
- Color palette: Dark navy base + gold accent. Premium, trustworthy automotive feel
- Glassmorphism: Point elements only (header, CTA buttons, hero section). General cards/forms use solid backgrounds
- Font: Pretendard (Korean web standard, clean readability)
- shadcn/ui components: Claude's discretion — install what Phase 1 layout shell needs, add more per phase

### Korean Locale Utilities
- Currency: "월 450,000원" pattern (comma-separated + '원' suffix, '월' prefix for monthly)
- Date: "2026년 3월 9일" formal format + "2026.03.09" short format
- Distance: "12,500km" (comma-separated + 'km' suffix) + 만단위 display for large numbers (e.g., "1.2만 km")
- Year model: "2026년식" format
- Implementation: Claude's discretion (pure helper functions with Intl API preferred for bundle size)

### Claude's Discretion
- Navigation pattern for public pages (top header, bottom tab bar, or hybrid)
- Admin/dealer layout pattern (sidebar recommended)
- URL routing structure (path-based separation with App Router route groups)
- Supabase auth.users ↔ app profiles table relationship
- shadcn/ui initial component selection
- Locale utility implementation approach (Intl API vs date-fns)

</decisions>

<specifics>
## Specific Ideas

- Design philosophy from CLAUDE.md: "High-Fidelity Aesthetics (Nano Banana Pro 2)" — premium, high-density landing page design
- Visual density: 2-column visual assets, shadow-card layout, background watermark
- Mobile-first responsive design
- Success Criteria explicitly requires: formatKRW, formatDate, formatDistance helpers
- All monetary values: KRW format (월 450,000원), dates in Korean format (2026년 3월 9일)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing codebase

### Established Patterns
- CLAUDE.md defines: named exports, functional components, Zod validation, Server Components by default
- Performance rules: Promise.all() for parallel async, next/dynamic for large libs, React.cache() for server dedup

### Integration Points
- Supabase project already provisioned (env vars defined in CLAUDE.md)
- Vercel deployment target (CI/CD on main branch merge)
- Prisma as ORM with Supabase PostgreSQL

### External Research Notes
- `claude_volt/Projects/navid-auto-rental-lease/Phase1-RLS-정책설계.md` — Table-level RLS permission matrix (reference during planning)
- `claude_volt/Projects/navid-auto-rental-lease/핵심기능-우선순위.md` — MVP/differentiation priorities
- NotebookLM: 57 sources including eKYC legal requirements, residual value calculation references

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-09*
