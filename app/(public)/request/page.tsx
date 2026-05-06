"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { submitRequest, parseLatLngFromMapUrl } from "@/lib/requests";
import type { ShopType } from "@/lib/types";
import { SHOP_TYPE_LABEL } from "@/lib/types";

export default function RequestPage() {
  const { user, isLoading, requireAuth } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<ShopType>("okinawa");
  const [note, setNote] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;

    if (!name.trim()) { setError("店舗名を入力してください"); return; }
    if (!address.trim()) { setError("住所を入力してください"); return; }

    // Google Maps URLから座標を解析
    let latitude = 0;
    let longitude = 0;
    if (mapUrl.trim()) {
      const parsed = parseLatLngFromMapUrl(mapUrl.trim());
      if (parsed) {
        latitude = parsed.latitude;
        longitude = parsed.longitude;
      } else {
        setError("Google MapsのURLから座標を読み取れませんでした。URLを確認してください");
        return;
      }
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await submitRequest({
        name,
        address,
        latitude,
        longitude,
        type,
        note,
        mapUrl: mapUrl.trim() || undefined,
        userId: user.id,
        displayName: user.displayName,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("[request] submitRequest failed:", err);
      setError(
        err instanceof Error
          ? `送信に失敗しました: ${err.message}`
          : "送信に失敗しました。時間をおいて再度お試しください",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Solicitar Tienda
        </p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {submitted ? (
          <div className="paper card-stamp rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] px-8 py-10 text-center">
            <p className="text-5xl mb-4">🌮</p>
            <h2 className="font-display text-ink text-[22px] mb-2">
              リクエストを受け付けました
            </h2>
            <p className="font-serif-it italic text-[13px] text-muted-foreground mb-6">
              管理者が確認後、マップに追加されます
            </p>
            <Link
              href="/"
              className="font-display text-[14px] px-6 h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] inline-flex items-center"
            >
              マップに戻る →
            </Link>
          </div>
        ) : (
          <div className="paper card-stamp rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] overflow-hidden">
            <div className="bg-naranja px-6 py-5">
              <p className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-crema/70">
                Nueva Tienda
              </p>
              <h1 className="font-display text-crema text-[24px] leading-tight">
                店舗リクエスト
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5 bg-crema">
              {/* 店舗名 */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
                  店舗名 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: タコスいちば"
                  maxLength={50}
                  className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                />
              </div>

              {/* 住所 */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
                  住所 *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="例: 沖縄県那覇市..."
                  maxLength={100}
                  className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                />
              </div>

              {/* Google Maps URL */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
                  Google Maps URL（任意・座標取得に使用）
                </label>
                <input
                  type="text"
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                />
                <p className="mt-1 text-[10px] text-muted-foreground font-serif-it italic">
                  Google Mapsで店舗を開き、URLをコピーして貼り付けると地図に正確に表示されます
                </p>
              </div>

              {/* 種別 */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  種別
                </label>
                <div className="flex gap-2">
                  {(["okinawa", "mexican"] as ShopType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 h-9 rounded-full text-[12px] font-display border-2 border-ink transition-all shadow-[2px_2px_0_var(--ink)] ${
                        type === t
                          ? "bg-naranja text-crema"
                          : "bg-white text-ink hover:bg-masa-hi"
                      }`}
                    >
                      {SHOP_TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* メモ */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
                  メモ（任意）
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="営業時間や特徴など補足があれば..."
                  rows={3}
                  maxLength={200}
                  className="w-full resize-none bg-white border-2 border-ink rounded-xl px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                />
              </div>

              {error && (
                <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "送信中…" : "リクエストを送信 →"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
