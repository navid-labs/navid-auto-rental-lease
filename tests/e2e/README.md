# E2E Test Scenarios

## Quick Start

```bash
# 사전 준비
yarn db:seed          # 데모 계정 + 시드 데이터
yarn dev              # 개발 서버 실행

# Playwright Test (표준)
yarn test:e2e

# 특정 시나리오만 실행
npx playwright test tests/e2e/scenario-a-customer.spec.ts
npx playwright test tests/e2e/scenario-b-dealer.spec.ts
npx playwright test tests/e2e/scenario-c-admin.spec.ts
npx playwright test tests/e2e/scenario-d-ux.spec.ts

# HTML 리포트
npx playwright show-report

# Debug 모드
npx playwright test --debug
```

## Playwright Skill (Claude Code)

```bash
cd ~/.claude/skills/playwright-skill && node run.js /tmp/playwright-navid-scenarios.js
```

## Antigravity Browser

Antigravity 브라우저에서 수동/자동 테스트 시 동일 시나리오 사용:

1. `http://localhost:3000` 접속
2. 아래 시나리오 순서대로 실행
3. 각 단계에서 스크린샷/GIF 캡처 가능

## Scenarios

| File | 시나리오 | 테스트 수 | 설명 |
|------|---------|-----------|------|
| `scenario-a-customer.spec.ts` | Customer Journey | 7 | 랜딩→검색→상세→계약→마이페이지 |
| `scenario-b-dealer.spec.ts` | Dealer Journey | 5 | 대시보드→차량등록→승인확인 |
| `scenario-c-admin.spec.ts` | Admin Operations | 8 | 대시보드→차량→계약→사용자→잔가 |
| `scenario-d-ux.spec.ts` | UX & Cross-cutting | 8 | 접근제어, 모바일, 스켈레톤 |
| `demo-flow.spec.ts` | Legacy Smoke Test | 5 | 기존 간단 테스트 (유지) |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@navid.kr | navid1234! |
| Dealer | dealer1@navid.kr | navid1234! |
| Customer | customer1@navid.kr | navid1234! |

## Test Data

- eKYC 인증번호: `123456` (Mock)
- 번호판 조회: Mock Provider (any input)
- 시드 데이터: 180 차량, 8 브랜드, 13 계약
