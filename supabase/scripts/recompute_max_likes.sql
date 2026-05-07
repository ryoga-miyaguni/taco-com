-- =====================================================================
-- profiles.max_likes の再計算（一回限りの運用スニペット）
-- 実行日: 2026-05-07
--
-- 背景:
--   ユーザー登録時のデフォルト値が `max_likes: 5` になっていたため、
--   いいね 0 の新規ユーザーでも「初めてのいいね」バッジ（minLikes:1）
--   が自動付与される問題があった。
--   コード側のデフォルトは 0 に修正済み（lib/auth.ts:125）。
--   既に誤った値で保存されている既存ユーザーの max_likes を、実際の
--   コメント like_count 合計から再計算してハイウォーターマークを正す。
--
-- 安全性:
--   max_likes はハイウォーターマーク（過去最高）。実値が現在より高い
--   ケースは想定されないため、合計を直接代入してよい。
--
-- 実行方法:
--   Supabase Dashboard の SQL Editor にこの全文を貼り付けて 1 度実行。
-- =====================================================================

-- 0. 実行前の状態確認
SELECT
  COUNT(*)                           AS total_users,
  SUM(CASE WHEN max_likes > 0 THEN 1 ELSE 0 END) AS with_max_likes_gt0,
  SUM(CASE WHEN max_likes >= 1 AND max_likes < 5 THEN 1 ELSE 0 END) AS suspicious_1_4,
  SUM(CASE WHEN max_likes = 5 THEN 1 ELSE 0 END) AS exactly_5
FROM public.profiles;


-- 1. 各ユーザーの実 like_count 合計から max_likes を再計算
UPDATE public.profiles p
   SET max_likes = COALESCE(
     (SELECT SUM(c.like_count)::int FROM public.comments c WHERE c.user_id = p.id),
     0
   );


-- 2. 実行後の確認（rookie 達成者だけ残っているはず）
SELECT
  COUNT(*)                           AS total_users,
  SUM(CASE WHEN max_likes >= 1  THEN 1 ELSE 0 END) AS rookie_plus,
  SUM(CASE WHEN max_likes >= 10 THEN 1 ELSE 0 END) AS regular_plus,
  SUM(CASE WHEN max_likes >= 50 THEN 1 ELSE 0 END) AS expert_plus
FROM public.profiles;
