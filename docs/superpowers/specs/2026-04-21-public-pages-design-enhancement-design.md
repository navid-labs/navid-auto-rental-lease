# 차용 퍼블릭 페이지 디자인 증강 — Spec

작성일: 2026-04-21
관련 브랜드 브리프: Claude Design 핸드오프 번들 (`h/Smb1weN2BO8daIlSM99SPg`, README + chat transcript 기반 재구성)
범위: 퍼블릭 페이지(Home, List, Detail, Sell) 시각적 임팩트 강화

## 1. 배경

사용자 피드백: "현재 구현된 메인페이지를 포함하여 퍼블릭 페이지가 너무 밋밋해서".
Claude Design에서 반복한 디자인 탐색(chat1.md)은 퍼블릭 페이지에 다음을 추가함:

- 로고 커브 모티프(도로/리본)를 섹션 배경·구분자에 활용
- 카운트업 애니메이션 (신뢰 지표)
- 실시간 활동 피드 ("방금 등록된 매물" 타입 티커)
- 인터랙티브 비용 계산기
- 고객 스토리 테스티모니얼
- Hero 레이아웃 3종 변형 (split / spotlight / full-bleed)
- List/Detail/Sell 페이지의 시각적 리프트

디자인 번들은 전송 중 일부 잘려(HTML 프로토타입 부재) README + 채팅 전사를 기반으로 재구성함.

## 2. 원칙 (README 준수)

- **Korean-first / 존댓말** — 기존 카피 톤 유지
- **Toss-blue (`#3182F6`) 단일 액센트** — 프라이머리 외 블루 신설 금지
- **Pretendard Variable** — 이미 CDN으로 로드됨
- **금융 UI 느낌** — 배경·텍스처·음영 최소, `shadow-sm/md/lg` 3단 유지
- **`prefers-reduced-motion` 존중** — 모든 애니메이션에 적용
- **모바일-우선** — 현재 grid/padding 패턴 유지

## 3. 단계별 스펙

### Phase 1 — 디자인 시스템 토큰 확장 ✅ (완료 2026-04-21)

`src/app/globals.css` 증분 업데이트. 기존 토큰 수정 없음, 117 lines 추가.

- 컬러: `primary-wash`, `primary-soft`, `primary-ring`
- 그라데이션: `gradient-hero`, `gradient-cta`, `gradient-subtle`
- 섀도우 스케일: `shadow-sm/md/lg/float`
- 반경 스케일: `radius-sm/md/lg/xl/2xl/full`
- 모션: `transition-fast/base/slow`
- 유틸리티 클래스: `chayong-hover-lift`, `chayong-icon-well`, `chayong-tabular-nums`, `chayong-count-up`, `chayong-ticker-item`, `chayong-ribbon-bg`, `chayong-scroll-x`, `chayong-focus-ring`

**검증**: `bun run build` 통과 (exit 0).

### Phase 2 — Home 페이지 증강

현재 Home 구성: Hero + SearchHub + TrustStripe + Recommended + StoryCards + Timeline + SellCTA.

#### 2.0 전역 타이포 보정 (F-07, F-08)
- `src/app/globals.css`에 `h1, h2, h3 { text-wrap: balance; }` 추가 — 한국어 2~3줄 헤딩 줄바꿈 개선
- Hero와 section h2 사이 중간 스케일 확보: `text-2xl`/`text-3xl` 명시 사용 (현재 `text-lg md:text-xl` → `text-xl md:text-2xl`로 승급, h1은 유지)

#### 2.1 TrustStripe 카운트업 애니메이션
- IntersectionObserver로 뷰포트 진입 시 0 → 목표값 count-up (800ms)
- `prefers-reduced-motion` 감지 시 즉시 최종값 표시
- 최초 진입 1회만 트리거

#### 2.2 LiveActivityFeed (신규 컴포넌트)
- 상단 Hero 아래 또는 TrustStripe 옆 배치 (TBD 리뷰 후)
- 항목 예: "방금 BMW X3 매물 등록", "에스크로 결제 완료 (서울·K5)", "잔여 14개월 매물 신규"
- 현재 세션에서 mock 데이터 (`useEffect` + `setInterval`로 5초마다 다음 이벤트)
- 추후 실시간 데이터 연동 포인트 남김 (API 스텁)

#### 2.3 CostCalculator (신규 컴포넌트)
- 차량가 슬라이더 (500만 ~ 1억)
- 선택값 → `월 납입금` 추정치 + `신차 리스 대비 절감액`
- 계산식: README "~40% 저렴" 기준 단순화 (월납입금 ≈ 차량가 × 0.012, 신차 대비 40% savings)
- 결과 블록 시각: PriceDisplay 컴포넌트 재사용

#### 2.4 CustomerStories (신규 컴포넌트)
- 3~6장 카드 (현재 `story-cards.tsx`와는 다른 목적: 제품 설명 vs 사용자 인용)
- 각 카드: 이니셜 아바타, 이름(가명) + 직업, 인용구, 차종 태그, 절감액
- 초기 더미 데이터 (추후 CMS 연동 포인트)

#### 2.5 RibbonMotif (신규 SVG 컴포넌트)
- 로고 커브를 추출한 유연한 SVG 리본/물결
- Hero 배경 / TrustStripe 구분자 / SellCTA 배경에 옅게 배치
- Primary + primary-wash 두 톤, `opacity 0.3~0.5`
- Reduced-motion 사용자에게도 정적으로 표시 (움직임 없음)

#### 2.6 Hero 폴리시 (F-05, F-10)
- 현재 Hero 유지 + RibbonMotif 배경 추가
- "이번 달 N건 신규" 배지 위치 미세 조정 (현재 위치는 접근성 OK이나 시각 무게 낮음)
- Floating price widget: 모바일(`<md`)에서 Car SVG 아래로 재배치 (현재 `absolute -bottom-2 right-0`로 덮임) — 모바일에서는 `relative mt-4`, 데스크톱만 absolute 유지
- Hero 그라데이션 대비 강화: 기존 `gradient-hero` 유지하되 RibbonMotif로 시각 포인트 보강

#### 2.7 카드 호버 리프트 전역 적용 (F-01, F-09)
- `VehicleCard`, `StoryCards`, `TrustStripe` 카드에 `chayong-hover-lift` 유틸리티 적용
- 현재 VehicleCard는 `hover:shadow-lg hover:-translate-y-0.5` 이미 존재 → 토큰화만 (동작 동일)
- StoryCards는 현재 hover 상태 없음 → 신규 적용

### Phase 3 — List 페이지 증강

- 데스크톱 sticky 사이드바 필터 (`lg:sticky lg:top-20`)
- 결과 수 변경 시 카운트업 애니메이션
- 정렬 드롭다운 폴리시 (shadcn `<Select>` 재활용)
- 브랜드 칩 가로 스크롤 (`chayong-scroll-x` 적용)

### Phase 4 — Detail 페이지 증강

- 비용 breakdown 탭 (`월납입금 / 총지출 / 신차리스 비교`) — 현재 `ListingCostCalculator` 사이드바 존재, 하단 섹션으로 확장 복제
- **에스크로 5-스텝 비주얼 (F-11)** — 현재 3-step (가계약금 보호 / 승계 진행 / 거래 완료)을 README 원안 따라 5-step으로 확장:
  1. 매물 상담 & 예약
  2. 에스크로 계약금 입금
  3. 금융사 심사 (신용/명의)
  4. 명의 이전 & 본계약
  5. 에스크로 해제 & 거래 완료
- Sticky 사이드바 price 위젯 강화: 현재 존재, `chayong-shadow-float` 토큰화 + scroll시 헤더 고정 연동 확인

### Phase 5 — Sell 페이지 증강

- Wizard 진행 상태 애니메이션 (현재 `step-indicator.tsx` 활용)
- 라이브 프리뷰 카드 (입력 중 매물 카드가 채워지는 시각화)
- 각 스텝 trust reinforcement (에스크로 보호, 안심매물 뱃지 등)

## 4. 비범위 (YAGNI)

- 다크 모드 — 브리프에서 "tokens reserved" 언급, 구현 보류
- Guide 페이지 증강 — 사용자가 우선순위에서 제외
- 관리자/인증 페이지 — 브리프 명시적 제외
- Pretendard self-host — CDN 유지 (README caveat 존중)
- 로고 마크 교체 — `/public/logo.png` 현존, 교체 요청 없음

## 5. 검증 전략

- 각 Phase 후 `bun run build` + `bun run type-check` + `bun run lint`
- Chrome/Playwright로 각 페이지 시각 확인 (screenshot + axe 접근성)
- `prefers-reduced-motion` on/off 수동 확인

## 6. 의존성 & 라이브러리

기존 스택 활용, 신규 의존성 추가 없음.
- `lucide-react` ✓ 이미 설치
- `sonner` ✓ 이미 설치 (알림)
- IntersectionObserver — 브라우저 네이티브

## 7. 롤백 플랜

각 Phase는 독립 커밋 — feature flag 없이 `git revert <sha>`로 단일 단계 롤백 가능.

---

## 변경 이력

- 2026-04-21: 초안 작성, Phase 1 완료 (디자인 시스템 토큰 확장)
- 2026-04-21: design-review 수행, findings 13건 스펙 반영 (Phase 2.0 신설, 2.6 확장, 2.7 신설, Phase 4 에스크로 5-step 확장)

---

## 부록 A — Design Review 결과 (2026-04-21)

### Classifier
- Home: HYBRID · List/Detail/Sell: APP UI

### 점수
- Design Score: **B** (펀더멘털 탄탄, motion·사회적증거 부재)
- AI Slop Score: **B-** (TrustStripe 4-col, StoryCards 3-col 경계선)
- Goodwill Reservoir: **72/100** (건전하나 플랫)

### Litmus 체크 (7개 중)
- ✅ 시각 앵커, 헤드라인 스캔, 프리미엄 느낌
- ⚠️ 브랜드 존재감, 섹션 역할 분리, 카드 필요성
- ❌ **Motion 완전 부재 — "밋밋한"의 제1 원인**

### Findings

| ID | Finding | Impact | 페이지 | 매핑 Phase |
|----|---------|--------|--------|-----------|
| F-01 | Zero intentional motion | HIGH | All | 2.1, 2.7 |
| F-02 | Cookie-cutter 섹션 리듬 | HIGH | Home | 2.5 |
| F-03 | TrustStripe 4-col AI slop 경계 | MEDIUM | Home | 2.1 |
| F-04 | StoryCards 3-col borderline | MEDIUM | Home | 2.4 (보완) |
| F-05 | Hero 그라데이션 너무 은은 | MEDIUM | Home | 2.6 |
| F-06 | 사회적 증거 부재 | HIGH | Home | 2.4 |
| F-07 | Heading 중간 스케일 부재 | POLISH | Home | 2.0 |
| F-08 | `text-wrap: balance` 미적용 | MEDIUM | All | 2.0 |
| F-09 | StoryCards hover 없음 | MEDIUM | Home | 2.7 |
| F-10 | 모바일 Floating widget이 Car SVG 덮음 | MEDIUM | Home | 2.6 |
| F-11 | Detail escrow 3-step (README는 5) | MEDIUM | Detail | 4 |
| F-12 | List 결과 카운트 변화 피드백 없음 | POLISH | List | 3 |
| F-13 | Sell wizard preview 없음 | MEDIUM | Sell | 5 |

### 하드 체크
- 하드 반려 사항 없음 (경미한 우려만)
