# Phase 3: Vehicle Data & Storage - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Dealers and admins can register vehicles with full details and images, and vehicle status transitions are tracked. This phase covers vehicle CRUD (create/read/update/delete), image upload to Supabase Storage, license plate auto-lookup via API, and vehicle status state machine. Public search/discovery is Phase 5. Dealer approval workflow is Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Vehicle Registration Form
- Multi-step wizard: Step 1 (License plate lookup or Brand/Model/Trim) → Step 2 (Details: year, mileage, color, price) → Step 3 (Photos)
- Plate-first entry: Step 1 starts with license plate input field. API lookup auto-fills brand/model/year/etc. "Enter manually" link switches to Brand→Model→Generation→Trim cascade
- Progressive disclosure for cascade selects: Show only Brand first, then Model appears after selection, then Generation, then Trim
- Same form shared between dealer and admin, role-aware (admin may skip approval, sees extra fields if needed)

### Image Upload
- Drag-and-drop zone + click to browse. Desktop: large dropzone area. Mobile: falls back to file picker
- Max 10 photos per vehicle
- Drag to reorder thumbnails in a sortable grid. First image is always the primary/thumbnail photo
- Storage: Supabase Storage (public bucket for vehicle images)
- Claude's discretion: image compression/resize before upload, accepted file types, max file size

### Vehicle List & Management
- Table view for dealer/admin vehicle list: columns for thumbnail, brand/model, year, mileage, price, status badge, actions
- Basic status filter only (tabs or dropdown: All, Available, Reserved, Rented, Maintenance)
- Click row → vehicle detail page. "Edit" button switches to editable form (reuses wizard steps)
- Soft delete: status changes to HIDDEN instead of DB deletion. Confirmation dialog before hiding. Admin can restore

### Status Transitions & Rules
- Strict state machine: explicit allowed transitions only (e.g., AVAILABLE→RESERVED, RESERVED→RENTED, any→MAINTENANCE). Invalid transitions rejected with error
- Permissions: Dealer can change status on own vehicles only. Admin can change any vehicle's status including force-transitions
- Confirmation dialog with optional note field for every status change. Notes stored for audit trail
- Color-coded badges: green (Available), yellow (Reserved), blue (Rented/Leased), orange (Maintenance), gray (Hidden)

### Claude's Discretion
- License plate API provider selection (data.go.kr vs commercial)
- Image compression/resize approach before upload
- Exact wizard progress bar design
- Loading states and error handling throughout forms
- Vehicle detail page layout (info sections, photo gallery placement)
- RLS policy specifics for vehicle CRUD
- Accepted image file types and max file size per image

</decisions>

<specifics>
## Specific Ideas

- License plate lookup should feel instant — show a loading spinner while API call runs, then auto-fill fields with animation/transition
- Status badges should be consistent across the entire app (same colors in dealer list, admin list, detail pages, and future public pages)
- The wizard should preserve form state when navigating between steps (no data loss on back button)
- Deletion is soft (HIDDEN status) — this protects referential integrity since contracts reference vehicles

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/table.tsx`: Table component for vehicle list
- `src/components/ui/card.tsx`: Card component for detail pages
- `src/components/ui/badge.tsx`: Badge component for status display
- `src/components/ui/select.tsx`: Select component for cascade dropdowns
- `src/components/ui/input.tsx`: Input component for form fields
- `src/components/ui/button.tsx`: Button component
- `src/lib/utils/format.ts`: Korean locale formatters (KRW, dates, distances)
- `src/features/auth/`: Server Actions pattern established for form handling
- `src/types/index.ts`: Prisma types re-exported (Vehicle, VehicleImage, Brand, CarModel, etc.)

### Established Patterns
- Server Actions for form submissions (used in auth)
- Zod 3.x for validation with React Hook Form
- Server Components by default, 'use client' only when needed
- Supabase clients: browser, server, admin (in src/lib/supabase/)
- Role-based middleware for route protection

### Integration Points
- Prisma schema: Vehicle, VehicleImage, Brand, CarModel, Generation, Trim models ready
- VehicleStatus enum: AVAILABLE, RESERVED, RENTED, LEASED, MAINTENANCE, HIDDEN
- Profile.dealerVehicles relation for ownership checks
- Dealer sidebar at `src/components/layout/dealer-sidebar.tsx` — needs "My Vehicles" nav link
- Admin sidebar at `src/components/layout/admin-sidebar.tsx` — needs "Vehicles" nav link
- Supabase Storage needs bucket configuration for vehicle images

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-vehicle-data-storage*
*Context gathered: 2026-03-09*
