-- =====================================================================
-- Admin: 店舗の名称・座標変更（カスケード ID 更新）
-- 適用日: 2026-05-06
--
-- 背景:
--   shops.id は `name@lat,lng` 形式の TEXT PK のため、name または座標が
--   変わると id 自体が変わる。関連テーブル（comments / favorites /
--   shop_stamps）の shop_id も同時に新 id へ付け替えなければ、コメントや
--   お気に入りが孤児化する。
--
--   この RPC は「新 id 行を INSERT → 関連テーブル shop_id を更新 →
--   旧 id 行を DELETE」を 1 トランザクションでまとめて行う。
--
-- アクセス制御:
--   SECURITY DEFINER + 関数内で auth.jwt() の app_metadata.role を確認し
--   admin 以外は実行不可とする。authenticated にのみ EXECUTE 権限を付与。
-- =====================================================================

CREATE OR REPLACE FUNCTION public.admin_rename_shop(
  p_old_id text,
  p_new_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- 管理者のみ許可
  v_role := (auth.jwt() -> 'app_metadata' ->> 'role');
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  -- 同一 id ならノーオペ
  IF p_old_id = p_new_id THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_old_id) THEN
    RAISE EXCEPTION 'shop not found: %', p_old_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.shops WHERE id = p_new_id) THEN
    RAISE EXCEPTION 'shop id collision: % already exists', p_new_id;
  END IF;

  -- 1) 新 id 行を INSERT（name / lat / lng 以外のフィールドは旧行から複製）
  --    name / lat / lng は呼び出し元 (lib/shops.ts) が saveShopOverride で
  --    rename 直後に新 id へ UPDATE するため、ここではコピーのみで OK。
  INSERT INTO public.shops (
    id, name, latitude, longitude, address, type, business_hours, note,
    image_url, website, instagram, x_url, slider_ratings, is_demo, created_at
  )
  SELECT p_new_id, name, latitude, longitude, address, type, business_hours, note,
         image_url, website, instagram, x_url, slider_ratings, is_demo, created_at
    FROM public.shops WHERE id = p_old_id;

  -- 2) 関連テーブルの shop_id を新 id にカスケード更新
  UPDATE public.comments    SET shop_id = p_new_id WHERE shop_id = p_old_id;
  UPDATE public.favorites   SET shop_id = p_new_id WHERE shop_id = p_old_id;
  UPDATE public.shop_stamps SET shop_id = p_new_id WHERE shop_id = p_old_id;

  -- 3) 旧 id 行を削除（children は既に新 id を参照しているので CASCADE で
  --    巻き込まれることはない）
  DELETE FROM public.shops WHERE id = p_old_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_rename_shop(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_rename_shop(text, text) TO authenticated;
