# Phase 12: Settings Management & Polish - Research

**Researched:** 2026-03-10
**Domain:** Admin CRUD settings, CSV upload, UI polish (Next.js 15 App Router)
**Confidence:** HIGH

## Summary

Phase 12 is a straightforward admin CRUD phase that builds on well-established patterns from Phases 6, 9, and 10. The three requirements (REQ-V11-08, REQ-V11-09, REQ-V11-10) involve creating a password-gated settings page with CRUD for promo rates/subsidies/defaults, adding CSV upload to the existing inventory page, and polishing the admin UI with navigation updates, loading states, and tests.

The existing codebase provides strong patterns to follow: `residual-value` page for CRUD tables/forms, `json-adapter.ts` for data parsing, `admin-sidebar.tsx` for navigation, and `dashboard/loading.tsx` for skeletons. No new external libraries are needed -- everything can be built with the existing stack.

**Primary recommendation:** Follow existing admin CRUD patterns exactly (residual-value-form/table, force-dynamic pages, native HTML selects, vi.hoisted() test mocking) -- no architectural novelty needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-V11-08 | Settings CRUD (password gate, promo rates, subsidies, default rates) | Three new Prisma models (PromoRate, Subsidy, DefaultSetting). Follow residual-value CRUD pattern. Password stored in DefaultSetting table. |
| REQ-V11-09 | Data Management (CSV upload, validation, last update timestamp) | Extend existing inventory adapter pattern. Native CSV parsing (no library needed). Zod per-row validation. Last upload tracked in DefaultSetting. |
| REQ-V11-10 | UI Polish & Integration (nav update, loading/error states, tests) | Admin sidebar already has inventory link. Add settings link. Skeleton pattern from dashboard/loading.tsx. vi.hoisted() test pattern. |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15 | App Router, Server Actions, force-dynamic pages | Project framework |
| Prisma | 6.x | ORM for new models (PromoRate, Subsidy, DefaultSetting) | Project ORM |
| Zod | 4.x | Schema validation for settings forms and CSV rows | Project validation |
| React Hook Form | + zodResolver | Settings forms (promo rate, subsidy, default settings) | Project form pattern |
| Vitest | + happy-dom | Unit tests for schemas and actions | Project test framework |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | - | Icons for sidebar nav (Package, Settings) | Admin sidebar update |
| shadcn/ui | - | Card, Skeleton, Button components | Loading states, forms |

### No New Dependencies Needed
This phase requires zero new npm packages. CSV parsing is simple enough for native string splitting. Password hashing is unnecessary (simple string comparison against DB value is sufficient for this admin-only feature per requirements).

## Architecture Patterns

### Recommended Project Structure
```
src/features/settings/
  schemas/
    settings.ts              # Zod schemas for PromoRate, Subsidy, DefaultSetting
  actions/
    settings.ts              # CRUD server actions (getPromoRates, upsertPromoRate, etc.)
    settings-auth.ts         # verifySettingsPassword server action
  components/
    settings-auth-gate.tsx   # Password modal wrapping settings content
    promo-rate-table.tsx     # Table + inline edit (follows residual-value-table pattern)
    promo-rate-form.tsx      # Add/edit form (follows residual-value-form pattern)
    subsidy-table.tsx        # Table for subsidies
    subsidy-form.tsx         # Add/edit form for subsidies
    default-rate-form.tsx    # Editable list of default settings

src/features/inventory/
  schemas/
    inventory-upload.ts      # Zod schema for CSV row validation
  actions/
    inventory-upload.ts      # CSV parse + validate + bulk insert server action
  components/
    csv-upload-form.tsx      # File input + upload button
    upload-status.tsx        # Last update timestamp display

src/app/admin/settings/
  page.tsx                   # Settings page with tabs (promo/subsidy/defaults)
  loading.tsx                # Skeleton loader
  error.tsx                  # Error boundary
```

### Pattern 1: Admin CRUD Page (Established in Phase 6)
**What:** Server component page with force-dynamic, admin role check, Promise.all data loading, client form components with useForm + zodResolver.
**When to use:** All admin CRUD pages.
**Example (from residual-value page):**
```typescript
export const dynamic = 'force-dynamic'

export default async function AdminPage({ searchParams }: PageProps) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const [data1, data2] = await Promise.all([getData1(), getData2()])
  return <ClientForm data1={data1} data2={data2} />
}
```

### Pattern 2: Server Action with Validation (Established in Phase 6)
**What:** Server action with admin check, Zod safeParse, prisma operation, revalidatePath.
**When to use:** All mutations.
**Example:**
```typescript
'use server'
type ActionResult = { success: true } | { error: string }

export async function upsertRecord(data: Input): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return { error: '권한이 없습니다' }

  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await prisma.model.upsert({ ... })
  revalidatePath('/admin/page')
  return { success: true }
}
```

### Pattern 3: Password Gate with sessionStorage
**What:** Client component that checks sessionStorage for auth state, shows password modal if not authenticated, calls server action to verify.
**When to use:** Settings page access control.
**Key considerations:**
- sessionStorage is cleared on tab close (appropriate security level for admin settings)
- No JWT or cookie needed -- this is a secondary gate within already-authenticated admin area
- Default password "admin1234" stored in DefaultSetting table, changeable by admin

### Pattern 4: CSV Upload via FormData Server Action
**What:** File input submits FormData to server action, which parses CSV text, validates each row with Zod, and bulk inserts.
**When to use:** REQ-V11-09 inventory data upload.
**Key considerations:**
- Native CSV parsing: `text.split('\n')`, first line = headers, comma-separated values
- Korean header mapping to English field names (same mapping as json-adapter)
- Full refresh strategy: `deleteMany` + `createMany` (established in Phase 10 loadInventoryData)
- Per-row validation errors collected with row numbers for user feedback

### Pattern 5: Tabbed Admin Page via searchParams
**What:** URL searchParams `tab` controls which section is visible (promo/subsidy/defaults).
**When to use:** Settings page with multiple sections.
**Example (established in Phase 4, reused in Phase 7):**
```typescript
const params = await searchParams
const tab = params.tab || 'promo'
// Render tab buttons and matching content
```

### Anti-Patterns to Avoid
- **Don't use base-ui Select for admin forms:** Project convention is native HTML `<select>` for admin forms (simpler, established in 06-03, 11-01).
- **Don't hash the settings password:** Requirements specify simple admin password gate, not a security-critical auth system. Plain string comparison is appropriate.
- **Don't use a CSV parsing library:** The CSV structure is simple (no quoted commas, no multiline values). Native string splitting is sufficient and avoids a dependency.
- **Don't create a separate auth middleware for settings:** sessionStorage gate in the client component is the appropriate pattern -- admin is already authenticated via Supabase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod schemas + zodResolver | Already in project, handles edge cases |
| Loading skeletons | Custom pulse animations | shadcn/ui Skeleton component | Already used in dashboard/loading.tsx |
| Data tables with edit/delete | Complex table component | Follow residual-value-table inline editing pattern | Proven pattern in this project |
| Toast notifications | Custom notification system | Existing toast utility (if any) or window.alert | Keep it simple, admin-only UI |

## Common Pitfalls

### Pitfall 1: Prisma Schema Relations for New Models
**What goes wrong:** Adding PromoRate and Subsidy models without updating the Brand model's relation arrays.
**Why it happens:** Prisma requires bidirectional relation definitions.
**How to avoid:** Add `promoRates PromoRate[]` and `subsidies Subsidy[]` to the Brand model.
**Warning signs:** `yarn db:push` fails with relation error.

### Pitfall 2: CSV Column Mapping Mismatch
**What goes wrong:** CSV headers from the actual data don't match the expected Korean headers.
**Why it happens:** Different export sources may use slightly different header names.
**How to avoid:** Use flexible matching (contains check) or document the exact expected CSV format. The existing `json-adapter.ts` already defines the Korean field mapping -- reuse those exact header names.
**Warning signs:** All rows fail validation after upload.

### Pitfall 3: DefaultSetting Key Conflicts
**What goes wrong:** Multiple features try to use the same DefaultSetting keys, or the key naming is inconsistent.
**Why it happens:** DefaultSetting is a generic key-value store.
**How to avoid:** Use prefixed keys: `annual_rate`, `residual_rate`, `settings_password`, `last_inventory_upload`. Document all keys.

### Pitfall 4: Admin Sidebar Already Has Inventory Link
**What goes wrong:** Plan 12-03 adds "재고 관리" to sidebar, but it already exists (added in Phase 10).
**Why it happens:** Plans were written before Phase 10 executed.
**How to avoid:** Check the current admin-sidebar.tsx before modifying. Currently it already has `{ href: '/admin/inventory', label: '재고 관리', icon: Package }`. Only "설정 관리" needs to be added.
**Warning signs:** Duplicate menu items in sidebar.

### Pitfall 5: Zod 4 Issue Syntax
**What goes wrong:** Using `.errors` instead of `.issues` for Zod 4 validation error access.
**Why it happens:** Zod 3 used `.errors`, Zod 4 uses `.issues`.
**How to avoid:** Always use `parsed.error.issues[0].message` pattern (established in Phase 6).

### Pitfall 6: CSV Parsing Edge Cases
**What goes wrong:** Commas inside values break simple CSV splitting.
**Why it happens:** Inventory data may have commas in price fields ("25,000,000") or description fields.
**How to avoid:** The existing json-adapter already handles comma-delimited numbers with `parseNumber()`. For CSV upload, strip commas from numeric fields before parsing. Simple approach: if the data source is controlled (internal export), enforce clean CSV format.

## Code Examples

### Prisma Schema Addition (PromoRate, Subsidy, DefaultSetting)
```prisma
// Source: Plan 12-01, following existing ResidualValueRate pattern
model PromoRate {
  id        String   @id @default(uuid()) @db.Uuid
  brandId   String   @map("brand_id") @db.Uuid
  rate      Decimal  // 0.03 = 3%
  label     String?
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  brand Brand @relation(fields: [brandId], references: [id])

  @@unique([brandId])
  @@map("promo_rates")
}

model DefaultSetting {
  id        String   @id @default(uuid()) @db.Uuid
  key       String   @unique
  value     String
  label     String
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("default_settings")
}
```

### Settings Auth Gate Pattern
```typescript
// Source: Project patterns (sessionStorage + server action verification)
'use client'
import { useState, useEffect } from 'react'

export function SettingsAuthGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('settings_auth')
    if (stored === 'true') setAuthenticated(true)
  }, [])

  if (!authenticated) return <PasswordForm onSuccess={() => {
    sessionStorage.setItem('settings_auth', 'true')
    setAuthenticated(true)
  }} />

  return <>{children}</>
}
```

### CSV Upload Server Action Pattern
```typescript
// Source: Extending existing load-inventory.ts pattern
'use server'

export async function uploadInventoryCsv(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return { error: '권한이 없습니다' }

  const file = formData.get('file') as File
  if (!file) return { error: 'CSV 파일을 선택해주세요' }

  const text = await file.text()
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  // Map Korean headers -> field names, validate each row with Zod
  // deleteMany + createMany (full refresh)
}
```

### Test Pattern (vi.hoisted for mocking)
```typescript
// Source: Project convention from Phase 2+
import { describe, it, expect, vi } from 'vitest'

const { mockPrisma, mockGetCurrentUser } = vi.hoisted(() => ({
  mockPrisma: { promoRate: { findMany: vi.fn(), upsert: vi.fn(), delete: vi.fn() } },
  mockGetCurrentUser: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth/helpers', () => ({ getCurrentUser: mockGetCurrentUser }))
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm install | yarn add | Project inception | All package operations use yarn |
| Zod .errors | Zod .issues | Zod 4 (Phase 3+) | Use .issues[0].message for error access |
| base-ui Select | Native HTML select | Phase 6 decision | Admin forms use native select for simplicity |
| jsdom | happy-dom | Phase 1 | ESM compatibility in vitest |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + happy-dom |
| Config file | vitest.config.mts |
| Quick run command | `yarn test --reporter=verbose` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-V11-08 | PromoRate schema validation | unit | `yarn test tests/unit/features/settings/settings-actions.test.ts -x` | Wave 0 |
| REQ-V11-08 | Subsidy schema validation | unit | `yarn test tests/unit/features/settings/settings-actions.test.ts -x` | Wave 0 |
| REQ-V11-08 | DefaultSetting schema validation | unit | `yarn test tests/unit/features/settings/settings-actions.test.ts -x` | Wave 0 |
| REQ-V11-08 | Password verification logic | unit | `yarn test tests/unit/features/settings/settings-actions.test.ts -x` | Wave 0 |
| REQ-V11-09 | CSV row schema validation | unit | `yarn test tests/unit/features/inventory/inventory-upload.test.ts -x` | Wave 0 |
| REQ-V11-09 | CSV header mapping | unit | `yarn test tests/unit/features/inventory/inventory-upload.test.ts -x` | Wave 0 |
| REQ-V11-10 | Build succeeds | smoke | `yarn build` | N/A |
| REQ-V11-10 | Type check passes | smoke | `yarn type-check` | N/A |

### Sampling Rate
- **Per task commit:** `yarn type-check && yarn test --reporter=verbose`
- **Per wave merge:** `yarn test && yarn build`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `tests/unit/features/settings/settings-actions.test.ts` -- covers REQ-V11-08 (schema validation, password auth)
- [ ] `tests/unit/features/inventory/inventory-upload.test.ts` -- covers REQ-V11-09 (CSV row validation, header mapping)

*(Both test files are created in Plan 12-03, Wave 2)*

## Open Questions

1. **CSV Format Strictness**
   - What we know: The existing json-adapter uses Korean headers for field mapping. CSV upload should use the same headers.
   - What's unclear: Whether real CSV exports will have quoted fields, BOM characters (UTF-8 with BOM is common in Korean Excel exports), or different line endings (CRLF vs LF).
   - Recommendation: Handle CRLF line endings (`text.replace(/\r\n/g, '\n')`). Strip BOM if present (`text.replace(/^\uFEFF/, '')`). These are one-liners.

2. **Settings Password Security Level**
   - What we know: Requirements say "관리자 비밀번호로 접근 제한" -- a simple password gate.
   - What's unclear: Whether plain text storage is acceptable long-term.
   - Recommendation: Plain text in DefaultSetting table is fine for MVP. This is a secondary gate within an already-authenticated admin area. If needed later, bcrypt can be added.

## Sources

### Primary (HIGH confidence)
- Project codebase: `prisma/schema.prisma` -- current DB schema with InventoryItem model
- Project codebase: `src/app/admin/residual-value/page.tsx` -- CRUD page pattern
- Project codebase: `src/features/inventory/actions/load-inventory.ts` -- deleteMany + createMany pattern
- Project codebase: `src/features/inventory/adapters/json-adapter.ts` -- Korean field mapping
- Project codebase: `src/components/layout/admin-sidebar.tsx` -- current nav items (already has inventory)
- Project codebase: `src/app/admin/dashboard/loading.tsx` -- Skeleton loading pattern
- Project codebase: `vitest.config.mts` -- test configuration
- Project codebase: `tests/unit/features/inventory/json-adapter.test.ts` -- test pattern

### Secondary (MEDIUM confidence)
- Existing Plan files (12-01, 12-02, 12-03) -- detailed task specifications already written

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project, no new dependencies
- Architecture: HIGH - all patterns established in prior phases (6, 9, 10)
- Pitfalls: HIGH - identified from actual codebase analysis (sidebar duplication, Zod 4 syntax, CSV edge cases)

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable -- internal patterns, no external dependency changes)
