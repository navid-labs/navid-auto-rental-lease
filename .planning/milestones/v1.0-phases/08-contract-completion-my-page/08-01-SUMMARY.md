---
phase: 08-contract-completion-my-page
plan: 01
subsystem: api
tags: [react-pdf, pdf-generation, korean-fonts, contract, api-route]

requires:
  - phase: 07-contract-engine
    provides: RentalContract/LeaseContract models, contract state machine, Prisma schema
provides:
  - GET /api/contracts/[id]/pdf?type=RENTAL|LEASE endpoint
  - ContractPDF react-pdf document template with Korean text
  - NanumGothic font registration for @react-pdf/renderer
  - ContractPDFData type definition
affects: [08-contract-completion-my-page]

tech-stack:
  added: ["@react-pdf/renderer"]
  patterns: ["server-side PDF generation via react-pdf renderToBuffer", "serverExternalPackages for native Node modules"]

key-files:
  created:
    - src/lib/pdf/fonts.ts
    - src/features/contracts/components/contract-pdf.tsx
    - src/app/api/contracts/[id]/pdf/route.ts
  modified:
    - next.config.ts
    - src/features/contracts/types/index.ts
    - package.json

key-decisions:
  - "Separate lease/rental query paths for full type safety instead of union type narrowing"
  - "Inline KRW/date formatters in PDF component (react-pdf uses separate reconciler)"
  - "createElement + any cast for renderToBuffer compatibility with React 19 types"

patterns-established:
  - "PDF font registration: side-effect import pattern for @react-pdf/renderer fonts"
  - "serverExternalPackages in next.config.ts for native Node module packages"

requirements-completed: [CONT-03]

duration: 3min
completed: 2026-03-10
---

# Phase 8 Plan 01: Contract PDF Generation Summary

**Server-side contract PDF generation with @react-pdf/renderer, NanumGothic Korean fonts, and auth-protected API route**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T18:09:45Z
- **Completed:** 2026-03-09T18:13:07Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- @react-pdf/renderer installed with Korean NanumGothic font support
- ContractPDF component renders both rental and lease contract templates with all required sections
- PDF API route with authentication (401), ownership check (403), and admin bypass
- Build passes with serverExternalPackages configuration

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @react-pdf/renderer, register Korean fonts, create PDF document template** - `9a8d198` (feat)
2. **Task 2: Create PDF API route with auth/ownership check, update next.config.ts** - `228e85b` (feat)

## Files Created/Modified
- `src/lib/pdf/fonts.ts` - NanumGothic Regular/Bold registration from Google CDN
- `src/features/contracts/components/contract-pdf.tsx` - ContractPDF A4 document with parties, vehicle, terms, residual value (lease), signature sections
- `src/app/api/contracts/[id]/pdf/route.ts` - GET handler with auth, ownership check, PDF streaming
- `src/features/contracts/types/index.ts` - Added ContractPDFData type
- `next.config.ts` - Added serverExternalPackages for @react-pdf/renderer
- `package.json` - Added @react-pdf/renderer dependency

## Decisions Made
- Used separate if/else branches for lease/rental contract queries instead of union type narrowing -- avoids complex TypeScript discriminated union issues with Prisma includes
- Inlined KRW formatting and date formatting in the PDF component since @react-pdf/renderer runs in a separate reconciler context and cannot share Next.js module imports reliably
- Used `createElement + as any` cast for renderToBuffer call due to React 19 type incompatibility with @react-pdf/renderer's expected ReactElement type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed plateNumber to licensePlate field name**
- **Found during:** Task 2 (PDF API route)
- **Issue:** Plan referenced `vehicle.plateNumber` but Prisma schema uses `vehicle.licensePlate`
- **Fix:** Changed to `vehicle.licensePlate` in PDF data builder
- **Files modified:** src/app/api/contracts/[id]/pdf/route.ts
- **Verification:** yarn type-check passes
- **Committed in:** 228e85b (Task 2 commit)

**2. [Rule 1 - Bug] Fixed renderToBuffer type compatibility with React 19**
- **Found during:** Task 2 (PDF API route)
- **Issue:** createElement returns FunctionComponentElement incompatible with @react-pdf/renderer DocumentProps
- **Fix:** Added `as any` type cast with eslint-disable comment
- **Files modified:** src/app/api/contracts/[id]/pdf/route.ts
- **Verification:** yarn type-check and yarn build pass
- **Committed in:** 228e85b (Task 2 commit)

**3. [Rule 1 - Bug] Fixed Buffer to Response body type**
- **Found during:** Task 2 (PDF API route)
- **Issue:** renderToBuffer returns Buffer which is not assignable to Response BodyInit
- **Fix:** Wrapped with `new Uint8Array(buffer)` for proper Web API compatibility
- **Files modified:** src/app/api/contracts/[id]/pdf/route.ts
- **Verification:** yarn type-check passes
- **Committed in:** 228e85b (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed type issues above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PDF API endpoint ready for Plan 02's download buttons and My Page integration
- Font registration pattern reusable for future PDF templates

---
*Phase: 08-contract-completion-my-page*
*Completed: 2026-03-10*
