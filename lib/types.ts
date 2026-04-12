export type ShopType = "hard" | "soft" | "tacorice" | "mixed";

export type Shop = {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  type: ShopType;
  business_hours: string;
  note: string;
};

export const SHOP_TYPE_LABEL: Record<ShopType, string> = {
  hard: "ハードシェル",
  soft: "ソフトシェル",
  tacorice: "タコライス",
  mixed: "ミックス",
};

export const SHOP_TYPE_COLOR: Record<ShopType, string> = {
  hard: "#e11d48",
  soft: "#f59e0b",
  tacorice: "#10b981",
  mixed: "#6366f1",
};

export function getShopId(shop: Pick<Shop, "name" | "latitude" | "longitude">): string {
  return `${shop.name}@${shop.latitude.toFixed(5)},${shop.longitude.toFixed(5)}`;
}

export type Comment = {
  id: string;
  shopId: string;
  guestId: string;
  nickname: string;
  body: string;
  rating: number;
  createdAt: string;
};
