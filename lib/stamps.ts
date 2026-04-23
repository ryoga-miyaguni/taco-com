import { createClient } from "@/lib/supabase/client";
import type { StampKey, ShopStamp } from "./types";
import { STAMP_KEYS } from "./types";

export async function getStampCounts(shopId: string): Promise<Record<StampKey, number>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("shop_stamps")
    .select("stamp_key")
    .eq("shop_id", shopId);
  const counts = Object.fromEntries(STAMP_KEYS.map((k) => [k, 0])) as Record<StampKey, number>;
  for (const row of data ?? []) {
    const key = (row as { stamp_key: string }).stamp_key as StampKey;
    if (key in counts) counts[key]++;
  }
  return counts;
}

export async function getUserStamps(shopId: string, userId: string): Promise<StampKey[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("shop_stamps")
    .select("stamp_key")
    .eq("shop_id", shopId)
    .eq("user_id", userId);
  return (data ?? []).map((r: { stamp_key: string }) => r.stamp_key as StampKey);
}

export async function toggleStamp(shopId: string, userId: string, stampKey: StampKey): Promise<StampKey[]> {
  const supabase = createClient();
  const current = await getUserStamps(shopId, userId);
  if (current.includes(stampKey)) {
    await supabase.from("shop_stamps")
      .delete()
      .eq("shop_id", shopId)
      .eq("user_id", userId)
      .eq("stamp_key", stampKey);
  } else {
    await supabase.from("shop_stamps").insert({ shop_id: shopId, user_id: userId, stamp_key: stampKey });
  }
  return getUserStamps(shopId, userId);
}

// 未使用だが型互換のためエクスポート
export type { ShopStamp };
