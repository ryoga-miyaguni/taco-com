"use client";

import type { Shop } from "@/lib/types";
import { SHOP_TYPE_COLOR, SHOP_TYPE_LABEL, getShopId } from "@/lib/types";
import { CommentSection } from "./CommentSection";

export function ShopDetailPanel({
  shop,
  onClose,
}: {
  shop: Shop;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 sm:left-auto sm:right-4 sm:bottom-4 sm:top-4 sm:w-96 flex flex-col justify-end sm:justify-start pointer-events-none">
      <div className="pointer-events-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] sm:max-h-full">
        <div
          className="h-2 w-full"
          style={{ backgroundColor: SHOP_TYPE_COLOR[shop.type] }}
        />
        <div className="p-5 overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div
                className="inline-block text-[10px] font-bold uppercase tracking-wider text-white rounded-full px-2.5 py-0.5 mb-2"
                style={{ backgroundColor: SHOP_TYPE_COLOR[shop.type] }}
              >
                {SHOP_TYPE_LABEL[shop.type]}
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {shop.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className="shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                住所
              </dt>
              <dd className="mt-0.5 text-gray-900">{shop.address}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                営業時間
              </dt>
              <dd className="mt-0.5 text-gray-900">{shop.business_hours}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                特徴
              </dt>
              <dd className="mt-0.5 text-gray-900">{shop.note}</dd>
            </div>
          </dl>

          <CommentSection shopId={getShopId(shop)} />
        </div>
      </div>
    </div>
  );
}
