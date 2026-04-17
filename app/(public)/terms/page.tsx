import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 — 沖縄タコスマップ",
};

const SECTIONS = [
  {
    title: "第1条（適用）",
    body: `本利用規約（以下「本規約」）は、沖縄タコスマップ（以下「本サービス」）の利用に関する条件を定めるものです。本サービスをご利用いただく方（以下「ユーザー」）は、本規約に同意したものとみなします。`,
  },
  {
    title: "第2条（サービスの目的）",
    body: `本サービスは、沖縄県内のタコス・メキシカン料理店に関する情報を地図上で共有し、ユーザー同士の口コミ交流を促進することを目的としています。`,
  },
  {
    title: "第3条（禁止事項）",
    items: [
      "虚偽の店舗情報・口コミの投稿",
      "他のユーザーへの誹謗中傷・ハラスメント行為",
      "スパム・広告・宣伝目的の投稿",
      "他のユーザーへのなりすまし",
      "著作権・肖像権その他の知的財産権の侵害",
      "本サービスの運営を妨害する行為",
      "その他、法令または公序良俗に違反する行為",
    ],
  },
  {
    title: "第4条（アカウントの管理）",
    body: `ユーザーは自己の責任においてアカウントを管理するものとします。アカウント情報の不正使用によって生じた損害について、運営者は一切の責任を負いません。`,
  },
  {
    title: "第5条（アカウントの停止）",
    body: `運営者は、ユーザーが本規約に違反した場合、または違反のおそれがあると判断した場合、事前の通知なくアカウントを停止・削除できるものとします。`,
  },
  {
    title: "第6条（口コミ・投稿コンテンツ）",
    body: `ユーザーが投稿した口コミ・コメントは、本サービスの運営・改善のために利用する場合があります。投稿内容が第三者の権利を侵害しないよう、ユーザー自身がその内容に責任を負います。`,
  },
  {
    title: "第7条（免責事項）",
    items: [
      "掲載している店舗情報の正確性・最新性を保証しません",
      "システム障害・メンテナンス等によるサービスの停止・中断に関して責任を負いません",
      "ユーザー間で生じたトラブルについて、運営者は一切の責任を負いません",
      "本サービスの利用によって生じた損害に対し、運営者の故意または重過失がある場合を除き、責任を負いません",
    ],
  },
  {
    title: "第8条（サービスの変更・終了）",
    body: `運営者は、予告なく本サービスの内容を変更または終了できるものとします。これによってユーザーに生じた損害について、運営者は責任を負いません。`,
  },
  {
    title: "第9条（規約の改定）",
    body: `運営者は本規約を予告なく変更できるものとします。変更後の規約は本サービス上に掲示した時点から効力を生じ、ユーザーが本サービスを継続して利用した場合、改定後の規約に同意したものとみなします。`,
  },
  {
    title: "第10条（準拠法・管轄裁判所）",
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
            制定日: 2026年4月17日
          </p>
        </div>

        {/* 各条文 */}
        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title} className="bg-crema border-2 border-ink rounded-2xl p-5 shadow-[3px_3px_0_var(--ink)]">
              <h2 className="font-display text-ink text-[16px] mb-3">{s.title}</h2>
              {"body" in s && s.body && (
                <p className="text-[13px] text-ink leading-relaxed">{s.body}</p>
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
            rigongguo@gmail.com
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
