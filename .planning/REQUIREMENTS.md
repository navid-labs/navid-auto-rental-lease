# Requirements: Navid Auto

**Defined:** 2026-03-09
**Core Value:** 고객이 중고차를 온라인에서 검색하고, 비교하고, 비대면으로 렌탈/리스 계약까지 완료할 수 있는 원스톱 경험

## v1 Requirements

Requirements for demo/investor-ready release. Each maps to roadmap phases.

### Authentication & User

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can log in and stay logged in across browser sessions
- [x] **AUTH-03**: User can log out from any page
- [x] **AUTH-04**: User profile with role assignment (customer/dealer/admin)
- [x] **AUTH-05**: User can edit own profile information
- [x] **AUTH-06**: Routes protected by user role (middleware-based)

### Vehicle Management

- [x] **VEHI-01**: Dealer can register vehicle with details (make, model, year, mileage, color, price)
- [x] **VEHI-02**: Dealer can upload multiple vehicle images
- [x] **VEHI-03**: Dealer can edit/delete own vehicle listings
- [x] **VEHI-04**: Admin can register/edit/delete vehicles (self-operated inventory)
- [x] **VEHI-05**: Vehicle status transitions (available → reserved → rented → maintenance)
- [x] **VEHI-06**: License plate auto-lookup via API with manual input fallback
- [x] **VEHI-07**: Admin approval workflow for dealer-registered vehicles

### Search & Discovery

- [x] **SRCH-01**: User can search vehicles with multi-criteria filters (brand, model, year, price range, mileage)
- [x] **SRCH-02**: User can sort results by price, year, mileage, or newest
- [x] **SRCH-03**: Vehicle detail page with photo gallery, specs, and pricing info
- [x] **SRCH-04**: Interactive rental vs lease comparison calculator (period/deposit sliders)
- [x] **SRCH-05**: Filter state persisted in URL for sharing/bookmarking

### Pricing & Calculation

- [x] **PRIC-01**: Monthly rental/lease payment calculator based on contract terms
- [x] **PRIC-02**: Residual value estimation from admin-configurable lookup table (make/model/year → %)

### Contract

- [x] **CONT-01**: Multi-step contract application form (vehicle → terms → eKYC → review → submit)
- [x] **CONT-02**: Mock eKYC flow with ID verification UI (real API integration in v2)
- [x] **CONT-03**: Contract PDF auto-generation with all contract details
- [x] **CONT-04**: Contract status tracking on customer my page
- [x] **CONT-05**: Real-time vehicle/contract status updates via Supabase Realtime
- [x] **CONT-06**: Contract state machine with explicit transitions (draft → pending_ekyc → pending_approval → approved → active → completed)
- [x] **CONT-07**: Admin approval step after contract submission

### Dealer Portal

- [x] **DEAL-01**: Dealer dashboard (my vehicles, contract requests, approval status)

### Admin

- [ ] **ADMN-01**: Admin can view/edit/delete all vehicles, contracts, users
- [ ] **ADMN-02**: Dealer vehicle approval queue (approve/reject with reason)
- [ ] **ADMN-03**: Stats dashboard (registered vehicles, active contracts, user count)
- [ ] **ADMN-04**: Residual value rate table management (make/model/year → percentage)

### UI & Experience

- [x] **UIEX-01**: Responsive web design (desktop + mobile simultaneous design)
- [x] **UIEX-02**: Landing page with featured vehicles and quick search
- [x] **UIEX-03**: My page with contract list and PDF download

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication
- **AUTH-V2-01**: Password reset via email link
- **AUTH-V2-02**: Social login (Kakao/Naver)

### User Experience
- **UIEX-V2-01**: Vehicle favorites/wishlist
- **UIEX-V2-02**: In-app notification bell + notification history
- **UIEX-V2-03**: Landing page trust metrics (registered vehicles count, contracts count)

### Pricing
- **PRIC-V2-01**: Automatic deposit calculation logic

### External Integrations
- **INTG-V2-01**: Real eKYC API integration (CLOVA/PASS)
- **INTG-V2-02**: Electronic signature API (Modusign)
- **INTG-V2-03**: Payment gateway (PG) integration

### Platform
- **PLAT-V2-01**: Native mobile app via Capacitor
- **PLAT-V2-02**: Real-time chat/consultation
- **PLAT-V2-03**: Multi-language support

## Out of Scope

| Feature | Reason |
|---------|--------|
| Vehicle insurance/maintenance management | Not core to rental/lease flow |
| AI vehicle recommendations | Complexity vs. demo value |
| Vehicle price bidding/auction | Different business model |
| Used car sales (purchase) | Focus on rental/lease only |
| Vehicle delivery tracking | Offline operation for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Complete |
| VEHI-01 | Phase 3 | Complete |
| VEHI-02 | Phase 3 | Complete |
| VEHI-03 | Phase 3 | Complete |
| VEHI-04 | Phase 3 | Complete |
| VEHI-05 | Phase 3 | Complete |
| VEHI-06 | Phase 3 | Complete |
| VEHI-07 | Phase 4 | Complete |
| SRCH-01 | Phase 5 | Complete |
| SRCH-02 | Phase 5 | Complete |
| SRCH-03 | Phase 5 | Complete |
| SRCH-04 | Phase 6 | Complete |
| SRCH-05 | Phase 5 | Complete |
| PRIC-01 | Phase 6 | Complete |
| PRIC-02 | Phase 6 | Complete |
| CONT-01 | Phase 7 | Complete |
| CONT-02 | Phase 7 | Complete |
| CONT-03 | Phase 8 | Complete |
| CONT-04 | Phase 8 | Complete |
| CONT-05 | Phase 7 | Complete |
| CONT-06 | Phase 7 | Complete |
| CONT-07 | Phase 7 | Complete |
| DEAL-01 | Phase 4 | Complete |
| ADMN-01 | Phase 9 | Pending |
| ADMN-02 | Phase 9 | Pending |
| ADMN-03 | Phase 9 | Pending |
| ADMN-04 | Phase 9 | Pending |
| UIEX-01 | Phase 1 | Complete |
| UIEX-02 | Phase 5 | Complete |
| UIEX-03 | Phase 8 | Complete |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after roadmap creation*
