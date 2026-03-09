---
description: 개발 서버 실행 방법
---

# Development Server

1. 의존성 설치 (최초 또는 변경 시)
// turbo
```bash
yarn install
```

2. Prisma 클라이언트 생성
// turbo
```bash
yarn db:generate
```

3. 개발 서버 실행
// turbo
```bash
yarn dev
```

서버가 http://localhost:3000 에서 실행됩니다.

## 환경 변수

`.env.local` 파일이 필요합니다:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
