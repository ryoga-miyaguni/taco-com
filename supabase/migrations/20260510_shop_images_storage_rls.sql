-- =====================================================================
-- shop-images Storage バケットの RLS ポリシー
-- 適用日: 2026-05-10
--
-- 前提:
--   Supabase Dashboard → Storage で "shop-images" バケットを以下の設定で
--   作成してから本マイグレーションを実行する:
--     - Public bucket: ON（誰でも公開 URL から読める）
--     - File size limit: 5 MB
--     - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- このマイグレーションは storage.objects への書き込み（INSERT / UPDATE /
-- DELETE）を「shop-images バケット内のオブジェクトに限り、admin ロール
-- のみ許可」する。SELECT は Public bucket の挙動でデフォルト公開。
-- =====================================================================

DROP POLICY IF EXISTS "shop_images_admin_insert" ON storage.objects;
CREATE POLICY "shop_images_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'shop-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "shop_images_admin_update" ON storage.objects;
CREATE POLICY "shop_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'shop-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "shop_images_admin_delete" ON storage.objects;
CREATE POLICY "shop_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'shop-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
