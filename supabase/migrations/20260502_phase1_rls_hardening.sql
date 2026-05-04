-- =====================================================================
-- Phase 1 RLS hardening
-- 適用日: 2026-05-02
--
-- 対応内容:
--   1. profiles の "誰でも閲覧可" SELECT を削除（個人情報リーク対策）
--   2. profiles の重複 INSERT ポリシー（英語版）を削除
--   3. likes / shop_stamps の SELECT を本人のみに絞る
--   4. shop_stamps の集計用 RPC 関数 get_stamp_counts を追加
--   5. reports / shop_requests に admin の ALL ポリシーを追加
--
-- 事前に必要なコード変更（このコミットに含まれる）:
--   - lib/likes.ts: 集計を comments.like_count の合算に変更
--   - lib/stamps.ts: getStampCounts を rpc("get_stamp_counts") に変更
-- =====================================================================

-- ─── 1. profiles: 公開 SELECT を削除 ─────────────────────────────────
-- 既に "Users can read their own profile"（本人のみ）と
-- "profiles: 管理者は全操作"（admin 全権限）があるので、誰でも閲覧可は不要。
DROP POLICY IF EXISTS "profiles: 誰でも閲覧可" ON public.profiles;

-- ─── 2. profiles: 重複 INSERT ポリシーを削除 ─────────────────────────
-- "Users can insert their own profile" と "profiles: 本人のみ挿入" は
-- 同一内容（auth.uid() = id）。日本語版を残して英語版を削除。
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- ─── 3a. likes: SELECT を本人のみに絞る ─────────────────────────────
-- 他人の like 履歴が閲覧できる状態を解消。集計は comments.like_count を使う。
DROP POLICY IF EXISTS "likes: 誰でも閲覧可" ON public.likes;
CREATE POLICY "likes: 本人のみ閲覧" ON public.likes
  FOR SELECT
  USING (auth.uid() = user_id);

-- ─── 3b. shop_stamps: SELECT を本人のみに絞る ───────────────────────
-- 他人のスタンプ履歴が閲覧できる状態を解消。集計は RPC で行う（下記）。
DROP POLICY IF EXISTS "shop_stamps: 誰でも閲覧可" ON public.shop_stamps;
CREATE POLICY "shop_stamps: 本人のみ閲覧" ON public.shop_stamps
  FOR SELECT
  USING (auth.uid() = user_id);

-- ─── 4. shop_stamps の集計用 RPC ────────────────────────────────────
-- SELECT 制限下でも店舗ごとのスタンプ集計を取得できるよう、
-- SECURITY DEFINER で全行集計する関数を提供する。
CREATE OR REPLACE FUNCTION public.get_stamp_counts(p_shop_id text)
RETURNS TABLE(stamp_key text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.stamp_key::text, COUNT(*)::bigint
  FROM public.shop_stamps s
  WHERE s.shop_id = p_shop_id
  GROUP BY s.stamp_key;
$$;

GRANT EXECUTE ON FUNCTION public.get_stamp_counts(text) TO authenticated, anon;

-- ─── 5a. reports: admin の ALL ポリシー追加 ────────────────────────
-- 不要な通報の削除や閲覧を admin が行えるように。
CREATE POLICY "reports: 管理者は全操作" ON public.reports
  FOR ALL
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- ─── 5b. shop_requests: admin の ALL ポリシー追加 ──────────────────
-- 不要な申請の削除を admin が行えるように。既存の SELECT/UPDATE policy は
-- そのまま残し、admin の DELETE 権限を追加する。
CREATE POLICY "shop_requests: 管理者は全操作" ON public.shop_requests
  FOR ALL
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);
