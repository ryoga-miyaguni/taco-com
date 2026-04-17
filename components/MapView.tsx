"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import type { Shop } from "@/lib/types";
import { SHOP_TYPE_COLOR } from "@/lib/types";
import { ShopDetailPanel } from "./ShopDetailPanel";
import { TypeFilter } from "./TypeFilter";
import { ShopSearchBar } from "./ShopSearchBar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { AVATAR_EMOJI } from "@/lib/types";
import { getAllFavoriteShopIds } from "@/lib/favorites";
import { getShopId } from "@/lib/types";

const OKINAWA_CENTER: [number, number] = [127.85, 26.45];
const INITIAL_ZOOM = 9.2;

type ShopProps = { kind: "shop"; shop: Shop };

export function MapView({ shops }: { shops: Shop[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const clusterRef = useRef<Supercluster<ShopProps> | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<Shop["type"]>>(
    new Set(["okinawa", "mexican"]),
  );
  const [mapReady, setMapReady] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const { user, logout, openAuthModal } = useAuth();

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: OKINAWA_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: { compact: true },
    });

    map.on("load", () => {
      setMapLanguage(map, "ja");
      hideBoundariesOverWater(map);
      setMapReady(true);
    });
    map.on("error", (e) => console.error("[MapView] map error:", e?.error ?? e));

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      "top-right",
    );

    mapRef.current = map;

    return () => {
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const favIds = favOnly && user ? getAllFavoriteShopIds(user.id) : null;
    const visible = shops.filter(
      (s) =>
        activeTypes.has(s.type) &&
        (favIds === null || favIds.has(getShopId(s))),
    );

    const index = new Supercluster<ShopProps>({
      radius: 60,
      maxZoom: 14,
    });
    index.load(
      visible.map((shop) => ({
        type: "Feature",
        properties: { kind: "shop", shop },
        geometry: {
          type: "Point",
          coordinates: [shop.longitude, shop.latitude],
        },
      })),
    );
    clusterRef.current = index;

    const render = () => {
      const idx = clusterRef.current;
      if (!idx) return;
      const bounds = map.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      const zoom = Math.floor(map.getZoom());
      const features = idx.getClusters(bbox, zoom);

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const feature of features) {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties as
          | (ShopProps & { cluster?: false })
          | {
              cluster: true;
              cluster_id: number;
              point_count: number;
              point_count_abbreviated: number | string;
            };

        if ("cluster" in props && props.cluster) {
          const el = createClusterElement(props.point_count);
          el.addEventListener("click", () => {
            const expansionZoom = Math.min(
              idx.getClusterExpansionZoom(props.cluster_id),
              16,
            );
            map.flyTo({
              center: [lng, lat],
              zoom: expansionZoom,
              duration: 600,
            });
          });
          const marker = new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat([lng, lat])
            .addTo(map);
          markersRef.current.push(marker);
        } else {
          const shop = (props as ShopProps).shop;
          const el = createShopElement(shop);
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelectedShop(shop);
            map.flyTo({
              center: [shop.longitude, shop.latitude],
              zoom: Math.max(map.getZoom(), 13),
              duration: 800,
            });
          });
          const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([shop.longitude, shop.latitude])
            .addTo(map);
          markersRef.current.push(marker);
        }
      }
    };

    render();
    map.on("moveend", render);
    map.on("zoomend", render);

    return () => {
      map.off("moveend", render);
      map.off("zoomend", render);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [shops, activeTypes, favOnly, user, mapReady]);

  const handleSelectFromSearch = (shop: Shop) => {
    const map = mapRef.current;
    if (!map) return;
    setSelectedShop(shop);
    map.flyTo({
      center: [shop.longitude, shop.latitude],
      zoom: Math.max(map.getZoom(), 14),
      duration: 800,
    });
  };

  const toggleType = (type: Shop["type"]) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleFavOnly = () => setFavOnly((v) => !v);

  const favIds = favOnly && user ? getAllFavoriteShopIds(user.id) : null;
  const visibleCount = shops.filter(
    (s) =>
      activeTypes.has(s.type) &&
      (favIds === null || favIds.has(getShopId(s))),
  ).length;

  return (
    <div className="fixed inset-0 bg-masa">
      <div
        ref={mapContainerRef}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />

      {/* Top-left: editorial logo + counter + search */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-3 max-w-[min(92vw,22rem)]">
        <div className="pointer-events-auto rise delay-1">
          <LogoCard visibleCount={visibleCount} total={shops.length} />
        </div>
        <div className="pointer-events-auto rise delay-2">
          <ShopSearchBar shops={shops} onSelect={handleSelectFromSearch} />
        </div>
      </div>

      {/* Bottom: filter chips */}
      <div className="absolute bottom-5 left-4 right-4 z-10 flex justify-center pointer-events-none">
        <div className="pointer-events-auto rise delay-3">
          <TypeFilter
            active={activeTypes}
            onToggle={toggleType}
            favOnly={favOnly}
            onToggleFav={toggleFavOnly}
          />
        </div>
      </div>

      {/* Top-right: auth button — desktop only */}
      <div className="hidden sm:flex absolute top-4 right-14 z-10 items-center gap-2 rise delay-4">
        {user ? (
          <>
            <Link
              href="/request"
              className="paper card-stamp-sm rounded-full px-4 h-9 flex items-center font-display text-[13px] text-ink hover:bg-naranja transition-colors"
            >
              店舗を追加
            </Link>
            <Link
              href="/profile"
              className="paper card-stamp-sm rounded-full px-3 h-9 flex items-center gap-2 hover:bg-naranja transition-colors"
            >
              <span className="text-base leading-none">{AVATAR_EMOJI[user.avatarKey]}</span>
              <span className="font-display text-ink text-[13px] max-w-20 truncate">{user.displayName}</span>
            </Link>
          </>
        ) : (
          <button
            type="button"
            onClick={openAuthModal}
            className="paper card-stamp rounded-full px-4 h-9 font-display text-[13px] text-ink hover:bg-naranja transition-colors border-2 border-ink shadow-[2px_2px_0_var(--ink)]"
          >
            ログイン
          </button>
        )}
        <Link
          href="/terms"
          className="paper card-stamp-sm rounded-full px-3 h-9 flex items-center font-display text-[12px] text-ink hover:bg-naranja transition-colors"
        >
          利用規約
        </Link>
        <Link
          href="/privacy"
          className="paper card-stamp-sm rounded-full px-3 h-9 flex items-center font-display text-[12px] text-ink hover:bg-naranja transition-colors"
        >
          プライバシー
        </Link>
        {user && (
          <button
            type="button"
            onClick={logout}
            className="rounded-full px-3 h-9 font-display text-[12px] bg-naranja text-crema border-2 border-ink shadow-[2px_2px_0_var(--ink)]"
          >
            ログアウト
          </button>
        )}
      </div>

      {/* Bottom-right: FAB — mobile only */}
      <div className="sm:hidden absolute bottom-22 right-4 z-20">
        <UserFab />
      </div>

      {selectedShop && (
        <ShopDetailPanel
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
        />
      )}
    </div>
  );
}

function LogoCard({ visibleCount, total }: { visibleCount: number; total: number }) {
  return (
    <div className="paper card-stamp rounded-none px-5 pt-4 pb-4 w-fit">
      <p className="font-serif-it text-naranja-deep text-[11px] tracking-[0.22em] uppercase mb-0.5">
        mapa de Tacos
      </p>
      <h1 className="font-display text-ink text-[28px] leading-none">
        オキナワ<span className="text-naranja">タコス</span>マップ
      </h1>
      <div className="mt-2 flex items-center gap-2">
        <div className="wavy-divider w-20" />
        <p className="font-serif-it text-[11px] text-ink">
          {visibleCount}
          <span className="text-muted-foreground"> / {total} </span>
          shops on the map
        </p>
      </div>
    </div>
  );
}

function setMapLanguage(map: maplibregl.Map, lang: string) {
  const style = map.getStyle();
  if (!style?.layers) return;
  for (const layer of style.layers) {
    if (layer.type !== "symbol") continue;
    const textField = layer.layout?.["text-field"];
    if (textField === undefined) continue;
    map.setLayoutProperty(layer.id, "text-field", [
      "coalesce",
      ["get", `name:${lang}`],
      ["get", "name"],
      ["get", "name:latin"],
    ]);
  }
}

function hideBoundariesOverWater(map: maplibregl.Map) {
  const style = map.getStyle();
  if (!style?.layers) return;

  // Find the first water fill layer to use as the "below" anchor
  const waterLayer = style.layers.find(
    (l) => l.type === "fill" && /water|ocean|sea/.test(l.id),
  );
  if (!waterLayer) return;

  for (const layer of style.layers) {
    if (layer.type !== "line") continue;
    // Match administrative / boundary line layers
    if (!/bound|admin/.test(layer.id)) continue;
    // Move boundary below water so water covers it
    map.moveLayer(layer.id, waterLayer.id);
  }
}

function createShopElement(shop: Shop): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${shop.name}を選択`);
  el.className = "block w-8 h-8 cursor-pointer focus:outline-none";
  el.innerHTML = `<span class="sr-only">${shop.name}</span><span class="marker-dot w-full h-full rounded-full border-2 border-white shadow-lg transition-transform flex items-center justify-center text-white text-sm" style="background-color:${SHOP_TYPE_COLOR[shop.type]}">🌮</span>`;
  return el;
}

function createClusterElement(count: number): HTMLButtonElement {
  const size = count < 10 ? 40 : count < 30 ? 48 : 58;
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${count}店舗のクラスター`);
  el.className = "taco-cluster focus:outline-none";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.textContent = String(count);
  return el;
}

// ─── UserFab (mobile only) ────────────────────────────────────────────────────

function UserFab() {
  const { user, logout, openAuthModal } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // 外側タップで閉じる
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className="relative flex flex-col items-end gap-2">
      {/* メニュー（上方向に展開） */}
      {open && (
        <div
          className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-150 w-36"
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        >
          {user ? (
            <>
              <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); router.push("/request"); setOpen(false); }}
                className="w-full paper card-stamp rounded-full h-10 font-display text-[13px] text-ink border-2 border-ink shadow-[3px_3px_0_var(--ink)] whitespace-nowrap hover:bg-naranja transition-colors"
              >
                店舗を追加
              </button>
              <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); router.push("/profile"); setOpen(false); }}
                className="w-full paper card-stamp rounded-full h-10 flex items-center justify-center gap-2 border-2 border-ink shadow-[3px_3px_0_var(--ink)] whitespace-nowrap"
              >
                <span className="text-base leading-none">{AVATAR_EMOJI[user.avatarKey]}</span>
                <span className="font-display text-ink text-[13px]">{user.displayName}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); openAuthModal(); setOpen(false); }}
              className="w-full paper card-stamp rounded-full h-10 font-display text-[13px] text-ink border-2 border-ink shadow-[3px_3px_0_var(--ink)] whitespace-nowrap"
            >
              ログイン
            </button>
          )}
          <Link
            href="/terms"
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full paper card-stamp rounded-full h-10 flex items-center justify-center font-display text-[13px] text-ink border-2 border-ink shadow-[3px_3px_0_var(--ink)] whitespace-nowrap"
          >
            利用規約
          </Link>
          <Link
            href="/privacy"
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full paper card-stamp rounded-full h-10 flex items-center justify-center font-display text-[13px] text-ink border-2 border-ink shadow-[3px_3px_0_var(--ink)] whitespace-nowrap"
          >
            プライバシーポリシー
          </Link>
          {user && (
            <button
              type="button"
              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); logout(); setOpen(false); }}
              className="w-full rounded-full h-10 font-display text-[13px] bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] whitespace-nowrap"
            >
              ログアウト
            </button>
          )}
        </div>
      )}

      {/* FAB 本体 */}
      <button
        type="button"
        aria-label="ユーザーメニュー"
        aria-expanded={open}
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((v) => !v); }}
        className={`w-12 h-12 rounded-full border-[3px] border-ink flex items-center justify-center text-xl shadow-[3px_3px_0_var(--ink)] transition-all active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_var(--ink)] ${
          open
            ? "bg-naranja text-crema"
            : "bg-crema text-ink"
        }`}
      >
        {user ? AVATAR_EMOJI[user.avatarKey] : "👤"}
      </button>
    </div>
  );
}
