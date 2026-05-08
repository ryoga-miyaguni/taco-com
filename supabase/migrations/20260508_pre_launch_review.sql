-- =====================================================================
-- 公開前レビュー指摘の対応（review #1, #2, #5）
-- 適用日: 2026-05-08
--
-- 含む内容:
--   #1. comments の like_count / report_count を原子的に更新する RPC
--       （read-modify-write の lost update 競合を解消）
--   #2. shop_views の INSERT に WITH CHECK を追加
--       （user_id の偽装と他人 UUID の代入を防ぐ）
--   #5. comments の admin SELECT ポリシー（is_hidden=true 含む全件閲覧）
-- =====================================================================


-- ─── #1. 原子的カウンタ更新 RPC ─────────────────────────────────────
-- 旧実装は SELECT → 加減算 → UPDATE の 3 ステップで、同時アクセス時に
-- lost update が起きていた。Postgres の原子的 UPDATE 1 文に置き換える。
-- SECURITY DEFINER で RLS を bypass し、authenticated だけ EXECUTE 可。

CREATE OR REPLACE FUNCTION public.increment_comment_like_count(
  p_comment_id uuid,
  p_delta int
)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.comments
     SET like_count = GREATEST(0, like_count + p_delta)
   WHERE id = p_comment_id
  RETURNING like_count;
$$;

REVOKE ALL ON FUNCTION public.increment_comment_like_count(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_comment_like_count(uuid, int) TO authenticated;


CREATE OR REPLACE FUNCTION public.increment_comment_report_count(
  p_comment_id uuid
)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.comments
     SET report_count = report_count + 1,
         is_hidden    = (report_count + 1) >= 3
   WHERE id = p_comment_id
  RETURNING report_count;
$$;

REVOKE ALL ON FUNCTION public.increment_comment_report_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_comment_report_count(uuid) TO authenticated;


-- ─── #2. shop_views.user_id の偽装防止 ──────────────────────────────
-- 旧 INSERT ポリシー（誰でも自由に書ける）を WITH CHECK 付きに作り直す。
-- - 匿名利用は user_id = NULL のみ許可
-- - 認証済みは user_id = NULL or auth.uid() 自身のみ許可
DROP POLICY IF EXISTS "shop_views_insert_anyone" ON public.shop_views;
CREATE POLICY "shop_views_insert_self_or_anon"
  ON public.shop_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());


-- ─── #5. comments の admin SELECT ポリシー ─────────────────────────
-- 既存の公開 SELECT ポリシーが is_hidden=true のコメントを返さない場合、
-- admin 通報対応 UI の loadAllComments が hidden 行を読めない懸念がある。
-- admin ロール用の SELECT ポリシーを別途追加し、全件閲覧を保証する。
-- 同名ポリシーがあれば置き換え（DROP IF EXISTS で冪等）。
DROP POLICY IF EXISTS "comments: 管理者は全件閲覧" ON public.comments;
CREATE POLICY "comments: 管理者は全件閲覧" ON public.comments
  FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);
