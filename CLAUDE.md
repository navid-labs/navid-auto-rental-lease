# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 읽지 말 것 (토큰 절약)

다음 경로는 읽지 마세요:
- `node_modules/` - 의존성 (yarn.lock으로 버전 확인)
- `.next/` - Next.js 빌드 캐시
- `dist/`, `build/` - 빌드 출력
- `.git/` - Git 내부 파일
- `coverage/` - 테스트 커버리지
- `*.log`, `*.lock` - 로그 및 락 파일
- `prisma/migrations/` - 마이그레이션 히스토리 (schema.prisma만 참조)
- `.gemini/` - Antigravity 로컬 데이터

## Package Manager

**Always use `yarn` instead of `npm`** for all package management operations:
- Install: `yarn add <package>` / `yarn add -D <package>`
- Run scripts: `yarn <script-name>`
- Do NOT use `npm install`, `npm run`, `npx` (프로젝트 초기화 시 제외)

## Commands

```bash
# Development
yarn dev              # Start Next.js dev server (http://localhost:3000)
yarn build            # Production build
yarn lint             # ESLint
yarn lint:fix         # ESLint with auto-fix
yarn type-check       # TypeScript check (tsc --noEmit)

# Testing
yarn test             # Run all unit tests (vitest)
yarn test:watch       # Watch mode
yarn test:coverage    # Coverage report

# Database (PostgreSQL via Prisma + Supabase)
yarn db:generate      # Generate Prisma client
yarn db:migrate       # Deploy migrations (prisma migrate deploy)
yarn db:push          # Push schema changes (prisma db push)
yarn db:seed          # Seed database
yarn db:studio        # Open Prisma Studio
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod validation
- **Database**: PostgreSQL via Prisma (hosted on Supabase)
- **State**: Zustand
- **Package Manager**: yarn

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard pages
│   └── (marketing)/       # Marketing & public pages
├── components/
│   ├── ui/                # Primitives (Button, Input, Card, etc.)
│   └── layout/            # Header, Footer, Navigation
├── features/              # Domain modules
│   ├── vehicles/          # Vehicle catalog (rental/lease inventory)
│   ├── rental/            # Rental management
│   ├── lease/             # Lease management
│   ├── customers/         # Customer CRM
│   ├── contracts/         # Contract management
│   └── marketing/         # Marketing & promotions
├── lib/
│   ├── db/                # Prisma client (prisma.ts, supabase.ts)
│   ├── validation/        # Zod schemas
│   ├── finance/           # Payment & lease calculations
│   └── utils/             # Shared utilities
└── types/                 # Shared TypeScript definitions

prisma/
├── schema.prisma          # Database schema
├── migrations/            # Migration files
└── seed.ts                # Seed script
```

### Database Schema (Key Domains)

**Vehicle Catalog**:
- `Brand` → `CarModel` → `Generation` → `Trim`
- Vehicle inventory for rental and lease

**Rental & Lease**:
- `RentalContract` - 렌탈 계약 관리
- `LeaseContract` - 리스 계약 관리
- `Payment` - 결제 기록

**Customer CRM**:
- `Customer` - 고객 정보
- `Inquiry` - 상담/문의
- `ConsultationLead` - 상담 리드

### API Pattern

API routes follow REST conventions:
- `GET /api/vehicles` - List with filters
- `GET /api/vehicles/[id]` - Detail
- `POST /api/inquiry` - Create inquiry
- `POST /api/contracts` - Create contract
- Admin APIs require session auth (`/api/admin/*`)

## Environment Variables

Required in `.env.local`:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Branch Strategy

See AGENTS.md for full details.

**Quick reference:**
- `main`: Production (PR + approval required)
- `dev`: Integration (PR required)
- `feature/*`: Development branches

**Workflow:** `feature/xxx` -> PR -> `dev` -> PR -> `main`

**Important:** Never push directly to main or dev. Always use PRs.

## Code Conventions

- Use named exports (avoid default exports)
- Functional components with hooks
- Zod schemas in `features/*/schemas/` or `lib/validation/`
- Server Components by default; add `'use client'` only when needed

### Performance Rules

**Async (CRITICAL):**
- 독립적인 async 호출은 반드시 `Promise.all()` 사용 — 순차 await 금지
- API 라우트에서 DB 쿼리 2개 이상이면 병렬 가능 여부 확인

**Bundle (CRITICAL):**
- 대형 라이브러리(100KB+)는 반드시 `next/dynamic`으로 import (`ssr: false`)
- barrel file(index.ts)에서 import보다 직접 파일 import 선호

**Server (HIGH):**
- 서버 컴포넌트에서 동일 데이터 중복 fetch 시 `React.cache()` 사용
- 클라이언트 컴포넌트에 전달하는 props 최소화 (필요한 필드만)

## Design Philosophy

- **High-Fidelity Aesthetics (Nano Banana Pro 2)**: 프리미엄, 고밀도 랜딩 페이지 디자인
- **Visual Density**: 2-column 비주얼 에셋, shadow-card 레이아웃, 배경 워터마크
- **Mobile-First**: 모바일 우선 반응형 디자인
- **Glassmorphism**: backdrop-blur, 반투명 카드 UI

## Testing Structure

```
tests/
├── unit/                  # Unit tests (vitest)
├── integration/           # Integration tests
└── e2e/                   # End-to-end tests (Playwright)
```
