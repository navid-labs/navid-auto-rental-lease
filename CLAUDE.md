# CLAUDE.md — 차용(Chayong) 플랫폼

중고 승계 + 중고 리스/렌트 거래 플랫폼.
"플랫폼은 유입 도구, 계약은 사람이 만든다"

## 읽지 말 것 (토큰 절약)

- `node_modules/`, `.next/`, `dist/`, `build/`, `.git/`, `coverage/`
- `*.log`, `*.lock`
- `prisma/migrations/` (schema.prisma만 참조)
- `.gemini/`, `.omc/`, `.firecrawl/`, `.context/`, `.planning/`

## Package Manager

**Always use `bun`** (not npm/yarn):
- Install: `bun add <package>` / `bun add -D <package>`
- Scripts: `bun run <script>` or `bun <script>`

## Commands

```bash
# Development
bun dev               # Next.js dev (http://localhost:3000)
bun run build         # Production build
bun run lint          # ESLint
bun run type-check    # TypeScript check (tsc --noEmit)

# Testing
bun run test          # Unit tests (vitest) — 주의: `bun test`는 bun 내장 러너
bun run test:e2e      # E2E tests (Playwright)

# Database (PostgreSQL via Prisma + Supabase)
bun run db:generate   # Generate Prisma client
bun run db:push       # Push schema (prisma db push)
bun run db:seed       # Seed database
bun run db:studio     # Open Prisma Studio
```

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL via Prisma 6 (Supabase)
- **Auth**: Supabase Auth (@supabase/ssr)
- **Realtime**: Supabase Realtime (chat)
- **Storage**: Supabase Storage (이미지 업로드)
- **Payment**: 토스페이먼츠 SDK (에스크로)
- **Package Manager**: bun
- **Testing**: Vitest (unit) + Playwright (e2e)

## Project Structure

```
src/
├── app/
│   ├── (public)/              # 공개 페이지 (HOME, LIST, DETAIL, SELL, GUIDE)
│   ├── (auth)/                # 인증 (LOGIN, SIGNUP)
│   ├── (protected)/           # 보호 (CHAT, PAYMENT, MY)
│   ├── admin/                 # 관리자 (대시보드, 리드, 매물, 에스크로)
│   └── api/                   # API routes
│       ├── listings/          # 매물 CRUD + brands + images
│       ├── chat/              # 채팅 rooms/messages/read
│       ├── payment/           # 에스크로 prepare/confirm
│       ├── favorites/         # 찜 toggle + my
│       ├── notifications/     # 알림 list + mark-read
│       ├── admin/             # 관리자 leads/listings/escrow
│       └── upload/            # 이미지 업로드
├── components/
│   ├── ui/                    # shadcn + 차용 공유 (VehicleCard, PriceDisplay, TrustBadge, FilterBar, StepIndicator, ImageUpload)
│   └── layout/                # Header, HeaderAuth, Footer, MobileNav, NotificationBell
├── features/
│   ├── listings/              # 매물 (gallery, cost-calculator, cta-sidebar, share, mobile-cta, grid, advanced-filters, use-favorite hook)
│   ├── chat/                  # 채팅 (room-list, message-area)
│   ├── payment/               # 결제 (escrow-checkout)
│   ├── sell/                  # 매물 등록 (sell-wizard)
│   ├── my/                    # 마이페이지 (dashboard, listing-card)
│   ├── auth/                  # 인증 (login-form, signup-form)
│   └── admin/                 # 관리자 (sidebar, lead-table, listing-admin-table, escrow-admin-table)
├── lib/
│   ├── db/prisma.ts           # Prisma client
│   ├── supabase/              # client.ts, server.ts, auth.ts
│   ├── api/auth-guard.ts      # API 인증/인가 미들웨어 (requireAuth, requireRole)
│   ├── finance/calculations.ts # 비용 계산 (calcTotalAcquisitionCost, checkIsVerified)
│   ├── chat/contact-filter.ts # 연락처 차단 (containsContactInfo, sanitizeMessage)
│   └── utils/format.ts        # 통화 포맷 (formatKRW, formatKRWCompact)
└── types/index.ts             # Prisma 타입 + ListingCardData, ListingWithImages
```

## Database Schema

10개 Prisma 모델:

| 모델 | 역할 |
|------|------|
| Profile | 유저 (BUYER/SELLER/DEALER/ADMIN) |
| Listing | 매물 (TRANSFER/USED_LEASE/USED_RENTAL) |
| ListingImage | 매물 이미지 |
| ChatRoom | 채팅방 (buyer + seller per listing) |
| ChatMessage | 채팅 메시지 (TEXT/IMAGE/SYSTEM) |
| ConsultationLead | 상담 리드 (WAITING/CONSULTING/CONTRACTED) |
| EscrowPayment | 에스크로 결제 (PENDING→PAID→RELEASED/REFUNDED/DISPUTED) |
| Favorite | 찜 |
| Notification | 알림 |
| DealerReview | 딜러 후기 (별점, 코멘트) |

## API Security

- **Public**: `GET /api/listings`, `GET /api/listings/[id]`, `GET /api/listings/brands`
- **Auth required**: 나머지 모든 API (requireAuth)
- **Admin only**: `/api/admin/*` (requireRole("ADMIN"))
- senderId/buyerId/sellerId는 항상 세션에서 추출 (body 무시)
- PUT은 allowlist 필드만 업데이트 가능

## Design System

```
Primary:    #3182F6 (토스 블루)
Background: #FFFFFF
Surface:    #F9FAFB
Text:       #111111
Sub Text:   #687684
Caption:    #8B95A1
Divider:    #E5E8EB
Success:    #00C471
Danger:     #F04452
```

CSS vars: `--chayong-primary`, `--chayong-text`, `--chayong-text-sub`, etc.
Font: Pretendard Variable (via `<link>` in layout.tsx)

### UI 원칙
- 월 납입금을 가장 크게 표시 (전체 금액 강조 금지)
- 카드형 UI + shadow-sm + hover:shadow-lg
- 버튼: h-12, rounded-xl, font-semibold, text-[15px]
- 금융 앱 느낌 (토스/카카오뱅크 스타일)

## Environment Variables

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_... (optional, 없으면 테스트 모드)
```

## Code Conventions

- Named exports (default export 지양)
- Server Components by default; `"use client"` 필요할 때만
- `var(--chayong-*)` CSS vars 사용
- API routes: `requireAuth()` / `requireRole()` + try/catch + 입력 검증

### Performance Rules

- 독립 async 호출은 `Promise.all()` 사용
- 대형 라이브러리(100KB+)는 `next/dynamic` import
- 서버 컴포넌트에서 중복 fetch 시 `React.cache()` 사용

## Testing

- **Unit** (29 tests): `src/lib/finance/`, `src/lib/chat/`, `src/lib/utils/`
- **E2E** (20 specs): `tests/e2e/` — navigation, auth, sell wizard, detail

## Concept Designs

- `docs/concept-designs/01-chayong-reference-ui.png`
- `docs/concept-designs/02-chayong-page-wireframes.png`
- `docs/concept-designs/03-chayong-mvp-spec.png`
- `docs/superpowers/specs/2026-04-08-chayong-platform-design.md`

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

## Hybrid Harness (Codex 통합)

차용은 Hybrid Harness 활성. 작업 시작 전 **반드시** `.harness/routing.md`를 먼저 읽어 Owner/Reviewer를 확인.

### Layers
- **Layer 1 (you)**: 계획·라우팅·accept/reject. 제품 코드 직접 작성 금지.
- **Layer 2 (codex-fast)**: `codex exec --profile fast` — 단일 파일 실행.
- **Layer 2.5 (codex-strict)**: `codex exec --profile strict` — read-only 리뷰.
- **Layer 3 (you)**: `.handoff/<TASK>.review.json` 읽고 merge/reject.

### Hard rules (차용)
- 제품 코드 직접 구현 금지. `.tasks/TASK-XXX.md` 카드 작성 → `.harness/scripts/orchestrate.sh` 디스패치.
- OMC `/team` `/autopilot` `/ralph`로 Hybrid TASK와 동일 파일 실행 금지.
- `.handoff/decision-brief.md` 먼저 읽기. 원본 diff는 ambiguity / severity ≥ medium / 인증·결제·관리자·금융·업로드·연락처필터 변경에서만 직접 확인.
- review fail 2회 → `status: blocked`, 사람 에스컬레이션.
- 1 TASK = 1 파일. 둘 이상 파일이 함께 변경되어야 하면 claude가 미리 split.

### 차용 Cross-cutting invariants (claude split 강제)
1. 에스크로 상태 머신 (`payment/**` + `admin/escrow/**` + `Listing.status RESERVED/SOLD` + `Notification(ESCROW_STATUS)`)
2. 인증 흐름 (`auth-guard.ts` + `supabase/server.ts` + `(protected)/layout.tsx`)
3. 매물 승인 파이프라인 (`admin/listings approve` + `Listing.status PENDING→ACTIVE` + `Notification(LISTING_APPROVED)` + 카드 노출 조건)
4. 연락처 필터 강화 (`contact-filter.ts` + `chat/messages POST` + 클라이언트 sanitize hook + 테스트)

### 보호 영역 (Codex 손대지 않음)
- `.harness/**`, `.tasks/**`, `.handoff/*.override.json`, `.handoff/SUB-*.decision.json`
- `prisma/migrations/**` (사람만 작성)
- `.env*`, `node_modules/**`, `.next/**`, `coverage/**`, `dist/**`, `build/**`
- 다른 도구 산출물: `.gemini/**`, `.omc/**`, `.firecrawl/**`, `.context/**`, `.planning/**`, `*.log`, `*.lock`

상세 라우팅 매트릭스: `.harness/routing.md`. 글로벌 규칙: `~/dotfiles/harness/{HARNESS,ONTOLOGY,WORKFLOW,HANDOFF}.md`.
