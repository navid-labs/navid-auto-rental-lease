# 차용(Chayong) 플랫폼 설계 명세

> 중고 승계 + 중고 리스/렌트 거래 플랫폼
> "플랫폼은 유입 도구, 계약은 사람이 만든다"

## 1. 프로젝트 개요

### 핵심 철학
차용은 중고 리스/렌트 승계 매물을 탐색하고, 채팅을 통해 상담으로 연결하며, 에스크로로 안전하게 거래하는 플랫폼이다. 플랫폼의 역할은 **매물 → 상담 → 계약**으로 이어지는 영업 자동화 시스템이다.

### 전환 전략
- **방식**: 기존 Navid Auto 레포에서 클린 리빌드
- **유지**: Next.js 15, Prisma, PostgreSQL(Supabase), Supabase Auth, TypeScript, bun
- **교체**: 전체 프론트엔드 (pages, components, design system)
- **신규**: 채팅 시스템, 에스크로 결제, 간편 매물 등록

### 개발 순서
Phase 0 (Foundation) → Phase 1~8 (병렬 페이지 개발)

---

## 2. 디자인 시스템

### 컬러 팔레트
```
Primary:    #3182F6  (토스 블루)
Background: #FFFFFF
Surface:    #F9FAFB  (카드 배경)
Text:       #111111
Sub Text:   #687684
Caption:    #8B95A1
Divider:    #E5E8EB
Success:    #00C471  (안심마크 그린)
Danger:     #F04452
Warning:    #FF9500
```

### UI 원칙
- **월 납입금을 가장 크게** 표시 (24px+ bold), 전체 금액은 보조 정보
- **카드형 UI** — 모든 매물은 카드 컴포넌트로 표현
- **금융 앱 느낌** — 토스/카카오뱅크 스타일의 깔끔한 레이아웃
- **외부 연락처 차단** — 채팅에서 전화번호/이메일 입력 필터링
- **상담 버튼 항상 노출** — 상세 페이지 하단 고정 CTA

### 타이포그래피
- **Font**: Pretendard Variable (유지)
- **Scale**: 12/14/16/18/20/24/28/32px
- **Weight**: 400(body), 500(label), 600(emphasis), 700(heading)

### 컴포넌트 라이브러리
shadcn/ui 기반, 차용 테마 오버라이드:
- `VehicleCard` — 매물 카드 (이미지, 차명, 월납입금, 뱃지)
- `PriceDisplay` — 월 납입금 강조 포맷 (월 580,000원)
- `TrustBadge` — 안심마크 뱃지 (초록 체크)
- `FilterBar` — 필터 바 (월납입금, 초기비용, 제조사, 잔여기간)
- `ChatBubble` — 채팅 메시지 버블
- `StepIndicator` — 단계별 진행 표시기

---

## 3. 데이터 모델

### 유저 역할 변경
```
기존: CUSTOMER | DEALER | ADMIN
변경: BUYER | SELLER | DEALER | ADMIN
```
- SELLER: 개인 매도자 (직접 매물 등록)
- BUYER: 매수자 (매물 탐색, 상담 신청)
- DEALER: 전문 딜러 (다수 매물 관리)
- ADMIN: 관리자 (리드 관리, 매물 승인)

### Listing (매물) — Vehicle 모델 확장

기존 Vehicle 모델에 승계/중고리스 전용 필드 추가:

```prisma
enum ListingType {
  TRANSFER      // 승계
  USED_LEASE    // 중고 리스
  USED_RENTAL   // 중고 렌트
}

enum ListingStatus {
  DRAFT         // 작성중
  PENDING       // 승인 대기
  ACTIVE        // 게시중
  RESERVED      // 예약중
  SOLD          // 거래완료
  HIDDEN        // 숨김
}

model Listing {
  id              String        @id @default(uuid()) @db.Uuid
  sellerId        String        @map("seller_id") @db.Uuid
  type            ListingType
  status          ListingStatus @default(DRAFT)

  // 차량 기본 정보 (Step 2에서 입력, Step 1에선 미입력 가능)
  brand           String?       // "현대"
  model           String?       // "싼타페 하이브리드"
  year            Int           // 2023
  trim            String?       // "프레스티지"
  fuelType        String?       // "하이브리드"
  transmission    String?       // "자동"
  seatingCapacity Int?          @map("seating_capacity")  // 5
  mileage         Int?          // 23,456km
  color           String?       // "화이트"
  plateNumber     String?       @map("plate_number")  // 123가4567

  // 금융 정보 (핵심)
  monthlyPayment  Int           @map("monthly_payment")   // 월 납입금 (원)
  initialCost     Int           @default(0) @map("initial_cost")  // 초기비용/보증금 (원)
  remainingMonths Int           @map("remaining_months")  // 잔여 개월수
  totalPrice      Int?          @map("total_price")       // 총 인수 비용 (자동계산)
  remainingBalance Int?         @map("remaining_balance")  // 남은 총 납입금
  capitalCompany  String?       @map("capital_company")   // 캐피탈사 (현대캐피탈 등)
  transferFee     Int           @default(0) @map("transfer_fee")  // 승계 수수료

  // 통계 (카드 표시용)
  viewCount       Int           @default(0) @map("view_count")
  favoriteCount   Int           @default(0) @map("favorite_count")

  // 상태
  isVerified      Boolean       @default(false) @map("is_verified")  // 안심마크
  accidentFree    Boolean?      @map("accident_free")  // 무사고
  description     String?

  // 타임스탬프
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  // Relations
  seller          Profile       @relation("SellerListings", fields: [sellerId], references: [id])
  images          ListingImage[]
  chatRooms       ChatRoom[]
  leads           ConsultationLead[]
  escrowPayments  EscrowPayment[]
  favorites       Favorite[]

  @@index([type, status])
  @@index([sellerId, status])
  @@index([monthlyPayment])
  @@index([status, isVerified])
  @@map("listings")
}

model ListingImage {
  id        String   @id @default(uuid()) @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  url       String
  order     Int      @default(0)
  isPrimary Boolean  @default(false) @map("is_primary")
  createdAt DateTime @default(now()) @map("created_at")

  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@map("listing_images")
}
```

### Chat (채팅) — 신규

```prisma
model ChatRoom {
  id        String   @id @default(uuid()) @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  buyerId   String   @map("buyer_id") @db.Uuid
  sellerId  String   @map("seller_id") @db.Uuid
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  listing   Listing      @relation(fields: [listingId], references: [id])
  buyer     Profile      @relation("BuyerChats", fields: [buyerId], references: [id])
  seller    Profile      @relation("SellerChats", fields: [sellerId], references: [id])
  messages  ChatMessage[]

  @@unique([listingId, buyerId])
  @@index([buyerId])
  @@index([sellerId])
  @@map("chat_rooms")
}

enum MessageType {
  TEXT
  IMAGE
  SYSTEM      // 시스템 안내 메시지 (안전거래 안내 등)
}

model ChatMessage {
  id         String      @id @default(uuid()) @db.Uuid
  chatRoomId String      @map("chat_room_id") @db.Uuid
  senderId   String      @map("sender_id") @db.Uuid
  type       MessageType @default(TEXT)
  content    String      // TEXT: 메시지 내용, IMAGE: 캡션, SYSTEM: 안내문구
  imageUrl   String?     @map("image_url")  // Supabase Storage URL (type=IMAGE일 때)
  isRead     Boolean     @default(false) @map("is_read")
  createdAt  DateTime    @default(now()) @map("created_at")

  chatRoom   ChatRoom @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
  sender     Profile  @relation("SentMessages", fields: [senderId], references: [id])

  @@index([chatRoomId, createdAt])
  @@map("chat_messages")
}
```

### ConsultationLead (상담 리드) — Inquiry 대체

```prisma
enum LeadStatus {
  WAITING      // 대기
  CONSULTING   // 상담중
  CONTRACTED   // 계약완료
  CANCELED     // 취소
}

model ConsultationLead {
  id         String     @id @default(uuid()) @db.Uuid
  userId     String     @map("user_id") @db.Uuid
  listingId  String     @map("listing_id") @db.Uuid
  type       ListingType  // 승계/리스/렌트
  status     LeadStatus @default(WAITING)
  assignedTo String?    @map("assigned_to") @db.Uuid
  note       String?
  createdAt  DateTime   @default(now()) @map("created_at")
  updatedAt  DateTime   @updatedAt @map("updated_at")

  user       Profile    @relation("UserLeads", fields: [userId], references: [id])
  listing    Listing    @relation(fields: [listingId], references: [id])
  assignee   Profile?   @relation("AssignedLeads", fields: [assignedTo], references: [id])

  @@index([status])
  @@index([assignedTo, status])
  @@map("consultation_leads")
}
```

### EscrowPayment (에스크로 결제) — 신규

```prisma
enum EscrowStatus {
  PENDING     // 결제 대기
  PAID        // 입금 완료 (에스크로 보관중)
  RELEASED    // 판매자에게 지급 완료
  REFUNDED    // 환불 완료
  DISPUTED    // 분쟁중
}

model EscrowPayment {
  id          String       @id @default(uuid()) @db.Uuid
  listingId   String       @map("listing_id") @db.Uuid
  buyerId     String       @map("buyer_id") @db.Uuid
  sellerId    String       @map("seller_id") @db.Uuid  // 결제 시점의 판매자 스냅샷
  depositAmount Int        @map("deposit_amount")    // 가계약금
  transferFee   Int        @map("transfer_fee")      // 승계 대행 수수료
  totalAmount   Int        @map("total_amount")      // 총 결제금액
  status      EscrowStatus @default(PENDING)
  paidAt      DateTime?    @map("paid_at")
  releasedAt  DateTime?    @map("released_at")
  refundedAt  DateTime?    @map("refunded_at")
  pgOrderId   String?      @map("pg_order_id")  // 토스페이먼츠 주문ID
  pgPaymentKey String?     @map("pg_payment_key")  // 토스페이먼츠 결제키
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  listing     Listing      @relation(fields: [listingId], references: [id])
  buyer       Profile      @relation("BuyerPayments", fields: [buyerId], references: [id])
  seller      Profile      @relation("SellerPayments", fields: [sellerId], references: [id])

  @@index([listingId])
  @@index([buyerId])
  @@index([sellerId])
  @@map("escrow_payments")
}
```

### Favorite (찜) — 신규

```prisma
model Favorite {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  user      Profile  @relation("UserFavorites", fields: [userId], references: [id])
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([userId, listingId])
  @@map("favorites")
}
```

### Profile 모델 관계 추가

```prisma
model Profile {
  // 기존 필드 유지
  id, email, name, phone, role, avatarUrl, createdAt, updatedAt

  // 신규 Relations
  sellerListings    Listing[]           @relation("SellerListings")
  buyerChats        ChatRoom[]          @relation("BuyerChats")
  sellerChats       ChatRoom[]          @relation("SellerChats")
  sentMessages      ChatMessage[]       @relation("SentMessages")
  userLeads         ConsultationLead[]  @relation("UserLeads")
  assignedLeads     ConsultationLead[]  @relation("AssignedLeads")
  buyerPayments     EscrowPayment[]     @relation("BuyerPayments")
  sellerPayments    EscrowPayment[]     @relation("SellerPayments")
  favorites         Favorite[]          @relation("UserFavorites")
}
```

### 삭제 대상 모델
기존 모델 중 차용에서 사용하지 않는 것들:
- `Vehicle`, `VehicleImage` → `Listing`, `ListingImage`으로 대체
- `RentalContract`, `LeaseContract` → `EscrowPayment`로 대체 (실제 계약은 오프라인)
- `Inquiry` → `ConsultationLead`로 대체
- `Brand`, `CarModel`, `Generation`, `Trim` → Listing에 string 필드로 단순화
- `ResidualValueRate`, `PromoRate`, `DefaultSetting` → 삭제 (차용 모델에 불필요)
- `VehicleStatusLog`, `VehicleApprovalLog` → 필요 시 추후 추가
- `EkycVerification` → 추후 실명인증 필요 시 복원
- `QuoteRequest`, `DealerBid` → 삭제 (차용은 입찰 모델 아님)
- `InventoryItem` → 삭제 (B2B 재고 관리 불필요)

---

## 4. 라우팅 구조

```
src/app/
├── (public)/
│   ├── page.tsx                    # HOME (/)
│   ├── list/
│   │   └── page.tsx                # 매물 리스트 (/list)
│   ├── detail/
│   │   └── [id]/
│   │       └── page.tsx            # 매물 상세 (/detail/:id)
│   ├── sell/
│   │   └── page.tsx                # 매물 등록 (/sell)
│   └── guide/
│       └── page.tsx                # 이용 가이드
├── (auth)/
│   ├── login/page.tsx              # 로그인
│   └── signup/page.tsx             # 회원가입
├── (protected)/
│   ├── chat/
│   │   ├── page.tsx                # 채팅 목록 (/chat)
│   │   └── [roomId]/page.tsx       # 채팅방 (/chat/:roomId)
│   ├── payment/
│   │   └── [listingId]/page.tsx    # 에스크로 결제 (/payment/:listingId)
│   └── my/
│       └── page.tsx                # 마이페이지 (/my)
├── admin/
│   ├── page.tsx                    # 관리자 대시보드
│   ├── leads/page.tsx              # 상담 리드 관리
│   ├── listings/page.tsx           # 매물 관리
│   └── settings/page.tsx           # 설정
├── api/
│   ├── listings/                   # 매물 CRUD
│   ├── chat/                       # 채팅 API
│   ├── leads/                      # 상담 리드 API
│   ├── payment/                    # 에스크로 결제 API
│   ├── favorites/                  # 찜 API
│   └── auth/                       # 인증 API
└── layout.tsx
```

---

## 5. 페이지별 상세 설계

### 5.1 HOME (/)

**레이아웃:**
- Header: 차용 로고 + 네비게이션 (매물보기, 중고리스/렌트, 매물등록, 이용가이드, 고객센터) + 로그인/회원가입
- Hero Section: 핵심 카피 + 월납입금 미리보기 위젯 + CTA 버튼 2개 (매물 보러가기 / 간편하게 매물 등록하기)
- 카테고리 선택: 승계 차량 | 중고 리스/렌트 (탭 형태)
- 필터 바: 월납입금, 초기비용, 차종, 제조사, 잔여기간, 주행거리 + 상세검색
- 추천 매물: 카드 그리드 (안심마크 매물 우선 노출)
- 신뢰 섹션: 100% 안심거래 / 금융사 승인 지원 / 전문가 1:1 상담 / 승계 실패 시 환불
- 이용 방법: 매물 탐색 → 상담 신청 → 승계 심사 → 안전거래
- Footer: 서비스, 이용안내, 회사, 고객센터

**데이터:**
- 추천 매물: `Listing` where `status=ACTIVE` and `isVerified=true`, limit 8, order by `createdAt DESC`
- 이번달 신규 등록: count of `Listing` created this month

### 5.2 LIST (/list)

**레이아웃:**
- 상단: 필터 바 (월납입금 범위, 초기비용, 제조사, 잔여기간, 상세필터)
- 정렬: 전체 | ~50만원 | ~100만원 | 100만원~ (퀵 필터)
- 카드 그리드: 3열(데스크톱) / 2열(모바일)
- 페이지네이션: 1 2 3 4 5 ... 21

**매물 카드 구조:**
```
[이미지] [안심 뱃지]
[하트 버튼]
차량명 (현대 싼타페 하이브리드)
연식 · 트림 · 주행거리
월 580,000원 (Bold, 크게)
초기비용 0원 | 잔여 32개월
[좋아요 수] · [조회 수]
```

**필터 파라미터:** (URL query string으로 관리)
- `type`: TRANSFER | USED_LEASE | USED_RENTAL
- `monthlyMin`, `monthlyMax`: 월납입금 범위
- `initialCostMax`: 초기비용 상한
- `brand`: 제조사
- `remainingMin`: 잔여 최소 개월
- `sort`: newest | price_asc | price_desc
- `page`: 페이지 번호

### 5.3 DETAIL (/detail/:id)

**레이아웃 (2컬럼):**

왼쪽 (이미지 + 정보):
- 이미지 갤러리 (슬라이더, 1/15 카운터, 썸네일)
- 차량명 + 안심마크 뱃지 + 금융사 승인 가능 뱃지
- 스펙 요약: 연식 · 트림 · 무사고
- 연료 · 인승 · 비흡연

오른쪽 (가격 + CTA):
- **월 580,000원** (대형, Bold)
- 초기비용 0원 | 잔여 32개월
- CTA: [상담 신청하기] (Primary) + [찜하기] (Secondary)

하단 섹션:
- **차량 정보**: 차량번호, 연식, 주행거리, 연료, 미션, 색상, 사고유무, 캐피탈사
- **예상 비용 계산**: 총 인수 비용 = 보증금 + 승계 수수료 + 기타비용, 남은 총 납입금 = 월 납입금 × 잔여기간, 실질 총 비용 = 인수 비용 + 남은 총 납입금
- **안심거래 시스템**: 에스크로 흐름 다이어그램
- **전문가 상담**: 채팅 시작 버튼

**핵심 계산 로직:**
```typescript
const totalAcquisitionCost = initialCost + transferFee; // 초기비용 + 승계수수료
const remainingPayments = monthlyPayment * remainingMonths;
const totalEffectiveCost = totalAcquisitionCost + remainingPayments;
```

### 5.4 CHAT (/chat)

**레이아웃 (2패널):**

좌측: 채팅 목록
- 검색 바
- 채팅방 리스트: [차량 이미지] [차량명 · 월납입금] [마지막 메시지] [시간] [읽지않은 수]

우측: 채팅창
- 상단: 차량 정보 바 (차량명, 월납입금, 매물보기 버튼, 안전거래 진행하기 버튼)
- 시스템 메시지: "안전거래 시 보호됩니다. 플랫폼 외 거래로 인한 문제는 보호되지 않습니다."
- 메시지 영역: 말풍선 (좌/우 정렬)
- 입력 바: 텍스트 + 이미지 첨부 + 전송

**연락처 차단 로직:**
- 메시지 전송 시 정규식으로 전화번호/이메일 패턴 감지
- 매칭 시 전송 차단 + 안내 메시지 표시
- 패턴: `/\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/`, `/[\w.-]+@[\w.-]+\.\w+/`

**실시간 구현:**
- Supabase Realtime (Postgres Changes) 사용
- `chat_messages` 테이블 INSERT 구독
- 온라인 상태는 Supabase Presence 활용

### 5.5 PAYMENT (/payment/:listingId)

**에스크로 결제 플로우:**

Step 1: 결제 내역 확인
```
차량: 현대 싼타페 하이브리드 · 2023년식 · 월 580,000원
─────────────────────
가계약금          500,000원
승계 대행 수수료   300,000원
─────────────────────
총 결제금액       800,000원
```

Step 2: 안심 보장 안내
- 승계 실패 시 100% 환불
- 캐피탈 승인 불가 시 전액 환불
- 실차 미인도 시 전액 환불

Step 3: 결제 (토스페이먼츠 연동)
- [800,000원 안심하게 결제하기] 버튼
- 토스페이먼츠 결제창 호출
- 결제 완료 후 에스크로 상태 PAID로 변경

Step 4: 거래 완료
- 승계 심사 완료 + 실차 인도 확인 후 → RELEASED
- 초기 버전에서는 관리자가 수동으로 지급 처리, 추후 자동화

### 5.6 SELL (/sell)

**3단계 간편 등록:**

Step 1: 기본 정보 (필수)
- 월 납입금 (예: 580,000원)
- 잔여 개월 수 (예: 32개월)
- 초기 인도금/보증금 (예: 0원)

Step 2: 상세 정보 (선택)
- 차량 정보: 제조사, 모델, 연식, 트림
- 사진 업로드 (최대 15장)
- 추가 옵션 태그: 파노라마 선루프, HUD, BOSE 사운드, 빌트인캠 등
- 차량 설명 (자유 텍스트)

Step 3: 등록 확인
- 미리보기 카드
- "이후 상세 정보는 관심 고객이 생기면 추가로 입력할 수 있어요."
- [등록하기] → 임시저장 후 리스트 노출

**안심마크 조건 (isVerified = true 판정 기준):**
다음 필드가 모두 non-null일 때 시스템이 자동 판정:
- `brand` AND `model` AND `year` (차량 기본정보)
- `trim` (트림)
- `mileage` (주행거리)
- `color` (색상)
- `images.count >= 1` (사진 1장 이상)

조건 충족 시 → `isVerified = true` → 리스트 상단 노출 + 안심 뱃지

### 5.7 MY (/my)

**레이아웃:**
- 프로필 카드: 이름 + 등급 뱃지 + 설정 버튼
- 거래 현황 대시보드: 등록 매물 수 | 채팅 수 | 진행 중 거래 수
- 내 거래 현황: 탭 (시세비교 N건 | 승계진행 N건 | 거래완료 N건)

**메뉴:**
- 내 매물 관리
- 찜한 매물
- 채팅 내역
- 거래 내역
- 계정 설정
- 고객센터
- 로그아웃

### 5.8 ADMIN (/admin)

**상담 리드 관리 대시보드:**

상단 탭: 전체(34) | 대기(12) | 상담중(15) | 계약완료(7)

테이블 컬럼:
| 매물 | 고객 | 타입 | 상태 | 담당자 | 생성일 |
|------|------|------|------|--------|--------|
| 현대 싼타페 | 김차용 | 승계 | 대기 | 미배정 | 2026-04-08 |

기능:
- 상태 변경: 대기 → 상담중 → 계약완료
- 담당자 배정
- 매물 관리 (승인/거절/숨김)
- 기본 통계 (일별 리드 수, 전환율)

---

## 6. 핵심 비즈니스 로직

### 6.1 상담 전환 플로우
```
매물 조회 (DETAIL)
  ↓
채팅 버튼 or 상담 신청 버튼 클릭
  ↓
ChatRoom 생성 (buyer + seller)
  ↓
ConsultationLead 생성 (status: WAITING)
  ↓
관리자: 상담자 배정 (assignedTo)
  ↓
상담 진행 (status: CONSULTING)
  ↓
계약 체결 (status: CONTRACTED) → 오프라인
```

### 6.2 안심마크 시스템
```
매물 저장/수정 시 자동 판정:
  isVerified = brand && model && year && trim && mileage && color && images.count >= 1

  - 조건 미충족 → isVerified: false → 일반 노출
  - 조건 충족   → isVerified: true → 리스트 상단 노출 + 안심 뱃지
```

### 6.3 자동 비용 계산
```
총 인수 비용 = 초기비용(보증금) + 승계 수수료
남은 총 납입금 = 월 납입금 × 잔여기간
실질 총 비용 = 총 인수 비용 + 남은 총 납입금
```

### 6.4 에스크로 안전거래
```
Buyer 결제 → 에스크로 보관 (PAID)
  ↓
승계 심사 + 캐피탈 승인
  ↓
성공: 실차 인도 → 판매자 지급 (RELEASED)
실패: 전액 환불 (REFUNDED)
```

---

## 7. 기술 구현 상세

### 7.1 프론트엔드 구조
```
src/
├── app/                      # 라우팅 (위 구조 참조)
├── components/
│   ├── ui/                   # shadcn/ui (차용 테마)
│   └── layout/               # Header, Footer, MobileNav
├── features/
│   ├── listings/             # 매물 (카드, 필터, 상세)
│   ├── chat/                 # 채팅 (목록, 방, 메시지)
│   ├── payment/              # 에스크로 결제
│   ├── sell/                 # 매물 등록 위자드
│   ├── my/                   # 마이페이지
│   ├── auth/                 # 로그인/회원가입
│   └── admin/                # 관리자
├── lib/
│   ├── db/                   # Prisma client
│   ├── supabase/             # Auth + Realtime
│   ├── finance/              # 비용 계산 유틸
│   ├── chat/                 # 연락처 필터, 메시지 포맷
│   └── utils/                # 공통 유틸
└── types/                    # 공유 타입
```

### 7.2 채팅 실시간 아키텍처
```
Client (React) 
  → Supabase Realtime subscribe("chat_messages")
  → INSERT detected → 자동 UI 업데이트
  
메시지 전송:
  Client → POST /api/chat/messages → Prisma insert → Supabase Realtime broadcast
```

### 7.3 에스크로 결제 (토스페이먼츠)
```
1. POST /api/payment/prepare → EscrowPayment 생성 (PENDING)
2. 토스페이먼츠 SDK → 결제창 표시
3. 결제 완료 → POST /api/payment/confirm → 토스 API 승인 → status: PAID
4. Webhook: 토스 → /api/payment/webhook → 상태 동기화
```

### 7.4 이미지 저장소 (Supabase Storage)
- **버킷**: `listing-images` (매물 사진), `chat-images` (채팅 이미지)
- **최대 파일 크기**: 10MB
- **허용 MIME**: `image/jpeg`, `image/png`, `image/webp`
- **업로드 흐름**: 클라이언트 → `POST /api/upload` → Supabase Storage → URL 반환
- **이미지 처리**: `browser-image-compression`으로 클라이언트 사이드 리사이즈 (1920px max width, quality 0.8)
- **경로 규칙**: `listing-images/{listingId}/{uuid}.webp`, `chat-images/{chatRoomId}/{uuid}.webp`

### 7.5 CSP 헤더 업데이트
토스페이먼츠 연동을 위해 `next.config.ts` CSP에 추가 필요:
- `script-src`: `js.tosspayments.com`
- `frame-src`: `*.tosspayments.com`
- `connect-src`: `api.tosspayments.com`

### 7.6 알림 시스템 (인앱)

```prisma
enum NotificationType {
  CHAT_MESSAGE     // 새 채팅 메시지
  ESCROW_STATUS    // 에스크로 상태 변경 (PAID/RELEASED/REFUNDED)
  LEAD_ASSIGNED    // 상담 리드 배정 (관리자용)
  LISTING_APPROVED // 매물 승인 완료
  LISTING_LIKED    // 내 매물 찜
}

model Notification {
  id        String           @id @default(uuid()) @db.Uuid
  userId    String           @map("user_id") @db.Uuid
  type      NotificationType
  title     String
  message   String
  linkUrl   String?          @map("link_url")  // 클릭 시 이동 경로
  isRead    Boolean          @default(false) @map("is_read")
  createdAt DateTime         @default(now()) @map("created_at")

  user      Profile          @relation("UserNotifications", fields: [userId], references: [id])

  @@index([userId, isRead])
  @@map("notifications")
}
```

- Header에 벨 아이콘 + 읽지않은 수 뱃지 표시
- 알림 트리거: 각 이벤트 발생 시 서버에서 Notification INSERT → Supabase Realtime 구독으로 실시간 표시
- Profile에 relation 추가: `notifications Notification[] @relation("UserNotifications")`

### 7.7 관리자 에스크로 관리
- ADMIN 페이지에 에스크로 관리 탭 추가
- 기능: PAID → RELEASED (지급 처리), PAID → REFUNDED (환불 처리)
- 각 처리 시 사유 입력 필수, 구매자/판매자에게 알림 발송

---

## 8. 개발 페이즈

### Phase 0: Foundation (선행)
- [ ] 기존 src/ 프론트엔드 코드 정리 (페이지/컴포넌트 제거)
- [ ] 차용 디자인 시스템 설정 (globals.css, tailwind tokens)
- [ ] Prisma 스키마 변경 (Listing, ChatRoom, ChatMessage, ConsultationLead, EscrowPayment, Favorite)
- [ ] 공통 레이아웃 (Header, Footer, MobileNav)
- [ ] 공통 컴포넌트 (VehicleCard, PriceDisplay, TrustBadge, FilterBar, StepIndicator)
- [ ] Supabase Storage 버킷 설정 (listing-images, chat-images)
- [ ] CSP 헤더 업데이트 (토스페이먼츠 도메인 추가)
- [ ] API 기본 구조 (listings CRUD, chat API, payment API)

### Phase 1~8: 페이지 병렬 개발

| Phase | 페이지 | 핵심 기능 | 의존성 |
|-------|--------|----------|--------|
| 1 | HOME (/) | 히어로, 필터, 추천매물 | Phase 0 |
| 2 | LIST (/list) | 필터링, 카드그리드, 페이지네이션 | Phase 0 |
| 3 | DETAIL (/detail/:id) | 갤러리, 차량정보, 비용계산, CTA | Phase 0 |
| 4 | SELL (/sell) | 3단계 등록 위자드, 이미지 업로드 | Phase 0 |
| 5 | CHAT (/chat) | 실시간 메시징, 연락처 차단 | Phase 0 |
| 6 | PAYMENT (/payment) | 에스크로, 토스페이먼츠 연동 | Phase 0 |
| 7 | MY (/my) | 프로필, 거래현황, 매물관리 | Phase 0 |
| 8 | ADMIN (/admin) | 리드 관리, 매물 승인, 에스크로 관리 | Phase 0 |

Phase 1~4는 Phase 0 완료 후 즉시 병렬 시작 가능.
Phase 5~6은 백엔드 API(채팅, 결제)가 필요하므로 Phase 0에서 API 기본 구조도 함께 준비.

---

## 9. 기존 코드 처리 전략

### 유지 (수정 없이)
- `prisma/` 디렉토리 (스키마는 변경하되 설정 유지)
- `src/lib/db/prisma.ts` (Prisma 클라이언트)
- `src/lib/supabase/` (인증 클라이언트)
- `next.config.ts` (보안 헤더, 이미지 설정)
- `tsconfig.json`, `package.json`, `tailwind.config.ts`

### 삭제
- `src/app/` 하위 모든 페이지 (새로 작성)
- `src/components/layout/` (새로 작성)
- `src/features/` 전체 (새로 작성)
- `src/lib/finance/` (새 계산 로직으로 대체)
- `src/lib/kotsa/` (차용에서 불필요)
- `src/lib/ekyc/` (추후 필요 시 복원)
- `src/lib/api/` (OpenAPI 생성 클라이언트 불필요)
- `src/types/index.ts` (새 스키마 기반으로 재생성)

### 수정
- `prisma/schema.prisma` → 차용 데이터 모델로 변경
- `src/app/globals.css` → 차용 디자인 토큰으로 교체
- `src/app/layout.tsx` → 차용 레이아웃으로 교체
- `src/components/ui/` → shadcn 컴포넌트는 유지, 테마만 변경

---

## 10. 참고 자료

- 컨셉 디자인: `docs/concept-designs/01-chayong-reference-ui.png`
- 페이지 와이어프레임: `docs/concept-designs/02-chayong-page-wireframes.png`
- MVP 개발 명세: `docs/concept-designs/03-chayong-mvp-spec.png`
