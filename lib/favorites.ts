import { createClient } from "@/lib/supabase/client";
import type { Favorite, FavoriteType } from "./types";

export async function getFavorite(shopId: string, userId: string): Promise<FavoriteType | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("favorites")
    .select("type")
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .single();
  return (data as { type: FavoriteType } | null)?.type ?? null;
}

export async function toggleFavorite(
  shopId: string,
  userId: string,
  type: FavoriteType,
): Promise<FavoriteType | null> {
  const supabase = createClient();
  const current = await getFavorite(shopId, userId);

  if (current === type) {
    await supabase.from("favorites").delete().eq("shop_id", shopId).eq("user_id", userId);
    return null;
  }

  await supabase.from("favorites").upsert(
    { shop_id: shopId, user_id: userId, type },
    { onConflict: "shop_id,user_id" },
  );
  return type;
}

export async function getShopIdsByFavoriteType(userId: string, type: FavoriteType): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("favorites")
    .select("shop_id")
    .eq("user_id", userId)
    .eq("type", type);
  return new Set((data ?? []).map((r: { shop_id: string }) => r.shop_id));
}

export async function getAllFavoriteShopIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("favorites")
    .select("shop_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r: { shop_id: string }) => r.shop_id));
}

export async function getVisitedCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("type", ["visited", "want_again"]);
  return count ?? 0;
}

export async function getWantToTryShopIds(userId: string): Promise<Set<string>> {
  return getShopIdsByFavoriteType(userId, "want_to_try");
}

export async function getVisitedShopIds(userId: string): Promise<Set<string>> {
  return getShopIdsByFavoriteType(userId, "visited");
}

export async function getWantAgainShopIds(userId: string): Promise<Set<string>> {
  return getShopIdsByFavoriteType(userId, "want_again");
}

// 未使用だが型互換のためエクスポート
export type { Favorite };
