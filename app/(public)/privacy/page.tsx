import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー — オキナワタコスマップ",
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
            制定日: 2026年4月17日 / 最終改定: 2026年5月2日
          </p>
          <p className="mt-3 text-[13px] text-ink leading-relaxed">
            オキナワタコスマップ運営（以下「運営者」）が提供する「オキナワタコスマップ」（以下「本サービス」）は、個人情報の保護に関する法律（以下「個人情報保護法」）を遵守し、ユーザーの個人情報を適切に管理します。本ポリシーは、本サービスにおける個人情報の取り扱いについて定めるものです。
          </p>
        </div>

        {/* 1. 個人情報取扱事業者 */}
        <Card title="1. 個人情報取扱事業者">
          <ul className="space-y-1.5">
            <Bullet>事業者名: オキナワタコスマップ運営</Bullet>
            <Bullet>連絡先: tacosta.okinawa@gmail.com</Bullet>
          </ul>
        </Card>

        {/* 2. 収集する情報 */}
        <Card title="2. 収集する情報">
          <p className="text-[13px] text-ink mb-3">本サービスは以下の情報を収集します。</p>
          <div className="space-y-3">
            <div>
              <p className="font-bold text-[12px] text-ink mb-1">アカウント情報（必須）</p>
              <ul className="space-y-1">
                {[
                  "メールアドレス（ログイン認証用）",
                  "パスワード（ハッシュ化して保管され、運営者は復元できません）",
                ].map((item) => (
                  <Bullet key={item}>{item}</Bullet>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-[12px] text-ink mb-1">プロフィール情報</p>
              <ul className="space-y-1">
                {[
                  "ニックネーム（表示名）",
                  "アバター（絵文字キャラクター）",
                  "生まれた年（年齢の算出に使用）",
                  "居住地区分（沖縄県内在住 / 観光・県外）",
                  "主な移動手段、シェルの好み、辛さの耐性",
                  "よく行くエリア、同伴者タイプ、タコス店に求めること",
                  "住んでいる市町村（任意）",
                ].map((item) => (
                  <Bullet key={item}>{item}</Bullet>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-[12px] text-ink mb-1">利用データ</p>
              <ul className="space-y-1">
                {[
                  "投稿した口コミ・スライダー評価・コメント・返信",
                  "いいね・お気に入り登録",
                  "スタンプ（トルティーヤ・サルサ・雰囲気・店主）",
                  "店舗追加リクエスト",
                  "他のコンテンツへの通報",
                ].map((item) => (
                  <Bullet key={item}>{item}</Bullet>
                ))}
              </ul>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Google アカウントでログインした場合は、Google から提供される基本的な認証情報（メールアドレス等）を Supabase Authentication 経由で取得します。
            </p>
          </div>
        </Card>

        {/* 3. 情報の保存方法 */}
        <Card title="3. 情報の保存方法">
          <p className="text-[13px] text-ink leading-relaxed mb-3">
            収集した情報は、本サービスのバックエンドである <strong>Supabase（米国）</strong> 上のデータベースに保存します。Supabase は SOC 2 Type 2 等の業界標準のセキュリティ対策を講じています。
          </p>
          <p className="text-[13px] text-ink leading-relaxed">
            ログインセッションの維持には、ブラウザの Cookie を使用します。
          </p>
        </Card>

        {/* 4. 利用目的 */}
        <Card title="4. 情報の利用目的">
          <ul className="space-y-1.5">
            {[
              "ユーザーの認証およびアカウント管理",
              "口コミ・コメント・スタンプの表示",
              "バッジ・ランキング機能の提供",
              "お気に入り・訪問済みの管理",
              "パスワード再設定メールの送信",
              "サービスの改善および不正利用の防止",
              "ユーザーからのお問い合わせへの対応",
            ].map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </ul>
        </Card>

        {/* 5. 第三者提供 */}
        <Card title="5. 第三者への提供">
          <p className="text-[13px] text-ink leading-relaxed">
            運営者は、以下の場合を除き、収集した個人情報を第三者に提供・販売・共有しません。
          </p>
          <ul className="space-y-1.5 mt-3">
            {[
              "ユーザーの事前の同意がある場合",
              "法令に基づく開示が求められた場合",
              "人の生命・身体・財産の保護のために必要であり、本人の同意を得ることが困難な場合",
            ].map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </ul>
        </Card>

        {/* 6. 業務委託先（外部サービス） */}
        <Card title="6. 業務委託先（外部サービス）">
          <p className="text-[13px] text-ink leading-relaxed mb-3">
            本サービスの運営にあたり、以下の外部サービスを利用しています。これらは個人情報保護法に定める「個人データの取扱いの委託」に該当する場合があります。各サービスは各社のプライバシーポリシーに従って情報を取り扱います。
          </p>
          <div className="space-y-3">
            <div>
              <p className="font-bold text-[12px] text-ink">Supabase（米国）</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                データベース・認証基盤として利用しています。すべてのアカウント情報・プロフィール情報・投稿データはこのサービスに保存されます。
              </p>
            </div>
            <div>
              <p className="font-bold text-[12px] text-ink">Brevo（フランス）</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                パスワード再設定等の自動メール送信に利用しています。送信時にメールアドレスを Brevo のサーバに送信します。
              </p>
            </div>
            <div>
              <p className="font-bold text-[12px] text-ink">Vercel（米国）</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                本サービスのホスティング基盤として利用しています。アクセス時の IP アドレス等の接続情報が記録されます。
              </p>
            </div>
            <div>
              <p className="font-bold text-[12px] text-ink">Google LLC（米国）</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Google アカウントでのログイン認証および Google Fonts によるフォント配信に利用しています。
              </p>
            </div>
            <div>
              <p className="font-bold text-[12px] text-ink">OpenFreeMap</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                地図タイルの配信に利用しています。地図タイルの読み込みにあたり、IP アドレス等の接続情報が OpenFreeMap のサーバに送信されます。
              </p>
            </div>
          </div>
        </Card>

        {/* 7. Cookie について */}
        <Card title="7. Cookie について">
          <p className="text-[13px] text-ink leading-relaxed">
            本サービスは、ログインセッションの維持のため Cookie を使用します。ブラウザ設定により Cookie を無効化することは可能ですが、その場合ログインを必要とする機能をご利用いただけません。Cookie はサードパーティへの広告配信目的では使用していません。
          </p>
        </Card>

        {/* 8. 個人情報の開示・訂正・削除 */}
        <Card title="8. 個人情報の開示・訂正・削除">
          <p className="text-[13px] text-ink leading-relaxed mb-3">
            ユーザーは、自身の個人情報について以下の権利を行使できます。
          </p>
          <ul className="space-y-1.5">
            <Bullet><strong>開示請求</strong>: プロフィール画面で確認、または運営者へのメールで請求</Bullet>
            <Bullet><strong>訂正</strong>: プロフィール画面の編集機能で実施可能</Bullet>
            <Bullet><strong>削除（退会）</strong>: プロフィール画面の「アカウントを削除」から実施可能。すべての関連データが完全に削除されます</Bullet>
          </ul>
          <p className="text-[12px] text-muted-foreground leading-relaxed mt-3">
            開示請求等の権利行使については、本人確認の上で対応いたします。
          </p>
        </Card>

        {/* 9. 未成年者 */}
        <Card title="9. 未成年者のご利用">
          <p className="text-[13px] text-ink leading-relaxed">
            13歳未満の方のご利用はお断りしています。13歳以上18歳未満の方は、保護者の同意を得た上でご利用ください。
          </p>
        </Card>

        {/* 10. 改定 */}
        <Card title="10. ポリシーの改定">
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
            tacosta.okinawa@gmail.com
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
