---
description: 데이터베이스 마이그레이션 및 시딩 방법
---

# Database Management

## 스키마 변경 시

1. `prisma/schema.prisma` 수정

2. 마이그레이션 생성
```bash
yarn prisma migrate dev --name <migration_name>
```

3. Prisma 클라이언트 재생성
// turbo
```bash
yarn db:generate
```

## 프로덕션 마이그레이션 배포

```bash
yarn db:migrate
```

## 시딩

```bash
yarn db:seed
```

## 스키마 푸시 (개발용, 마이그레이션 없이)

```bash
yarn db:push
```

## Prisma Studio (DB GUI)

// turbo
```bash
yarn db:studio
```

## 주의사항

- 프로덕션 DB에 직접 쿼리 실행 시 항상 `--env prd` 확인
- 스키마 변경은 반드시 마이그레이션 파일로 관리
- `prisma/schema.prisma`가 single source of truth
