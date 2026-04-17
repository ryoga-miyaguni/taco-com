import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー — 沖縄タコスマップ",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-masa paper-lite">
      <header className="border-b-[3px] border-ink bg-naranja px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="font-display text-crema text-[13px] border-2 border-crema/60 rounded-full px-3 h-8 flex items-center hover:bg-crema hover:text-naranja transition-colors"
        >
          ← マップに戻る
        </Link>
        <p className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-crema/70 ml-auto hidden sm:block">
          Política de Privacidad
        </p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* タイトル */}
        <div>
          <p className="font-serif-it text-[10px] tracking-[0.24em] uppercase text-naranja-deep mb-2">
            Política de Privacidad
          </p>
          <h1 className="font-display text-ink text-[32px] leading-tight">
            プライバシーポリシー
          </h1>
          <p className="mt-3 text-[12px] font-mono text-muted-foreground">
            制定日: 2026年4月17日
          </p>
          <p className="mt-3 text-[13px] text-ink leading-relaxed">
            沖縄タコスマップ（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報を適切に管理します。本ポリシーは、本サービスにおける情報の取り扱いについて定めるものです。
          </p>
        </div>

        {/* 1. 収集する情報 */}
        <Card title="1. 収集する情報">
          <p className="text-[13px] text-ink mb-3">本サービスは以下の情報を収集します。</p>
          <div className="space-y-3">
            <div>
              <p className="font-bold text-[12px] text-ink mb-1">アカウント情報</p>
              <ul className="space-y-1">
                {["ニックネーム（表示名）", "アバター（絵文字キャラクター）"].map((item) => (
                  <Bullet key={item}>{item}</Bullet>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-[12px] text-ink mb-1">プロフィール情報（任意）</p>
              <ul className="space-y-1">
                {[
                  "生まれた年（年齢の算出に使用）",
                  "居住地区分（沖縄県内在住 / 観光・県外）",
                  "主な移動手段、シェルの好み、辛さの耐性",
                  "よく行くエリア、同伴者タイプ、タコス店に求めること",
                ].map((item) => (
                  <Bullet key={item}>{item}</Bullet>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-[12px] text-ink mb-1">利用データ</p>
              <ul className="space-y-1">
                {[
                  "投稿した口コミ・評価・返信",
                  "いいね・お気に入り登録",
                  "店舗追加リクエスト",
                ].map((item) => (
                  <Bullet key={item}>{item}</Bullet>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* 2. 情報の保存方法 */}
        <Card title="2. 情報の保存方法">
          <p className="text-[13px] text-ink leading-relaxed mb-3">
            現在、本サービスで収集するすべての情報は、<strong>ご利用のデバイスのブラウザ（localStorage）にのみ保存</strong>されます。外部のサーバーには一切送信されません。
          </p>
          <div className="bg-naranja/8 border-2 border-naranja/30 rounded-xl p-3 text-[12px] text-ink leading-relaxed">
            <p className="font-bold mb-1">将来的なデータ移行について</p>
            <p>
              サービスの本格運用に際してクラウドデータベースへ移行する場合は、本ポリシーを改定の上、事前にお知らせします。
            </p>
          </div>
        </Card>

        {/* 3. 利用目的 */}
        <Card title="3. 情報の利用目的">
          <ul className="space-y-1.5">
            {[
              "ユーザーの識別とアカウント管理",
              "口コミ・コメントの表示",
              "バッジ・ランキング機能の提供",
              "お気に入り・訪問済みの管理",
              "サービスの改善および不正利用の防止",
            ].map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </ul>
        </Card>

        {/* 4. 第三者提供 */}
        <Card title="4. 第三者への提供">
          <p className="text-[13px] text-ink leading-relaxed">
            運営者は、以下の場合を除き、収集した情報を第三者に提供・販売・共有しません。
          </p>
          <ul className="space-y-1.5 mt-3">
            {[
              "ユーザーの事前の同意がある場合",
              "法令に基づく開示が求められた場合",
            ].map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </ul>
        </Card>

        {/* 5. 外部サービス */}
        <Card title="5. 利用している外部サービス">
          <div className="space-y-3">
            <div>
              <p className="font-bold text-[12px] text-ink">OpenFreeMap（地図表示）</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                地図の表示に OpenFreeMap を使用しています。地図タイルの読み込みにあたり、IPアドレス等の接続情報が OpenFreeMap のサーバーに送信される場合があります。
              </p>
            </div>
            <div>
              <p className="font-bold text-[12px] text-ink">Google Fonts（フォント）</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                テキスト表示に Google Fonts を使用しています。フォントの読み込みにあたり Google のサーバーへのリクエストが発生します。
              </p>
            </div>
          </div>
        </Card>

        {/* 6. Cookieとlocalストレージ */}
        <Card title="6. Cookie・localStorageについて">
          <p className="text-[13px] text-ink leading-relaxed">
            本サービスは、ログインセッションの維持とユーザーデータの保存のため、ブラウザの localStorage を使用します。localStorage はサードパーティには共有されません。ブラウザの設定から localStorage を削除することで、保存されたデータをすべて消去できます（アカウントも削除されます）。
          </p>
        </Card>

        {/* 7. 未成年者 */}
        <Card title="7. 未成年者のご利用">
          <p className="text-[13px] text-ink leading-relaxed">
            13歳未満の方のご利用はお断りしています。13歳以上18歳未満の方は、保護者の同意を得た上でご利用ください。
          </p>
        </Card>

        {/* 8. 改定 */}
        <Card title="8. ポリシーの改定">
          <p className="text-[13px] text-ink leading-relaxed">
            本ポリシーは、法令の改正やサービス内容の変更に伴い、予告なく改定する場合があります。重要な変更がある場合は、本サービス上でお知らせします。
          </p>
        </Card>

        {/* お問い合わせ */}
        <section className="bg-masa-hi border-2 border-ink/30 rounded-2xl p-5">
          <h2 className="font-display text-ink text-[16px] mb-2">お問い合わせ</h2>
          <p className="text-[13px] text-ink leading-relaxed">
            本ポリシーに関するご質問・ご意見は、以下のメールアドレスまでお問い合わせください。
          </p>
          <p className="mt-2 font-mono text-[13px] text-naranja-deep">
            rigongguo@gmail.com
          </p>
        </section>

        {/* 関連リンク */}
        <div className="flex gap-4 text-[12px] font-display text-naranja-deep">
          <Link href="/terms" className="hover:underline">
            利用規約 →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-crema border-2 border-ink rounded-2xl p-5 shadow-[3px_3px_0_var(--ink)]">
      <h2 className="font-display text-ink text-[16px] mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[13px] text-ink leading-snug">
      <span className="text-naranja shrink-0 mt-0.5">•</span>
      <span>{children}</span>
    </li>
  );
}
