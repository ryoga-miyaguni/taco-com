-- =====================================================================
-- shop_views — 店舗詳細パネルの表示イベントログ
-- 適用日: 2026-05-07
--
-- 背景:
--   どの店舗が何回／いつ表示されたかを admin で把握できるようにする。
--   日にちごとの推移分析が可能なよう、行ベースのイベントログとして保存。
--
-- 連打対策:
--   クライアント側で sessionStorage で重複抑制（同一セッション内で
--   同店舗は 1 度のみ INSERT）。サーバー側はそのまま受ける。
--
-- アクセス制御:
--   - INSERT: anon / authenticated いずれも可（パネル表示は誰でも発生する）
--   - SELECT: admin のみ（app_metadata.role = 'admin'）
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.shop_views (
  id         bigserial PRIMARY KEY,
  shop_id    text        NOT NULL,
  user_id    uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_views_shop_id    ON public.shop_views (shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_views_viewed_at  ON public.shop_views (viewed_at DESC);

ALTER TABLE public.shop_views ENABLE ROW LEVEL SECURITY;

-- INSERT: 誰でも記録できる（user_id は省略可）
DROP POLICY IF EXISTS "shop_views_insert_anyone" ON public.shop_views;
CREATE POLICY "shop_views_insert_anyone"
  ON public.shop_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT: admin のみ
DROP POLICY IF EXISTS "shop_views_select_admin" ON public.shop_views;
CREATE POLICY "shop_views_select_admin"
  ON public.shop_views
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
