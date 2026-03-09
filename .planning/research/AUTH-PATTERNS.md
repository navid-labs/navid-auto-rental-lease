# Supabase Auth + Next.js 15 인증 패턴

> Source: NotebookLM + Supabase 공식 문서 best practices, 2026-03-09
> Phase 2 선행 리서치

## 1. @supabase/ssr 환경별 클라이언트

| 환경 | 함수 | 쿠키 권한 | 용도 |
|------|------|----------|------|
| 클라이언트 컴포넌트 | `createBrowserClient` | 브라우저 자동 관리 | UI 인터랙션, Realtime |
| 서버 컴포넌트 | `createServerClient` | Read only | 데이터 패칭 |
| Server Actions / Route Handlers | `createServerClient` | Read/Write/Remove | 로그인/로그아웃, 세션 조작 |
| 미들웨어 | `createServerClient` | Read/Write | 토큰 갱신, 라우트 보호 |

### 구현 파일 구조
```
src/lib/supabase/
├── client.ts       # createBrowserClient (클라이언트 컴포넌트용)
├── server.ts       # createServerClient (서버 컴포넌트용, read-only)
├── actions.ts      # createServerClient (Server Actions용, read/write)
└── middleware.ts    # createServerClient (미들웨어용, 토큰 갱신)
```

## 2. 미들웨어 세션 검증

### 핵심 패턴
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 반드시 getUser() 사용 (getSession() 아님!)
  const { data: { user } } = await supabase.auth.getUser()

  // 라우트 보호 로직
  if (!user && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
```

### 토큰 갱신
- `getUser()` 호출 시 만료된 토큰 자동 갱신 (Refresh Token 사용)
- `request.cookies.set()` + `response.cookies.set()` 동기화 필수

## 3. 역할 기반 라우트 보호

### 라우트 매핑
```typescript
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin':  ['admin'],
  '/dealer': ['dealer', 'admin'],
  '/mypage': ['customer', 'dealer', 'admin'],
}
```

### 미들웨어에서 역할 확인
```typescript
// 방법 1: profiles 테이블 조회 (Phase 1에서 구현)
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

// 방법 2: JWT Claims (Phase 9 최적화 시)
const role = user.app_metadata?.role
```

### 권한 없을 때
- 비로그인 → `/login` 리다이렉트
- 역할 불일치 → `/unauthorized` 또는 홈으로 리다이렉트

## 4. getUser() vs getSession()

| | getUser() ⭐ 권장 | getSession() |
|---|---|---|
| 동작 | Supabase 서버에 API 호출 → 토큰 실시간 검증 | 쿠키의 JWT 로컬 디코딩 |
| 속도 | 느림 (네트워크 왕복) | 빠름 |
| 보안 | 높음 (변조/차단 사용자 감지) | 낮음 (만료 전 변조 감지 불가) |
| 사용처 | 서버 컴포넌트, Server Actions, 미들웨어 | 클라이언트에서 빠른 UI 판단 (비보안) |

**규칙**: 서버에서 접근 제어 → 반드시 `getUser()` | 클라이언트 UI 토글 → `getSession()` 허용

## 5. 회원가입/로그인/로그아웃 플로우

### 회원가입 (Server Action)
```
1. 폼 입력 (이메일, 비밀번호, 역할 선택)
2. Server Action → supabase.auth.signUp({ email, password, options: { data: { role } } })
3. profiles 테이블에 자동 INSERT (DB trigger)
4. 이메일 확인 메일 발송 (선택)
5. 리다이렉트 → 역할별 대시보드
```

### 로그인 (Server Action)
```
1. 이메일/비밀번호 입력
2. Server Action → supabase.auth.signInWithPassword({ email, password })
3. @supabase/ssr이 Auth 쿠키 설정
4. 역할 확인 → redirect('/mypage' or '/dealer' or '/admin')
```

### 로그아웃 (Server Action)
```
1. 로그아웃 버튼 클릭
2. Server Action → supabase.auth.signOut()
3. 쿠키 삭제
4. redirect('/')
```

### profiles 테이블 자동 생성 트리거
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'customer'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 6. Phase 2 구현 시 주의사항

- **navid-app 기존 패턴**: 어드민은 `jose` JWT 커스텀 세션 사용 → Supabase Auth와 분리
- **Zod 검증**: 회원가입/로그인 폼 → 클라이언트 + 서버 양쪽에서 Zod 스키마 공유
- **에러 핸들링**: `AuthApiError` 타입별 한글 메시지 매핑 (이메일 중복, 비밀번호 약함 등)
- **React cache()**: 서버 컴포넌트에서 `getUser()` 중복 호출 방지
