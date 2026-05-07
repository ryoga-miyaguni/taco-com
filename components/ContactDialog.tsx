"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

const FORM_EMBED_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSd_gJyLVOJBIFpzFSbDyd3Zu5GFeRvW1ngL-Sk_3vXRgRKzAA/viewform?embedded=true";

/**
 * 運営へのお問い合わせを Google Forms の embed iframe で表示するモーダル。
 *
 * - 旧実装は `window.open(short URL)` で別タブを開いていたが、iOS Safari の
 *   ポップアップブロッカー等で開かないケースがあった。ページ内 iframe に
 *   切り替えることで確実に表示できる。
 * - body のスクロールロックを onMount/onUnmount で行う。
 */
export function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 px-3 py-4 sm:px-6 sm:py-8 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="運営へのお問い合わせフォーム"
    >
      <div className="paper w-full max-w-xl max-h-full flex flex-col rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] bg-crema overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink/15 shrink-0">
          <div>
            <p className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-naranja-deep leading-none">Contacto</p>
            <h2 className="font-display text-ink text-[17px] leading-tight mt-0.5">運営へお問い合わせ</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="h-9 w-9 rounded-full bg-crema border-2 border-ink flex items-center justify-center hover:bg-naranja hover:text-crema transition-colors shadow-[2px_2px_0_var(--ink)]"
          >
            <X className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-white">
          <iframe
            src={FORM_EMBED_URL}
            title="運営へのお問い合わせフォーム"
            className="w-full h-full min-h-[60vh]"
            loading="lazy"
          >
            読み込み中…
          </iframe>
        </div>
      </div>
    </div>
  );
}
