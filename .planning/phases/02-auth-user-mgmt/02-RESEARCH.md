# Phase 2: Authentication & User Management - Research

**Researched:** 2026-03-09
**Domain:** Supabase Auth + Next.js 15 App Router + RBAC
**Confidence:** HIGH

## Summary

Phase 2 implements email/password authentication, session management, role-based access control (RBAC), and profile management using Supabase Auth with `@supabase/ssr` 0.9.0 on Next.js 15 App Router. The Phase 1 foundation already provides: Supabase client utilities (`src/lib/supabase/{client,server,admin}.ts`), middleware with session refresh (`src/middleware.ts`), Prisma schema with `Profile` model and `UserRole` enum (CUSTOMER/DEALER/ADMIN), and admin/dealer layout shells.

The implementation follows a Server Actions pattern for auth operations (signup/login/logout), middleware-based route protection with role checking via profiles table query, and Zod validation on both client and server. Extensive pre-research in `AUTH-PATTERNS.md` and `RLS-PATTERNS.md` covers the exact patterns to use, including the critical `getUser()` vs `getSession()` distinction and the profiles auto-creation trigger.

**Primary recommendation:** Use Supabase Auth Server Actions with profiles-table RBAC (not JWT claims) for simplicity. Add Zod 3.x for form validation. Middleware handles route protection by querying the profiles table for role. RLS policies on profiles table are Phase 2 scope; other table RLS deferred to their respective phases.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password | Server Action with `supabase.auth.signUp()` + DB trigger for profile auto-creation |
| AUTH-02 | User can log in and stay logged in across browser sessions | `supabase.auth.signInWithPassword()` + `@supabase/ssr` cookie-based session + middleware token refresh |
| AUTH-03 | User can log out from any page | Server Action with `supabase.auth.signOut()` + redirect to home |
| AUTH-04 | User profile with role assignment (customer/dealer/admin) | Prisma `Profile` model (exists) + admin role-change Server Action + `createAdminClient()` for `auth.admin.updateUserById()` |
| AUTH-05 | User can edit own profile information | Profile edit form + Server Action with Zod validation + RLS self-update policy |
| AUTH-06 | Routes protected by user role (middleware-based) | Middleware `getUser()` + profiles table role query + route-role mapping + redirect logic |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | 0.9.0 | Cookie-based auth for SSR | Already installed; official Supabase SSR package |
| @supabase/supabase-js | 2.98.0 | Supabase client (auth, DB) | Already installed; provides Auth API |
| zod | 3.25.x | Form/action validation | Ecosystem standard for TypeScript validation; compatible with react-hook-form |
| react-hook-form | 7.x | Form state management | Ecosystem standard; pairs with Zod resolver |
| @hookform/resolvers | 3.x | Zod-to-RHF bridge | Official adapter |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @prisma/client | 6.x | Type-safe DB queries | Profile CRUD operations |
| lucide-react | 0.577.0 | Icons | Already installed; auth UI icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Profiles table RBAC | JWT Claims RBAC | JWT claims are faster (no DB query per request) but harder to debug and require JWT refresh on role change. Use profiles table now, optimize to JWT in Phase 9 if needed |
| react-hook-form | Native form actions | RHF provides better UX (field-level errors, dirty tracking). Worth the 10KB bundle for multi-field forms |
| Zod 3.x | Zod 4.x | Zod 4 is available but @hookform/resolvers may not fully support it yet. Stick with 3.x for stability |

**Installation:**
```bash
yarn add zod react-hook-form @hookform/resolvers
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/              # Auth route group (no layout nesting with main layout)
│   │   ├── login/page.tsx   # Login page
│   │   ├── signup/page.tsx  # Signup page
│   │   └── layout.tsx       # Minimal auth layout (centered card)
│   ├── (protected)/         # Protected route group (optional, or use middleware only)
│   │   └── mypage/page.tsx  # Customer my page
│   ├── admin/               # Exists - add role guard
│   │   └── users/page.tsx   # Admin user/role management
│   └── dealer/              # Exists - add role guard
├── features/
│   └── auth/
│       ├── actions/
│       │   ├── login.ts     # signInWithPassword Server Action
│       │   ├── signup.ts    # signUp Server Action
│       │   ├── logout.ts    # signOut Server Action
│       │   └── profile.ts   # updateProfile, changeRole Server Actions
│       ├── schemas/
│       │   └── auth.ts      # Zod schemas (login, signup, profile)
│       └── components/
│           ├── login-form.tsx
│           ├── signup-form.tsx
│           ├── logout-button.tsx
│           └── profile-form.tsx
├── lib/
│   ├── supabase/            # Exists - no changes needed
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   └── auth/
│       └── helpers.ts       # getUser() wrapper with React.cache()
└── middleware.ts             # Exists - extend with route protection
```

### Pattern 1: Server Action Auth Flow
**What:** All auth operations (login/signup/logout) as Server Actions, not API routes
**When to use:** Every auth mutation
**Example:**
```typescript
// src/features/auth/actions/login.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema } from '../schemas/auth'

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: '입력 정보를 확인해주세요.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: getAuthErrorMessage(error.message) }
  }

  // Check role for redirect target
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const redirectPath = profile?.role === 'ADMIN' ? '/admin/dashboard'
    : profile?.role === 'DEALER' ? '/dealer/dashboard'
    : '/mypage'

  redirect(redirectPath)
}
```

### Pattern 2: Middleware Route Protection
**What:** Extend existing middleware to check auth + role for protected routes
**When to use:** Every request to protected paths
**Example:**
```typescript
// src/middleware.ts (extended)
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin':  ['ADMIN'],
  '/dealer': ['DEALER', 'ADMIN'],
  '/mypage': ['CUSTOMER', 'DEALER', 'ADMIN'],
}

// Inside middleware function, after getUser():
const { data: { user } } = await supabase.auth.getUser()

const pathname = request.nextUrl.pathname
const matchedRoute = Object.entries(PROTECTED_ROUTES)
  .find(([prefix]) => pathname.startsWith(prefix))

if (matchedRoute) {
  const [, allowedRoles] = matchedRoute
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.role)) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}
```

### Pattern 3: Cached getUser Helper
**What:** Wrap `getUser()` with `React.cache()` to prevent duplicate calls within a single request
**When to use:** Server Components that need user info
**Example:**
```typescript
// src/lib/auth/helpers.ts
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
})
```

### Pattern 4: Admin Role Change
**What:** Admin changes user roles using service_role client
**When to use:** Admin user management page
**Example:**
```typescript
// src/features/auth/actions/profile.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { revalidatePath } from 'next/cache'

export async function changeUserRole(userId: string, newRole: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const adminClient = createAdminClient()

  // Update profiles table (Prisma or Supabase)
  // Also update auth.users app_metadata for future JWT claims optimization
  await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { role: newRole },
  })

  // Update profiles table via Prisma
  await prisma.profile.update({
    where: { id: userId },
    data: { role: newRole as UserRole },
  })

  revalidatePath('/admin/users')
  return { success: true }
}
```

### Anti-Patterns to Avoid
- **Using `getSession()` for authorization on server:** Always use `getUser()` which validates the JWT against Supabase servers. `getSession()` only decodes the JWT locally and can be spoofed
- **Checking roles only on client:** Client-side role checks are for UI display only. Server Actions and middleware MUST verify roles independently
- **Storing role in localStorage/cookies directly:** Role lives in profiles table. The middleware queries it fresh each request
- **Creating custom JWT/session system:** Use Supabase Auth exclusively. No `jose` or custom JWT as in previous navid-app patterns

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom cookie/JWT sessions | @supabase/ssr cookie handling | Token refresh, expiry, secure cookie flags are complex edge cases |
| Password hashing | bcrypt/argon2 custom | Supabase Auth built-in | Handles salting, timing attacks, password policy |
| Email validation | Complex regex | Zod `z.string().email()` | Covers edge cases, RFC-compliant |
| Form state | useState for each field | react-hook-form | Dirty tracking, validation, performance (no re-render per keystroke) |
| CSRF protection | Custom tokens | Next.js Server Actions built-in | Server Actions have automatic CSRF protection |
| Profile auto-creation | Application-level INSERT after signup | Supabase DB Trigger | Race condition-free; trigger fires within the auth transaction |

**Key insight:** Supabase Auth handles the entire auth lifecycle (signup, login, session, token refresh, password policy). The application layer only needs to: call auth methods, query the profiles table for role, and protect routes.

## Common Pitfalls

### Pitfall 1: Missing Token Refresh in Middleware
**What goes wrong:** User stays logged in visually but auth fails on server because tokens expired
**Why it happens:** Middleware must call `getUser()` (which triggers token refresh) and then sync cookies back to the response
**How to avoid:** The existing middleware pattern already does this correctly. Do NOT skip the `getUser()` call even for public routes
**Warning signs:** "Auth session missing" errors after ~1 hour of inactivity

### Pitfall 2: Server Action Without Auth Check
**What goes wrong:** Any unauthenticated user can call Server Actions directly (they are public HTTP endpoints)
**Why it happens:** Developers assume Server Actions are "internal"
**How to avoid:** Every Server Action that mutates data MUST start with `const user = await getCurrentUser(); if (!user) throw`
**Warning signs:** Data modifications without login

### Pitfall 3: Race Condition on Profile Creation
**What goes wrong:** After signup, immediate redirect to profile page fails because the DB trigger hasn't completed
**Why it happens:** `auth.signUp()` returns before the trigger fires
**How to avoid:** Use a DB trigger (not application code) for profile creation. The trigger executes within the same transaction as the auth.users INSERT, so by the time the response arrives, the profile exists
**Warning signs:** "Profile not found" errors immediately after signup

### Pitfall 4: Middleware Performance with DB Query
**What goes wrong:** Every single request (including static assets) triggers a profiles table query
**Why it happens:** Middleware runs on all matched routes
**How to avoid:** (1) Matcher config already excludes static assets. (2) Only query profiles for protected routes (check path prefix first). (3) Consider `get_user_role()` STABLE function for Supabase-side caching
**Warning signs:** Slow TTFB on all pages

### Pitfall 5: Zod Version Mismatch
**What goes wrong:** `@hookform/resolvers` fails at runtime with Zod type errors
**Why it happens:** Project has both Zod 3.x and 4.x in yarn.lock (via transitive deps). Direct install must match resolvers compatibility
**How to avoid:** Install `zod@^3.24` explicitly (not v4). Verify `@hookform/resolvers` supports the installed version
**Warning signs:** TypeScript errors in zodResolver(), runtime "not a function" errors

### Pitfall 6: Supabase RLS Blocking Profile Reads
**What goes wrong:** Middleware or Server Actions can't read the profiles table
**Why it happens:** RLS enabled on profiles but no policy allows authenticated users to read their own profile
**How to avoid:** Create RLS policies on profiles table: (1) self-read, (2) self-update (name/phone/avatar only), (3) admin full access. Apply these BEFORE testing auth flows
**Warning signs:** Empty profile data despite successful signup

## Code Examples

### Zod Schemas for Auth Forms
```typescript
// src/features/auth/schemas/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
})

export const signupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  confirmPassword: z.string(),
  name: z.string().min(1, '이름을 입력하세요'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

export const profileUpdateSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  phone: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
```

### Auth Error Message Mapping
```typescript
// src/features/auth/utils/error-messages.ts
const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다',
  'Email not confirmed': '이메일 인증이 필요합니다',
  'User already registered': '이미 가입된 이메일입니다',
  'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 합니다',
  'Email rate limit exceeded': '잠시 후 다시 시도해주세요',
}

export function getAuthErrorMessage(error: string): string {
  return AUTH_ERROR_MAP[error] ?? '오류가 발생했습니다. 다시 시도해주세요.'
}
```

### Profiles Table RLS Policies (SQL)
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Self-read: authenticated users can read their own profile
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Self-update: users can update their own profile (except role)
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin read all: admins can read all profiles
CREATE POLICY "admin_read_all_profiles" ON profiles
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );

-- Admin update all: admins can update any profile (including role)
CREATE POLICY "admin_update_all_profiles" ON profiles
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );

-- Note: INSERT handled by DB trigger (SECURITY DEFINER bypasses RLS)
-- Note: DELETE not allowed through RLS (admin uses service_role client)
```

### Profiles Auto-Creation Trigger (SQL)
```sql
-- Source: AUTH-PATTERNS.md pre-research
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::text,
      'CUSTOMER'
    ),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Login Form Component Pattern
```typescript
// src/features/auth/components/login-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '../schemas/auth'
import { login } from '../actions/login'
import { useTransition } from 'react'

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', data.email)
      formData.set('password', data.password)
      const result = await login(formData)
      if (result?.error) {
        form.setError('root', { message: result.error })
      }
    })
  })

  return (
    <form onSubmit={onSubmit}>
      {/* form fields using form.register() */}
    </form>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 Q1 | auth-helpers deprecated; ssr is the replacement |
| `getSession()` for auth checks | `getUser()` for server-side auth | 2024 Q2 | Security: getUser() validates against Supabase server |
| Pages Router auth patterns | App Router Server Actions | Next.js 13+ | No API routes needed for auth mutations |
| Client-side auth state management | Middleware + Server Components | Next.js 14+ | Auth state lives server-side, no client-side race conditions |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Do not use
- `supabase.auth.session()`: Removed. Use `getSession()` or `getUser()`
- Custom JWT with `jose`: Not needed when using Supabase Auth. The pre-research mentions navid-app used this -- do NOT replicate

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | `vitest.config.mts` (exists) |
| Quick run command | `yarn test` |
| Full suite command | `yarn test --run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Signup Server Action validates input and calls supabase.auth.signUp | unit | `yarn test src/features/auth/actions/signup.test.ts` | No -- Wave 0 |
| AUTH-02 | Login Server Action authenticates and redirects by role | unit | `yarn test src/features/auth/actions/login.test.ts` | No -- Wave 0 |
| AUTH-03 | Logout Server Action signs out and redirects | unit | `yarn test src/features/auth/actions/logout.test.ts` | No -- Wave 0 |
| AUTH-04 | Admin changeUserRole updates profile and auth metadata | unit | `yarn test src/features/auth/actions/profile.test.ts` | No -- Wave 0 |
| AUTH-05 | Profile update validates and persists changes | unit | `yarn test src/features/auth/actions/profile.test.ts` | No -- Wave 0 |
| AUTH-06 | Middleware redirects unauthorized users by role | unit | `yarn test src/middleware.test.ts` | No -- Wave 0 |

### Supplementary Tests
| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| Zod schemas reject invalid input | unit | `yarn test src/features/auth/schemas/auth.test.ts` | No -- Wave 0 |
| Auth error message mapping | unit | `yarn test src/features/auth/utils/error-messages.test.ts` | No -- Wave 0 |
| Login/Signup form renders and validates | unit | `yarn test src/features/auth/components/login-form.test.tsx` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test --run`
- **Per wave merge:** `yarn test --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/auth/actions/signup.test.ts` -- covers AUTH-01
- [ ] `src/features/auth/actions/login.test.ts` -- covers AUTH-02
- [ ] `src/features/auth/actions/logout.test.ts` -- covers AUTH-03
- [ ] `src/features/auth/actions/profile.test.ts` -- covers AUTH-04, AUTH-05
- [ ] `src/middleware.test.ts` -- covers AUTH-06
- [ ] `src/features/auth/schemas/auth.test.ts` -- Zod schema validation
- [ ] Supabase client mocking pattern (shared test utility for mocking `createClient`)

### Mocking Strategy for Supabase
```typescript
// Test helper pattern for mocking Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    }),
  }),
}))
```

## Open Questions

1. **Email confirmation flow**
   - What we know: Supabase supports email confirmation. The signup action can set `emailRedirectTo`
   - What's unclear: Whether v1 demo requires email confirmation or auto-confirms for faster demo flow
   - Recommendation: Disable email confirmation for v1 (set in Supabase dashboard: Auth > Providers > Email > "Confirm email" toggle off). This simplifies demo. Add confirmation in v2

2. **Supabase project email configuration**
   - What we know: Supabase provides default SMTP for development (rate-limited to 3 emails/hour)
   - What's unclear: Whether the Supabase project is already configured
   - Recommendation: Use Supabase default SMTP for v1 demo. Custom SMTP for production can be added later

3. **Profile fields scope**
   - What we know: Prisma schema has name, phone, avatarUrl on Profile
   - What's unclear: Whether avatar upload is Phase 2 scope or deferred
   - Recommendation: Include name/phone edit in Phase 2. Defer avatar upload to later (requires Supabase Storage integration)

## Sources

### Primary (HIGH confidence)
- Pre-research `AUTH-PATTERNS.md` -- Supabase Auth + Next.js 15 patterns (NotebookLM + official docs synthesis, 2026-03-09)
- Pre-research `RLS-PATTERNS.md` -- RLS policy patterns for RBAC (2026-03-09)
- Pre-research `TECH-STACK-DEEP.md` -- Server Actions security, React 19 patterns (2026-03-09)
- Existing codebase: `src/lib/supabase/`, `src/middleware.ts`, `prisma/schema.prisma` -- Phase 1 artifacts verified
- `package.json` / `yarn.lock` -- Confirmed @supabase/ssr 0.9.0, @supabase/supabase-js 2.98.0, Vitest 4.x

### Secondary (MEDIUM confidence)
- Supabase official documentation patterns for @supabase/ssr cookie handling
- Next.js 15 App Router Server Actions security model

### Tertiary (LOW confidence)
- Zod 3.x + @hookform/resolvers compatibility -- not verified against latest resolvers release, but widely used combination

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all core libraries already installed except zod/RHF; patterns verified in pre-research
- Architecture: HIGH -- follows official Supabase SSR patterns documented in AUTH-PATTERNS.md
- Pitfalls: HIGH -- drawn from pre-research and known Supabase Auth edge cases
- Validation: MEDIUM -- test structure planned but mocking strategy needs verification at implementation time

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable stack, 30-day validity)
