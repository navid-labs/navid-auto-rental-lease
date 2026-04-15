# Remaining Features Design Spec: 진단서 뷰어 + 차량 비교 + 딜러 평점 + 블로그

> Date: 2026-04-16
> Status: Approved
> Phases: 4 (Phase 2 리스/렌트 랜딩은 이미 완료)

---

## Phase 1: 진단서 원본 뷰어

**목표:** DETAIL 페이지에서 점검기록부 PDF를 인라인 모달로 열람.

**현재 상태:**
- `Listing.inspectionReportUrl` 필드 존재 (schema:195)
- `VehicleDiagnosis` 컴포넌트에 "점검기록부 보기" 버튼 → 현재 외부 탭 링크
- `@react-pdf/renderer` 설치됨 (PDF 생성용, 뷰어 아님)

**설계:**
- `react-pdf` (pdfjs-dist 래퍼) 패키지 추가 — PDF 뷰잉 전용
- 모달 다이얼로그로 PDF 렌더링 (shadcn Dialog 기반)
- 페이지 네비게이션 (이전/다음, 현재 페이지 번호)
- 핀치 줌 + 확대/축소 버튼
- 모바일: 전체 화면 모달, 스와이프 페이지 전환
- `inspectionReportUrl`이 null이면 "점검기록부 미등록" 비활성 상태 유지
- 시드 데이터에 샘플 PDF URL 추가

**파일:**
- 신규: `src/features/listings/components/inspection-report-viewer.tsx`
- 수정: `src/features/listings/components/vehicle-diagnosis.tsx`

**스키마 변경:** 없음

---

## Phase 3: 차량 비교 (2~3대)

**목표:** LIST 페이지에서 최대 3대 선택 → 사양/금융 조건 나란히 비교.

**설계:**
- LIST 카드에 "비교" 체크박스 추가 (좌측 상단 오버레이)
- 선택 상태는 Zustand store로 관리 (새로고침 시 초기화 OK)
- 하단 floating bar: "N대 비교하기" 버튼 (1대 이상 선택 시 표시)
- 비교 페이지 `/compare` — 서버 컴포넌트, 쿼리 파라미터로 ID 전달 (`?ids=uuid1,uuid2,uuid3`)
- 비교 테이블 항목:
  - 이미지 + 차명
  - 월 납입금 / 초기비용 / 잔여개월
  - 연식 / 주행거리 / 연료 / 변속기
  - 사고이력 / 등급 / 옵션
  - 최저값 하이라이트 (월 납입금 최저에 primary 색상)
- 모바일: 가로 스크롤 테이블 (sticky 첫 열 = 항목명)
- 3대 초과 선택 시 토스트로 안내

**파일:**
- 신규: `src/lib/stores/compare-store.ts` (Zustand)
- 신규: `src/features/compare/compare-floating-bar.tsx`
- 신규: `src/features/compare/compare-table.tsx`
- 신규: `src/app/(public)/compare/page.tsx`
- 수정: `src/components/ui/vehicle-card.tsx` (비교 체크박스)
- 수정: `src/app/(public)/list/page.tsx` (FloatingBar 마운트)

**스키마 변경:** 없음

---

## Phase 4: 딜러 평점/후기

**목표:** 거래 완료 후 구매자가 딜러에게 평점 + 한줄평.

**스키마 추가:**
```prisma
model DealerReview {
  id         String   @id @default(uuid()) @db.Uuid
  reviewerId String   @map("reviewer_id") @db.Uuid
  dealerId   String   @map("dealer_id") @db.Uuid
  listingId  String   @map("listing_id") @db.Uuid
  rating     Int      // 1~5
  comment    String
  createdAt  DateTime @default(now()) @map("created_at")

  reviewer Profile @relation("ReviewsWritten", fields: [reviewerId], references: [id])
  dealer   Profile @relation("ReviewsReceived", fields: [dealerId], references: [id])
  listing  Listing @relation(fields: [listingId], references: [id])

  @@unique([reviewerId, listingId])
  @@index([dealerId, createdAt(sort: Desc)])
  @@map("dealer_reviews")
}
```

- Profile에 역관계: `reviewsWritten`, `reviewsReceived`
- Listing에 역관계: `reviews`

**UI:**
- DETAIL `SellerCard` 하단에 평균 별점 + 후기 수
- "후기 보기" → 후기 목록 (최신순)
- 거래 완료(SOLD) 구매자만 작성 가능 → MY 페이지에서 "후기 작성"
- 별점 1~5 + 텍스트 100자 이내

**API:**
- `GET /api/reviews?dealerId=xxx`
- `POST /api/reviews` (requireAuth, 거래 완료 검증)

**파일:**
- 신규: `src/features/reviews/components/review-list.tsx`
- 신규: `src/features/reviews/components/review-form.tsx`
- 신규: `src/features/reviews/components/star-rating.tsx`
- 신규: `src/app/api/reviews/route.ts`
- 수정: `prisma/schema.prisma`
- 수정: `src/features/listings/components/seller-card.tsx`

---

## Phase 5: 블로그 (MDX)

**목표:** 승계/리스/렌트 가이드 콘텐츠를 MDX 블로그로 제공.

**설계:**
- `next-mdx-remote` 사용 (파일 기반, DB 불필요)
- 콘텐츠 디렉터리: `content/blog/`
- 프론트매터: title, date, description, category, thumbnail
- 카테고리: 승계 가이드 / 리스·렌트 비교 / 절세 팁 / 플랫폼 소식

**라우트:**
- `/blog` — 목록 (카테고리 탭 + 카드 그리드)
- `/blog/[slug]` — 상세 (MDX 렌더링 + 목차 TOC)

**초기 콘텐츠 (3편):**
1. "리스 vs 렌트, 뭐가 다를까?"
2. "승계 절차 A to Z"
3. "법인 리스 절세 가이드"

**파일:**
- 신규: `content/blog/*.mdx` (3편)
- 신규: `src/app/(public)/blog/page.tsx`
- 신규: `src/app/(public)/blog/[slug]/page.tsx`
- 신규: `src/lib/blog/mdx.ts`
- 신규: `src/features/blog/components/blog-card.tsx`
- 신규: `src/features/blog/components/mdx-components.tsx`
- 수정: `src/components/layout/footer.tsx` (링크 추가)

**스키마 변경:** 없음

---

## 구현 순서

```
Phase 1 (진단서 뷰어) ── 독립, 즉시 착수
Phase 3 (차량 비교)   ── 독립, 즉시 착수
Phase 5 (블로그 MDX)  ── 독립, 즉시 착수
Phase 4 (딜러 평점)   ── 스키마 변경 선행
```

Phase 1, 3, 5는 병렬 가능. Phase 4는 스키마 변경이 선행.
