import { createClient } from "@/lib/supabase/client";
import type { Shop, SliderRatings } from "./types";

// ─── DB 行 → Shop 型マッピング ────────────────────────────────────────────────

type ShopRow = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  type: string;
  business_hours: string | null;
  note: string | null;
  image_url: string | null;
  website: string | null;
  instagram: string | null;
  x_url: string | null;
  slider_ratings: SliderRatings | null;
};

function mapShop(row: ShopRow): Shop {
  return {
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address ?? "",
    type: row.type as Shop["type"],
    business_hours: row.business_hours ?? "",
    note: row.note ?? "",
    image_url: row.image_url ?? undefined,
    website: row.website ?? undefined,
    instagram: row.instagram ?? undefined,
    x: row.x_url ?? undefined,
    sliderRatings: row.slider_ratings ?? undefined,
  };
}

// ─── 公開 API ─────────────────────────────────────────────────────────────────

/** 全店舗を取得 */
export async function getShops(): Promise<Shop[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("getShops error:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapShop(row as ShopRow));
}

/** 店舗のスライダー評価を返す（管理者が設定した値。未設定は null） */
export async function getShopSliderRatings(shopId: string): Promise<SliderRatings | null> {
  const supabase = createClient();
  const [name, coords] = shopId.split("@");
  const [lat, lng] = coords.split(",").map(Number);
  const { data } = await supabase
    .from("shops")
    .select("slider_ratings")
    .eq("name", name)
    .eq("latitude", lat)
    .eq("longitude", lng)
    .single();
  return (data as { slider_ratings: SliderRatings | null } | null)?.slider_ratings ?? null;
}

/** 店舗情報の上書き保存（管理者用） */
export async function saveShopOverride(shopId: string, updates: Partial<Shop>): Promise<void> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.address !== undefined) patch.address = updates.address;
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.business_hours !== undefined) patch.business_hours = updates.business_hours;
  if (updates.note !== undefined) patch.note = updates.note;
  if (updates.image_url !== undefined) patch.image_url = updates.image_url;
  if (updates.website !== undefined) patch.website = updates.website;
  if (updates.instagram !== undefined) patch.instagram = updates.instagram;
  if ("x" in updates) patch.x_url = updates.x ?? null;
  if ("sliderRatings" in updates) patch.slider_ratings = updates.sliderRatings ?? null;
  await supabase.from("shops").update(patch).eq("id", shopId);
}

/** 承認済みの追加店舗一覧（管理者用） */
export async function loadApprovedShopsPublic(): Promise<Shop[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("is_demo", false)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapShop(row as ShopRow));
}

/** 承認済み店舗を保存（管理者用） */
export async function saveApprovedShop(shop: Shop): Promise<void> {
  const supabase = createClient();
  const id = `${shop.name}@${shop.latitude.toFixed(5)},${shop.longitude.toFixed(5)}`;
  await supabase.from("shops").upsert({
    id,
    name: shop.name,
    latitude: shop.latitude,
    longitude: shop.longitude,
    address: shop.address,
    type: shop.type,
    business_hours: shop.business_hours,
    note: shop.note,
    image_url: shop.image_url ?? null,
    website: shop.website ?? null,
    instagram: shop.instagram ?? null,
    x_url: shop.x ?? null,
    slider_ratings: shop.sliderRatings ?? null,
    is_demo: false,
  }, { onConflict: "id" });
}

/** 承認済み店舗を削除（管理者用） */
export async function deleteApprovedShop(shopId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("shops").delete().eq("id", shopId).eq("is_demo", false);
}
