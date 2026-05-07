# Social Login (Google + Kakao) — Design Spec

- **Date**: 2026-05-08
- **Phase**: 1 (Naver는 별도 spec)
- **Stack**: Next.js 16 App Router, Supabase Auth (`@supabase/ssr`), Prisma, Tailwind, shadcn/ui
- **Branch**: `worktree-feat+social-login-google-kakao`

## 1. Goals

기존 이메일/비밀번호 로그인에 **Google + Kakao 소셜 로그인**을 추가한다. 첫 로그인 시 BUYER 역할로 자동 가입되고, 약관 동의 모달을 통과해야 서비스 이용이 가능하다.

### Non-goals (Phase 1)
- Naver 소셜 로그인 (custom OAuth 필요 → Phase 2)
- 마이페이지에서 소셜 계정 연결/해제
- 약관/개인정보 본문 페이지 (스텁만)
- 동의 이력 audit log (IP/UA)
- SELLER/DEALER로의 직접 소셜 가입 (BUYER 고정 후 별도 승격 절차)

## 2. User Flow

```
[Login or Signup 페이지]
   ├─ 이메일 폼 (기존 유지)
   ├─ Divider("또는")
   └─ SocialAuthButtons
       ├─ "Google로 로그인" → signInWithOAuth({ provider:'google' })
       └─ "카카오 로그인"   → signInWithOAuth({ provider:'kakao'  })
                  ↓
            Supabase OAuth → /api/auth/callback?code=...
                  ↓
[/api/auth/callback]  (Route Handler)
   1) supabase.auth.exchangeCodeForSession(code)
   2) Profile 분기:
        case A. Profile 없음
                → 신규 BUYER 생성, authProvider 기록
                → /onboarding/consent 로 redirect
        case B. Profile 있음, authProvider 일치
                → /  (정상 로그인)
                → 단, termsAcceptedAt 미설정 시 /onboarding/consent
        case C. Profile 있음, authProvider 불일치
                → signOut + /login?error=email_exists
                  ("이미 다른 방법으로 가입된 이메일입니다.")
                  ↓
[/onboarding/consent]
   - ConsentModal: 이용약관(필수) + 개인정보(필수) + 마케팅(선택)
   - 동의 → POST /api/auth/consent → Profile 업데이트 → /
```

## 3. Data Model Changes

`prisma/schema.prisma` Profile 모델에 다음 필드 추가 (사람이 마이그레이션 작성 — `prisma/migrations/**` 보호 영역).

```prisma
model Profile {
  // ... 기존 필드
  authProvider        String?    // "email" | "google" | "kakao"
  termsAcceptedAt     DateTime?
  privacyAcceptedAt   DateTime?
  marketingOptIn      Boolean    @default(false)
  marketingOptInAt    DateTime?
}
```

기존 이메일 가입자는 마이그레이션에서 `authProvider = 'email'`로 백필. 약관 필드는 NULL 허용 (점진 적용 가능).

## 4. File Plan

### 신규 파일
| 파일 | 역할 |
|------|------|
| `src/features/auth/components/social-auth-buttons.tsx` | Google + Kakao 버튼, 공식 가이드 준수 |
| `src/features/auth/components/consent-modal.tsx` | 약관 3개 체크박스 + 전체 동의 |
| `src/features/auth/components/auth-divider.tsx` | "또는" 가로선 |
| `src/app/(protected)/onboarding/consent/page.tsx` | 동의 미완 유저 강제 진입 페이지 |
| `src/app/api/auth/callback/route.ts` | OAuth 콜백 (PKCE exchange + Profile 분기) |
| `src/app/api/auth/consent/route.ts` | 동의 저장 API (POST) |
| `src/app/(public)/terms/page.tsx` | 약관 본문 스텁 |
| `src/app/(public)/privacy/page.tsx` | 개인정보 본문 스텁 |
| `public/icons/google-g.svg` | 공식 zip에서 추출 |
| `public/icons/kakao-symbol.png` | 공식 리소스 |
| `public/icons/README.md` | 라이선스/출처 메모 |

### 수정 파일
| 파일 | 변경 |
|------|------|
| `src/features/auth/components/login-form.tsx` | `<AuthDivider />` + `<SocialAuthButtons />` 추가, `searchParams.error` 메시지 |
| `src/features/auth/components/signup-form.tsx` | 동일 |
| `src/lib/supabase/auth.ts` | `getOrCreateProfileFromOAuth(user, provider)` 헬퍼 |
| `src/app/(auth)/login/page.tsx` | error query 노출 |
| `prisma/schema.prisma` | Profile 필드 추가 |

### 보호 영역 (이번 spec에서 손대지 않음)
- `prisma/migrations/**` (사람이 작성)
- `.env*` (Supabase URL/키 외 추가 비밀 없음 — Google/Kakao 키는 Supabase 대시보드에 저장)

## 5. Cross-cutting Invariants & Task Split

이번 작업은 **인증 흐름 + 약관 데이터 모델 + UI**가 얽혀 있어 1 TASK = 1 파일 원칙에 따라 사람이 다음과 같이 split 한다 (실행 plan 단계에서 확정).

| TASK | 파일 | Owner |
|------|------|-------|
| TASK-A | `prisma/schema.prisma` 필드 추가 + 사람이 마이그레이션 작성 | human |
| TASK-B | `src/lib/supabase/auth.ts` 헬퍼 추가 | codex-fast |
| TASK-C | `src/app/api/auth/callback/route.ts` | codex-fast |
| TASK-D | `src/app/api/auth/consent/route.ts` | codex-fast |
| TASK-E | `src/features/auth/components/social-auth-buttons.tsx` | codex-fast |
| TASK-F | `src/features/auth/components/consent-modal.tsx` | codex-fast |
| TASK-G | `src/features/auth/components/auth-divider.tsx` | codex-fast |
| TASK-H | `src/features/auth/components/login-form.tsx` 수정 | codex-fast |
| TASK-I | `src/features/auth/components/signup-form.tsx` 수정 | codex-fast |
| TASK-J | `src/app/(protected)/onboarding/consent/page.tsx` | codex-fast |
| TASK-K | `src/app/(public)/terms/page.tsx` 스텁 | codex-fast |
| TASK-L | `src/app/(public)/privacy/page.tsx` 스텁 | codex-fast |
| TASK-M | `src/app/(auth)/login/page.tsx` error 메시지 | codex-fast |
| TASK-N | `public/icons/*` 에셋 + README | human (자산 다운로드) |
| TASK-O | unit 테스트 — `getOrCreateProfileFromOAuth` 분기 | codex-fast |
| TASK-P | unit 테스트 — `/api/auth/consent` 입력 검증 | codex-fast |
| TASK-Q | e2e — 소셜 버튼 노출 + 모달 disabled 상태 | codex-fast |

**Cross-cutting invariant (인증 흐름)**: callback route + auth-guard.ts 호출부 + onboarding 페이지가 함께 동작해야 하므로, 통합 검증은 사람이 수행한 뒤 accept 한다.

## 6. UI 사양 (공식 브랜드 가이드라인)

### Google 버튼
- 배경 `#FFFFFF`, border `#747775` 1px, 텍스트 `#1F1F1F`
- 로고: 공식 zip(`developers.google.com/static/identity/images/signin-assets.zip`)의 컬러 G 로고 SVG
- 텍스트: `"Google로 로그인"` (한국어 로컬라이즈 공식 허용)
- Tailwind: `h-12 w-full rounded-xl border border-[#747775] bg-white text-[#1F1F1F] font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-gray-50 transition`
- 제약: 로고 비율 유지(stretch 금지), 단색 변환 금지

### Kakao 버튼
- 배경 `#FEE500` (고정), 텍스트 `#000000` opacity 85% (고정), border-radius 12px (가이드 권장)
- 심볼: 공식 리소스 PNG 또는 PSD 추출 SVG (`developers.kakao.com/tool/resource/login`)
- 텍스트: `"카카오 로그인"`
- Tailwind: `h-12 w-full rounded-xl bg-[#FEE500] text-black/85 font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-95 transition`
- 제약: `#FEE500` / 말풍선 / "카카오 로그인" 텍스트 변경 금지

### Divider
- 좌우 1px `#E5E8EB` 가로선 + 가운데 `또는` (text-sub, 12px)
- 이메일 폼 ↔ 소셜 버튼 사이 24px 간격

### Layout
- Google → Kakao 순 (영문 알파벳 ↔ 한국 친숙도 균형). 8px 간격.
- 모바일/데스크톱 모두 `w-full`, 컨테이너 max-width는 부모 폼이 제어.

## 7. Consent Modal 사양

- shadcn/ui `Dialog` 기반, 강제 모달 (background blur, ESC 비활성)
- 항목:
  1. ✅ **(필수)** 이용약관에 동의합니다 — `<Link href="/terms">`
  2. ✅ **(필수)** 개인정보 처리방침에 동의합니다 — `<Link href="/privacy">`
  3. ☐ (선택) 마케팅 정보 수신에 동의합니다 (이메일/SMS 통합)
- 상단에 "전체 동의" 토글 — 3개 일괄 on/off
- "동의하고 시작하기" 버튼: 필수 2개 모두 체크 시에만 활성화 (`disabled` + opacity)
- 제출 → `POST /api/auth/consent { marketingOptIn: boolean }` (필수 항목은 서버에서 자동으로 현재 시각 기록)
- 응답 200 시 `router.push('/'); router.refresh()`

## 8. API 사양

### `GET /api/auth/callback`
- Query: `code`, `error`, `error_description`, `next` (optional, 화이트리스트)
- 처리:
  1. `error` 있으면 `/login?error=oauth_failed` redirect
  2. `code` 없으면 `/login?error=invalid_callback`
  3. `supabase.auth.exchangeCodeForSession(code)` 호출
  4. `user.email`로 Profile 조회
  5. 분기 (위 User Flow 참조)
- 보안: `next` 파라미터는 `^/[a-zA-Z0-9/_-]*$` 만 허용 (open redirect 방지)

### `POST /api/auth/consent`
- Auth: `requireAuth()`
- Body: `{ marketingOptIn: boolean }`
- 처리:
  - `termsAcceptedAt = now()`
  - `privacyAcceptedAt = now()`
  - `marketingOptIn` 저장, true 시 `marketingOptInAt = now()`
- 응답: `{ ok: true }`
- 검증: 이미 동의 완료된 사용자는 200 + no-op (idempotent)

### `GET /api/auth/callback` 에러 매핑
| 시나리오 | redirect | 메시지 (login 페이지) |
|---------|---------|---------------------|
| OAuth provider denial | `/login?error=oauth_failed` | "소셜 로그인에 실패했습니다." |
| 이메일 중복 | `/login?error=email_exists` | "이미 다른 방법으로 가입된 이메일입니다. 기존 방법으로 로그인해 주세요." |
| code 없음/잘못됨 | `/login?error=invalid_callback` | "잘못된 접근입니다." |

## 9. Supabase 대시보드 작업 (사람)

코드 변경 외에 사람이 수행해야 할 일:

1. **Authentication → Providers**
   - Google: Client ID/Secret (GCP OAuth 2.0 Client) 등록
   - Kakao: REST API Key + Client Secret 등록
2. **Authentication → URL Configuration**
   - Site URL: `https://chayong.kr` (prod), `http://localhost:3000` (dev)
   - Redirect URLs: 위 두 URL 모두 등록
3. **GCP Console** — OAuth consent screen 등록, Authorized redirect URIs에 Supabase callback URL 추가
4. **Kakao Developers** — 앱 생성, 카카오 로그인 활성화, Redirect URI 등록, 동의 항목에 email 필수로 설정

## 10. 보안

- Supabase OAuth는 PKCE 기본 사용 — 별도 작업 불필요
- 콜백 처리는 Server-side(Route Handler), access/refresh token은 httpOnly cookie (`@supabase/ssr` 기본)
- `next` redirect 화이트리스트 (open redirect 방지)
- 약관 동의 시 IP/UA 기록은 v1에 미포함 (필요 시 Phase 2)
- 이메일 중복 차단 정책으로 계정 탈취 위험 최소화

## 11. Testing

### Unit (vitest)
- `getOrCreateProfileFromOAuth`:
  - 신규 가입 → BUYER + authProvider 기록
  - 동일 provider 재로그인 → 기존 Profile 반환
  - 다른 provider → 에러 throw
  - termsAcceptedAt 미설정 → `needsConsent: true`
- `/api/auth/consent`:
  - 입력 검증 (`marketingOptIn` boolean 강제)
  - idempotent (재호출 시 200, 시각 갱신 안 됨)

### E2E (Playwright)
- 로그인/회원가입 페이지 모두 소셜 버튼 노출
- ConsentModal: 필수 미체크 시 버튼 disabled
- 마케팅 토글 on/off 시 onSubmit payload 차이
- OAuth 자체는 외부 의존이라 mock — 실제 흐름은 manual QA로 검증

### Manual QA 체크리스트 (사람)
- [ ] Google 로그인 신규 가입 → consent → 홈
- [ ] Google 로그인 재로그인 → 홈 직행
- [ ] Kakao 로그인 신규 가입 → consent → 홈
- [ ] 동일 이메일을 이메일 가입 후 Google 로그인 시도 → 차단 메시지
- [ ] 모달 새로고침 우회 시도 → middleware 또는 페이지 가드로 강제 진입
- [ ] 모바일 사파리에서 OAuth redirect 정상 동작

## 12. Rollout

1. PR 생성 → 사람이 마이그레이션 작성/검토
2. dev 환경에서 Supabase Provider 등록 + Manual QA
3. staging 배포 → 외부 OAuth 키 prod로 교체
4. prod 배포 — 기존 유저는 영향 없음 (이메일 로그인 그대로)

## 13. Risks & Open Questions

| 위험 | 완화 |
|------|------|
| 약관 본문 미작성 시 법적 노출 | placeholder는 "추후 안내" 문구만 — 실제 출시 전 본문 필수 (별도 spec) |
| Kakao 카톡톡 심볼 라이선스 | 공식 PNG 사용으로 회피, README에 출처 명시 |
| `marketingOptIn` 한국 법령 (정통망법) | 명시적 별도 동의 + 시각 기록 — v1 만족, 수신 동의 철회 UI는 Phase 2 |
| 기존 이메일 가입자 백필 누락 | 마이그레이션에서 `authProvider = 'email'` 필수로 백필 |
| OAuth redirect URI 불일치로 prod에서 실패 | Supabase 대시보드 + GCP/Kakao Developers 설정 체크리스트로 검증 |

## 14. Out of Scope (다음 spec 후보)

- Naver 소셜 로그인 (custom OAuth)
- 마이페이지: 연결된 소셜 계정 표시/해제
- 약관/개인정보 본문 작성
- 마케팅 수신 동의 철회 UI
- 동의 이력 audit log (IP/UA/시각 별도 테이블)
- 휴대폰 번호 인증 연동 (SELLER 승격 시 필요)

---

**Approval gate**: 이 문서 검토 후 `writing-plans` 스킬로 구현 plan 작성 → `.tasks/TASK-*.md` 카드 생성 → Hybrid `orchestrate.sh` 디스패치.
