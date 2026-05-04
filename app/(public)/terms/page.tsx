import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 — オキナワタコスマップ",
};

const SECTIONS = [
  {
    title: "第1条（適用）",
    body: `本利用規約（以下「本規約」）は、オキナワタコスマップ運営（以下「運営者」）が提供する「オキナワタコスマップ」（以下「本サービス」）の利用に関する条件を定めるものです。本サービスをご利用いただく方（以下「ユーザー」）は、本規約に同意したものとみなします。`,
  },
  {
    title: "第2条（運営者・お問い合わせ）",
    body: `本サービスは以下の運営者により提供されます。本規約および本サービスに関するご質問・ご意見は、下記の連絡先までお願いします。`,
    items: [
      "運営者: オキナワタコスマップ運営",
      "連絡先: tacosta.okinawa@gmail.com",
    ],
  },
  {
    title: "第3条（サービスの目的）",
    body: `本サービスは、沖縄県内のタコス・メキシカン料理店に関する情報を地図上で共有し、ユーザー同士の口コミ交流を促進することを目的としています。`,
  },
  {
    title: "第4条（禁止事項）",
    body: `ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。`,
    items: [
      "虚偽の店舗情報・口コミの投稿",
      "他のユーザーへの誹謗中傷・ハラスメント行為",
      "スパム・広告・宣伝目的の投稿",
      "他のユーザーへのなりすまし・複数アカウントの不正利用",
      "著作権・肖像権その他の知的財産権の侵害",
      "わいせつ・暴力的・差別的な内容の投稿",
      "本サービスの運営を妨害する行為",
      "不正アクセス、本サービスのシステムへの攻撃",
      "その他、法令または公序良俗に違反する行為",
    ],
  },
  {
    title: "第5条（アカウントの管理）",
    body: `ユーザーは自己の責任においてアカウント情報（メールアドレス・パスワード）を管理するものとします。パスワードは適切に管理し、第三者に開示・貸与・譲渡してはなりません。アカウント情報の不正使用によって生じた損害について、運営者は一切の責任を負いません。`,
  },
  {
    title: "第6条（アカウントの停止）",
    body: `運営者は、ユーザーが本規約に違反した場合、または違反のおそれがあると判断した場合、事前の通知なくアカウントを停止・削除できるものとします。`,
  },
  {
    title: "第7条（退会・アカウント削除）",
    body: `ユーザーは、プロフィール画面の「アカウント設定」からいつでも退会（アカウント削除）することができます。アカウント削除に伴い、ユーザーが投稿した口コミ・コメント・評価・お気に入り・スタンプ・店舗追加リクエスト等のデータも削除されます。一度削除されたデータは復元できません。`,
  },
  {
    title: "第8条（投稿コンテンツの権利）",
    body: `ユーザーが本サービスに投稿した口コミ・コメント・写真等のコンテンツ（以下「投稿コンテンツ」）の著作権は、原則として投稿者に帰属します。ただし、ユーザーは運営者に対し、以下の権利を無償で許諾するものとします。`,
    items: [
      "本サービスにおける表示・配信",
      "本サービスの運営上必要な範囲での編集・削除・非表示等のモデレーション",
      "本サービスの紹介・宣伝・SNS シェア用の OGP 生成等、本サービス外での表示・転載",
      "将来的な機能改善や AI 機能（自動推薦・要約・検索等）の学習素材としての利用",
    ],
    footer: `ユーザーは、投稿コンテンツが第三者の権利を侵害しないよう、自らの責任で内容を確認するものとします。`,
  },
  {
    title: "第9条（免責事項）",
    items: [
      "掲載している店舗情報の正確性・最新性を保証しません",
      "システム障害・メンテナンス等によるサービスの停止・中断に関して責任を負いません",
      "ユーザー間で生じたトラブルについて、運営者は一切の責任を負いません",
      "本サービスの利用によって生じた損害に対し、運営者の故意または重過失がある場合を除き、責任を負いません",
    ],
  },
  {
    title: "第10条（サービスの変更・終了）",
    body: `運営者は、予告なく本サービスの内容を変更または終了できるものとします。これによってユーザーに生じた損害について、運営者は責任を負いません。`,
  },
  {
    title: "第11条（規約の改定）",
    body: `運営者は本規約を予告なく変更できるものとします。変更後の規約は本サービス上に掲示した時点から効力を生じ、ユーザーが本サービスを継続して利用した場合、改定後の規約に同意したものとみなします。`,
  },
  {
    title: "第12条（準拠法・管轄裁判所）",
    body: `本規約は日本法に準拠します。本サービスに関する一切の紛争は、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。`,
  },
];

export default function TermsPage() {
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
          Términos de Uso
        </p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        {/* タイトル */}
        <div>
          <p className="font-serif-it text-[10px] tracking-[0.24em] uppercase text-naranja-deep mb-2">
            Términos de Uso
          </p>
          <h1 className="font-display text-ink text-[32px] leading-tight">
            利用規約
          </h1>
          <p className="mt-3 text-[12px] font-mono text-muted-foreground">
            制定日: 2026年4月17日 / 最終改定: 2026年5月2日
          </p>
        </div>

        {/* 各条文 */}
        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title} className="bg-crema border-2 border-ink rounded-2xl p-5 shadow-[3px_3px_0_var(--ink)]">
              <h2 className="font-display text-ink text-[16px] mb-3">{s.title}</h2>
              {"body" in s && s.body && (
                <p className="text-[13px] text-ink leading-relaxed mb-2">{s.body}</p>
              )}
              {"items" in s && s.items && (
                <ul className="space-y-1.5">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-ink leading-snug">
                      <span className="text-naranja shrink-0 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {"footer" in s && s.footer && (
                <p className="text-[13px] text-ink leading-relaxed mt-3">{s.footer}</p>
              )}
            </section>
          ))}
        </div>

        {/* お問い合わせ */}
        <section className="bg-masa-hi border-2 border-ink/30 rounded-2xl p-5">
          <h2 className="font-display text-ink text-[16px] mb-2">お問い合わせ</h2>
          <p className="text-[13px] text-ink leading-relaxed">
            本規約に関するご質問・ご意見は、以下のメールアドレスまでお問い合わせください。
          </p>
          <p className="mt-2 font-mono text-[13px] text-naranja-deep">
            tacosta.okinawa@gmail.com
          </p>
        </section>

        {/* 関連リンク */}
        <div className="flex gap-4 text-[12px] font-display text-naranja-deep">
          <Link href="/privacy" className="hover:underline">
            プライバシーポリシー →
          </Link>
        </div>
      </main>
    </div>
  );
}
