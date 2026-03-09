# Feature Research

**Domain:** Korean Used Car Rental/Lease Platform (B2B2C Hybrid)
**Researched:** 2026-03-09
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 차량 검색/필터/정렬 | 엔카, KB차차차 등 모든 플랫폼 기본 기능. 브랜드/모델/연식/가격/주행거리 필터 필수 | MEDIUM | Supabase 풀텍스트 검색 + 다중 필터 조합. 차종 분류 체계(세단/SUV/경차 등) 설계 중요 |
| 차량 상세 정보 페이지 | 사진 갤러리, 제원, 옵션, 사고이력 요약은 최소 기대치 | MEDIUM | 이미지 최적화(Next.js Image), 제원 데이터 구조화 필요 |
| 렌탈/리스 월 납입금 계산기 | 다나와, 카베이 등 견적 비교 플랫폼의 핵심 기능. 보증금/기간/주행거리에 따른 월 비용 실시간 계산 | MEDIUM | 잔존가치 테이블 기반 계산 로직. 리스는 잔가율, 렌탈은 감가+보험+관리비 포함 |
| 회원가입/로그인 | 기본 인증. 이메일+비밀번호 최소, 소셜 로그인(카카오/네이버)은 한국 시장에서 사실상 필수 | LOW | Supabase Auth 활용. v1은 이메일, v2에서 소셜 로그인 추가 가능 |
| 역할 기반 접근 제어 (고객/딜러/관리자) | B2B2C 모델의 근간. 딜러 차량 관리, 관리자 승인 등 역할별 화면 분리 필수 | MEDIUM | Supabase RLS로 데이터 격리. 역할별 미들웨어 설계 |
| 딜러 차량 등록/관리 | B2B2C 마켓플레이스 핵심. 딜러가 차량 정보/사진 등록, 수정, 삭제 | MEDIUM | 이미지 업로드(Supabase Storage), 차량 상태 관리 상태머신 |
| 계약 신청 플로우 | 온라인 계약의 핵심 UX. 롯데렌터카 마이카는 "5분 논스톱 계약" 표방 | HIGH | 다단계 폼 위저드. 본인인증 -> 심사 -> 계약조건 확인 -> 서명 -> 완료 |
| 마이페이지 (계약현황/차량정보) | 고객이 계약 상태, 잔여 기간, 납입 현황 확인하는 기본 기능 | LOW | Supabase 쿼리 기반. 계약 상태머신과 연동 |
| 반응형 웹 (모바일 최적화) | K카 온라인 거래 비중 56.4%. 모바일 우선은 필수 | MEDIUM | Tailwind CSS 반응형. shadcn/ui 컴포넌트 기본 지원 |
| 차량 상태 표시 (예약됨/렌트중/가용) | 실시간 재고 상태는 마켓플레이스 신뢰의 기본 | LOW | Supabase Realtime 또는 폴링. 상태 enum 관리 |
| 관리자 대시보드 | 차량/계약/사용자 CRUD + 기본 통계. 운영의 최소 도구 | MEDIUM | shadcn/ui 데이터 테이블 + 차트. 관리자 전용 레이아웃 |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 번호판 기반 차량 정보 자동 조회 | 헤이딜러의 핵심 차별화 요소. 딜러가 번호판만 입력하면 제원/이력 자동 채움 -> 등록 시간 대폭 단축 | MEDIUM | 국토교통부 공공데이터 API 또는 민간 API(에이픽 등) 연동. v1에서 실연동 확정 |
| 비대면 계약 완결 (eKYC + 전자서명) | 롯데렌터카도 "논스톱 온라인 계약" 추구. 완전 비대면은 아직 드문 차별점 | HIGH | v1은 모의 플로우(UI/UX만), v2에서 PASS/카카오 본인인증 + 모두싸인 전자서명 API 연동 |
| 잔존가치 자동 산정 | 리스 계약의 핵심 요소. 연식/주행거리/모델별 잔가율 자동 계산은 투명성 제고 | MEDIUM | 차종별 감가율 테이블 설계. 연 약정거리별 잔가율 차등 적용(1만km: 65%, 2만km: 62% 등) |
| 렌탈 vs 리스 비교 시뮬레이션 | 고객이 같은 차량에 대해 렌탈/리스 조건을 나란히 비교. 다나와/카베이 수준의 비교 기능 | MEDIUM | 월 납입금, 총비용, 번호판 종류(하/허/호 vs 일반), 보험 조건 등 차이점 시각화 |
| 계약서 PDF 자동 생성 | 계약 내용 기반 법적 효력 있는 PDF 자동 생성. 다운로드/이메일 발송 | MEDIUM | React-PDF 또는 서버사이드 PDF 생성. 계약서 템플릿 법률 검토 필요 |
| 딜러 승인/관리 체계 | 관리자가 딜러 가입 승인, 등록 차량 검수 후 노출. 플랫폼 신뢰도 확보 | LOW | 승인 상태머신(신청 -> 검토 -> 승인/반려). 관리자 알림 |
| 차량 가격 변동 알림 | 반카 등에서 제공. 찜한 차량 가격 하락 시 알림 | LOW | Supabase Edge Function + 웹 푸시 알림. v2 이후 적합 |
| 3D/VR 차량 뷰어 | 엔카 VR 차량 전시장. 온라인 구매 신뢰도 향상 | HIGH | 서드파티 솔루션 필요. MVP 범위 밖이지만 장기적 차별화 요소 |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 실시간 채팅/상담 | 고객 문의 즉시 응대 기대 | v1에서 24/7 상담 인력 확보 불가. 미응답 채팅은 역효과. 개발 복잡도 높음 | 문의 폼 + 콜백 예약. v2에서 카카오톡 채널 연동 검토 |
| 결제/PG 연동 | "결제까지 원스톱" 기대 | 결제 방식 미확정. PG 심사/계약 시간 소요. 렌탈/리스는 월 자동이체가 일반적이라 PG보다 CMS가 적합 | v1은 계약 체결까지만. 결제는 오프라인 또는 별도 안내 |
| AI 차량 추천 | "맞춤 추천"은 트렌디해 보임 | 초기 데이터 부족으로 추천 품질 낮음. 잘못된 추천은 신뢰 하락 | 인기 차량/최근 등록 차량 노출. 데이터 축적 후 v2+ 검토 |
| 보험/정비 통합 관리 | 원스톱 차량 관리 기대 | 보험사/정비 업체 연동 복잡. 규제 이슈. v1 범위 초과 | 렌탈 계약에 보험 포함 여부만 명시. 정비 안내는 정보성 콘텐츠로 |
| 다국어 지원 | 글로벌 확장 기대 | 한국 중고차 렌탈/리스는 내수 시장. i18n 구현 비용 대비 효과 미미 | 한국어 단일 언어. 향후 필요 시 next-intl 도입 |
| 네이티브 모바일 앱 | "앱이 있어야 한다" 인식 | 웹 앱으로 충분한 기능 제공 가능. 앱스토어 심사/유지보수 부담 | 반응형 웹 + PWA. v2에서 Capacitor 패키징 검토 |
| 실시간 차량 위치 추적 | 렌탈 차량 관리 기대 | GPS 장비/연동 필요. 개인정보 이슈. v1 범위 초과 | 차량 인수/반납 장소 안내만 제공 |

## Feature Dependencies

```
[회원가입/로그인]
    +--requires--> [역할 기반 접근 제어]
    |                  +--requires--> [딜러 차량 등록/관리]
    |                  |                  +--enhances--> [번호판 기반 자동 조회]
    |                  |                  +--requires--> [차량 상태 관리]
    |                  +--requires--> [관리자 대시보드]
    |                                     +--requires--> [딜러 승인/관리]
    +--requires--> [마이페이지]

[차량 검색/필터]
    +--requires--> [차량 상세 페이지]
    |                  +--enhances--> [렌탈/리스 월납입금 계산기]
    |                  |                  +--requires--> [잔존가치 자동 산정]
    |                  +--enhances--> [렌탈 vs 리스 비교 시뮬레이션]
    +--requires--> [차량 상태 표시]

[계약 신청 플로우]
    +--requires--> [회원가입/로그인]
    +--requires--> [차량 상세 페이지]
    +--requires--> [월납입금 계산기]
    +--enhances--> [eKYC 본인인증] (v1 모의)
    +--enhances--> [전자서명] (v1 모의)
    +--enhances--> [계약서 PDF 생성]

[잔존가치 자동 산정]
    +--requires--> [차종별 감가율 데이터]
    +--enhances--> [월납입금 계산기]
```

### Dependency Notes

- **계약 신청 플로우 requires 월납입금 계산기:** 계약 조건(보증금, 기간, 주행거리)에 따른 월 납입금이 확정되어야 계약 진행 가능
- **번호판 조회 enhances 딜러 차량 등록:** 번호판 입력으로 차량 정보 자동 채움. 없어도 수동 입력 가능하지만 딜러 UX 크게 향상
- **잔존가치 산정 requires 감가율 데이터:** 차종/연식/주행거리별 잔가율 테이블이 선행되어야 계산 가능. 초기 데이터는 업계 표준 기반 시드 데이터로 구성
- **eKYC/전자서명 enhances 계약 플로우:** v1은 모의 플로우이므로 의존성 약함. v2에서 실연동 시 강한 의존성

## MVP Definition

### Launch With (v1) -- Demo/Investment Pitch

- [x] 차량 검색/필터/비교 -- 플랫폼의 가장 기본적인 가치
- [x] 차량 상세 페이지 (사진, 제원, 가격) -- 구매 의사결정의 핵심 정보
- [x] 번호판 기반 차량 정보 자동 조회 -- 데모 임팩트가 큰 핵심 차별화 기능
- [x] 회원가입/로그인 + 역할 기반 접근 제어 -- B2B2C 모델의 근간
- [x] 딜러 차량 등록/수정/삭제 -- 마켓플레이스 공급 측면
- [x] 관리자 차량 등록 (자사 재고) -- 하이브리드 모델 시연
- [x] 렌탈/리스 월 납입금 계산기 -- 계약 의사결정 도구
- [x] 잔존가치 자동 산정 -- 리스 계약의 핵심 로직
- [x] 계약 신청 플로우 (다단계 위저드) -- 비대면 계약의 핵심 UX
- [x] eKYC 모의 플로우 (UI/UX만) -- 비대면 인증 시연
- [x] 계약서 PDF 자동 생성 -- 계약 완결성 시연
- [x] 마이페이지 (계약 현황) -- 고객 경험 완결
- [x] 관리자 대시보드 (CRUD + 통계) -- 운영 도구
- [x] 반응형 웹 (모바일 최적화) -- 모바일 트래픽 대응

### Add After Validation (v1.x)

- [ ] 소셜 로그인 (카카오/네이버) -- 한국 시장 전환율 향상에 직결
- [ ] 딜러 승인/관리 체계 -- 실 딜러 온보딩 시 필요
- [ ] 차량 찜/관심 목록 -- 재방문 유도
- [ ] 렌탈 vs 리스 비교 시뮬레이션 -- 고객 의사결정 지원 강화
- [ ] 이메일/푸시 알림 (계약 상태 변경) -- 고객 경험 향상
- [ ] 차량 가격 변동 알림 -- 재방문 유도

### Future Consideration (v2+)

- [ ] 실제 eKYC API 연동 (PASS/카카오 인증) -- 건당 200~500원 비용 발생
- [ ] 전자서명 API 연동 (모두싸인) -- 월 구독 + 건당 비용
- [ ] 결제/CMS 연동 -- 월 자동이체 설정
- [ ] 실시간 채팅 (카카오톡 채널) -- 상담 인력 확보 후
- [ ] 네이티브 앱 (Capacitor) -- PWA로 부족할 경우
- [ ] AI 기반 차량 추천 -- 데이터 축적 후
- [ ] 3D/VR 차량 뷰어 -- 기술 성숙도 + 비용 고려

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 차량 검색/필터 | HIGH | MEDIUM | P1 |
| 차량 상세 페이지 | HIGH | MEDIUM | P1 |
| 번호판 기반 자동 조회 | HIGH | MEDIUM | P1 |
| 회원가입/로그인 | HIGH | LOW | P1 |
| 역할 기반 접근 제어 | HIGH | MEDIUM | P1 |
| 딜러 차량 등록/관리 | HIGH | MEDIUM | P1 |
| 월 납입금 계산기 | HIGH | MEDIUM | P1 |
| 잔존가치 자동 산정 | HIGH | MEDIUM | P1 |
| 계약 신청 플로우 | HIGH | HIGH | P1 |
| eKYC 모의 플로우 | MEDIUM | MEDIUM | P1 |
| 계약서 PDF 생성 | MEDIUM | MEDIUM | P1 |
| 관리자 대시보드 | MEDIUM | MEDIUM | P1 |
| 마이페이지 | MEDIUM | LOW | P1 |
| 반응형 웹 | HIGH | MEDIUM | P1 |
| 소셜 로그인 | MEDIUM | LOW | P2 |
| 딜러 승인 체계 | MEDIUM | LOW | P2 |
| 렌탈 vs 리스 비교 | MEDIUM | MEDIUM | P2 |
| 차량 찜/관심 목록 | LOW | LOW | P2 |
| 가격 변동 알림 | LOW | MEDIUM | P3 |
| 실제 eKYC 연동 | HIGH | HIGH | P3 |
| 전자서명 연동 | HIGH | HIGH | P3 |
| 결제/CMS 연동 | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (demo/investment pitch)
- P2: Should have, add when possible (post-launch enhancement)
- P3: Nice to have, future consideration (v2+ with real business operations)

## Competitor Feature Analysis

| Feature | 엔카 | K카 (케이카) | KB차차차 | 롯데렌터카 마이카 | Our Approach |
|---------|------|-------------|---------|-----------------|-------------|
| 차량 검색/필터 | 최대 매물, 상세 필터 | 직영 재고 중심 | AI 시세 예측 | 자사 재고 중심 | 다중 필터 + 가격 비교 |
| 번호판 조회 | 시세 조회 가능 | 미제공 | 시세 조회 가능 | 미제공 | 딜러 등록 시 자동 채움 (차별화) |
| 온라인 계약 | 딜러 연결 | 100% 온라인 구매 | 딜러 연결 | 5분 논스톱 전자계약 | 비대면 렌탈/리스 계약 (차별화) |
| 배송 | 미제공 | 당일배송 홈서비스 | 미제공 | 탁송 | v1 범위 외 |
| 보증/환불 | 딜러별 상이 | 3일 환불 + 2년 보증 | 딜러별 상이 | 계약 조건 내 | 계약 조건 명시 |
| 잔존가치 산정 | 시세 정보 제공 | 미제공 (매매) | AI 시세 예측 | 내부 산정 | 투명한 잔가율 공개 (차별화) |
| 렌탈/리스 비교 | 미제공 (매매) | 미제공 (매매) | 미제공 | 렌탈만 | 렌탈 vs 리스 나란히 비교 (차별화) |

### 경쟁 분석 요약

기존 시장은 크게 두 축으로 나뉨:
1. **중고차 매매 플랫폼** (엔카, K카, KB차차차): 구매/판매 중심. 렌탈/리스 기능 미약
2. **렌터카 회사** (롯데렌터카, SK렌터카): 자사 재고 중심. 마켓플레이스 아님

Navid의 포지셔닝은 이 두 축의 교차점: **중고차 마켓플레이스 + 렌탈/리스 특화**. 이 조합을 제공하는 플랫폼은 현재 한국 시장에 부재하므로 명확한 차별화 가능.

## Sources

- [다나와 자동차 렌트/리스 가격비교](https://auto.danawa.com/leaserent/)
- [반카 - 렌트 가격비교 플랫폼](https://www.vancar.kr/)
- [K Car 케이카 내차사기 홈서비스](https://www.kcar.com/bc/homeSvc/main)
- [엔카 중고차](https://www.encar.com/)
- [KB차차차](https://www.kbchachacha.com/)
- [롯데렌터카 마이카](https://direct.lotterentacar.net/)
- [SK렌터카 다이렉트](https://www.skdirect.co.kr/)
- [국토교통부 자동차종합정보 API](https://www.data.go.kr/data/15071233/openapi.do)
- [에이픽 API 차량 정보 조회](https://apick.app/dev_guide/get_car_info)
- [모두싸인 전자서명 API](https://modusign.co.kr/features-api)
- [바로써트 인증 API](https://www.barocert.com/)
- [잔존가치 가이드 - 겟차](https://web.getcha.kr/articles/rent-residual-value)
- [뱅크샐러드 리스 vs 렌트 비교](https://www.banksalad.com/articles/%EC%9E%90%EC%82%B0%EA%B4%80%EB%A6%AC-%EC%9E%90%EB%8F%99%EC%B0%A8%EB%A0%8C%ED%8A%B8-%EB%A6%AC%EC%8A%A4%EB%A0%8C%ED%8A%B8%EC%B0%A8%EC%9D%B4)

---
*Feature research for: Korean Used Car Rental/Lease Platform*
*Researched: 2026-03-09*
