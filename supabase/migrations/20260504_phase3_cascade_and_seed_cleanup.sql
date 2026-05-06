-- =====================================================================
-- Phase 3 — コメント削除の整合性確保（FK ON DELETE CASCADE）+ 周辺整理
-- 適用日: 2026-05-04
--
-- 対応内容:
--   1. comments の子要素（replies / likes / reports）に CASCADE を設定し、
--      コメント削除時に関連データが自動的に消えるようにする
--   2. 既存の FK 制約を再作成する形（IF EXISTS で安全に削除→再追加）
--
-- これにより lib/comments.ts の deleteComment / adminDeleteComment が
-- 「親コメント DELETE 1 回」だけで完結するようになり、RLS で他人の
-- likes / reports を消せず孤児化していた問題を解消する。
--
-- 注意:
--   - 制約名は Supabase デフォルトの `<table>_<column>_fkey` を前提
--   - CASCADE は SQL レベルで動作し、RLS の DELETE ポリシーを bypass する
--     （これは安全。FK 整合性のためにエンジン側が実行）
-- =====================================================================


-- ───── 1. likes.comment_id → comments(id) CASCADE ─────
ALTER TABLE public.likes
  DROP CONSTRAINT IF EXISTS likes_comment_id_fkey;

ALTER TABLE public.likes
  ADD CONSTRAINT likes_comment_id_fkey
  FOREIGN KEY (comment_id)
  REFERENCES public.comments(id)
  ON DELETE CASCADE;


-- ───── 2. reports.comment_id → comments(id) CASCADE ─────
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_comment_id_fkey;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_comment_id_fkey
  FOREIGN KEY (comment_id)
  REFERENCES public.comments(id)
  ON DELETE CASCADE;


-- ───── 3. comments.parent_id → comments(id) CASCADE ─────
-- 親コメント削除時に返信ツリーがまるごと消えるようにする。
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_parent_id_fkey;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES public.comments(id)
  ON DELETE CASCADE;


-- ───── 確認クエリ（実行後の検証用） ─────
-- 以下を実行し、3 件すべて delete_rule が CASCADE になっていることを確認:
--
-- SELECT
--   tc.table_name,
--   kcu.column_name,
--   rc.delete_rule
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.referential_constraints rc
--   ON tc.constraint_name = rc.constraint_name
-- WHERE tc.table_schema = 'public'
--   AND tc.constraint_type = 'FOREIGN KEY'
--   AND tc.constraint_name IN (
--     'likes_comment_id_fkey',
--     'reports_comment_id_fkey',
--     'comments_parent_id_fkey'
--   );
