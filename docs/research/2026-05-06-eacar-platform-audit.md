---
title: 이어카(eacar) 승계 플랫폼 실측 감사
date: 2026-05-06
type: research
sources:
  - https://www.eacar.co.kr/
  - https://www.eacar.co.kr/car/40635
  - https://www.eacar.co.kr/premium
  - https://www.eacar.co.kr/premium/request
cache:
  - .firecrawl/eacar.co.kr/
  - .firecrawl/eacar.co.kr-premium.md
  - .firecrawl/eacar.co.kr-premium-request.md
  - .firecrawl/eacar.co.kr-trust.md
  - .firecrawl/eacar.co.kr-safe.md
related:
  - 2026-05-06-transfer-pipeline-audit.md
  - 2026-05-06-prisma-schema-diff.md
---

## 한 줄 결론

이어카는 **무료 등록 + "빠른승계" 단일 부가 패키지(중고차 시세 4% 수수료)** 모델로 운영. 패키지 안에 (1) 매니저 대행 (2) 리스트 최상단 노출·전용 배지 (3) AI 보도자료 자동 생성 (4) SNS·홈페이지 무료 홍보가 묶여있음. 차용 결정(d+c)과 정합. **앱 다운로드 15~20만**(사용자 진술), **위탁업무에 "엔카닷컴(주) — 승계 광고 플랫폼" 명시**(공식 광고송출 채널).

---

## 1. 비즈니스 모델

### 1.1 빠른승계 패키지 (`/premium/request`)

| 항목 | 내용 |
|---|---|
| 수수료 | **중고차 시세의 4%** (거래 완료 시 매도자 부담) |
| 등록비 | **무료** (셀프 등록) |
| 패키지 구성 | 매니저 대행 + 24h 응대 + 리스트 최상단 + 전용 아이콘 + SNS 홍보 + AI 보도자료 |
| 마케팅 헤드라인 | "평균 중도해지위약금 753만원 절약" |
| 결제 시점 | 거래 완료 시 (선결제 광고비 없음 — 사용자가 추측한 "광고비 10만"은 실측 미확인) |
| 배지 자산 | `assets/images/badge_quick.png` ("빠른승계") |
| 보도자료 | `/premium/<id>` — AI 리포터 캐릭터(엘리/위버/에이미)가 자동 생성, 매물별 1편 |

> **차용 의사결정 영향**: 사용자가 grill에서 (d) "셀프등록 무료 + 담당자 대행 시 4-5%" + (c) "노출강화 부가상품"으로 답했는데, 이어카는 둘을 **하나로 묶음**. 차용도 단일 "빠른승계" 패키지 1개로 통합 가능 (후속 SKU 분화는 Phase 2).

### 1.2 위탁업무 (개인정보처리방침에서 추출)

| 위탁업무 | 업체 | 차용 매핑 |
|---|---|---|
| 모바일 쿠폰(기프티콘) | 기프티쇼 비즈 | 후순위 |
| 장기렌트/리스 승계 및 견적비교 | 카베이, 시현신차장기렌트, 오토다이렉트카 | **B2B 파트너 네트워크** — MVP 보류 |
| 장기렌트/리스 견적비교 | 마춤카 | 동일 |
| SMS 발송 | (주)알리는사람들 | 차용 = Supabase + 토스 알림톡으로 대체 |
| **PG 사 전자결제** | 다날, **카카오페이** | 차용 = **토스페이먼츠** |
| 신용도 평가/조회 | 각 렌트 리스사 담당부서 | 차용 — DEALER 역할로 흡수 |
| **승계 광고 플랫폼** | **엔카닷컴(주)** | ⭐ 핵심 — 이어카 매물이 엔카에 노출됨 |
| 자동차 정보조회 | **오토비긴즈** | ⭐ 차량번호 자동조회 — 차용 sell wizard `plate-lookup` 후보 SDK |
| 시스템 유지/보수 | 카페24 | N/A |
| 비즈니스 메시지(알림톡) | 엠포플러스(주) | 카카오 알림톡 송출 — 차용 = 별도 검토 |

---

## 2. 매물 상세 페이지 데이터 모델 (`/car/40635` 실측)

### 2.1 헤더

```
[리스/렌트] · 이미지 1/11 · 제목
조회수 518 · 마이픽 3 · 채팅 2
3개월 전 · 수정됨 2026-01-13 20:09:02
```

### 2.2 차량 소개 (자유 텍스트)

매도자가 직접 작성. 1~3줄. 예: "비흡연이며, 깨끗합니다. 휠 살짝 긁힘 빼고는 애지중지 관리하여 A급이라 생각합니다."

### 2.3 비용 섹션

| 라벨 | 값 예시 |
|---|---|
| 월 납입금 | 732,490원 X 37개월 |
| 운전자 연령 | 만 26세 이상 |

### 2.4 계약 정보 ⭐

| 라벨 | 값 예시 | 차용 필드 |
|---|---|---|
| 계약업체 | 현대캐피탈 | `capitalCompany` ✓ |
| 계약기간 | 60개월 | **없음** (계산 가능) |
| 계약종료 | 2029년06월 | **없음** (계산 가능) |
| 잔여개월 | 37개월 | `remainingMonths` ✓ |
| 약정주행거리 | 15,000km/년 | `mileageLimit` ✓ (단위 모호) |
| **인수방법** | **선택인수** | **없음** ⭐ 신규 enum |
| **인수금(잔존가치)** | 21,115,600원 | **없음** ⭐ 신규 필드 |
| 운전자연령 | 만 26세 이상 | **없음** ⭐ 신규 필드 |

**인수방법 enum 후보**: `OPTIONAL` (선택인수), `MANDATORY` (의무인수), `NONE` (인수 없음 — 렌트 만기 반환).

### 2.5 차량 기본 정보

| 라벨 | 값 예시 | 차용 필드 |
|---|---|---|
| 모델명 | 기아 더 뉴카니발 하이브리드(KA4) | `brand`+`model` ✓ |
| 등급/트림 | 1.6 HEV 9인승 노블레스 | `trim` ✓ |
| 차량번호 | 203호1320 | `plateNumber` ✓ |
| 차량가 | 48,880,000원 | `totalPrice` ✓ |
| 최초등록 | 2024년 06월 | **registrationDate** 신규 (현재는 `year`만) |
| 연비 | 13.5km/L (3등급) | **없음** ⭐ 신규 (`fuelEfficiency`, `fuelEfficiencyGrade`) |
| 변속기 | 오토 | `transmission` ✓ |
| 유종 | 가솔린+전기 | `fuelType` ✓ (HYBRID) |
| 색상 | 미색 | `color` ✓ |
| 사고이력 | 무사고 | `accidentCount=0` ✓ |
| 주행거리(등록일기준) | 28,000km | `mileage` ✓ |

### 2.6 차량 옵션 정보 ⭐ 카테고리 그룹핑

이어카는 옵션을 **카테고리 prefix**로 표기:

```
- 기본형-컴포트
- 듀얼선루프
- 드라이브와이즈
- 모니터링팩
- 스타일
- 헤드램프 LED
- 사이드미러 전동접이
- 사이드미러 열선
- 휠타이어 알루미늄휠
- 시트 전동시트(동승석)
- 시트 열선시트(앞)
- 시트 통풍시트(운전석)
- 시트 인조가죽시트
- 룸미러 전자식 룸미러(ECM)
- 룸미러 하이패스 내장
- 스티어링휠 가죽스티어링휠
- 파킹 전자식 파킹
- 에어백 운전석 / 동승석 / 사이드 / 커튼 / 무릎보호
- 주행안전 차체자세제어장치(VDC,ESC,ESP)
- 주행안전 후측방경보시스템(BSD)
- 주차보조 후방카메라
- 에어컨 풀오토에어컨 / 공기청정기
- 유무선단자 블루투스 / USB
```

**차용 갭**: 현재 `options: String[]` 평탄 배열. 카테고리 prefix가 없어 UI에서 섹션 분리 어려움. 두 가지 옵션:
- **(A) 평탄 유지 + 카테고리 추론** — 옵션 문자열을 prefix로 그룹핑하는 클라이언트 헬퍼.
- **(B) Json 컬럼으로 카테고리화** — `optionsByCategory: Json` 추가, 시드 시 카테고리 분리. eacar/kcar 카탈로그 미러링이 쉬워짐.

**추천: (B)** — 데이터 정합성 + UI 단순화.

### 2.7 저공해차량 정보 ⭐

- 등급 (1종/2종/3종) — 이미지 라벨로 표시
- 공항주차장 50% 할인
- 공영주차장 50% 할인

차용 갭: **없음**. EV/HEV/LPG 등 친환경 차량 USP 강화에 유효.

### 2.8 차량 위치

`경기 평택시 비전동` (시·군·읍·면·동 단위). 차용은 `registrationRegion: String?` 1필드. 같은 수준.

### 2.9 동일 차종 추천 ⭐

페이지 하단 "동일 차종 이어카" 섹션 — 같은 모델/연식의 다른 매물 8~9개 카드 그리드. **빠른승계 배지 + 지원금 + 최근 조회수 + 등록 시간** 표시. SEO + 회유 모두에 효과.

차용 갭: 추천 섹션 자체가 없음. `GET /api/listings?model=X&excludeId=Y&limit=8` API 추가만으로 구현 가능.

### 2.10 매니저 / CTA 사이드바

- 매니저 사진 + 이름 + 연락처 + 상담신청 버튼
- 채팅하기 (`http://go.eacar.co.kr/...` — 앱 딥링크)
- 빠른승계 신청 / 중도해지위약금 절약 CTA
- 간편 상담문의 모달 (승계상담 / 신차상담 라디오)

차용 갭: DEALER 프로필이 별도 페이지로 분리돼있고, 매물 상세 사이드바에 **"매니저 카드"가 없음**. `Profile.role=DEALER`인 셀러는 사이드바에 프로필 카드 노출 권장.

---

## 3. /premium 인덱스 페이지 (AI 보도자료)

- 빠른승계 매물별 페이지 1개 (`/premium/<id>`)
- AI 리포터 캐릭터: 엘리, 위버, 에이미
- 제목 패턴: "**[지역]** 차량 모델 (연식) 합리적 조건…", "파격 승계 지원금 X백만원"
- 본문: 보도자료 톤, 차량 사양 + 조건 + 시장 맥락 (300~500자)
- 페이지네이션: 11페이지 × 16건 = 약 170~200건 (활성 빠른승계 매물 추정 규모)

차용 갭: 현재 `blog/notice` 페이지만 있고 **AI 자동 보도자료는 없음**. MVP 후순위(Phase 2 — Vercel AI Gateway + Claude/Gemini로 매물 메타에서 본문 생성).

---

## 4. 페이지 구조 (URL 인벤토리, eacar.com sitemap)

```
/                  홈
/car               승계 리스트
/car/<id>          승계 상세
/premium           AI 보도자료 인덱스
/premium/<id>      AI 보도자료 상세
/premium/request   빠른승계 신청 폼
/article           블로그/기사
/channel           SNS 채널 모음
/safe              안전거래 안내
/trust             신뢰 안내
/community         커뮤니티 (구매/판매/AI/신차/자유)
/community/find    원하는 차 찾기
/community/ai      AI 추천
/community/newcar  신차 게시판
/community/free    자유 게시판
/notice            공지사항
/newcar            신차 메인
/newcar/main, /live, /model, /trust, /business
/recruit.php       채용
/privacy.html, /terms.html
```

차용 vs 이어카 페이지 매핑:
- ✓ 홈, 리스트, 상세, sell, guide, faq, terms, privacy, blog, notice
- ✗ AI 보도자료(`/premium`), 안전거래(`/safe`), 커뮤니티(`/community`), 신차 매인(`/newcar`)

**MVP 우선**: 차용은 매물 거래 깊이 우선 → 커뮤니티/신차/AI 보도자료는 Phase 2 이후.

---

## 5. 차용 액션 후보 (Phase별)

### Phase 1 — 데이터 모델 정합 (이번 작업)

1. Listing 확장 필드: `acquisitionMethod` (enum), `residualValue` (Int), `driverMinAge` (Int), `contractMonths` (Int), `contractEndDate` (DateTime), `fuelEfficiency` (Decimal), `fuelEfficiencyGrade` (Int), `lowEmissionGrade` (Int)
2. 옵션 카테고리화: `optionsByCategory: Json` 또는 헬퍼 함수 (B 권장)
3. 신규 모델: `PromotionProduct`, `PromotionPurchase`, `AgentRequest`, `SellerPayment(kind: PROMOTION | AGENT_FEE)`
4. mockup 데이터: 이어카 /car/40635 + kcar carInfoDtl 기반 fixture

### Phase 2 — UX 미러링

1. 매물 상세에 카테고리화된 옵션 섹션
2. 동일 차종 추천 그리드
3. 빠른승계 배지 + 사이드바 매니저 카드
4. 저공해차량 혜택 섹션 (EV/HEV/LPG 매물)

### Phase 3 — 비즈니스 로직

1. 빠른승계 신청 폼 + AgentRequest 워크플로
2. PromotionProduct 카탈로그 + 결제(토스페이먼츠 별건) + 노출 부스트 로직
3. AI 보도자료 자동 생성 (Vercel AI Gateway)

---

## 6. 미해결 / Phase 2 조사 필요

- 엔카·KB차차차·헤이딜러 **광고 상품 카탈로그** — 매도자 대시보드 로그인 벽 추정. 앱스토어 스크린샷 / 블로그 후기 / 영업제안서 PDF로 보조 수집 필요.
- 이어카 **거래 완료 정산 흐름** — 매도자 계좌 KYC, 송금 PG, 세금계산서 처리 (정책 페이지 미공개).
- 이어카 **매물 검수 절차** — 등록 후 ACTIVE까지 시간/기준 미공개. 실제로 매물 등록 테스트가 필요.
