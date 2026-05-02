"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * URL に auth_error / auth_error_description クエリが付いている場合に
 * トースト表示する。/auth/callback や /auth/confirm が失敗時にこれらの
 * クエリを付けてトップへリダイレクトしてくる。
 */
function AuthErrorToastInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("auth_error");
    if (!error) return;

    const description = searchParams.get("auth_error_description");
    setMessage(formatAuthError(error, description));

    // URL からクエリを除去（履歴を汚さないため replace）
    const url = new URL(window.location.href);
    url.searchParams.delete("auth_error");
    url.searchParams.delete("auth_error_description");
    router.replace(url.pathname + url.search + url.hash, { scroll: false });

    // 6 秒後に自動で閉じる
    const id = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(id);
    // searchParams は URL 変更で更新されるが、依存にすると無限ループになるため意図的に外す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[calc(100%-2rem)] paper card-stamp rounded-2xl border-[3px] border-salsa shadow-[4px_4px_0_var(--ink)] overflow-hidden animate-in slide-in-from-top-4 duration-300"
    >
      <div className="px-4 py-3 bg-salsa/10 flex items-start gap-3">
        <span className="text-xl shrink-0" aria-hidden>⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-[13px] text-ink leading-tight mb-1">認証エラー</p>
          <p className="text-[12px] text-ink/80 leading-relaxed break-words">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => setMessage(null)}
          aria-label="閉じる"
          className="shrink-0 text-ink/40 hover:text-ink text-[14px] leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function formatAuthError(error: string, description: string | null): string {
  // 既知のエラーコードは日本語化する
  switch (error) {
    case "access_denied":
      return "認証リンクが無効か期限切れです。もう一度お試しください。";
    case "code_exchange_failed":
      return "認証コードの確認に失敗しました。もう一度お試しください。";
    case "no_session":
      return "セッションを取得できませんでした。もう一度お試しください。";
    case "otp_invalid":
      return description ?? "認証リンクが無効か期限切れです。もう一度お試しください。";
    case "invalid_link":
      return "リンクの形式が正しくありません。";
    default:
      return description ?? `認証に失敗しました（${error}）`;
  }
}

export function AuthErrorToast() {
  // useSearchParams は Suspense boundary が必要
  return (
    <Suspense fallback={null}>
      <AuthErrorToastInner />
    </Suspense>
  );
}
