"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Search, X } from "lucide-react";
import { loadAllComments } from "@/lib/comments";
import type { Comment } from "@/lib/types";
import { getShopId, SHOP_TYPE_COLOR, SHOP_TYPE_LABEL, type Shop } from "@/lib/types";

const MAX_RESULTS = 8;

type ResultKind = "shop" | "comment";

type SearchResult = {
  kind: ResultKind;
  shop: Shop;
  /** コメント検索でヒットした場合の抜粋（最大40文字） */
  excerpt?: string;
};

export function ShopSearchBar({
  shops,
  onSelect,
}: {
  shops: Shop[];
  onSelect: (shop: Shop) => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [allComments, setAllComments] = useState<Comment[]>([]);

  useEffect(() => {
    void loadAllComments().then(setAllComments);
  }, []);

  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // 1. 店舗名・住所でヒットした店舗
    const shopHits = shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q),
    );
    const shopHitIds = new Set(shopHits.map((s) => getShopId(s)));

    // 2. コメント本文でヒット → 対応する店舗を抽出（店舗ヒット済みは除外）
    const commentHitMap = new Map<string, string>(); // shopId → excerpt
    for (const c of allComments) {
      if (c.isHidden) continue;
      const body = c.body.toLowerCase();
      if (!body.includes(q)) continue;
      if (commentHitMap.has(c.shopId)) continue; // 1店舗につき最初のコメントのみ
      // 抜粋：ヒット箇所を含む最大40文字
      const idx = c.body.toLowerCase().indexOf(q);
      const start = Math.max(0, idx - 10);
      const raw = c.body.slice(start, start + 40);
      commentHitMap.set(c.shopId, (start > 0 ? "…" : "") + raw + (raw.length === 40 ? "…" : ""));
    }

    const commentResults: SearchResult[] = [];
    for (const shop of shops) {
      const id = getShopId(shop);
      if (shopHitIds.has(id)) continue; // 店舗ヒットが優先
      if (commentHitMap.has(id)) {
        commentResults.push({ kind: "comment", shop, excerpt: commentHitMap.get(id) });
      }
    }

    return [
      ...shopHits.map((shop) => ({ kind: "shop" as const, shop })),
      ...commentResults,
    ].slice(0, MAX_RESULTS);
  }, [shops, query, allComments]);

  const open = focused && query.trim().length > 0;

  return (
    <div className="relative w-72">
      <div className="relative bg-crema card-stamp rounded-full flex items-center h-11 px-4">
        <Search className="h-4 w-4 text-naranja-deep mr-2 shrink-0" strokeWidth={2.8} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Buscar…  店舗名・住所・口コミ"
          /* iOS Safari は font-size < 16px の input に focus すると自動
             ズームする。text-base(16px) + leading-snug でズームを防ぐ。 */
          className="flex-1 min-w-0 bg-transparent outline-none text-base leading-snug text-ink placeholder:text-muted-foreground placeholder:font-serif-it placeholder:italic"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="クリア"
            className="shrink-0 h-6 w-6 rounded-full border-2 border-ink flex items-center justify-center hover:bg-naranja hover:text-crema transition-colors"
          >
            <X className="h-3 w-3" strokeWidth={3} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-crema paper-lite card-stamp rounded-xl overflow-hidden max-h-80 overflow-y-auto mercado-scroll">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-xs text-muted-foreground font-serif-it italic">
              No hay resultados — 該当する店舗がありません
            </p>
          ) : (
            <ul className="divide-y-2 divide-dashed divide-ink/20">
              {results.map((result) => (
                <li key={`${result.kind}-${result.shop.name}-${result.shop.latitude}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(result.shop);
                      setQuery("");
                      setFocused(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-accent flex items-start gap-3 transition-colors"
                  >
                    <span
                      className="w-3 h-3 rounded-full mt-1.5 shrink-0 border-2 border-ink"
                      style={{ backgroundColor: SHOP_TYPE_COLOR[result.shop.type] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[14px] text-ink truncate leading-tight">
                        {result.shop.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        <span className="font-serif-it italic text-naranja-deep">
                          {SHOP_TYPE_LABEL[result.shop.type]}
                        </span>
                        {" · "}
                        {result.shop.address}
                      </p>
                      {result.kind === "comment" && result.excerpt && (
                        <p className="mt-1 flex items-start gap-1 text-[10px] text-ink/60 leading-snug">
                          <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" strokeWidth={2} />
                          <span className="line-clamp-1">{result.excerpt}</span>
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
