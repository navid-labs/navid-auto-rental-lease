---
description: 프로덕션 빌드 및 검증 방법
---

# Build & Verification

1. 타입 체크
// turbo
```bash
yarn type-check
```

2. 린트 체크
// turbo
```bash
yarn lint
```

3. 테스트 실행
// turbo
```bash
yarn test
```

4. 프로덕션 빌드
```bash
yarn build
```

## 빌드 전 체크리스트

- [ ] 타입 에러 없음
- [ ] 린트 에러 없음
- [ ] 테스트 통과
- [ ] 환경 변수 설정 확인
