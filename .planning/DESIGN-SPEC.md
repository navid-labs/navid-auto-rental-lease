# Navid Auto 디자인 스펙

> AI 컨셉 이미지 기반 추출 (Nano Banana 2, 2026-03-09)
> 이미지 위치: `~/development/claude_volt/Assets/navid-concepts/`

## 1. 디자인 원칙

- **Premium Glassmorphism**: 반투명 카드, backdrop-blur, 미묘한 보더
- **Dark Hero + Light Content**: 히어로 영역은 다크 네이비, 콘텐츠는 화이트
- **Mobile-First**: 모바일 레이아웃 우선 설계 → 데스크톱 확장
- **한글 최적화**: Pretendard 폰트, KRW 포맷(월 450,000원), 한국어 날짜

## 2. 색상 팔레트

### Primary (Brand)
```css
--navy-900: #0F172A;    /* 히어로 배경 */
--navy-800: #1E293B;    /* 다크 섹션 */
--navy-700: #334155;    /* 서브 다크 */
```

### Accent (CTA / 가격 강조)
```css
--blue-500: #3B82F6;    /* 주요 CTA, 가격 표시 */
--blue-600: #2563EB;    /* CTA hover */
--blue-100: #DBEAFE;    /* 뱃지 배경 */
```

### Neutral
```css
--white: #FFFFFF;        /* 콘텐츠 배경 */
--gray-50: #F8FAFC;     /* 카드 배경 */
--gray-100: #F1F5F9;    /* 필터 배경 */
--gray-300: #CBD5E1;    /* 보더 */
--gray-500: #64748B;    /* 보조 텍스트 */
--gray-900: #0F172A;    /* 메인 텍스트 */
```

### Semantic
```css
--success: #22C55E;     /* 가능/활성 */
--warning: #F59E0B;     /* 주의 */
--error: #EF4444;       /* 에러/불가 */
```

## 3. 타이포그래피

| 용도 | 크기 | 무게 | 행간 |
|------|------|------|------|
| Hero Heading | 48px / 3rem | Bold 700 | 1.2 |
| Page Heading | 32px / 2rem | Bold 700 | 1.3 |
| Section Title | 24px / 1.5rem | SemiBold 600 | 1.4 |
| Card Title | 18px / 1.125rem | SemiBold 600 | 1.4 |
| Body | 16px / 1rem | Regular 400 | 1.6 |
| Caption/Label | 14px / 0.875rem | Medium 500 | 1.5 |
| Small | 12px / 0.75rem | Regular 400 | 1.5 |
| Price (강조) | 28px / 1.75rem | Bold 700 | 1.2 |

### 모바일 스케일
- Hero: 32px, Page: 24px, Section: 20px, Price: 24px
- 기타 동일

## 4. 스페이싱

| 토큰 | 값 | 용도 |
|------|-----|------|
| xs | 4px | 인라인 요소 간격 |
| sm | 8px | 아이콘-텍스트 간격 |
| md | 16px | 카드 내부 패딩 |
| lg | 24px | 섹션 내부 간격 |
| xl | 32px | 카드 간 간격 |
| 2xl | 48px | 섹션 간 간격 |
| 3xl | 64px | 히어로 패딩 |
| 4xl | 96px | 페이지 상단/하단 |

## 5. 컴포넌트 스펙

### 5.1 Vehicle Card
```
┌─────────────────────────┐
│  [차량 이미지 16:10]     │  ← rounded-xl, object-cover
│                         │
├─────────────────────────┤
│ 현대 쏘나타 2024 프리미엄  │  ← card-title, semibold
│ 2024 · 1.5만km · 가솔린   │  ← caption, gray-500
│                         │
│ 월 380,000원~            │  ← price, blue-500, bold
└─────────────────────────┘

- 데스크톱: 3열 그리드, gap-6
- 모바일: 1열, 카드 가로 풀폭
- 카드: bg-white, rounded-2xl, shadow-sm
- 호버: shadow-lg, translateY(-2px)
```

### 5.2 Glassmorphism Card
```css
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

/* 다크 배경 위 */
.glass-card-dark {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
```

### 5.3 Search Bar (히어로)
```
┌──────────┬──────────┬──────────┬──────────┐
│ 브랜드 ▾  │ 예산 설정  │ 차종 ▾    │ 차량 검색하기 │
└──────────┴──────────┴──────────┴──────────┘

- glassmorphism-dark 카드 위에 배치
- 데스크톱: 가로 1행
- 모바일: 2열 그리드 + 하단 풀폭 버튼
- 검색 버튼: bg-blue-500, text-white, rounded-xl
```

### 5.4 Filter Sidebar (검색 결과)
```
데스크톱: 좌측 280px 고정 사이드바
  - 브랜드 로고 그리드 (Hyundai, Kia, Genesis)
  - 가격 범위 슬라이더
  - 연식 범위 (2020~2024)
  - 연료 타입 체크박스
  - 주행거리 범위

모바일: 하단 시트(Sheet) 또는 상단 필터 칩
  - 수평 스크롤 필터 칩 (전체, 현대, 기아, 제네시스)
  - "필터" 버튼 → 바텀시트 오픈
```

### 5.5 Step Indicator (계약 플로우)
```
(1) ────── (2) ────── (3) ────── (4)
차량확인   조건설정   본인인증   검토·서명

- 활성: bg-blue-500, text-white, ring
- 완료: bg-blue-100, text-blue-600, checkmark
- 미완료: bg-gray-100, text-gray-400
- 라인: 완료=blue-500, 미완료=gray-200
```

### 5.6 Price Calculator
```
┌─────────────────────────────┐
│ 가격                         │
│                             │
│ 계약기간   [12─────60] 36개월  │  ← 슬라이더
│ 보증금/선납금  [________] 원    │  ← 입력 필드
│                             │
│     월 420,000원              │  ← 대형 파란색 텍스트
│                             │
│  [    견적 신청하기    ]       │  ← blue CTA 풀폭
└─────────────────────────────┘
- glassmorphism 카드
- 슬라이더: blue-500 트랙, 원형 핸들
```

## 6. 페이지별 레이아웃

### 6.1 랜딩 페이지
```
[Header: 로고 + 네비 + 로그인]
[Hero: 다크 그라데이션 + 차량 이미지 + 헤드라인 + 검색바]
[Featured: 추천 차량 카드 3열]
[Trust: 신뢰 뱃지 + 카테고리 아이콘]
[Footer]
```

### 6.2 검색 결과
```
[Header]
[Filter Sidebar | Sort Bar + Card Grid 3열]
[Pagination]
[Footer]

모바일: [Header] [Filter Chips] [Sort] [Card List 1열] [Sticky Bottom Bar]
```

### 6.3 차량 상세
```
[Header]
[Image Gallery | Vehicle Info + Price Calculator]
[Rental vs Lease 비교표]
[차량 스펙 아이콘 그리드]
[관련 차량 추천 캐러셀]
[Footer]

모바일: 모두 세로 스택, 가격 계산기 sticky bottom
```

### 6.4 계약 신청 (eKYC)
```
[Header]
[Step Indicator 4단계]
[Form Card | Summary Sidebar]
[이전/다음 버튼]
[Footer]

모바일: Summary가 상단 축약 배너로 전환
```

## 7. 반응형 브레이크포인트

| 이름 | 값 | 그리드 |
|------|-----|--------|
| mobile | < 640px | 1열 |
| tablet | 640-1024px | 2열 |
| desktop | 1024-1440px | 3열, 사이드바 |
| wide | > 1440px | max-w-7xl 센터 |

## 8. 애니메이션

| 요소 | 효과 | 속도 |
|------|------|------|
| 카드 호버 | translateY(-2px) + shadow-lg | 200ms ease |
| 페이지 전환 | opacity fade | 150ms |
| 필터 토글 | height collapse/expand | 200ms ease-out |
| 가격 변경 | number counter animation | 300ms |
| 모바일 바텀시트 | slide up from bottom | 250ms ease-out |

## 9. 컨셉 이미지 참조

| 파일명 | 설명 |
|--------|------|
| `landing-desktop.png` | 랜딩 데스크톱 - 다크 히어로 + 카드 3열 |
| `landing-mobile.png` | 랜딩 모바일 - iPhone 프레임 + 세로 카드 |
| `search-results-desktop.png` | 검색 데스크톱 - 사이드바 필터 + 9카드 |
| `search-results-mobile.png` | 검색 모바일 - 필터 칩 + 리스트 |
| `vehicle-detail-desktop.png` | 상세 데스크톱 - 갤러리 + 계산기 |
| `contract-ekyc-desktop.png` | 계약 eKYC - 4단계 스텝퍼 + 폼 |
