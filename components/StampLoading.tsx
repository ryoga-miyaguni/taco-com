/**
 * 画面遷移直後に表示する最小ローディング演出。
 * Next.js App Router の `loading.tsx` 規約から呼び出される想定。
 *
 * 世界観に合わせ paper 背景 + 中央に「TACOS」スタンプ + やわらかいパルス。
 */
export function StampLoading({ label = "読み込み中…" }: { label?: string } = {}) {
  return (
    <div className="min-h-screen bg-masa paper-lite flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative inline-flex items-center justify-center px-6 py-3 rounded-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--ink)] bg-crema rotate-[-4deg] animate-pulse"
          aria-hidden
        >
          <span className="font-display text-naranja text-[22px] tracking-[0.18em] uppercase">
            Tacos
          </span>
          <span className="absolute -top-1 -right-1 text-base">🌮</span>
        </div>
        <p className="font-serif-it italic text-[12px] tracking-[0.2em] uppercase text-ink/45">
          {label}
        </p>
      </div>
    </div>
  );
}
