"use client";

import type { ShopType } from "@/lib/types";
import { SHOP_TYPE_COLOR, SHOP_TYPE_LABEL } from "@/lib/types";

const ALL_TYPES: ShopType[] = ["hard", "soft", "tacorice", "mixed"];

export function TypeFilter({
  active,
  onToggle,
}: {
  active: Set<ShopType>;
  onToggle: (type: ShopType) => void;
}) {
  return (
    <div className="bg-white/95 backdrop-blur rounded-full shadow-lg px-2 py-2 flex gap-1">
      {ALL_TYPES.map((type) => {
        const isActive = active.has(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive
                ? "text-white shadow-sm"
                : "text-gray-400 bg-gray-100 hover:bg-gray-200"
            }`}
            style={isActive ? { backgroundColor: SHOP_TYPE_COLOR[type] } : undefined}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                backgroundColor: isActive ? "rgba(255,255,255,0.9)" : SHOP_TYPE_COLOR[type],
              }}
            />
            {SHOP_TYPE_LABEL[type]}
          </button>
        );
      })}
    </div>
  );
}
