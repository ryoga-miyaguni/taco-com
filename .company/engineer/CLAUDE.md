# エンジニア部 — 沖縄タコスマップ

## 担当領域
- 技術選定・アーキテクチャ設計
- 実装・コードレビュー
- バグ追跡・パフォーマンスチューニング
- Mapbox / Supabase / Vercel の実装面

## 技術スタック（確定事項）
- Next.js + Tailwind CSS
- Mapbox GL JS + react-map-gl
- Supabase (PostgreSQL + PostGIS 必須)
- Vercel ホスティング
- Cloudflare Turnstile（Bot対策）

## 記録先
- 技術仕様: specs/
- コードレビュー: reviews/
- バグ: bugs/

## 重要な技術的論点（要検討）
1. ゲスト識別: LocalStorage の guest_session_id でどこまで編集権を持たせるか
2. PostGIS クエリ: 現在地近傍検索のパフォーマンス（ST_DWithin vs ST_Distance）
3. Yahoo! API のレート制限と初期データバッチ取得戦略
4. Mapbox 無料枠（月5万ロード）を超えた場合の代替策
5. 通報フローと is_hidden の自動化ライン
