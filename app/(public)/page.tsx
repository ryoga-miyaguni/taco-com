"use client";

import { useState, useEffect } from "react";
import { MapView } from "@/components/MapView";
import { getShops } from "@/lib/shops";
import type { Shop } from "@/lib/types";
import demoData from "@/data/demo-shops.json";

export default function HomePage() {
  // サーバーサイドでは localStorage が読めないため、
  // まずデモデータで初期化し、クライアントマウント後に承認済み店舗を含む全データを反映する
  const [shops, setShops] = useState<Shop[]>(demoData.shops as Shop[]);

  useEffect(() => {
    setShops(getShops());
  }, []);

  return <MapView shops={shops} />;
}
