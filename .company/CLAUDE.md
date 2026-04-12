# 沖縄タコスマップ（taco-com）— プロジェクト支社

## このプロジェクトについて
- プロジェクト名: 沖縄タコスマップ（仮称 / コード名: taco-com）
- 概要: 沖縄県内のタコス店に特化した、マップベースの口コミコミュニティアプリ
- フォルダ: ~/Desktop/taco-com/
- 本社: ~/.company/
- 作成日: 2026-04-11
- ステータス: 🟡 要件定義完了 → 技術選定・設計フェーズ

## コアバリュー
1. **ログイン不要**：圧倒的な手軽さ（ゲスト投稿・LocalStorageで識別）
2. **Mapboxによる地図体験**：クラスタリング・カスタムピン・現在地連携
3. **口コミの熱量**：沖縄タコス愛好家のリアルな声

## 技術スタック（要件定義書 v1 より）
- フロント: Next.js (React) + Tailwind CSS
- 地図: Mapbox GL JS + react-map-gl
- DB: Supabase (PostgreSQL + PostGIS)
- 外部API: Yahoo! ローカルサーチAPI（初期店舗データ取得）
- ホスティング: Vercel
- Bot対策: Cloudflare Turnstile

## スコープ外（v1では実装しない）
- ユーザー認証・アカウント機能
- スタンプラリー機能
- 決済・課金

## このプロジェクトの部署
| 部署 | 担当 | 状態 |
|------|------|------|
| エンジニア | 技術選定・実装・レビュー | 常設 |
| PM | 要件管理・ロードマップ・進捗 | 常設 |

## 重要ドキュメント
- 要件定義書 v1: engineer/specs/requirements-v1.md

## ルール
- 本社の行動原則に従う（~/.company/CLAUDE.md 参照）
- プロジェクト固有の技術・要件情報はここに記録
- 会社全体に関わる決定は本社の memory/decisions.md に記録
- TODO は本社の secretary/todos/ に `[taco-com]` タグで記録
