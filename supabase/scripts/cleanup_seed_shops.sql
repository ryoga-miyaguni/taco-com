-- =====================================================================
-- シード店舗のクリーンアップ — 公開直前の運用スニペット
--
-- このファイルは migration ではなく、公開直前に「ダミーで投入したシード
-- 店舗を全削除」する用途で 1 回限り Supabase Dashboard の SQL Editor で
-- 実行するためのスニペットです。
--
-- 削除対象:
--   - shops テーブルの全レコード
--   - 関連する comments / favorites / likes / reports / shop_stamps
--
-- ⚠️ 注意:
--   - 本番運用に入った後は実行禁止（実ユーザーのデータも消える）
--   - shops に対する FK CASCADE は現状ついていないため、関連テーブルは
--     順次手動で削除する
-- =====================================================================


-- ───── 0. 削除前の確認（実行して件数を把握） ─────
SELECT 'shops' AS tbl, COUNT(*) AS rows FROM public.shops
UNION ALL
SELECT 'comments',     COUNT(*) FROM public.comments
UNION ALL
SELECT 'favorites',    COUNT(*) FROM public.favorites
UNION ALL
SELECT 'likes',        COUNT(*) FROM public.likes
UNION ALL
SELECT 'reports',      COUNT(*) FROM public.reports
UNION ALL
SELECT 'shop_stamps',  COUNT(*) FROM public.shop_stamps;


-- ───── 1. 関連データを順次削除 ─────
-- comments を消すと、Phase 3 migration で設定した FK CASCADE により
-- likes と reports も連動して消える（comments 経由で）。
-- ただし、comments → shops の FK CASCADE は無いので、shops を直接消すと
-- 失敗する。このため、関連テーブルを先に空にしてから shops を消す手順とする。

DELETE FROM public.shop_stamps;
DELETE FROM public.favorites;
DELETE FROM public.comments;       -- CASCADE で likes / reports / 返信が連動削除される
-- 念のため likes と reports に取り残しがあれば全削除（shops 経由のシード混入を考慮）
DELETE FROM public.likes;
DELETE FROM public.reports;


-- ───── 2. shops を削除 ─────
DELETE FROM public.shops;


-- ───── 3. 削除結果の確認 ─────
SELECT 'shops' AS tbl, COUNT(*) AS rows FROM public.shops
UNION ALL
SELECT 'comments',     COUNT(*) FROM public.comments
UNION ALL
SELECT 'favorites',    COUNT(*) FROM public.favorites
UNION ALL
SELECT 'likes',        COUNT(*) FROM public.likes
UNION ALL
SELECT 'reports',      COUNT(*) FROM public.reports
UNION ALL
SELECT 'shop_stamps',  COUNT(*) FROM public.shop_stamps;

-- 全テーブル 0 件になっていれば成功。
-- 次のブランチで実装する Admin の「店舗を追加」機能から本番店舗を投入する。
