"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { Shop } from "@/lib/types";
import { SHOP_TYPE_COLOR, SHOP_TYPE_LABEL, getShopId } from "@/lib/types";
import { CommentSection } from "./CommentSection";
import { useAuth } from "./AuthProvider";
import { getFavorite, toggleFavorite } from "@/lib/favorites";
import type { FavoriteType } from "@/lib/types";
import { X, MapPin, Clock, Sparkles, Globe } from "lucide-react";

export function ShopDetailPanel({
  shop,
  onClose,
}: {
  shop: Shop;
  onClose: () => void;
}) {
  const { user, requireAuth } = useAuth();
  const shopId = getShopId(shop);
  const [favType, setFavType] = useState<FavoriteType | null>(null);

  useEffect(() => {
    setFavType(user ? getFavorite(shopId, user.id) : null);
  }, [shopId, user]);

  const handleFav = (type: FavoriteType) => {
    if (!requireAuth()) return;
    const next = toggleFavorite(shopId, user!.id, type);
    setFavType(next);
  };

  return (
    <aside
      className="absolute z-20 flex flex-col overflow-hidden
                 inset-x-0 bottom-0 max-h-[82vh]
                 sm:inset-x-auto sm:bottom-4 sm:top-4 sm:right-4 sm:w-104 sm:max-h-none
                 bg-crema paper-lite
                 border-t-[3px] border-ink
                 sm:border-[3px]
                 sm:shadow-[6px_6px_0_var(--ink)]
                 rounded-t-3xl sm:rounded-2xl
                 animate-in slide-in-from-bottom-6 sm:slide-in-from-right-6 duration-500"
      role="dialog"
      aria-label={`${shop.name}の詳細`}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full
                   bg-crema border-2 border-ink
                   flex items-center justify-center
                   hover:bg-naranja hover:text-crema
                   transition-colors
                   shadow-[2px_2px_0_var(--ink)]"
      >
        <X className="h-4 w-4" strokeWidth={3} />
      </button>

      {/* Hero image with diagonal corner tag */}
      <div className="relative w-full aspect-4/3 bg-masa-lo shrink-0 overflow-hidden border-b-[3px] border-ink">
        {shop.image_url ? (
          <Image
            src={shop.image_url}
            alt={shop.name}
            fill
            sizes="420px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">
            🌮
          </div>
        )}

        {/* Diagonal type tag */}
        <div
          className="absolute top-4 -left-8 rotate-[-18deg] px-10 py-1 text-[11px] font-bold tracking-[0.2em] uppercase text-crema border-y-2 border-ink shadow-[0_2px_0_var(--ink)]"
          style={{ backgroundColor: SHOP_TYPE_COLOR[shop.type] }}
        >
          {SHOP_TYPE_LABEL[shop.type]}
        </div>

        {/* Bottom fade to cream */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-crema to-transparent pointer-events-none" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain mercado-scroll">
        <div className="px-6 pt-5 pb-6">
          <p className="font-serif-it text-[10px] tracking-[0.24em] uppercase text-naranja-deep">
            La Casa de
          </p>
          <h2 className="mt-1 font-display text-ink text-[26px] leading-[1.15] pr-10">
            {shop.name}
          </h2>

          {/* Wavy divider */}
          <div className="wavy-divider w-full my-4 opacity-80" />

          {/* お気に入りボタン */}
          <div className="flex gap-2 mb-4">
            {(["visited", "want_to_go"] as FavoriteType[]).map((type) => {
              const isActive = favType === type;
              const label = type === "visited" ? "行った ✓" : "行きたい ♡";
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleFav(type)}
                  className={`flex-1 h-9 rounded-full text-[12px] font-display border-2 border-ink transition-all shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] ${
                    isActive
                      ? "bg-naranja text-crema"
                      : "bg-crema text-ink hover:bg-masa-hi"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Info grid */}
          <dl className="space-y-3 text-sm">
            <InfoRow icon={<MapPin className="h-4 w-4" strokeWidth={2.4} />} label="Address">
              {shop.address}
            </InfoRow>
            <InfoRow icon={<Clock className="h-4 w-4" strokeWidth={2.4} />} label="Hours">
              {shop.business_hours}
            </InfoRow>
            <InfoRow icon={<Sparkles className="h-4 w-4" strokeWidth={2.4} />} label="introduction">
              {shop.note}
            </InfoRow>
          </dl>

          {/* 外部リンク */}
          {(shop.website || shop.instagram || shop.x) && (
            <div className="mt-5 flex flex-wrap gap-2">
              <ShopLink
                href={`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`}
                label="Google Maps"
                icon={<MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />}
              />
              {shop.website && (
                <ShopLink
                  href={shop.website}
                  label="公式サイト"
                  icon={<Globe className="h-3.5 w-3.5" strokeWidth={2.4} />}
                />
              )}
              {shop.instagram && (
                <ShopLink
                  href={shop.instagram}
                  label="Instagram"
                  icon={
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  }
                />
              )}
              {shop.x && (
                <ShopLink
                  href={shop.x}
                  label="X"
                  icon={
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.213 5.567 5.951-5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  }
                />
              )}
            </div>
          )}
          {!(shop.website || shop.instagram || shop.x) && (
            <div className="mt-5">
              <ShopLink
                href={`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`}
                label="Google Maps"
                icon={<MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />}
              />
            </div>
          )}

          {/* Section break — dashed with chili */}
          <div className="relative my-6 flex items-center gap-3">
            <div className="flex-1 border-t-2 border-dashed border-ink/60" />
            <span className="text-lg leading-none select-none">🌮</span>
            <div className="flex-1 border-t-2 border-dashed border-ink/60" />
          </div>

          <CommentSection shopId={getShopId(shop)} />
        </div>
      </div>
    </aside>
  );
}

function ShopLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-crema border-2 border-ink text-ink font-display text-[12px] shadow-[2px_2px_0_var(--ink)] hover:bg-naranja hover:text-crema transition-colors whitespace-nowrap"
    >
      {icon}
      {label}
    </a>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-naranja text-crema border-2 border-ink flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <dt className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep">
          {label}
        </dt>
        <dd className="mt-0.5 text-ink text-[13.5px] leading-snug">
          {children}
        </dd>
      </div>
    </div>
  );
}
