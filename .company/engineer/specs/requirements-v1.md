# 要件定義書 v2 — 沖縄タコスマップ（taco-com）

作成日: 2026-04-11
更新日: 2026-04-12（v2.0）
ステータス: 確定

## 更新履歴
- v2.0 (2026-04-12):
  - **認証方針を全面変更**: ゲスト投稿廃止 → **閲覧は誰でも可、書き込みはログイン必須**
  - セッション永続化: 一度ログインしたらサイト再訪時に自動ログイン維持
  - コメントへの返信（スレッド式）を追加
  - バッジシステム（ハイウォーターマーク方式）を追加
  - お気に入り（行った / 行きたい）を追加
  - 店舗リクエスト機能を v1 スコープに復帰
  - プロフィール画面（バッジ・過去コメント一覧）を追加
- v1.2 (2026-04-11): v1スコープ最小化、管理画面方針確定
- v1.1 (2026-04-11): MapLibre + Protomaps に変更、運営承認制に変更

## 1. プロジェクト概要
- **目的:** 沖縄県内のタコス店を地図上で視覚的に探しやすくし、ユーザー同士のリアルな口コミを共有できるコミュニティアプリ
- **ターゲット:** 沖縄県民、観光客、タコス愛好家
- **コアバリュー:** 直感的な地図体験 + コミュニティの熱量（バッジ・スレッド・いいね）

## 2. システム構成

- **フロントエンド:** Next.js (App Router) + Tailwind CSS 4 + shadcn/ui
- **地図:** MapLibre GL JS + Supercluster（クラスタリング）
- **地図タイル:** Phase 1: OpenFreeMap / Phase 2: Protomaps (.pmtiles on Cloudflare R2)
- **DB:** Phase 1: localStorage / Phase 2: Supabase (PostgreSQL + PostGIS)
- **認証:** Phase 1: localStorage仮ログイン / Phase 2: Supabase Auth
- **ホスティング:** Vercel
- **Bot対策:** Cloudflare Turnstile（Phase 2）

## 3. 認証・ユーザー

### 3-1. 認証方針
- **閲覧（地図・店舗詳細・コメント閲覧）**: 誰でも可、ログイン不要
- **書き込み（コメント・いいね・お気に入り・店舗リクエスト）**: ログイン必須
- 書き込みアクション時に未ログインなら「ログインしてください」を表示

### 3-2. ログイン方式
- メールアドレス + パスワード
- ソーシャルログイン（Google等、Supabase Auth対応分）
- **セッション永続化**: 一度ログインしたユーザーはサイト再訪時に自動的にログイン状態を維持（Supabase Authのリフレッシュトークンによる自動更新）

### 3-3. ユーザープロフィール
- ニックネーム（必須、登録時に設定）
- アバター（アイコン選択式）
- プロフィール画面に表示する情報:
  - バッジ（現在の称号）
  - レビュー数
  - 獲得いいね合計
  - 過去のコメント一覧

## 4. 機能要件

### 4-1. 地図・店舗（実装済み）
| 機能 | 詳細 |
|------|------|
| マップ表示 | MapLibre全画面、カスタムピン、クラスタリング |
| 店舗検索 | 店舗名・住所で検索 |
| タイプフィルター | 沖縄タコス / メキシカン |
| 現在地連携 | Geolocation APIで現在地表示 |
| 店舗詳細パネル | モバイル:ボトムシート / PC:サイドパネル |

### 4-2. コメント・レビュー
| 機能 | 詳細 |
|------|------|
| コメント投稿 | テキスト + 星評価（1〜5）。ログイン必須 |
| コメント編集 | 自分のコメントのみ編集可 |
| コメント削除 | 自分のコメントのみ削除可 |
| コメントへの返信 | スレッド式。`parentId` で親コメントに紐づけ |
| 写真投稿 | レビューに画像を添付（Phase 2: Supabase Storage） |

### 4-3. いいね
| 機能 | 詳細 |
|------|------|
| いいねボタン | コメントに対して1ユーザー1いいね |
| いいね取り消し | トグル式で取り消し可能 |
| いいね数表示 | コメントに現在のいいね数を表示 |

### 4-4. バッジシステム（ハイウォーターマーク方式）
| 項目 | 詳細 |
|------|------|
| 経験値の定義 | そのユーザーの全レビューに付いた「いいね」合計 |
| 記録方式 | 現在のいいね合計が過去最高を超えたら `maxLikes` を更新 |
| 降格なし | いいねが減っても `maxLikes` は下がらない。バッジは剥奪されない |
| バッジ判定 | `maxLikes` が閾値に達したら称号付与 |
| 表示 | プロフィール画面 + コメント横にバッジアイコン |
| 閾値・名称 | 後日決定（例: 10/50/100/500 いいね等） |

### 4-5. お気に入り
| 機能 | 詳細 |
|------|------|
| 行った | 訪問済みとしてマーク |
| 行きたい | ウィッシュリストとしてマーク |
| フィルター | マップ上でお気に入り店舗のみ表示 |
| プロフィール連携 | 訪問済み店舗数をプロフィールに表示 |

### 4-6. 店舗リクエスト
| 機能 | 詳細 |
|------|------|
| リクエスト送信 | 店名・住所・位置（地図タップ）・メモ。ログイン必須 |
| 管理者承認 | 管理画面で承認 → マップに追加 / 却下 |

### 4-7. 通報
| 機能 | 詳細 |
|------|------|
| 通報ボタン | 不適切なコメントを通報。ログイン必須 |
| 重複防止 | 同一ユーザーからは1コメントにつき1通報 |
| 自動非表示 | 通報3件で `is_hidden = true`（管理者レビュー待ち） |

## 5. 管理画面（/admin）

別途 `admin-requirements.md` に詳細記載。概要:
- 管理者ログイン（Supabase Auth、role = admin）
- 店舗CRUD
- コメントモデレーション（通報対応・削除）
- 店舗リクエスト承認/却下
- ユーザーBAN
- アナリティクス

## 6. データベース設計（主要テーブル）

### 6-1. `users`（プロフィール拡張）
- `id` (Supabase Auth user_id)
- `display_name`, `avatar_key`
- `max_likes` (ハイウォーターマーク)
- `created_at`

### 6-2. `shops`
- `id`, `name`, `latitude`, `longitude`, `address`, `type`, `business_hours`, `note`, `image_url`, `is_active`, `created_at`, `updated_at`

### 6-3. `pending_shops`（リクエスト）
- `id`, `name`, `latitude`, `longitude`, `address`, `type`, `note`
- `submitted_by_user_id`, `status` (pending/approved/rejected), `created_at`

### 6-4. `comments`
- `id`, `shop_id`, `user_id`, `parent_id` (nullable, 返信用)
- `body`, `rating` (nullable, 返信にはrating不要), `image_url`
- `is_hidden`, `report_count`, `created_at`, `updated_at`

### 6-5. `reactions`（いいね）
- `id`, `comment_id`, `user_id`, `created_at`
- UNIQUE (`comment_id`, `user_id`)

### 6-6. `reports`（通報）
- `id`, `comment_id`, `reporter_user_id`, `reason`, `created_at`
- UNIQUE (`comment_id`, `reporter_user_id`)
- トリガーで `comments.report_count` 更新 → 3件で自動非表示

### 6-7. `favorites`（お気に入り）
- `id`, `shop_id`, `user_id`, `type` ('visited' | 'want_to_go'), `created_at`
- UNIQUE (`shop_id`, `user_id`)

## 7. 実装フェーズ

### Phase 1: localStorage版（全機能プロトタイプ）
- 仮ログイン（localStorageにユーザー情報保持）
- コメント投稿・編集・削除・返信
- いいね
- バッジ計算・表示
- お気に入り（行った / 行きたい）
- 店舗リクエストフォーム（localStorage保存）
- プロフィール画面
- 通報・自動非表示
- 管理画面（localStorage版CRUD）

### Phase 2: Supabase移行（本番環境）
- Supabase プロジェクト作成・テーブル構築
- Supabase Auth（メール + ソーシャル + セッション永続化）
- 全 lib/ をlocalStorage → Supabase クライアントに移行
- RLS（Row Level Security）設定
- 画像アップロード（Supabase Storage）
- Protomaps (.pmtiles) 地図タイル移行
- Cloudflare Turnstile（Bot対策）
- プライバシーポリシー・利用規約
- Vercelデプロイ

## 8. 非機能要件
- **パフォーマンス:** 地図初期ロード3秒以内
- **レスポンシブ:** モバイルファースト、PCでも崩れない
- **スパム対策:** Turnstile + 通報自動非表示 + ユーザーBAN
- **法務:** プライバシーポリシー・利用規約を本番公開前に整備
- **運用コスト:** 初期は月額1,000円未満
