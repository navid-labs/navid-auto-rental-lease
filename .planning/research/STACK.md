# Stack Research

**Domain:** Korean used car rental/lease web platform (B2B2C marketplace)
**Researched:** 2026-03-09
**Confidence:** HIGH (core stack pre-decided, research focused on versions, complementary packages, and patterns)

## Recommended Stack

### Core Technologies (Pre-decided)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (latest stable in 15 line) | Full-stack React framework | Pre-decided. App Router with Server Components for SEO-critical vehicle listings. Note: Next.js 16 is available but project spec says Next.js 15 -- stay on 15.x for stability. |
| React | 19.x | UI library | Ships with Next.js 15. Required for useActionState, Server Actions, and Suspense boundaries. |
| Supabase (`@supabase/supabase-js`) | ^2.98.0 | BaaS -- Auth, Database (Postgres), Storage, Realtime | Pre-decided. Provides auth, RLS, file storage (vehicle photos), and realtime status updates in one platform. |
| `@supabase/ssr` | ^0.9.0 | SSR-compatible Supabase client | Required for Next.js App Router. Replaces deprecated `@supabase/auth-helpers-nextjs`. Cookie-based auth that works across Server Components, Server Actions, Route Handlers, and middleware. |
| Tailwind CSS | v4.x | Utility-first CSS | Pre-decided. v4 has no `tailwind.config.ts` -- config lives in CSS. 5x faster full builds, 100x faster incremental builds. Use `@tailwindcss/postcss` plugin with Next.js. |
| shadcn/ui | latest (CLI-based, not versioned) | Component library | Pre-decided. Copy-paste components built on Radix UI + Tailwind. Full React 19 + Tailwind v4 support. Use `npx shadcn@latest init` then add components as needed. |
| Vercel | -- | Hosting & CI/CD | Pre-decided. Zero-config Next.js deployment. Auto-preview on PR, auto-deploy on main merge. |

### Form & Validation

| Library | Version | Purpose | Why This |
|---------|---------|---------|----------|
| react-hook-form | ^7.71.0 | Form state management | Industry standard for performant forms. Uncontrolled inputs minimize re-renders. Essential for complex contract application forms with many fields. |
| zod | ^4.3.0 | Schema validation | Type-safe validation shared between client and server. Zod 4 is stable (released after a year of development). Single schema validates both react-hook-form and Server Actions -- no duplication. |
| `@hookform/resolvers` | ^5.x | Bridges react-hook-form + zod | Glue package. Use `zodResolver` to connect zod schemas to react-hook-form. |

### State Management & Data Fetching

| Library | Version | Purpose | Why This |
|---------|---------|---------|----------|
| zustand | ^5.0.11 | Client-side global state | Minimal (1.16KB), no Provider needed, SSR-friendly. Use for: auth state, UI state (modals, filters, sidebar), cart-like contract flow state. Do NOT use for server data -- that goes through Server Components or TanStack Query. |
| `@tanstack/react-query` | ^5.90.0 | Client-side data fetching & caching | Use for client-side mutations (contract submissions, vehicle status updates) and data that needs optimistic updates. Server Components handle initial data fetching; TanStack Query handles client-side refetching and mutations. |
| `@tanstack/react-query-devtools` | ^5.90.0 | Query debugging | Dev-only. Invaluable for debugging cache states during development. |

### PDF Generation

| Library | Version | Purpose | Why This |
|---------|---------|---------|----------|
| `@react-pdf/renderer` | ^4.3.2 | Contract PDF generation | React-component approach to PDFs. Build contract templates as JSX components. Supports Korean text (with font registration). Use in Route Handler or Server Action to generate on-demand. Lazy-load on client to avoid bundle bloat. |

### Icons & UI Utilities

| Library | Version | Purpose | Why This |
|---------|---------|---------|----------|
| lucide-react | ^0.576.0 | Icon library | Default icon library for shadcn/ui. Tree-shakable, 1600+ icons. Do NOT install a separate icon library. |
| `clsx` + `tailwind-merge` | latest | Conditional class merging | Already included by shadcn/ui setup. The `cn()` utility function combines these. |
| `class-variance-authority` | latest | Component variants | Already included by shadcn/ui. Used for creating variant-based component APIs. |
| `date-fns` | ^4.x | Date formatting & manipulation | Lightweight, tree-shakable, Korean locale support (`ko`). Use for contract dates, rental periods, vehicle age calculations. Do NOT use moment.js (deprecated, heavy). |
| `next-themes` | ^0.4.x | Dark mode support | Works with shadcn/ui theming. SSR-safe, no flash of unstyled content. |

### Korean-Specific

| Library | Version | Purpose | Why This |
|---------|---------|---------|----------|
| Built-in `Intl` API | -- | Korean number/currency formatting | Use `Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })` for price display. No library needed. |
| Noto Sans KR (Google Fonts) | -- | Korean typography | Use `next/font/google` to load. Variable font for optimal performance. Self-hosted by Next.js for privacy and speed. |

### External API Integration

| Service | Purpose | Notes |
|---------|---------|-------|
| data.go.kr (Public Data Portal) | Vehicle info lookup by license plate | Korean government API. Requires API key registration. Provides vehicle specs, history, registration data. Call from Server Action or Route Handler only (keep API key server-side). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript | ^5.x | Type safety | Non-negotiable. Next.js 15 has first-class TS support. Strict mode enabled. |
| ESLint | ^9.x (flat config) | Code quality | Use `next lint` with Next.js built-in ESLint config. Next.js 15.5+ deprecates standalone next lint in favor of ESLint flat config. |
| Prettier | ^3.x | Code formatting | Use with `prettier-plugin-tailwindcss` for automatic Tailwind class sorting. |
| `prettier-plugin-tailwindcss` | latest | Tailwind class sorting | Auto-sorts Tailwind classes in consistent order. Eliminates bikeshedding. |
| Supabase CLI | latest | Local development | `supabase init`, `supabase start` for local Postgres + Auth. `supabase db diff` for migration generation. Essential for RLS policy testing. |

### Testing (Phase-appropriate for MVP)

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | ^3.x | Unit/integration tests | Fast, Vite-based, ESM-native. Use for utility functions, schema validation, business logic (residual value calculations). |
| Playwright | ^1.50+ | E2E tests | For critical flows: vehicle search, contract application, admin CRUD. Use sparingly in MVP -- focus on happy paths. |

## Installation

```bash
# Core (Next.js 15 project init)
npx create-next-app@15 --typescript --tailwind --eslint --app --src-dir

# shadcn/ui init
npx shadcn@latest init

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# State Management & Data Fetching
npm install zustand @tanstack/react-query

# PDF Generation
npm install @react-pdf/renderer

# UI Utilities
npm install date-fns next-themes
# lucide-react, clsx, tailwind-merge, class-variance-authority are installed by shadcn init

# Dev dependencies
npm install -D @tanstack/react-query-devtools prettier prettier-plugin-tailwindcss vitest @playwright/test supabase
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| zustand (global state) | Jotai | If you need fine-grained atomic reactivity for highly interactive UIs (e.g., real-time dashboards). For this MVP, zustand's simplicity wins. |
| `@tanstack/react-query` (client fetching) | SWR | If you want smaller bundle and simpler API. TanStack Query wins here because contract mutations need optimistic updates and rollback -- SWR's mutation support is weaker. |
| `@react-pdf/renderer` (PDF gen) | jsPDF | If you need pixel-perfect control over PDF layout. jsPDF is more imperative. `@react-pdf/renderer` is better because contract templates map naturally to React components. |
| date-fns (dates) | dayjs | If you prefer method chaining API. date-fns is tree-shakable by default; dayjs requires plugin loading. Both work fine -- date-fns has broader ecosystem adoption. |
| zod v4 (validation) | Valibot | If bundle size is critical (Valibot is smaller). Zod v4 has better ecosystem integration (react-hook-form resolvers, tRPC, Supabase types). |
| Vitest (unit tests) | Jest | Never. Vitest is faster, ESM-native, and API-compatible with Jest. No reason to use Jest in a new project. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/auth-helpers-nextjs` | Deprecated. No longer receiving bug fixes or features. | `@supabase/ssr` ^0.9.0 |
| `moment.js` | Deprecated by its own maintainers, massive bundle size (300KB+), mutable API. | `date-fns` ^4.x |
| Redux / Redux Toolkit | Massive overkill for this project. Boilerplate-heavy. | zustand ^5.x |
| `next-auth` / Auth.js | Redundant -- Supabase Auth handles authentication. Adding another auth layer creates confusion and bugs. | Supabase Auth (built into `@supabase/supabase-js`) |
| Prisma | Redundant -- Supabase provides a Postgres client. Adding an ORM creates migration conflicts with Supabase migrations. Use Supabase client for queries, raw SQL for complex queries. | `@supabase/supabase-js` query builder + SQL migrations |
| CSS Modules / styled-components | Conflicts with Tailwind utility-first approach. shadcn/ui expects Tailwind. | Tailwind CSS v4 |
| `tailwind.config.ts` | Tailwind v4 moved configuration to CSS. Config file approach is v3 legacy. | CSS-based config with `@theme` directive |
| Pages Router | Legacy Next.js routing. App Router is the current standard. All Supabase SSR docs target App Router. | App Router |
| `getServerSideProps` / `getStaticProps` | Pages Router APIs. Not available in App Router. | Server Components + `fetch` / Supabase client |
| `react-icons` | Large bundle, includes ALL icon sets. Not tree-shakable in the same way. | `lucide-react` (default for shadcn/ui) |
| localStorage for auth tokens | XSS-vulnerable. Supabase SSR uses HTTP-only cookies instead. | `@supabase/ssr` cookie-based auth |

## Supabase-Specific Patterns

### Client Organization

Create `src/lib/supabase/` with separate files:
- `client.ts` -- Browser client (Client Components)
- `server.ts` -- Server client (Server Components, Server Actions, Route Handlers)
- `middleware.ts` -- Middleware client (token refresh)
- `admin.ts` -- Service role client (admin operations that bypass RLS)

### RLS Strategy for Multi-Tenant Marketplace

- Every table gets a `dealer_id` or `created_by` column for ownership
- Vehicle listings: public read, dealer-scoped write (dealer can only edit own vehicles)
- Contracts: user can read own contracts, dealer can read contracts for own vehicles, admin reads all
- User profiles: user can read/update own profile only
- Always index columns referenced in RLS policies (`dealer_id`, `user_id`, `status`)

### Auth Flow

- Use Supabase Auth with email/password (v1 requirement)
- Store role in `app_metadata` (admin-only writeable) not `user_metadata`
- Middleware refreshes tokens on every request via `supabase.auth.getUser()`
- Protect routes in middleware, not in individual pages

### Database Migrations

- Use `supabase/migrations/` directory with timestamped SQL files
- Generate with `supabase db diff` after schema changes in local DB
- Commit SQL files to Git for version control
- Apply with `supabase db push` (staging) or automatic on deploy (production)

## Version Compatibility Matrix

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.x | React 19.x | Next.js 15 ships with React 19 |
| Next.js 15.x | Tailwind CSS v4.x | Requires `@tailwindcss/postcss` plugin |
| shadcn/ui (latest) | React 19.x + Tailwind v4 | Fully supported since late 2024 |
| `@supabase/ssr` ^0.9.0 | `@supabase/supabase-js` ^2.98.0 | Must use together |
| zod ^4.3.0 | `@hookform/resolvers` ^5.x | Verify resolver version supports zod v4. If issues, pin zod to ^3.23 which has broader resolver support. |
| zustand ^5.0.x | React 19.x | Full support, no Provider needed |
| `@tanstack/react-query` ^5.90.x | React 19.x | Full support |
| `@react-pdf/renderer` ^4.3.x | React 19.x | Verify compatibility -- React 19 support was added in v4.x |

**Zod v4 compatibility note:** Zod 4 is a major release. If `@hookform/resolvers` has not yet updated for zod v4 compatibility, fall back to zod `^3.23.0` which is battle-tested. Check `@hookform/resolvers` changelog before installing zod v4.

## Sources

- [Next.js Blog - Release Notes](https://nextjs.org/blog) -- Next.js version history (HIGH confidence)
- [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side/nextjs) -- Official SSR setup guide (HIGH confidence)
- [Supabase SSR npm](https://www.npmjs.com/package/@supabase/ssr) -- v0.9.0 verified (HIGH confidence)
- [supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) -- v2.98.0 verified (HIGH confidence)
- [Tailwind CSS v4 Blog](https://tailwindcss.com/blog/tailwindcss-v4) -- v4 features and migration (HIGH confidence)
- [shadcn/ui React 19 Docs](https://ui.shadcn.com/docs/react-19) -- Compatibility confirmed (HIGH confidence)
- [react-hook-form npm](https://www.npmjs.com/package/react-hook-form) -- v7.71.2 verified (HIGH confidence)
- [zod v4 Release Notes](https://zod.dev/v4) -- v4.3.6 stable (HIGH confidence)
- [zustand npm](https://www.npmjs.com/package/zustand) -- v5.0.11 verified (HIGH confidence)
- [@tanstack/react-query npm](https://www.npmjs.com/package/@tanstack/react-query) -- v5.90.21 verified (HIGH confidence)
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer) -- v4.3.2 verified (HIGH confidence)
- [lucide-react npm](https://www.npmjs.com/package/lucide-react) -- v0.576.0 verified (HIGH confidence)
- [data.go.kr Vehicle API](https://www.data.go.kr/data/15071233/openapi.do) -- Korean vehicle info API (HIGH confidence)
- [Supabase RLS Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) -- Multi-tenant patterns (MEDIUM confidence)

---
*Stack research for: Navid Auto -- Korean used car rental/lease platform*
*Researched: 2026-03-09*
