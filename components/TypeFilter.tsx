"use client";

import type { ShopType } from "@/lib/types";
import { SHOP_TYPE_COLOR, SHOP_TYPE_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL_TYPES: ShopType[] = ["okinawa", "mexican"];

export function TypeFilter({
  active,
  onToggle,
  favOnly,
  onToggleFav,
}: {
  active: Set<ShopType>;
  onToggle: (type: ShopType) => void;
  favOnly: boolean;
  onToggleFav: () => void;
}) {
  return (
    <div className="paper card-stamp px-2 py-2 flex items-center gap-2">
      <span className="font-serif-it text-[10px] uppercase tracking-[0.2em] text-muted-foreground pl-2 pr-1 hidden sm:block">
        Filter
      </span>
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
              "border-2 border-ink transition-all select-none",
              "rounded-full font-display",
              isActive
                ? "text-crema translate-x-0 translate-y-0 shadow-[3px_3px_0_var(--ink)]"
                : "text-ink bg-crema hover:bg-accent shadow-[2px_2px_0_var(--ink)]",
            )}
            style={isActive ? { backgroundColor: SHOP_TYPE_COLOR[type] } : undefined}
          >
            <span>{SHOP_TYPE_LABEL[type]}</span>
          </button>
        );
      })}

      {/* お気に入りフィルター */}
      <button
        type="button"
        onClick={onToggleFav}
        aria-pressed={favOnly}
        className={cn(
          "relative inline-flex items-center gap-1.5 px-4 h-10 text-sm font-bold",
          "border-2 border-ink transition-all select-none",
          "rounded-full font-display",
          favOnly
            ? "bg-naranja text-crema shadow-[3px_3px_0_var(--ink)]"
            : "text-ink bg-crema hover:bg-accent shadow-[2px_2px_0_var(--ink)]",
        )}
      >
        <span>♥</span>
        <span className="hidden sm:inline">お気に入り</span>
      </button>
    </div>
  );
}
