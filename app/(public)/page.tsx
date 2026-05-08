"use client";

import { useState, useEffect } from "react";
import { MapView } from "@/components/MapView";
import { getShops } from "@/lib/shops";
import type { Shop } from "@/lib/types";

export default function HomePage() {
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    void getShops().then(setShops);
  }, []);

  return <MapView shops={shops} />;
}
