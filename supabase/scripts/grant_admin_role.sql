-- =====================================================================
-- 管理者権限 (admin) の付与・剥奪・確認 — 運用スニペット
--
-- このファイルは migration ではなく、運用時に必要に応じて
-- Supabase Dashboard の SQL Editor で手動実行するためのスニペット集です。
--
-- このアプリの middleware.ts は auth.users.app_metadata.role === 'admin'
-- を /admin 配下の保護条件としています。
--
-- 重要:
-- - app_metadata は service role でしか書き換えられません
--   （ユーザー自身は変更できないため、なりすましに強い設計）
-- - role 変更後はその人が一度サインアウト → サインインしないと
--   JWT に新しい role が反映されません
-- =====================================================================


-- ───── ① 管理者権限を付与 ─────
-- 実行前に PUT_EMAIL_HERE を対象メールアドレスに書き換えてください。
-- 既存の app_metadata を保持しつつ role キーを追加します。

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'PUT_EMAIL_HERE@example.com';


-- ───── ② 管理者権限を剥奪 ─────
-- role キーだけを削除します（他の app_metadata は保持）。

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data - 'role'
WHERE email = 'PUT_EMAIL_HERE@example.com';


-- ───── ③ 現在の admin ユーザー一覧を確認 ─────

SELECT
  id,
  email,
  raw_app_meta_data ->> 'role' AS role,
  created_at
FROM auth.users
WHERE raw_app_meta_data ->> 'role' = 'admin'
ORDER BY created_at;


-- ───── ④ 特定ユーザーの app_metadata を全部見る ─────

SELECT id, email, raw_app_meta_data
FROM auth.users
WHERE email = 'PUT_EMAIL_HERE@example.com';
