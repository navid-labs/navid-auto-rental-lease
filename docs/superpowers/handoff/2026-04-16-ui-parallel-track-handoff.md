# UI Parallel Track — Session Handoff

**Created:** 2026-04-16
**Plan:** `docs/superpowers/plans/2026-04-16-ui-parallel-track.md`
**Spec:** `docs/superpowers/specs/2026-04-16-ui-parallel-track-design.md`

## Running Sessions Snapshot

- Session "schema" — `feat/listing-schema-ext` branch, Task 8+ (accidentFree → accidentCount 전환 커밋까지 완료)
- Session "pr-a" — worktree `.claude/worktrees/admin-pagination-pr-a`, Task 6/7 진행 중

## New Sessions to Spawn

### Session "ui-wt0" — IMMEDIATE

**When:** 스키마 플랜이 `feat/listing-schema-ext`를 main에 머지 직후. WT0는 main에 직접 커밋.

**Setup:**
```bash
cd /Users/kiyeol/development/navid/navid-auto-rental-lease
git fetch origin && git checkout main && git pull
```

**Paste into new Claude Code session:**
```
docs/superpowers/plans/2026-04-16-ui-parallel-track.md 를 읽고,
WT0 섹션의 Task 0.1 → 0.2 → 0.3 → 0.4를 순서대로 실행해줘.
superpowers:executing-plans 스킬을 사용.
각 태스크는 단일 commit으로 마무리하고, TDD 순서(fail → impl → pass) 지켜줘.
WT0 완료 후에는 다음 세션(ui-wt4) 기동 가능하다고 알려줘.
```

**Blocking:** 스키마 플랜이 main 머지 전이라면 이 세션도 대기.

### Session "ui-wt4" — AFTER WT0

**When:** WT0 commit들이 main에 있은 직후. 스키마 플랜 대기 **불필요**.

**Setup:**
```bash
cd /Users/kiyeol/development/navid/navid-auto-rental-lease
git fetch origin && git checkout main && git pull
git worktree add .claude/worktrees/ui-sell-heydealer -b ui/sell-heydealer main
cd .claude/worktrees/ui-sell-heydealer
```

**Paste into new session:**
```
docs/superpowers/plans/2026-04-16-ui-parallel-track.md 를 읽고,
WT4 섹션의 Task 4.1 → 4.2 → 4.3 → 4.4 → 4.5를 순서대로 실행해줘.
superpowers:executing-plans 스킬을 사용.
TDD 원칙, 단일 commit/태스크, 마지막에 PR 생성까지.
작업 경로는 이 워크트리 (.claude/worktrees/ui-sell-heydealer) 안.
```

### Session "ui-wt1" — AFTER schema merge

**When:** 스키마 플랜 전체가 main에 머지된 직후. (accidentCount/features 필드가 main에 있을 때)

**Setup:**
```bash
cd /Users/kiyeol/development/navid/navid-auto-rental-lease
git fetch origin && git checkout main && git pull
git worktree add .claude/worktrees/ui-home-refresh -b ui/home-refresh main
cd .claude/worktrees/ui-home-refresh
```

**Paste:**
```
docs/superpowers/plans/2026-04-16-ui-parallel-track.md 의 WT1 섹션
(Task 1.1 → 1.2 → 1.3 → 1.4) 실행. executing-plans 스킬 사용.
TDD, 단일 commit/태스크, 마지막에 PR.
```

### Session "ui-wt2" — AFTER schema merge (ui-wt1과 동시 가능)

**Setup:**
```bash
cd /Users/kiyeol/development/navid/navid-auto-rental-lease
git fetch origin && git checkout main && git pull
git worktree add .claude/worktrees/ui-list-density -b ui/list-density main
cd .claude/worktrees/ui-list-density
```

**Paste:**
```
docs/superpowers/plans/2026-04-16-ui-parallel-track.md 의 WT2 섹션
(Task 2.1 → 2.2 → 2.3 → 2.4 → 2.5) 실행. executing-plans 스킬.
vehicle-card 수정 시 ListingCardData props 추가 요구 금지 (spec 명시).
list/page.tsx buildWhere 확장 시 스키마에 실제 있는 필드명으로 매핑 확인.
```

### Session "ui-wt3" — AFTER schema + WT2 merge

**Setup:**
```bash
cd /Users/kiyeol/development/navid/navid-auto-rental-lease
git fetch origin && git checkout main && git pull
git worktree add .claude/worktrees/ui-detail-trust -b ui/detail-trust main
cd .claude/worktrees/ui-detail-trust
```

**Paste:**
```
docs/superpowers/plans/2026-04-16-ui-parallel-track.md 의 WT3 섹션
(Task 3.1 → 3.7) 실행. executing-plans 스킬.
listing-gallery 리뉴얼은 ARIA role="dialog" + keyboard nav + focus trap 필수.
spec-panel의 새 필드명은 prisma/schema.prisma 확정 값 기준으로 매핑.
```

## Dependency DAG

```
schema-plan (running)
     │
     ├── merge to main ─────────────┐
     │                              ↓
     │                         ui-wt1 (Home)
     │                         ui-wt2 (List) ──── merge ──→ ui-wt3 (Detail)
     │
WT0 commits to main
     │
     ├──→ ui-wt4 (Sell, 독립)
```

## Session Coordination Rules

1. **WT0 단일 권한**: main에 직접 커밋. 다른 UI 세션은 WT0 완료 후 `git pull` 후 worktree 생성.
2. **`types/index.ts` 동결**: WT1/WT2/WT3은 ListingCardData 필드 **읽기만**. 추가/삭제/변경은 스키마 플랜만.
3. **URL 쿼리 조작**: WT1/WT2는 반드시 `buildListingUrl()` 사용. 직접 querystring 문자열 조립 금지.
4. **커밋 크기**: 태스크당 단일 commit. Squash 병합 전제로 세분화 OK.
5. **충돌 시 대응**: rebase 충돌은 executor가 해결 시도, 2회 실패 시 STOP & 사용자에게 보고.

## Readiness Checks per Session

Before starting any UI session:
```bash
# 현재 main의 schema 완성도 확인
git fetch origin
git log origin/main --oneline -20 | grep -E "schema|accidentCount|features"

# 스키마 플랜 완료 시 다음 커밋이 있어야 함:
# - Prisma accidentFree 제거
# - accidentCount 추가
# - features 배열 추가

# WT1/WT2/WT3 시작 전엔 반드시 이 커밋들이 main에 있어야.
```

## Success Marker

모든 WT 머지 후:
```bash
cd /Users/kiyeol/development/navid/navid-auto-rental-lease
git checkout main && git pull
bun run type-check && bun run lint && bun run test && bun run build && bun run test:e2e
# 전부 green이면 WT parallel track 완료.
```

그 후 `/design-review http://localhost:3000` 재감사로 경쟁사 갭 HIGH 항목 resolved 확인.
