# Navid Auto 데모 가이드

투자자 프레젠테이션을 위한 데모 워크스루 가이드입니다.

## 데모 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@navid.kr | navid1234! |
| 딜러 1 | dealer1@navid.kr | navid1234! |
| 딜러 2 | dealer2@navid.kr | navid1234! |
| 딜러 3 | dealer3@navid.kr | navid1234! |
| 고객 1 | customer1@navid.kr | navid1234! |
| 고객 2 | customer2@navid.kr | navid1234! |
| 고객 3 | customer3@navid.kr | navid1234! |
| 고객 4 | customer4@navid.kr | navid1234! |
| 고객 5 | customer5@navid.kr | navid1234! |

## 사전 준비

```bash
# 1. 환경변수 확인 (.env.local)
#    DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 필수
#    SUPABASE_SERVICE_ROLE_KEY (데모 계정 로그인 필요시)

# 2. 시드 데이터 투입
yarn db:seed

# 3. 개발 서버 실행
yarn dev
```

---

## 고객 여정 (Customer Journey)

### 1. 랜딩 페이지
- http://localhost:3000 방문
- Hero 섹션 확인: 메인 카피 + CTA 버튼
- 추천 차량 카드 확인 (하단 스크롤)
- 신뢰 지표 확인 (차량 수, 고객 수 등)

### 2. 차량 검색
- "차량 검색" 클릭 또는 /vehicles 직접 방문
- 필터 적용:
  - 브랜드: Hyundai 선택
  - 연식: 2023년 이상
  - 가격대 슬라이더 조정
- 정렬 변경: 최신순 / 가격순
- 차량 카드에서 가격(KRW), 주행거리(km) 형식 확인

### 3. 차량 상세
- 차량 카드 클릭 -> 상세 페이지
- 이미지 갤러리 확인
- 차량 스펙 (연식, 주행거리, 연료, 변속기)
- 렌탈/리스 월 납입금 확인
- "렌탈 신청" 또는 "리스 신청" 버튼

### 4. 계약 신청 (로그인 필요)
- customer1@navid.kr 로 로그인
- 계약 위자드 진행:
  1. 계약 조건 선택 (기간, 보증금)
  2. eKYC 본인인증 (테스트 모드)
  3. 계약 검토 및 제출
- 제출 후 차량 상세 페이지로 리다이렉트

### 5. 마이페이지
- /mypage 방문
- 내 계약 목록 확인
- 계약 상세 보기
- PDF 다운로드 (계약서)

---

## 관리자 여정 (Admin Journey)

### 1. 로그인
- admin@navid.kr / navid1234! 로 로그인
- /admin/dashboard 로 이동

### 2. 대시보드
- 4개 통계 카드 확인:
  - 전체 차량, 활성 계약, 승인 대기, 이번 달 매출
- 차트 섹션: 월별 계약 추이, 차량 브랜드 분포
- 최근 활동 피드

### 3. 차량 관리
- /admin/vehicles 이동
- "승인 대기" 탭 클릭 -> 승인 큐 확인
- 차량 승인/반려 처리
- 차량 행 클릭 -> Sheet에서 차량 정보 편집
- 휴지통 아이콘으로 소프트 삭제 테스트

### 4. 계약 관리
- /admin/contracts 이동
- 상태별 필터링 (전체, 승인 대기, 진행 중 등)
- PENDING_APPROVAL 계약 승인 처리
- 계약 취소 테스트

### 5. 사용자 관리
- /admin/users 이동
- 역할별 탭 필터링 (전체, 고객, 딜러, 관리자)
- 사용자 비활성화 버튼 테스트
- 역할 변경 (셀렉트 박스)

### 6. 잔존가치 관리
- /admin/residual-value 이동
- 브랜드 필터로 특정 브랜드 선택
- 잔존가치율 확인
- 신규 잔존가치율 추가 폼

---

## 딜러 여정 (Dealer Journey)

### 1. 로그인
- dealer1@navid.kr / navid1234! 로 로그인

### 2. 딜러 대시보드
- /dealer/dashboard 이동
- 등록 차량 목록 확인
- 승인 상태 확인 (PENDING, APPROVED, REJECTED)

### 3. 차량 등록
- "차량 등록" 클릭
- 위자드 Step 1: 브랜드/모델/세대/트림 선택
- 위자드 Step 2: 가격, 연식, 주행거리, 색상 입력
- 위자드 Step 3: 사진 업로드 (드래그앤드롭)
- 등록 완료 -> PENDING 상태로 관리자 승인 대기

---

## 모바일 테스트 체크리스트

브라우저 DevTools에서 375px 뷰포트로 확인:

- [ ] 랜딩 페이지: Hero 카피 읽기 가능, CTA 터치 가능
- [ ] 차량 검색: 필터 시트(모바일), 카드 1열 정렬
- [ ] 차량 상세: 이미지 전체폭, 스펙 2열
- [ ] 관리자 대시보드: 통계 카드 1열 스택, 차트 스크롤
- [ ] 관리자 차량: 모바일 카드 레이아웃 (테이블 숨김)
- [ ] 관리자 사용자: 모바일 카드 레이아웃
- [ ] 계약 위자드: 스텝 내비게이션, 폼 입력 가능

---

## 로딩 상태 확인

각 페이지에서 새로고침(Cmd+Shift+R)하여 스켈레톤 로딩 확인:

- [ ] /admin/dashboard - 카드, 차트, 활동 피드 스켈레톤
- [ ] /admin/vehicles - 탭, 테이블 스켈레톤
- [ ] /admin/contracts - 탭, 카드 스켈레톤
- [ ] /admin/users - 탭, 테이블/카드 스켈레톤
- [ ] /admin/residual-value - 필터, 테이블, 폼 스켈레톤
- [ ] /vehicles - 필터 사이드바, 그리드 스켈레톤
- [ ] /vehicles/[id] - 이미지, 스펙, 가격 스켈레톤

---

## 알려진 제한사항 (v2 예정)

- PDF 생성: Vercel serverless 환경에서 10초 타임아웃 가능
- 실시간 알림: 현재 Supabase Realtime 기반, 향후 WebSocket 전환 가능
- 결제 연동: 실제 PG 미연동 (데모 데이터만)
- eKYC: Mock 인증 (실제 PASS/통신사 인증 미연동)
- 이메일 알림: 미구현 (승인/계약 상태 변경 시)
- 검색 엔진: 전문 검색(Full-text search) 미구현
