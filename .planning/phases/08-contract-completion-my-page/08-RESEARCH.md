# Phase 8: Contract Completion & My Page - Research

**Researched:** 2026-03-10
**Domain:** PDF generation (Korean), customer dashboard UI
**Confidence:** HIGH

## Summary

Phase 8 adds two capabilities: (1) server-side contract PDF generation with Korean text support, and (2) a customer my page showing contract history with status filtering and PDF download. The primary technical challenge is PDF generation with Korean fonts in a Vercel serverless environment.

After evaluating jsPDF, pdfmake, PDFKit, and @react-pdf/renderer, the recommendation is **@react-pdf/renderer** for its JSX-based API (aligns with the React/Next.js stack), proven Korean font support via TTF registration (Nanum Gothic), and `renderToBuffer()` compatibility with Next.js 15+ when React 19 is used (this project runs React 19.2.3 + Next.js 16.1.6). The library requires `serverExternalPackages` configuration in next.config.ts to avoid "PDFDocument is not a constructor" errors in API routes.

The my page implementation reuses existing patterns: searchParams-based tab filtering (Phase 4 admin pattern), ContractStatusBadge component, and Supabase Realtime subscription for live status updates. No new libraries are needed beyond @react-pdf/renderer.

**Primary recommendation:** Use @react-pdf/renderer v4.x with Nanum Gothic TTF for server-side PDF generation via Next.js API route, streaming the response directly without Supabase Storage.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- PDF content format: Rental/lease shared template with type indicator; lease-only residual value section
- PDF structure: Contract body (parties/vehicle/terms/payment) + signature area (reference: Wellix competitor)
- My page contract list: Compact card layout with vehicle name + contract type badge + status badge + monthly payment + period
- Card click navigates to existing /contracts/[id] detail page
- Status filter tabs: "All" / "In Progress" / "Completed" / "Canceled" (reuse Phase 4 admin searchParams tab pattern)
- Download strategy: On-demand real-time generation (no Storage), API route streaming response
- Navid PDF scope: 1-2 pages of core info (not 12 pages like competitor)

### Claude's Discretion
- PDF generation library selection (react-pdf, jsPDF etc -- Vercel serverless + Korean support criteria)
- Server-side vs client-side rendering location
- Vercel 10-second timeout mitigation strategy
- PDF security level (watermark, download auth)
- PDF branding level (logo, colors, fonts -- per design system)
- PDF content scope (core only vs terms included)
- PDF filename pattern
- PDF download permission scope (self only vs dealer/admin)
- My page layout (tabs vs single page)
- Download button location and UX (detail fixed CTA vs also from list)
- Empty state design and CTA
- PDF generation error UX
- Post-contract-submit redirect destination (Phase 7 flow modification)
- Mobile PDF download UX
- Mobile card layout
- Contract status change notification (Realtime scope)

### Deferred Ideas (OUT OF SCOPE)
- PDF password protection / electronic signature (v2 INTG-V2-02 Modusign)
- Full terms text in PDF (21 clauses) (v2 legal review)
- Personal info collection consent PDF (v2)
- Customer/company dual copy printing (v2)
- Email notification on contract approval (v2 UIEX-V2-02)
- PDF storage management via Supabase Storage (v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-03 | Contract PDF auto-generation with all contract details | @react-pdf/renderer with Nanum Gothic TTF font, Next.js API route with renderToBuffer(), streaming response |
| CONT-04 | Contract status tracking on customer my page | Prisma queries for customer's rental + lease contracts, searchParams tab filtering, ContractStatusBadge reuse |
| UIEX-03 | My page with contract list and PDF download | Expand existing mypage with contract cards, download button linking to PDF API route |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-pdf/renderer | ^4.3.2 | Server-side PDF generation | JSX API matches React stack, Korean TTF support proven, renderToBuffer() works with React 19 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | (existing) | Icons for download button, empty state | Already installed |
| nuqs | (existing) | URL-based tab state for status filter | Already installed, used in Phase 5 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-pdf/renderer | jsPDF | jsPDF requires manual coordinate positioning; harder to maintain complex layouts; CJK font setup more verbose (base64 encoding) |
| @react-pdf/renderer | pdfmake | VFS font system has documented Vercel deployment issues; "hardly trackable errors" on backend per community reports |
| @react-pdf/renderer | PDFKit | Lower-level API; no JSX; more code for same result |

**Installation:**
```bash
yarn add @react-pdf/renderer
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/contracts/[id]/pdf/
│   │   └── route.ts              # PDF generation API route
│   └── (protected)/mypage/
│       └── page.tsx              # Expanded my page (profile + contracts)
├── features/contracts/
│   ├── components/
│   │   ├── contract-card.tsx     # Compact card for my page list
│   │   ├── contract-list.tsx     # Client component with filter tabs
│   │   └── contract-pdf.tsx      # React-PDF document template
│   ├── actions/
│   │   └── get-my-contracts.ts   # Server action or data fetch
│   └── types/index.ts           # Extend with PDF-related types
└── lib/
    └── pdf/
        └── fonts.ts              # Font registration (Nanum Gothic TTF)
```

### Pattern 1: Server-Side PDF Generation via API Route
**What:** Next.js route handler that fetches contract data, renders PDF with @react-pdf/renderer, and streams the buffer as a response.
**When to use:** On-demand PDF download requests.
**Example:**
```typescript
// src/app/api/contracts/[id]/pdf/route.ts
import { renderToBuffer } from '@react-pdf/renderer'
import { ContractPDF } from '@/features/contracts/components/contract-pdf'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // 1. Auth check (getCurrentUser)
  // 2. Fetch contract with vehicle details
  // 3. Ownership check
  // 4. Render PDF
  const buffer = await renderToBuffer(<ContractPDF data={contractData} />)

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="navid-contract-${id.slice(0,8)}.pdf"`,
    },
  })
}
```

### Pattern 2: Korean Font Registration
**What:** Register Nanum Gothic TTF for @react-pdf/renderer Korean text rendering.
**When to use:** Must be called before any PDF render.
**Example:**
```typescript
// src/lib/pdf/fonts.ts
import { Font } from '@react-pdf/renderer'

// Register Korean font -- TTF only (OTF/WOFF not supported)
Font.register({
  family: 'NanumGothic',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Bold.ttf',
      fontWeight: 700,
    },
  ],
})
```

### Pattern 3: Unified Contract Query (Rental + Lease)
**What:** Fetch both rental and lease contracts for a customer, normalize into a single list.
**When to use:** My page contract list.
**Example:**
```typescript
// Parallel fetch for both contract types
const [rentals, leases] = await Promise.all([
  prisma.rentalContract.findMany({
    where: { customerId: userId },
    include: contractInclude,
    orderBy: { createdAt: 'desc' },
  }),
  prisma.leaseContract.findMany({
    where: { customerId: userId },
    include: contractInclude,
    orderBy: { createdAt: 'desc' },
  }),
])

// Normalize into unified list with type discriminator
const contracts = [
  ...rentals.map(c => ({ ...c, contractType: 'RENTAL' as const })),
  ...leases.map(c => ({ ...c, contractType: 'LEASE' as const })),
].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
```

### Pattern 4: Status Filter Tabs (searchParams pattern)
**What:** Reuse Phase 4 admin searchParams tab pattern for contract status filtering.
**When to use:** My page status filter.
**Example:**
```typescript
// URL: /mypage?tab=active
const STATUS_FILTERS = {
  all: undefined,
  active: ['DRAFT', 'PENDING_EKYC', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE'],
  completed: ['COMPLETED'],
  canceled: ['CANCELED'],
} as const
```

### Anti-Patterns to Avoid
- **Client-side PDF generation:** Korean font files are 3-5MB; loading them in the browser wastes bandwidth and exposes internal data. Use server-side only.
- **Storing generated PDFs:** The decision is on-demand generation. Don't add Supabase Storage complexity.
- **Sequential contract queries:** Always use Promise.all() for rental + lease contract fetches.
- **Variable font files:** @react-pdf/renderer does NOT support OpenType variable fonts. Must use static TTF weight files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom canvas/HTML-to-PDF | @react-pdf/renderer | Font subsetting, layout engine, page breaks |
| Korean currency formatting | Manual string formatting | Existing formatKRW() | Already handles commas, won symbol, monthly prefix |
| Korean date formatting | Manual date strings | Existing formatDate() | Already handles "YYYY년 M월 D일" format |
| Status badges | Custom badge component | Existing ContractStatusBadge | Already has Korean labels + color mapping |
| Status filtering | Custom filter logic | Existing searchParams tab pattern | Phase 4 admin pattern, proven and tested |
| Realtime updates | Polling / manual refresh | Existing useContractRealtime hook | Already subscribed to rental_contracts + lease_contracts |

**Key insight:** Most UI primitives for this phase already exist from Phases 4 and 7. The only genuinely new code is the PDF template and the my page contract list component.

## Common Pitfalls

### Pitfall 1: @react-pdf/renderer "PDFDocument is not a constructor" in API Routes
**What goes wrong:** Next.js API routes use the "react-server" condition, which provides a limited React build missing internal APIs that react-reconciler needs.
**Why it happens:** Next.js module resolution for server components vs API routes differs.
**How to avoid:** Add `serverExternalPackages: ['@react-pdf/renderer']` to next.config.ts. This project uses React 19.2.3, which should resolve the issue, but the config is still recommended as a safety measure.
**Warning signs:** HTTP 500 errors on PDF endpoint with cryptic constructor errors.

### Pitfall 2: Korean Font Not Rendering (Blank/Tofu Characters)
**What goes wrong:** PDF shows empty boxes or missing characters for Korean text.
**Why it happens:** Using OTF, WOFF, or variable font files instead of static TTF files.
**How to avoid:** Use only TTF format fonts. Nanum Gothic TTF from Google Fonts gstatic CDN is proven to work. Register fonts BEFORE any render call.
**Warning signs:** PDF generates successfully but Korean text appears as rectangles or is missing.

### Pitfall 3: Vercel Serverless Timeout (10s on Hobby Plan)
**What goes wrong:** PDF generation exceeds function timeout, returning 504.
**Why it happens:** Font download on cold start + PDF rendering can take several seconds.
**How to avoid:** Keep PDF to 1-2 pages (already decided). Consider caching font in memory between invocations (Vercel reuses warm instances). Font URLs from Google's CDN are fast. If still an issue, bundle font file in the deployment.
**Warning signs:** Intermittent 504 errors, especially on first request after deploy.

### Pitfall 4: Dual Contract Model Complexity
**What goes wrong:** Code duplication or type errors when handling RentalContract vs LeaseContract.
**Why it happens:** Prisma generates separate types for separate models. No union type in schema.
**How to avoid:** Create a normalized `ContractListItem` type that merges common fields + contractType discriminator. Handle lease-specific fields (residualValue, residualRate) as optional.
**Warning signs:** Repeated if/else blocks for contract type throughout components.

### Pitfall 5: PDF Download Not Working on Mobile Safari
**What goes wrong:** Download doesn't trigger or opens in browser instead.
**Why it happens:** Mobile Safari handles `Content-Disposition: attachment` differently.
**How to avoid:** Use `Content-Disposition: inline` as fallback for mobile; let the browser's built-in PDF viewer handle it. Alternatively, open PDF in new tab with `target="_blank"`.
**Warning signs:** Users on iOS report "nothing happens" when clicking download.

## Code Examples

### Contract PDF Document Template
```typescript
// src/features/contracts/components/contract-pdf.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import '@/lib/pdf/fonts' // Side-effect: registers Korean fonts

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'NanumGothic', fontSize: 10 },
  header: { fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 20 },
  section: { marginBottom: 12 },
  row: { flexDirection: 'row', borderBottom: '1px solid #e5e7eb', paddingVertical: 6 },
  label: { width: '30%', color: '#6b7280', fontWeight: 700 },
  value: { width: '70%' },
})

type ContractPDFProps = {
  data: {
    contractType: 'RENTAL' | 'LEASE'
    vehicleName: string
    vehicleYear: number
    // ... all contract fields
  }
}

export function ContractPDF({ data }: ContractPDFProps) {
  const title = data.contractType === 'RENTAL' ? '렌탈 계약서' : '리스 계약서'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with title */}
        <Text style={styles.header}>{title}</Text>

        {/* Contract parties section */}
        <View style={styles.section}>
          {/* ... party info rows */}
        </View>

        {/* Vehicle info section */}
        <View style={styles.section}>
          {/* ... vehicle detail rows */}
        </View>

        {/* Contract terms section */}
        <View style={styles.section}>
          {/* ... terms rows */}
        </View>

        {/* Lease-only: residual value */}
        {data.contractType === 'LEASE' && (
          <View style={styles.section}>
            {/* ... residual value rows */}
          </View>
        )}

        {/* Signature area */}
        <View style={{ marginTop: 40 }}>
          {/* ... date + signature lines */}
        </View>
      </Page>
    </Document>
  )
}
```

### next.config.ts Update
```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  images: { /* existing config */ },
}
```

### Contract Card Component Pattern
```typescript
// Compact card for my page list
<div className="flex items-center justify-between rounded-lg border p-4">
  <div className="flex items-center gap-3">
    {/* Vehicle thumbnail */}
    <div className="relative size-12 overflow-hidden rounded-md bg-muted">
      <Image src={imageUrl} alt={vehicleName} fill className="object-cover" />
    </div>
    <div>
      <p className="font-medium">{vehicleName}</p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{contractType === 'RENTAL' ? '렌탈' : '리스'}</span>
        <span>|</span>
        <span>{formatKRW(monthlyPayment, { monthly: true })}</span>
      </div>
    </div>
  </div>
  <div className="flex items-center gap-3">
    <ContractStatusBadge status={status} />
    {/* Download button - only for approved+ status */}
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Puppeteer/Chromium PDF | @react-pdf/renderer | 2023+ | No headless browser needed in serverless; fits in 50MB limit |
| Client-side jsPDF | Server-side @react-pdf/renderer | 2024+ | Better security, no font download on client |
| Storing PDFs in blob storage | On-demand generation | Current | Simpler architecture, always reflects latest data |

**Deprecated/outdated:**
- `renderToFile()` from @react-pdf/renderer: Use `renderToBuffer()` for API route responses
- Google Fonts CSS import for PDF: Must use direct TTF file URLs, not CSS @font-face

## Open Questions

1. **Font Bundling vs CDN**
   - What we know: Nanum Gothic TTF works from gstatic CDN URL
   - What's unclear: Cold start latency when font is fetched from CDN vs bundled in deployment
   - Recommendation: Start with CDN; if timeouts occur, bundle TTF files in `public/fonts/` and reference locally

2. **PDF Download Permission Scope**
   - What we know: Customer must download own contracts; admin can see all
   - What's unclear: Should dealers also download contracts for their vehicles?
   - Recommendation: Allow customer (own) + admin (all) for v1; dealer access can be added later

3. **Contract Wizard Redirect Target**
   - What we know: Phase 7 redirects to vehicle detail after submission
   - What's unclear: Whether to change redirect to /mypage or /contracts/[id]
   - Recommendation: Redirect to /contracts/[id]?type={TYPE} (existing detail page) -- user sees status tracker immediately

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.x + happy-dom |
| Config file | vitest.config.mts |
| Quick run command | `yarn test` |
| Full suite command | `yarn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-03 | PDF generation produces valid buffer with Korean text | unit | `yarn vitest run src/features/contracts/components/contract-pdf.test.tsx -t "generates PDF"` | No -- Wave 0 |
| CONT-03 | PDF API route returns 200 with correct content-type | integration | `yarn vitest run src/app/api/contracts/pdf.test.ts` | No -- Wave 0 |
| CONT-03 | PDF API route rejects unauthorized access | unit | `yarn vitest run src/app/api/contracts/pdf.test.ts -t "unauthorized"` | No -- Wave 0 |
| CONT-04 | My page fetches and displays both rental + lease contracts | unit | `yarn vitest run src/features/contracts/components/contract-list.test.tsx` | No -- Wave 0 |
| CONT-04 | Status filter tabs filter contracts correctly | unit | `yarn vitest run src/features/contracts/components/contract-list.test.tsx -t "filter"` | No -- Wave 0 |
| UIEX-03 | Contract card renders vehicle name, type badge, status, amount | unit | `yarn vitest run src/features/contracts/components/contract-card.test.tsx` | No -- Wave 0 |
| UIEX-03 | Download button visible only for approved+ contracts | unit | `yarn vitest run src/features/contracts/components/contract-card.test.tsx -t "download"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn test`
- **Per wave merge:** `yarn test && yarn type-check && yarn lint`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `src/features/contracts/components/contract-pdf.test.tsx` -- covers CONT-03 PDF generation
- [ ] `src/features/contracts/components/contract-card.test.tsx` -- covers UIEX-03 card rendering
- [ ] `src/features/contracts/components/contract-list.test.tsx` -- covers CONT-04 list + filtering
- [ ] PDF API route test file -- covers CONT-03 auth + streaming

Note: Testing @react-pdf/renderer's `renderToBuffer()` in vitest with happy-dom may require mocking. The actual PDF output verification is best done as a manual smoke test (generate PDF, open, verify Korean text).

## Sources

### Primary (HIGH confidence)
- [react-pdf issue #806](https://github.com/diegomura/react-pdf/issues/806) - Korean font support confirmed with Nanum Gothic TTF
- [react-pdf issue #3074](https://github.com/diegomura/react-pdf/issues/3074) - Next.js 15 renderToBuffer fix via React 19 + serverExternalPackages
- [react-pdf fonts docs](https://react-pdf.org/fonts) - Font.register() API
- [react-pdf compatibility](https://react-pdf.org/compatibility) - React 19 compatibility confirmed
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer) - v4.3.2 latest

### Secondary (MEDIUM confidence)
- [PDF generation comparison blog](https://dmitriiboikov.com/posts/2025/01/pdf-generation-comarison/) - Library tradeoffs
- [react-pdf Next.js discussion #2402](https://github.com/diegomura/react-pdf/discussions/2402) - Server-side rendering patterns
- [jsPDF custom fonts](https://www.devlinpeck.com/content/jspdf-custom-font) - Alternative approach for CJK fonts
- [pdfmake font issues on Vercel](https://github.com/bpampuch/pdfmake/issues/2460) - Vercel deployment problems documented

### Tertiary (LOW confidence)
- Cold start font download latency on Vercel -- no concrete benchmarks found; needs empirical testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @react-pdf/renderer Korean support verified via GitHub issues; React 19 compatibility confirmed
- Architecture: HIGH - API route + renderToBuffer pattern well-documented; existing project patterns (searchParams tabs, status badges) proven
- Pitfalls: HIGH - serverExternalPackages requirement documented in multiple GitHub issues; TTF-only font constraint verified
- PDF content: MEDIUM - Template structure based on competitor reference (Wellix); exact layout needs iteration

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain, 30-day validity)
