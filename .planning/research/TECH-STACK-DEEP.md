# 기술 스택 심층 리서치

> Source: NotebookLM + 외부 지식 종합, 2026-03-09

## 1. Next.js 15 App Router - Server Actions 주의점

### 보안
- Server Action = 외부 노출된 API 엔드포인트와 동일
- **반드시** 함수 내부에서 인증(Authentication) + 권한(Authorization) 검증
- 클라이언트 검증 후에도 서버에서 Zod로 재검증 필수

### 캐싱 변경 (v15 핵심)
- `fetch` 요청, GET Route Handlers, 클라이언트 라우터 캐시 → **기본값 uncached**
- Server Action 후 변경 데이터 반영: `revalidatePath()` / `revalidateTag()` 호출

### 권장 패턴
```typescript
'use server'
import { z } from 'zod'
import { getUser } from '@/lib/auth'

const schema = z.object({ ... })

export async function createVehicle(formData: FormData) {
  // 1. 인증
  const user = await getUser()
  if (!user || user.role !== 'dealer') throw new Error('Unauthorized')

  // 2. 서버 검증
  const data = schema.parse(Object.fromEntries(formData))

  // 3. DB 작업
  await prisma.vehicle.create({ data })

  // 4. 캐시 무효화
  revalidatePath('/vehicles')
}
```

## 2. Tailwind CSS v4 주요 변경 (v3 대비)

### 아키텍처 혁신
- **Oxide 엔진**: Rust 기반 자체 파서 → 빌드 속도 10배+ 향상
- **CSS-first Configuration**: `tailwind.config.js` → CSS 파일에서 `@theme` 지시어로 대체
- **진입점 단순화**: `@tailwind base/components/utilities` → `@import "tailwindcss";`

### 설정 마이그레이션 (v3 → v4)
```css
/* v3: tailwind.config.js */
/* v4: globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #1a365d;
  --color-secondary: #2d3748;
  --font-sans: 'Pretendard', sans-serif;
}
```

### Phase 1 적용 사항
- `@import "tailwindcss"` 방식으로 설정
- `@theme` 에서 커스텀 색상/폰트 정의
- shadcn/ui는 Tailwind v4 호환 확인 필요 (2025년 이후 지원)

## 3. React 19 핵심 변경

### use() Hook
- Promise/Context 값 읽기 전용
- **조건문/반복문 내부에서도 호출 가능** (유일한 예외 훅)
- Promise → Suspense와 연동하여 렌더링 중단

### Server Components 패턴
- 서버에서만 실행 → JS 번들 제외 → 번들 사이즈 감소
- DB/API 키를 안전하게 사용 가능
- `'use client'`는 최소한의 인터랙티브 컴포넌트에만 적용

### 권장 구조
```
Page (Server Component) - async, data fetching
├── StaticSection (Server Component) - 정적 콘텐츠
├── InteractiveWidget (Client Component) - 'use client'
│   └── props는 반드시 직렬화 가능한 데이터만
└── DataTable (Server Component) - DB 직접 조회
```

## 4. Supabase + Prisma 이중 구조

### 역할 분리
- **Prisma**: 스키마 정의, 마이그레이션, 타입 안전 쿼리
- **Supabase**: RLS, Realtime, Auth, Storage

### 3가지 클라이언트
| 클라이언트 | 용도 | RLS |
|-----------|------|-----|
| Browser (`createBrowserClient`) | 클라이언트 컴포넌트 | 적용됨 |
| Server (`createServerClient`) | 서버 컴포넌트/Server Actions | 적용됨 |
| Admin (`createClient` with service_role) | 서버 전용 관리자 작업 | 바이패스 |

### Phase 1 구현 시 주의
- `@supabase/ssr` 패키지 사용 (쿠키 기반 세션)
- Prisma는 `DIRECT_URL`로 직접 연결 (connection pooler 미경유)
- 두 ORM의 동시 사용 시 트랜잭션 경계 주의
