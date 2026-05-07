-- 차용 Phase 1 Storage Baseline (TASK-009 / Schema Contract Addendum J)
--
-- Supabase Storage 버킷 3개와 RLS 정책 정의. Supabase Studio SQL Editor에서
-- 한 번 실행한다. Prisma migrations에는 storage 스키마가 포함되지 않으므로
-- 의도적으로 별도 파일에 둔다.
--
-- 적용 순서: prisma migrate가 통과한 뒤 본 파일을 SQL Editor에서 실행.
-- 모든 버킷은 private (public=false). Signed URL 또는 service-role 클라이언트만 접근 가능.

-- ─── 1. 버킷 생성 (idempotent) ─────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('listing-documents', 'listing-documents', false),
  ('transfer-proofs',   'transfer-proofs',   false),
  ('dispute-evidence',  'dispute-evidence',  false)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. 기존 정책 정리 (재실행 안전) ───────────────────────

DROP POLICY IF EXISTS "listing-documents owner read"  ON storage.objects;
DROP POLICY IF EXISTS "listing-documents owner write" ON storage.objects;
DROP POLICY IF EXISTS "listing-documents admin all"   ON storage.objects;

DROP POLICY IF EXISTS "transfer-proofs party read"    ON storage.objects;
DROP POLICY IF EXISTS "transfer-proofs party write"   ON storage.objects;
DROP POLICY IF EXISTS "transfer-proofs admin all"     ON storage.objects;

DROP POLICY IF EXISTS "dispute-evidence party read"   ON storage.objects;
DROP POLICY IF EXISTS "dispute-evidence party write"  ON storage.objects;
DROP POLICY IF EXISTS "dispute-evidence admin all"    ON storage.objects;

-- ─── 3. 헬퍼: 현재 사용자의 role 조회 ───────────────────────

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid()
$$;

-- ─── 4. listing-documents (등록증 등 매물 서류) ─────────────
-- path 컨벤션: <listing_id>/<filename>
-- 접근: 매물 소유자(seller) + ADMIN

CREATE POLICY "listing-documents owner read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'listing-documents'
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id::text = split_part(name, '/', 1)
      AND l.seller_id = auth.uid()
  )
);

CREATE POLICY "listing-documents owner write"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-documents'
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id::text = split_part(name, '/', 1)
      AND l.seller_id = auth.uid()
  )
);

CREATE POLICY "listing-documents admin all"
ON storage.objects FOR ALL
USING (
  bucket_id = 'listing-documents'
  AND public.current_profile_role() = 'ADMIN'
)
WITH CHECK (
  bucket_id = 'listing-documents'
  AND public.current_profile_role() = 'ADMIN'
);

-- ─── 5. transfer-proofs (입금/이체 증빙) ────────────────────
-- path: <escrow_payment_id>/<filename>
-- 접근: 결제 buyer/seller + ADMIN

CREATE POLICY "transfer-proofs party read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transfer-proofs'
  AND EXISTS (
    SELECT 1 FROM public.escrow_payments e
    WHERE e.id::text = split_part(name, '/', 1)
      AND (e.buyer_id = auth.uid() OR e.seller_id = auth.uid())
  )
);

CREATE POLICY "transfer-proofs party write"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'transfer-proofs'
  AND EXISTS (
    SELECT 1 FROM public.escrow_payments e
    WHERE e.id::text = split_part(name, '/', 1)
      AND (e.buyer_id = auth.uid() OR e.seller_id = auth.uid())
  )
);

CREATE POLICY "transfer-proofs admin all"
ON storage.objects FOR ALL
USING (
  bucket_id = 'transfer-proofs'
  AND public.current_profile_role() = 'ADMIN'
)
WITH CHECK (
  bucket_id = 'transfer-proofs'
  AND public.current_profile_role() = 'ADMIN'
);

-- ─── 6. dispute-evidence (분쟁 증거) ────────────────────────
-- path: <escrow_payment_id>/<filename>
-- 접근: 분쟁 당사자 buyer/seller + ADMIN

CREATE POLICY "dispute-evidence party read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dispute-evidence'
  AND EXISTS (
    SELECT 1 FROM public.escrow_payments e
    WHERE e.id::text = split_part(name, '/', 1)
      AND (e.buyer_id = auth.uid() OR e.seller_id = auth.uid())
  )
);

CREATE POLICY "dispute-evidence party write"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dispute-evidence'
  AND EXISTS (
    SELECT 1 FROM public.escrow_payments e
    WHERE e.id::text = split_part(name, '/', 1)
      AND (e.buyer_id = auth.uid() OR e.seller_id = auth.uid())
  )
);

CREATE POLICY "dispute-evidence admin all"
ON storage.objects FOR ALL
USING (
  bucket_id = 'dispute-evidence'
  AND public.current_profile_role() = 'ADMIN'
)
WITH CHECK (
  bucket_id = 'dispute-evidence'
  AND public.current_profile_role() = 'ADMIN'
);

-- ─── 7. 익명 차단 확인 ───────────────────────────────────────
-- storage.objects의 RLS는 기본적으로 enabled. 위 정책 외에는
-- anon role에 어떤 read/write 권한도 부여하지 않으므로 익명은 차단된다.
