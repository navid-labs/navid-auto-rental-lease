# Supabase RLS 패턴 리서치

> Source: NotebookLM + Supabase best practices, 2026-03-09

## 1. 역할 기반 접근제어 (RBAC) 구현

### 패턴 A: User Roles Table (일반적)
```sql
-- profiles 테이블에 role 컬럼
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'dealer', 'admin')),
  ...
);

-- RLS 조건식
(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
```

### 패턴 B: JWT Claims (성능 최적화) ⭐ 권장
```sql
-- JWT app_metadata에 role 저장 → DB 조회 없이 인가
(auth.jwt() -> 'app_metadata' ->> 'role') = 'dealer'
```
- 장점: 행마다 서브쿼리 실행 안 함 → 대규모 테이블에서 성능 우수
- 단점: 역할 변경 시 JWT 갱신 필요 (Edge Function/DB Trigger로 해결)

### 하이브리드 권장 전략
- **Phase 1**: 패턴 A (profiles 테이블) 로 시작 → 단순하고 디버깅 쉬움
- **Phase 9 최적화**: 패턴 B (JWT Claims) 로 마이그레이션 가능
- **성능 보호**: profiles 조회를 STABLE 함수로 래핑하여 캐싱

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

## 2. 테이블별 정책 분리

### 핵심 원칙: USING vs WITH CHECK
| 연산 | USING | WITH CHECK | 용도 |
|------|-------|------------|------|
| SELECT | ✅ | - | 기존 행 읽기 권한 |
| INSERT | - | ✅ | 새 행 삽입 유효성 |
| UPDATE | ✅ | ✅ | 대상 접근 + 수정 후 유효성 |
| DELETE | ✅ | - | 삭제 대상 접근 권한 |

### Navid 앱 RLS 설계 예시

#### vehicles 테이블
```sql
-- 공개 조회 (approved 상태만)
CREATE POLICY "public_read_vehicles" ON vehicles
  FOR SELECT USING (status = 'approved');

-- 딜러 본인 매물 등록
CREATE POLICY "dealer_insert_vehicle" ON vehicles
  FOR INSERT WITH CHECK (dealer_id = auth.uid());

-- 딜러 본인 매물 수정 (소유권 이전 방지)
CREATE POLICY "dealer_update_vehicle" ON vehicles
  FOR UPDATE USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

-- 관리자 전체 관리
CREATE POLICY "admin_all_vehicles" ON vehicles
  FOR ALL USING (get_user_role() = 'admin');
```

#### contracts 테이블
```sql
-- 고객 본인 계약 조회
CREATE POLICY "customer_read_contract" ON contracts
  FOR SELECT USING (customer_id = auth.uid());

-- 딜러 관련 계약 조회
CREATE POLICY "dealer_read_contract" ON contracts
  FOR SELECT USING (vehicle_id IN (
    SELECT id FROM vehicles WHERE dealer_id = auth.uid()
  ));

-- 관리자 전체 조회
CREATE POLICY "admin_read_contract" ON contracts
  FOR SELECT USING (get_user_role() = 'admin');
```

## 3. 성능 고려사항

### auth.uid() 최적화
- `auth.uid()` 자체는 JWT 컨텍스트 추출 → 가벼움
- **주의**: `(SELECT role FROM profiles WHERE id = auth.uid())` 서브쿼리가 행마다 실행 가능
- **해결**: STABLE 함수 래핑 또는 JWT Claims 사용

### 인덱스 필수 항목
```sql
-- RLS 조건에 사용되는 컬럼에 인덱스
CREATE INDEX idx_vehicles_dealer_id ON vehicles(dealer_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_vehicle_id ON contracts(vehicle_id);
CREATE INDEX idx_profiles_id ON profiles(id); -- PK라면 자동 생성
```

### 성능 안티패턴
- ❌ RLS에서 JOIN 없이 서브쿼리 반복 (N+1)
- ❌ STABLE 마킹 없는 함수를 RLS 조건에 사용
- ❌ 인덱스 없는 컬럼에 RLS 필터
- ✅ service_role 키로 RLS 바이패스 (서버 사이드 admin 작업)
