"use client";

import { useState, useEffect, useRef } from "react";
import type { ShopType, FavoriteType } from "@/lib/types";
import { SHOP_TYPE_COLOR, SHOP_TYPE_LABEL, FAVORITE_TYPE_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL_TYPES: ShopType[] = ["okinawa", "mexican"];
const FAV_TYPES: FavoriteType[] = ["want_to_try", "visited", "want_again"];

export function TypeFilter({
  active,
  onToggle,
  favFilter,
  onSetFavFilter,
}: {
  active: Set<ShopType>;
  onToggle: (type: ShopType) => void;
  favFilter: FavoriteType | null;
  onSetFavFilter: (t: FavoriteType | null) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: PointerEvent) => {
      if (!popupRef.current?.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [mobileOpen]);

  return (
    <div ref={popupRef} className="paper card-stamp px-2 py-2 flex items-center gap-2 relative">
      <span className="font-serif-it text-[10px] uppercase tracking-[0.2em] text-muted-foreground pl-2 pr-1 hidden sm:block">
        Filter
      </span>

      {/* ショップ種別フィルター */}
      {ALL_TYPES.map((type) => {
        const isActive = active.has(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            aria-pressed={isActive}
            className={cn(
              "relative inline-flex items-center gap-2 px-4 h-10 text-sm font-bold",
              "border-2 border-ink transition-all select-none rounded-full font-display",
              isActive
                ? "text-crema shadow-[3px_3px_0_var(--ink)]"
                : "text-ink bg-crema hover:bg-accent shadow-[2px_2px_0_var(--ink)]",
            )}
            style={isActive ? { backgroundColor: SHOP_TYPE_COLOR[type] } : undefined}
          >
            {SHOP_TYPE_LABEL[type]}
          </button>
        );
      })}

      {/* お気に入りフィルター — PC: 3ボタン直接表示 */}
      <div className="hidden sm:flex items-center gap-1.5">
        {FAV_TYPES.map((type) => {
          const isActive = favFilter === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSetFavFilter(isActive ? null : type)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center px-3 h-10 text-[12px] font-display font-bold",
                "border-2 border-ink rounded-full transition-all select-none",
                isActive
                  ? "bg-naranja text-crema shadow-[3px_3px_0_var(--ink)]"
                  : "bg-crema text-ink hover:bg-masa-hi shadow-[2px_2px_0_var(--ink)]",
              )}
            >
              {FAVORITE_TYPE_LABEL[type]}
            </button>
          );
        })}
      </div>

      {/* お気に入りフィルター — モバイル: ♥ ボタン + 上展開ポップアップ（TypeFilter全幅で横並び） */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        className={cn(
          "sm:hidden inline-flex items-center gap-1.5 px-4 h-10 text-sm font-bold",
          "border-2 border-ink rounded-full transition-all select-none",
          mobileOpen || favFilter !== null
            ? "bg-naranja text-crema shadow-[3px_3px_0_var(--ink)]"
            : "bg-crema text-ink shadow-[2px_2px_0_var(--ink)]",
        )}
      >
        ♥
        {favFilter !== null && (
          <span className="text-[11px] font-display">
            {FAVORITE_TYPE_LABEL[favFilter]}
          </span>
        )}
      </button>

      {mobileOpen && (
        <div className="sm:hidden absolute bottom-full left-0 right-0 mb-2 z-50 flex gap-1.5 animate-in slide-in-from-bottom-2 fade-in duration-150 px-2">
          {FAV_TYPES.map((type) => {
            const isActive = favFilter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onSetFavFilter(isActive ? null : type);
                  setMobileOpen(false);
                }}
                className={cn(
                  "flex-1 h-10 px-2 text-[12px] font-display font-bold",
                  "border-2 border-ink rounded-full transition-all",
                  "paper shadow-[2px_2px_0_var(--ink)]",
                  isActive
                    ? "bg-crema text-naranja border-naranja"
                    : "bg-crema text-ink hover:bg-masa-hi",
                )}
              >
                {FAVORITE_TYPE_LABEL[type]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
