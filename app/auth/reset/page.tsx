"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { confirmPasswordReset } from "@/lib/auth";

type Status = "loading" | "ok" | "no_session" | "wrong_entry";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setStatus("no_session");
        return;
      }
      // /auth/confirm が type=recovery でセットしたフラグ cookie を確認
      const hasRecoveryIntent = document.cookie.split(";").some((c) =>
        c.trim().startsWith("password_recovery_intent="),
      );
      if (!hasRecoveryIntent) {
        setStatus("wrong_entry");
        return;
      }
      // 1 回限りなので消費する
      document.cookie = "password_recovery_intent=; max-age=0; path=/";
      setStatus("ok");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("パスワードは8文字以上にしてください"); return; }
    if (password !== confirm) { setError("確認用パスワードが一致しません"); return; }
    setIsSubmitting(true);
    try {
      const result = await confirmPasswordReset(password);
      if (result.error) setError(result.error);
      else setDone(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // セッション確認中
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-masa paper-lite p-4">
        <p className="font-display text-[14px] text-ink/60">確認中…</p>
      </div>
    );
  }

  // リンクが期限切れ・無効
  if (status === "no_session") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-masa paper-lite p-4">
        <div className="w-full max-w-sm paper card-stamp rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b-2 border-ink bg-naranja">
            <p className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-crema/70">Enlace inválido</p>
            <h1 className="font-display text-crema text-[22px] leading-tight">リンクが無効です</h1>
          </div>
          <div className="px-6 py-6 bg-crema space-y-4">
            <p className="text-[13px] text-ink leading-relaxed">
              このパスワード再設定リンクは期限切れか、すでに使用されています。<br />
              もう一度メールを送信してください。
            </p>
            <Link href="/"
              className="block text-center w-full font-display text-[14px] h-11 leading-[44px] rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all">
              トップに戻る →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 既ログイン中だがリカバリ経由ではない（誰かが直接 URL を開いた等）
  if (status === "wrong_entry") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-masa paper-lite p-4">
        <div className="w-full max-w-sm paper card-stamp rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b-2 border-ink bg-naranja">
            <p className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-crema/70">Acceso incorrecto</p>
            <h1 className="font-display text-crema text-[22px] leading-tight">アクセス方法が違います</h1>
          </div>
          <div className="px-6 py-6 bg-crema space-y-4">
            <p className="text-[13px] text-ink leading-relaxed">
              このページはパスワード再設定メール経由でのみご利用いただけます。<br />
              <br />
              パスワード変更は<strong>プロフィール画面 → アカウント設定 → 「パスワードを変更」</strong>から行えます。
            </p>
            <Link href="/profile"
              className="block text-center w-full font-display text-[14px] h-11 leading-[44px] rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all">
              プロフィールへ →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 完了画面
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-masa paper-lite p-4">
        <div className="w-full max-w-sm paper card-stamp rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b-2 border-ink bg-naranja">
            <p className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-crema/70">¡Listo!</p>
            <h1 className="font-display text-crema text-[22px] leading-tight">変更しました</h1>
          </div>
          <div className="px-6 py-6 bg-crema space-y-4 text-center">
            <div className="text-3xl">✅</div>
            <p className="text-[13px] text-ink leading-relaxed">
              新しいパスワードに変更しました。<br />
              そのままログイン状態でアプリをご利用いただけます。
            </p>
            <button type="button" onClick={() => router.replace("/")}
              className="w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all">
              アプリへ →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 新パスワード入力画面
  return (
    <div className="min-h-screen flex items-center justify-center bg-masa paper-lite p-4">
      <div className="w-full max-w-sm paper card-stamp rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b-2 border-ink bg-naranja">
          <p className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-crema/70">Nueva Contraseña</p>
          <h1 className="font-display text-crema text-[22px] leading-tight">新しいパスワード</h1>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 bg-crema">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            新しいパスワードを設定してください（8文字以上）。
          </p>
          <div>
            <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">新しいパスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" autoFocus
              className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja" />
          </div>
          <div>
            <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">確認用</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja" />
          </div>
          {error && <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={isSubmitting}
            className="w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all disabled:opacity-60">
            {isSubmitting ? "更新中…" : "パスワードを更新 →"}
          </button>
        </form>
      </div>
    </div>
  );
}
