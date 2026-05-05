# AGENTS.md

Universal agent context for all AI coding tools (Claude Code, Codex, Gemini CLI, Aider, Cursor, Antigravity, etc.)
Tool-specific instructions: see `CLAUDE.md`. Hybrid Harness routing: see `.harness/routing.md`.

## Project

- **Name**: 차용(Chayong) — 중고 승계 + 중고 리스/렌트 C2C 거래 플랫폼
- **Concept**: "플랫폼은 유입 도구, 계약은 사람이 만든다"
- **Package Manager**: `bun` (npm/yarn/npx 사용 금지)
- **Dev Server**: http://localhost:3000

## 읽지 말 것 (토큰 절약)

- `node_modules/` — 의존성 (`bun.lock`으로 버전 확인)
- `.next/`, `dist/`, `build/` — 빌드 출력
- `.git/` — Git 내부
- `coverage/` — 테스트 커버리지
- `*.log`, `*.lock` — 로그/락
- `prisma/migrations/` — 마이그레이션 히스토리 (`schema.prisma`만 참조)
- `.gemini/`, `.omc/`, `.firecrawl/`, `.context/`, `.planning/` — 다른 도구 산출물

## Commands

```bash
bun dev               # Dev server (:3000)
bun run build         # Production build (prisma generate + next build)
bun run lint          # ESLint
bun run lint:fix      # ESLint auto-fix
bun run type-check    # tsc --noEmit
bun run test          # Unit tests (vitest run) — 주의: `bun test`는 bun 내장 러너
bun run test:watch    # Vitest watch
bun run test:coverage # Coverage 리포트
bun run test:e2e      # Playwright E2E
bun run db:generate   # Prisma client
bun run db:push       # prisma db push
bun run db:seed       # Seed
bun run db:studio     # Prisma Studio (직접 SQL은 여기서만)
```

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- PostgreSQL via Prisma 6 (Supabase)
- Auth: Supabase Auth (`@supabase/ssr`)
- Realtime (chat): Supabase Realtime
- Storage: Supabase Storage (이미지)
- Payment: 토스페이먼츠 SDK (에스크로)
- Forms: React Hook Form + Zod
- State: Zustand
- Testing: Vitest (unit) + Playwright (e2e)

## Project Structure

```
src/
├── app/
│   ├── (public)/      # HOME, LIST, DETAIL, SELL, GUIDE
│   ├── (auth)/        # LOGIN, SIGNUP
│   ├── (protected)/   # CHAT, PAYMENT, MY
│   ├── admin/         # 관리자 (대시보드/리드/매물/에스크로)
│   └── api/           # listings, chat, payment, favorites, notifications, admin, sell, upload, reviews, csp-report
├── components/
│   ├── ui/            # shadcn + 차용 공유 (VehicleCard, PriceDisplay, TrustBadge, FilterBar, StepIndicator, ImageUpload)
│   └── layout/        # Header, HeaderAuth, Footer, MobileNav, NotificationBell
├── features/          # listings, chat, payment, sell, my, auth, admin, home, compare, blog, reviews
├── lib/
│   ├── db/prisma.ts
│   ├── supabase/      # client.ts, server.ts, auth.ts
│   ├── api/auth-guard.ts          # requireAuth, requireRole — 모든 API 단일 게이트
│   ├── finance/calculations.ts    # 비용 계산
│   ├── chat/contact-filter.ts     # 연락처 차단 (비즈니스 모델 핵심)
│   └── utils/format.ts
└── types/index.ts
```

## Database Schema (10 모델)

| 모델 | 역할 |
|------|------|
| `Profile` | 유저 (BUYER/SELLER/DEALER/ADMIN) |
| `Listing` | 매물 (TRANSFER 승계/USED_LEASE/USED_RENTAL) |
| `ListingImage` | 매물 이미지 |
| `ChatRoom` | 채팅방 (buyer + seller per listing) |
| `ChatMessage` | 채팅 메시지 (TEXT/IMAGE/SYSTEM) |
| `ConsultationLead` | 상담 리드 (WAITING→CONSULTING→CONTRACTED) |
| `EscrowPayment` | 에스크로 (PENDING→PAID→RELEASED/REFUNDED/DISPUTED) |
| `Favorite` | 찜 |
| `Notification` | 알림 |
| `DealerReview` | 딜러 후기 (별점, 코멘트) |

## API Security Invariants

- **Public**: `GET /api/listings`, `GET /api/listings/[id]`, `GET /api/listings/brands` 만
- **Auth required**: 그 외 모든 API → `requireAuth()` 필수
- **Admin only**: `/api/admin/*` → `requireRole("ADMIN")` 필수
- `senderId` / `buyerId` / `sellerId`는 항상 **세션에서 추출** (request body 무시)
- PUT은 **allowlist 필드만** 업데이트 가능
- 업로드는 MIME + size 검증, `bucket`/`folder`는 절대 그대로 신뢰 금지

## Code Conventions

- Named exports (default export 지양)
- Server Components by default; `"use client"` 필요할 때만
- `var(--chayong-*)` CSS vars 사용
- API routes: `requireAuth()` / `requireRole()` + try/catch + 입력 검증
- Zod schemas는 `features/*/schemas/` 또는 `lib/validation/`
- `import type` for type-only imports

### Performance Rules

- 독립 async 호출은 반드시 `Promise.all()` (순차 await 금지)
- 대형 라이브러리(100KB+)는 `next/dynamic({ ssr: false })`
- 서버 컴포넌트 중복 fetch는 `React.cache()`
- Barrel import 지양, 직접 파일 import

## Branch Strategy

- `main`: Production (PR + approval)
- `dev`: Integration (PR)
- `feature/*`: 개발 브랜치
- Workflow: `feature/xxx` → PR → `dev` → PR → `main`
- main/dev 직접 push 금지, 강제 push 금지

## Hybrid Harness (Codex 통합)

차용 레포는 Hybrid Harness가 활성화되어 있습니다.

- **Layer 1 (Claude/human)**: 계획, 라우팅, accept/reject. 제품 코드 직접 작성 금지.
- **Layer 2 (codex-fast)**: `codex exec --profile fast` — 단일 파일 실행.
- **Layer 2.5 (codex-strict)**: `codex exec --profile strict` — read-only 리뷰.
- **Layer 3 (Claude/human)**: `.handoff/*.review.json` 읽고 merge/reject.

**Hard rules:**
- 제품 코드 직접 구현 금지. `.tasks/TASK-XXX.md` 카드 작성 → `.harness/scripts/orchestrate.sh` 디스패치.
- OMC `/team` `/autopilot` `/ralph`로 Hybrid TASK와 동일 파일 실행 금지.
- `.handoff/decision-brief.md` 먼저 읽기. diff는 ambiguity / severity ≥ medium / 인증·결제·관리자·금융 변경에서만.
- 2회 review fail → `status: blocked`, 사람 에스컬레이션.
- Codex Fast는 Superpowers/OMC/gstack/ralph/autopilot 등 Claude 플러그인 사용 금지. `.tasks` / `.handoff` 산출물로만 연결.

상세 라우팅 매트릭스: `.harness/routing.md`. 글로벌 규칙: `~/dotfiles/harness/{HARNESS,ONTOLOGY,WORKFLOW,HANDOFF}.md`.

## Environment Variables

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...   # optional, 없으면 테스트 모드
```

## Testing Structure

```
tests/
├── unit/                  # vitest (29 tests — finance, chat filter, utils)
├── integration/
└── e2e/                   # Playwright (20 specs — navigation, auth, sell wizard, detail)
```
