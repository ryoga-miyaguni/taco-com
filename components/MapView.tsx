"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import type { Shop } from "@/lib/types";
import { SHOP_TYPE_COLOR } from "@/lib/types";
import { ShopDetailPanel } from "./ShopDetailPanel";
import { TypeFilter } from "./TypeFilter";

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
    new Set(["hard", "soft", "tacorice", "mixed"]),
  );
  const [mapReady, setMapReady] = useState(false);

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

    const visible = shops.filter((s) => activeTypes.has(s.type));

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
          const marker = new maplibregl.Marker({ element: el })
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
          const marker = new maplibregl.Marker({ element: el })
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
  }, [shops, activeTypes, mapReady]);

  const toggleType = (type: Shop["type"]) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className="fixed inset-0">
      <div
        ref={mapContainerRef}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur rounded-xl shadow-lg px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">
            🌮 沖縄タコスマップ
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            {shops.filter((s) => activeTypes.has(s.type)).length} / {shops.length} 店舗表示中
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <TypeFilter active={activeTypes} onToggle={toggleType} />
        </div>
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

function createShopElement(shop: Shop): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${shop.name}を選択`);
  el.className = "block w-8 h-8 cursor-pointer focus:outline-none";
  el.innerHTML = `<span class="sr-only">${shop.name}</span><span class="marker-dot w-full h-full rounded-full border-2 border-white shadow-lg transition-transform flex items-center justify-center text-white text-sm font-bold" style="background-color:${SHOP_TYPE_COLOR[shop.type]}">🌮</span>`;
  return el;
}

function createClusterElement(count: number): HTMLButtonElement {
  const size = count < 10 ? 36 : count < 30 ? 44 : 54;
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${count}店舗のクラスター`);
  el.className = "block cursor-pointer focus:outline-none";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.innerHTML = `<span class="marker-dot w-full h-full rounded-full border-[3px] border-white shadow-lg flex items-center justify-center text-white text-sm font-bold transition-transform" style="background-color:#d97706">${count}</span>`;
  return el;
}
