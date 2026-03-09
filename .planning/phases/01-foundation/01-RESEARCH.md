# Phase 1: Foundation - Research

**Researched:** 2026-03-09
**Domain:** Next.js 15 + Supabase + Prisma + Tailwind CSS v4 + shadcn/ui project scaffolding
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield foundation setup covering five distinct domains: (1) Next.js 15 App Router project scaffolding with TypeScript, (2) Supabase client configuration (browser, server, admin), (3) PostgreSQL database schema via Prisma with RLS enabled on all tables, (4) responsive layout shell with Tailwind CSS v4 + shadcn/ui + Pretendard font, and (5) Korean locale utility functions.

The stack is well-documented and stable. Next.js 15 with App Router is the current recommended version. Supabase SSR via `@supabase/ssr` replaces the deprecated auth-helpers. Tailwind CSS v4 uses CSS-first configuration with `@theme inline` instead of `tailwind.config.ts`. Prisma cannot directly manage RLS policies, so raw SQL migrations are required for RLS setup. The Pretendard font should be loaded via `@fontsource/pretendard` npm package for optimal Next.js integration.

**Primary recommendation:** Use `create-next-app` with recommended defaults, then layer Supabase SSR clients, Prisma schema with manual RLS SQL, shadcn/ui with Tailwind v4, and pure Intl API-based Korean locale helpers.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Navigation pattern (public): Claude's discretion -- choose best pattern for Korean auto platform
- Admin/dealer dashboard layout: Claude's discretion -- sidebar vs tabs
- URL structure: Claude's discretion -- route groups recommended
- Footer: Minimal -- company name, copyright, contact info only. Expand later as needed
- Database scope: All core tables created in Phase 1 (User/Profile, Vehicle, Contract, Payment, Brand/Model/Generation/Trim, Inquiry, etc.)
- RLS: Enabled on every table with default deny-all policy. Phase-specific allow policies added in each subsequent phase
- Schema tool: Prisma ORM (schema.prisma -> yarn db:push -> Supabase)
- Color palette: Dark navy base + gold accent. Premium, trustworthy automotive feel
- Glassmorphism: Point elements only (header, CTA buttons, hero section). General cards/forms use solid backgrounds
- Font: Pretendard (Korean web standard, clean readability)
- Currency format: "월 450,000원" pattern
- Date format: "2026년 3월 9일" formal + "2026.03.09" short
- Distance format: "12,500km" + 만단위 display for large numbers (e.g., "1.2만 km")
- Year model format: "2026년식"
- Implementation: Pure helper functions with Intl API preferred for bundle size

### Claude's Discretion
- Navigation pattern for public pages (top header, bottom tab bar, or hybrid)
- Admin/dealer layout pattern (sidebar recommended)
- URL routing structure (path-based separation with App Router route groups)
- Supabase auth.users <-> app profiles table relationship
- shadcn/ui initial component selection
- Locale utility implementation approach (Intl API vs date-fns)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UIEX-01 | Responsive web design (desktop + mobile simultaneous design) | Tailwind CSS v4 responsive utilities + shadcn/ui responsive components + mobile-first approach documented in Architecture Patterns |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | React framework with App Router | Current stable, required by project spec |
| react / react-dom | 19.x | UI library | Ships with Next.js 15 |
| typescript | 5.x | Type safety | Ships with create-next-app |
| @supabase/supabase-js | 2.x | Supabase client SDK | Official SDK |
| @supabase/ssr | 0.5.x | SSR cookie handling for Supabase | Replaces deprecated @supabase/auth-helpers-nextjs |
| prisma / @prisma/client | 6.x | ORM for PostgreSQL | Project spec, schema-first approach |
| tailwindcss | 4.x | Utility-first CSS | Project spec, CSS-first config (no tailwind.config.ts) |
| @tailwindcss/postcss | 4.x | PostCSS plugin for Tailwind v4 | Required for Next.js integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest CLI | Component primitives | Layout shell components (Button, Sheet, NavigationMenu) |
| @fontsource/pretendard | latest | Pretendard font self-hosting | Korean typography, loaded via CSS import |
| tw-animate-css | latest | Animation utilities for shadcn/ui | Installed by shadcn init |
| postcss | 8.x | CSS processing | Required by Tailwind v4 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @fontsource/pretendard | CDN (jsdelivr) | npm gives build-time optimization, CDN is simpler but adds external dependency |
| Pure Intl API helpers | date-fns + Intl | date-fns adds ~7KB, Intl API is sufficient for Korean locale formatting |
| Prisma raw SQL for RLS | prisma-extension-supabase-rls | Extension has low adoption (102 stars), raw SQL gives full control |

**Installation:**
```bash
# Project scaffolding
yarn create next-app navid-auto-rental-lease --typescript --eslint --tailwind --app --src-dir --import-alias "@/*" --turbopack

# Supabase
yarn add @supabase/supabase-js @supabase/ssr

# Prisma
yarn add -D prisma
yarn add @prisma/client

# Tailwind v4 (if not already from create-next-app)
yarn add tailwindcss @tailwindcss/postcss postcss

# Font
yarn add @fontsource/pretendard

# shadcn/ui init (after project setup)
npx shadcn@latest init

# Initial shadcn components for layout shell
npx shadcn@latest add button sheet navigation-menu separator
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (public)/           # Public-facing pages (route group, no URL prefix)
│   │   ├── layout.tsx      # Public layout with header/footer
│   │   └── page.tsx        # Landing page (placeholder for Phase 5)
│   ├── (dealer)/           # Dealer portal pages
│   │   └── layout.tsx      # Sidebar layout for dealer
│   ├── (admin)/            # Admin dashboard pages
│   │   └── layout.tsx      # Sidebar layout for admin
│   ├── api/                # API routes
│   ├── layout.tsx          # Root layout (font, metadata, providers)
│   └── globals.css         # Tailwind v4 + shadcn theme
├── components/
│   ├── ui/                 # shadcn/ui primitives (auto-generated)
│   ├── layout/
│   │   ├── header.tsx      # Public header with navigation
│   │   ├── footer.tsx      # Minimal footer
│   │   ├── mobile-nav.tsx  # Mobile navigation (Sheet-based)
│   │   ├── admin-sidebar.tsx
│   │   └── dealer-sidebar.tsx
│   └── providers.tsx       # Client-side providers wrapper
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client (createBrowserClient)
│   │   ├── server.ts       # Server client (createServerClient)
│   │   └── admin.ts        # Admin client (service_role, no cookies)
│   ├── utils/
│   │   └── format.ts       # Korean locale formatters (KRW, date, distance)
│   └── db/
│       └── prisma.ts       # Prisma client singleton
├── types/
│   └── index.ts            # Shared TypeScript types
└── middleware.ts           # Supabase auth token refresh
prisma/
├── schema.prisma           # Full database schema
└── migrations/
    └── 00000000000000_rls_setup/
        └── migration.sql   # RLS enable + deny-all policies
```

### Pattern 1: Three Supabase Clients
**What:** Separate client factories for browser, server, and admin contexts
**When to use:** Always -- each context has different auth/cookie requirements

**Browser Client** (`src/lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server Client** (`src/lib/supabase/server.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
```

**Admin Client** (`src/lib/supabase/admin.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
```

### Pattern 2: Supabase Middleware for Token Refresh
**What:** Next.js middleware that refreshes Supabase auth tokens on every request
**When to use:** Required for SSR auth to work correctly

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 3: Prisma Client Singleton
**What:** Prevent multiple Prisma Client instances in development
**When to use:** Always in Next.js projects

```typescript
// src/lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Pattern 4: Prisma + Supabase auth.users Profile Sync
**What:** Database trigger that auto-creates a profile row when Supabase creates an auth.users entry
**When to use:** Always with Prisma + Supabase Auth

Prisma cannot reference `auth.users` directly (different schema). The standard pattern:
1. Define a `Profile` model in Prisma's public schema with `id` matching `auth.users.id`
2. Create a PostgreSQL trigger function to auto-insert profile on user creation
3. Use Prisma `multiSchema` preview feature if cross-schema references are needed

```sql
-- Migration: create trigger for profile sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."Profile" (id, email, role)
  VALUES (new.id, new.email, 'CUSTOMER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Pattern 5: Tailwind v4 Theme with Dark Navy + Gold
**What:** CSS-first Tailwind v4 configuration using @theme inline
**When to use:** Phase 1 globals.css setup

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";
@import "@fontsource/pretendard/400.css";
@import "@fontsource/pretendard/500.css";
@import "@fontsource/pretendard/600.css";
@import "@fontsource/pretendard/700.css";

@custom-variant dark (&:is(.dark *));

:root {
  /* Dark navy base + gold accent palette */
  --background: hsl(220 30% 98%);
  --foreground: hsl(220 30% 10%);
  --primary: hsl(220 50% 15%);        /* Dark navy */
  --primary-foreground: hsl(45 80% 60%); /* Gold */
  --accent: hsl(45 80% 55%);          /* Gold accent */
  --accent-foreground: hsl(220 50% 10%);
  --muted: hsl(220 15% 92%);
  --muted-foreground: hsl(220 10% 45%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(220 30% 10%);
  --border: hsl(220 15% 88%);
  --input: hsl(220 15% 88%);
  --ring: hsl(220 50% 15%);
  --destructive: hsl(0 84% 60%);
  --destructive-foreground: hsl(0 0% 98%);
  --secondary: hsl(220 15% 96%);
  --secondary-foreground: hsl(220 30% 10%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(220 30% 10%);
  --sidebar-background: hsl(220 50% 12%);
  --sidebar-foreground: hsl(220 10% 90%);
  --sidebar-accent: hsl(45 80% 55%);
  --radius: 0.625rem;
}

.dark {
  --background: hsl(220 40% 8%);
  --foreground: hsl(220 10% 95%);
  --primary: hsl(45 80% 60%);
  --primary-foreground: hsl(220 50% 10%);
  --card: hsl(220 35% 12%);
  --card-foreground: hsl(220 10% 95%);
  --border: hsl(220 20% 20%);
  --accent: hsl(45 80% 55%);
  --accent-foreground: hsl(220 50% 10%);
  --muted: hsl(220 25% 18%);
  --muted-foreground: hsl(220 10% 60%);
  --sidebar-background: hsl(220 50% 6%);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-sidebar-background: var(--sidebar-background);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: "Pretendard", system-ui, sans-serif;
}
```

### Pattern 6: Korean Locale Utilities
**What:** Pure functions using Intl API for Korean formatting
**When to use:** All monetary, date, and distance displays

```typescript
// src/lib/utils/format.ts

/**
 * Format currency in Korean Won
 * formatKRW(450000) => "450,000원"
 * formatKRW(450000, { monthly: true }) => "월 450,000원"
 */
export function formatKRW(
  amount: number,
  options?: { monthly?: boolean }
): string {
  const formatted = new Intl.NumberFormat('ko-KR').format(amount)
  const suffix = `${formatted}원`
  return options?.monthly ? `월 ${suffix}` : suffix
}

/**
 * Format date in Korean formal format
 * formatDate(new Date()) => "2026년 3월 9일"
 * formatDate(new Date(), { short: true }) => "2026.03.09"
 */
export function formatDate(
  date: Date | string,
  options?: { short?: boolean }
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (options?.short) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}.${m}.${day}`
  }
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Format distance in km
 * formatDistance(12500) => "12,500km"
 * formatDistance(12500, { compact: true }) => "1.2만 km"
 */
export function formatDistance(
  km: number,
  options?: { compact?: boolean }
): string {
  if (options?.compact && km >= 10000) {
    const man = km / 10000
    const formatted = man % 1 === 0 ? man.toString() : man.toFixed(1)
    return `${formatted}만 km`
  }
  return `${new Intl.NumberFormat('ko-KR').format(km)}km`
}

/**
 * Format year model
 * formatYearModel(2026) => "2026년식"
 */
export function formatYearModel(year: number): string {
  return `${year}년식`
}
```

### Anti-Patterns to Avoid
- **Using @supabase/auth-helpers-nextjs:** Deprecated. Use @supabase/ssr instead.
- **Single Supabase client for all contexts:** Browser and server clients have different cookie handling requirements. Admin client bypasses RLS entirely.
- **RLS policies via Prisma migrations:** Prisma cannot generate RLS SQL. Use raw SQL migration files.
- **tailwind.config.ts with Tailwind v4:** v4 is CSS-first. Use `@theme inline` in globals.css.
- **next/font/google for Pretendard:** Pretendard is not on Google Fonts. Use @fontsource npm package.
- **Direct foreign key to auth.users in Prisma:** Cross-schema FK not supported without multiSchema preview feature. Use trigger-based sync instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component primitives | Custom Button, Input, Dialog | shadcn/ui | Accessibility, keyboard nav, ARIA attributes |
| Cookie-based SSR auth | Custom cookie parsing | @supabase/ssr | Token refresh, cookie chunking, security edge cases |
| CSS utility framework | Custom utility classes | Tailwind CSS v4 | Responsive design, dark mode, design tokens |
| ORM / query builder | Raw SQL queries | Prisma | Type safety, migrations, schema management |
| Number/date formatting | Custom regex formatters | Intl API | Locale-aware, browser-native, zero bundle cost |
| Mobile navigation | Custom drawer component | shadcn/ui Sheet | Touch gestures, focus trapping, animations |

**Key insight:** Phase 1 is entirely infrastructure. Every component should be a well-tested library, not custom code. The only custom code should be the locale utility functions and the Prisma schema definition.

## Common Pitfalls

### Pitfall 1: Supabase SSR Cookie Handling in Server Components
**What goes wrong:** Server Components cannot write cookies, causing `setAll` to throw
**Why it happens:** Next.js Server Components are read-only by design
**How to avoid:** Wrap `setAll` in try-catch (the middleware handles the actual cookie writes)
**Warning signs:** "Cookies can only be modified in a Server Action or Route Handler" error

### Pitfall 2: Prisma Client Hot Reload Leak
**What goes wrong:** Multiple PrismaClient instances exhaust database connections in dev
**Why it happens:** Next.js hot module replacement creates new instances
**How to avoid:** Use the globalThis singleton pattern (documented in Pattern 3)
**Warning signs:** "Too many connections" or "PrismaClientKnownRequestError"

### Pitfall 3: RLS Deny-All Breaks Prisma Operations
**What goes wrong:** After enabling RLS with deny-all policies, all Prisma queries return empty
**Why it happens:** Prisma connects as a role subject to RLS unless using service_role
**How to avoid:** Ensure Prisma connects via a connection string that either: (a) uses a role exempt from RLS (e.g., `postgres` role), or (b) uses the Supabase pooler with appropriate role. For Phase 1, use the `postgres` superuser role via DIRECT_URL for migrations and the service_role for app queries if needed.
**Warning signs:** Queries return `[]` even when data exists

### Pitfall 4: Tailwind v4 CSS Import Order
**What goes wrong:** Styles don't apply or override incorrectly
**Why it happens:** `@import "tailwindcss"` must come before custom styles
**How to avoid:** Order: `@import "tailwindcss"` -> `@import "tw-animate-css"` -> font imports -> custom CSS
**Warning signs:** Components render without expected styling

### Pitfall 5: Environment Variable Naming
**What goes wrong:** Supabase client fails to initialize
**Why it happens:** Supabase docs recently changed from `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in some examples
**How to avoid:** Stick with `NEXT_PUBLIC_SUPABASE_ANON_KEY` which is the value shown in the Supabase dashboard. Add `SUPABASE_SERVICE_ROLE_KEY` (no NEXT_PUBLIC prefix -- must not be exposed to client).
**Warning signs:** "supabaseUrl is required" or "supabaseKey is required" errors

### Pitfall 6: Prisma db push vs migrate in Supabase
**What goes wrong:** Schema changes applied via `db push` cannot include custom SQL (RLS, triggers)
**Why it happens:** `db push` only syncs Prisma schema, ignoring custom SQL
**How to avoid:** Use `prisma migrate dev` for initial setup to capture both schema + custom SQL. Use `db push` only for rapid prototyping. RLS policies and triggers must go in migration SQL files.
**Warning signs:** RLS policies disappear after schema push

## Code Examples

### Root Layout with Pretendard Font
```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Navid Auto - 중고차 렌탈/리스',
  description: '프리미엄 중고차 렌탈 및 리스 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

### Responsive Layout Shell (Public)
```typescript
// src/app/(public)/layout.tsx
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
```

### Mobile Navigation with shadcn Sheet
```typescript
// src/components/layout/mobile-nav.tsx
'use client'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <nav className="flex flex-col gap-4 pt-8">
          {/* Navigation links */}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2024 | Different API, cookie-based approach |
| tailwind.config.ts | @theme inline in CSS | Tailwind v4 (2025) | No config file, CSS-first |
| HSL color format in shadcn | OKLCH available | shadcn 2025 updates | Better color accuracy, but HSL still works |
| createServerComponentClient | createServerClient | @supabase/ssr | Unified server client factory |
| next/font for all fonts | @fontsource for non-Google fonts | N/A | Pretendard not in Google Fonts catalog |
| Prisma migrate deploy | prisma db push for dev | Ongoing | db push faster for dev, migrate for production |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Fully replaced by `@supabase/ssr`
- `tailwind.config.ts`: Not needed with Tailwind CSS v4 (use CSS `@theme inline`)
- `@layer base` for CSS variables: shadcn/ui now puts variables outside `@layer`

## Open Questions

1. **Prisma connection pooling with Supabase**
   - What we know: Supabase provides both direct and pooled connections (via PgBouncer). Prisma needs DIRECT_URL for migrations and DATABASE_URL (pooled) for runtime.
   - What's unclear: Exact connection string format with `?pgbouncer=true` parameter for Prisma 6.x
   - Recommendation: Use `DATABASE_URL` (pooled, port 6543) for runtime and `DIRECT_URL` (direct, port 5432) for migrations. This is already defined in the project's env vars section.

2. **RLS policy design for deny-all default**
   - What we know: `ALTER TABLE x ENABLE ROW LEVEL SECURITY` with no policies = deny-all for non-superuser roles
   - What's unclear: Whether the app should connect as a role subject to RLS in Phase 1 (when no allow policies exist yet)
   - Recommendation: In Phase 1, Prisma connects as the `postgres` superuser (bypasses RLS). Phase 2 introduces auth-aware policies with the authenticated role.

3. **shadcn/ui components.json cssVariables config for Tailwind v4**
   - What we know: For Tailwind v4, set `"tailwind.config": ""` (empty string) in components.json
   - What's unclear: Exact components.json format may change with shadcn CLI updates
   - Recommendation: Let `npx shadcn@latest init` auto-detect Tailwind v4 and generate the correct config

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (as specified in CLAUDE.md) |
| Config file | `vitest.config.ts` -- Wave 0 |
| Quick run command | `yarn test` |
| Full suite command | `yarn test:coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UIEX-01 | Responsive layout renders on desktop and mobile | smoke | Manual viewport check (Playwright e2e in later phase) | -- Wave 0 |
| FOUND-01 | Three Supabase clients initialize without error | unit | `yarn test src/lib/supabase/` | -- Wave 0 |
| FOUND-02 | Korean locale formatters produce correct output | unit | `yarn test src/lib/utils/format.test.ts` | -- Wave 0 |
| FOUND-03 | Prisma client connects to database | integration | `yarn test src/lib/db/` | -- Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test`
- **Per wave merge:** `yarn test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration file
- [ ] `src/lib/utils/format.test.ts` -- Korean locale formatter tests
- [ ] `src/lib/supabase/__tests__/` -- Supabase client initialization tests
- [ ] Framework install: `yarn add -D vitest @testing-library/react @testing-library/jest-dom` -- test dependencies

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side/nextjs) - Server-side auth setup for Next.js
- [Supabase SSR Client Creation](https://supabase.com/docs/guides/auth/server-side/creating-a-client) - Three client types
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) - shadcn init flow
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) - @theme inline migration
- [Next.js create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app) - Project scaffolding options
- [Pretendard GitHub](https://github.com/orioncactus/pretendard) - Font installation options

### Secondary (MEDIUM confidence)
- [Supabase service_role discussion](https://github.com/orgs/supabase/discussions/30739) - Admin client pattern
- [prisma-extension-supabase-rls](https://github.com/dthyresson/prisma-extension-supabase-rls) - RLS with Prisma pattern
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policy syntax

### Tertiary (LOW confidence)
- Prisma + Supabase auth.users trigger pattern - assembled from multiple community discussions, no single authoritative source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries are current, well-documented, and explicitly specified in project requirements
- Architecture: HIGH - patterns verified against official Supabase and shadcn/ui docs
- Pitfalls: HIGH - common issues well-documented in official troubleshooting guides
- Korean locale utilities: HIGH - Intl API is a web standard, formatting rules specified by user
- RLS setup: MEDIUM - Prisma + RLS integration has fewer authoritative sources, community-driven patterns

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable stack, 30-day validity)
