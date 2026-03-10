# Roadmap: Navid Auto

## Milestones

- ✅ **v1.0 Demo MVP** — Phases 1-9 (shipped 2026-03-10)

## Phases

<details>
<summary>✅ v1.0 Demo MVP (Phases 1-9) — SHIPPED 2026-03-10</summary>

- [x] Phase 1: Foundation (2/2 plans) — completed 2026-03-09
- [x] Phase 2: Authentication & User Management (2/2 plans) — completed 2026-03-09
- [x] Phase 3: Vehicle Data & Storage (3/3 plans) — completed 2026-03-09
- [x] Phase 4: Dealer Portal & Approval Workflow (2/2 plans) — completed 2026-03-09
- [x] Phase 5: Public Search & Discovery (2/2 plans) — completed 2026-03-09
- [x] Phase 6: Pricing & Calculation (3/3 plans) — completed 2026-03-10
- [x] Phase 7: Contract Engine (3/3 plans) — completed 2026-03-09
- [x] Phase 8: Contract Completion & My Page (2/2 plans) — completed 2026-03-09
- [x] Phase 9: Admin Dashboard & Demo Readiness (3/3 plans) — completed 2026-03-10

</details>

### v1.1 Inventory Admin (Phases 10-12)

**Goal:** 외부 재고 데이터 연동, 재고 조회 테이블, 견적 생성, 설정 관리 — 롯데렌터카 Biz car 스타일 어드민
**Reference:** https://inventory-ver0130.vercel.app/

- [x] Phase 10: Inventory Data & Table UI (completed 2026-03-09)
  - **Goal:** 외부 재고 데이터를 가져와 필터/검색 가능한 대용량 테이블로 표시
  - **Requirements:** REQ-V11-01, REQ-V11-02, REQ-V11-03, REQ-V11-04
  - **Plans:** 2 plans
  - Plans:
    - [ ] 10-01-PLAN.md — Inventory schema, types, JSON adapter, sample data
    - [ ] 10-02-PLAN.md — Table UI, search/filter toolbar, admin page integration
- [x] Phase 11: Quote Generation Engine (gap closure in progress) (completed 2026-03-09)
  - **Goal:** 선택한 차량들로 렌탈/리스 견적서를 생성하고 PDF 출력
  - **Requirements:** REQ-V11-05, REQ-V11-06, REQ-V11-07
  - **Plans:** 3 plans
  - Plans:
    - [x] 11-01-PLAN.md — Quote types, calculation server action, builder UI with result cards
    - [x] 11-02-PLAN.md — Quote PDF component, API route, download button wiring
    - [ ] 11-03-PLAN.md — Gap closure: wire QuoteBuilder into inventory page
- [x] Phase 12: Settings Management & Polish (completed 2026-03-10)
  - **Goal:** 프로모션율, 보조금, 잔존가율 등 설정 CRUD 및 전체 마무리
  - **Requirements:** REQ-V11-08, REQ-V11-09, REQ-V11-10
  - **Plans:** 3 plans
  - Plans:
    - [ ] 12-01-PLAN.md — Settings schema, password gate, promo/subsidy/default CRUD
    - [ ] 12-02-PLAN.md — CSV upload for inventory data management
    - [ ] 12-03-PLAN.md — Admin nav update, loading/error states, unit tests

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 2/2 | Complete | 2026-03-09 |
| 2. Auth & User Management | v1.0 | 2/2 | Complete | 2026-03-09 |
| 3. Vehicle Data & Storage | v1.0 | 3/3 | Complete | 2026-03-09 |
| 4. Dealer Portal & Approval | v1.0 | 2/2 | Complete | 2026-03-09 |
| 5. Public Search & Discovery | v1.0 | 2/2 | Complete | 2026-03-09 |
| 6. Pricing & Calculation | v1.0 | 3/3 | Complete | 2026-03-10 |
| 7. Contract Engine | v1.0 | 3/3 | Complete | 2026-03-09 |
| 8. Contract Completion & My Page | v1.0 | 2/2 | Complete | 2026-03-09 |
| 9. Admin Dashboard & Demo Readiness | v1.0 | 3/3 | Complete | 2026-03-10 |
| 10. Inventory Data & Table UI | v1.1 | 2/2 | Complete | 2026-03-09 |
| 11. Quote Generation Engine | 3/3 | Complete    | 2026-03-09 | - |
| 12. Settings Management & Polish | 3/3 | Complete   | 2026-03-10 | - |
